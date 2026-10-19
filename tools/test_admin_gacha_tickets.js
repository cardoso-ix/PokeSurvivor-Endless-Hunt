/**
 * Teste Automatizado: Menu Admin - Gestão de Tickets e Roleta Gacha
 * Valida a adição e definição customizada de tickets, botões rápidos,
 * sorteios diretos de roleta, forçadores e simulação estatística.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
const LOCAL_URL = 'http://localhost:8080/dev.html';

(async () => {
  console.log('🚀 Iniciando teste automatizado do Menu Admin: Tickets & Roleta Gacha...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[ADMIN]') || text.includes('Gacha') || text.includes('Tickets')) {
      console.log('  ℹ️ [BROWSER LOG]', text);
    }
  });

  page.on('pageerror', err => {
    console.error('  💥 [PAGE ERROR]', err.message);
  });

  console.log(`🌐 Navegando para ${LOCAL_URL}...`);
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => window.G && window.G.DB && window.G.Gacha && window.AdminPanel, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  // Inicializa login como convidado se necessário
  await page.evaluate(async () => {
    document.querySelector('.tapstart')?.remove();
    if (window.G.DB && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('🛠️ 1. Abrindo o Painel Admin via F2 / toggle()...');
  const opened = await page.evaluate(() => {
    window.AdminPanel.open();
    const panel = document.getElementById('admin-debug-panel');
    return panel && panel.style.display !== 'none';
  });
  assert(opened, 'Painel Admin deve estar visível no DOM');
  console.log('✅ Painel Admin aberto com sucesso.');

  // 2. Verificar presença da Seção de Tickets e Roleta Gacha
  const gachaSectionExists = await page.evaluate(() => {
    return !!document.getElementById('admin-gacha-section');
  });
  assert(gachaSectionExists, 'A seção #admin-gacha-section deve existir no painel');
  console.log('✅ Seção de Tickets & Roleta Gacha presente no painel.');

  // 3. Teste de Definição Customizada de Tickets (ex: 50.000 tickets)
  console.log('🎟️ 2. Testando injeção customizada de 50.000 tickets via input...');
  await page.evaluate(() => {
    const input = document.getElementById('admin-tickets-input');
    input.value = '50000';
    document.getElementById('admin-btn-set-tickets').click();
  });
  await new Promise(r => setTimeout(r, 300));

  const ticketsAfterSet = await page.evaluate(() => {
    const tDisplay = document.getElementById('admin-tickets-display')?.textContent;
    const saveTickets = window.G.DB.save.tickets.t1;
    return { display: tDisplay, save: saveTickets };
  });
  console.log('  -> Saldo após definir 50.000:', ticketsAfterSet);
  assert.strictEqual(ticketsAfterSet.save, 50000, 'Saldo no save deve ser 50.000');
  assert(ticketsAfterSet.display.includes('50.000'), 'Display deve exibir 50.000');
  console.log('✅ Definição customizada de 50.000 tickets validada!');

  // 4. Teste de Adição com o botão "+ Somar" (ex: +25.000 -> 75.000)
  console.log('➕ 3. Testando soma de +25.000 tickets via botão "+ Somar"...');
  await page.evaluate(() => {
    const input = document.getElementById('admin-tickets-input');
    input.value = '25000';
    document.getElementById('admin-btn-add-tickets').click();
  });
  await new Promise(r => setTimeout(r, 300));

  const ticketsAfterAdd = await page.evaluate(() => {
    return window.G.DB.save.tickets.t1;
  });
  console.log('  -> Saldo após somar 25.000:', ticketsAfterAdd);
  assert.strictEqual(ticketsAfterAdd, 75000, 'Saldo deve ser 75.000');
  console.log('✅ Soma customizada de tickets validada com sucesso!');

  // 5. Teste dos Botões Rápidos (+5k, +25k, Zerar)
  console.log('⚡ 4. Testando botões rápidos (+5k e Zerar)...');
  await page.evaluate(() => {
    document.getElementById('admin-btn-t-5k').click();
  });
  assert.strictEqual(await page.evaluate(() => window.G.DB.save.tickets.t1), 80000, 'Deve ser 80.000');

  await page.evaluate(() => {
    document.getElementById('admin-btn-t-zero').click();
  });
  assert.strictEqual(await page.evaluate(() => window.G.DB.save.tickets.t1), 0, 'Deve ter zerado para 0');
  console.log('✅ Botões rápidos validados com sucesso!');

  // Recoloca 20.000 tickets para testes de giro
  await page.evaluate(() => {
    window.AdminPanel.setTickets(20000);
  });

  // 6. Teste de Forçar Lendário e Girar Roleta 1x
  console.log('👑 5. Testando forçamento de Lendário e giro de Roleta 1x...');
  await page.evaluate(() => {
    document.getElementById('admin-btn-force-legend').click();
    document.getElementById('admin-btn-spin-1').click();
  });
  await new Promise(r => setTimeout(r, 500));

  const spin1Result = await page.evaluate(() => {
    const t = window.G.DB.save.tickets.t1;
    const fb = document.getElementById('admin-unlock-feedback')?.textContent;
    return { remainingTickets: t, feedback: fb };
  });
  console.log('  -> Resultado Giro 1x (Lendário forçado):', spin1Result);
  assert.strictEqual(spin1Result.remainingTickets, 15000, 'Deve restar 15.000 tickets (gastou 5.000)');
  assert(spin1Result.feedback.includes('LENDÁRIO'), 'Feedback deve confirmar Pokémon Lendário!');
  console.log('✅ Giro de Roleta 1x com Lendário forçado executado com perfeição!');

  // 7. Teste de Forçar Shiny e Girar Roleta 1x
  console.log('✨ 6. Testando forçamento de Shiny e giro de Roleta 1x...');
  await page.evaluate(() => {
    document.getElementById('admin-btn-force-shiny').click();
    document.getElementById('admin-btn-spin-1').click();
  });
  await new Promise(r => setTimeout(r, 500));

  const spinShinyResult = await page.evaluate(() => {
    const t = window.G.DB.save.tickets.t1;
    const fb = document.getElementById('admin-unlock-feedback')?.textContent;
    return { remainingTickets: t, feedback: fb };
  });
  console.log('  -> Resultado Giro Shiny:', spinShinyResult);
  assert.strictEqual(spinShinyResult.remainingTickets, 10000, 'Deve restar 10.000 tickets (gastou mais 5.000)');
  assert(spinShinyResult.feedback.includes('SHINY'), 'Feedback deve confirmar Pokémon Shiny!');
  console.log('✅ Giro de Roleta com Shiny forçado validado com sucesso!');

  // 8. Teste de Simulação Estatística em Lote (100 giros)
  console.log('🧪 7. Testando simulação estatística de 100 giros...');
  const simData = await page.evaluate(() => {
    const inp = document.getElementById('admin-sim-count-input');
    inp.value = '100';
    document.getElementById('admin-btn-run-simulation').click();
    const box = document.getElementById('admin-sim-results');
    return {
      visible: box && box.style.display !== 'none',
      text: box?.textContent
    };
  });
  console.log('  -> Relatório da Simulação:', simData.text);
  assert(simData.visible, 'Caixa de resultados de simulação deve estar visível');
  assert(simData.text.includes('100 Giros Simulados'), 'Deve reportar 100 giros');
  assert(simData.text.includes('Lendários:'), 'Deve reportar lendários');
  assert(simData.text.includes('Shinies:'), 'Deve reportar shinies');
  assert(simData.text.includes('Moedas Geradas:'), 'Deve reportar moedas geradas');
  console.log('✅ Simulação em lote validada com sucesso!');

  // 9. Captura de Screenshot do Painel Admin
  const shotAdminPath = path.join(ARTIFACTS_DIR, 'admin_panel_tickets_gacha.png');
  await page.screenshot({ path: shotAdminPath });
  console.log('📸 Screenshot do Painel Admin salvo em:', shotAdminPath);

  // 10. Teste do Botão de Abrir Roleta Gacha
  console.log('🎰 8. Testando abertura da tela oficial da Roleta Gacha via Painel Admin...');
  await page.evaluate(() => {
    document.getElementById('admin-btn-open-gacha-ui').click();
  });
  await new Promise(r => setTimeout(r, 600));

  const gachaScreenVisible = await page.evaluate(() => {
    const scr = document.getElementById('scr-gacha');
    return scr && !scr.classList.contains('hidden');
  });
  assert(gachaScreenVisible, 'A tela oficial do Gacha (#scr-gacha) deve estar aberta');
  console.log('✅ Tela do Gacha aberta com sucesso através do Painel Admin!');

  const shotGachaPath = path.join(ARTIFACTS_DIR, 'admin_opened_gacha_screen.png');
  await page.screenshot({ path: shotGachaPath });
  console.log('📸 Screenshot da Tela do Gacha salvo em:', shotGachaPath);

  await browser.close();
  console.log('\n🎉 TODOS OS TESTES DO MENU ADMIN DE TICKETS E GACHA FORAM APROVADOS COM 100% DE SUCESSO!');
  process.exit(0);
})();
