/**
 * Teste Automatizado de Homologação na VPS Online (Coolify)
 * Valida o Menu Admin de Tickets e Roleta Gacha diretamente em produção.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
const VPS_DEV_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';

(async () => {
  console.log('🚀 Iniciando homologação do Menu Admin de Tickets & Gacha na VPS Online...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[ADMIN]') || text.includes('Tickets') || text.includes('Roleta')) {
      console.log('  ℹ️ [VPS LOG]', text);
    }
  });

  console.log(`🌐 Acessando VPS em ${VPS_DEV_URL}...`);
  await page.goto(VPS_DEV_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => window.G && window.G.DB && window.AdminPanel, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 800));

  console.log('🎮 1. Inicializando sessão de teste na VPS...');
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    if (window.G.DB && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('🛠️ 2. Abrindo o Painel Admin na VPS...');
  await page.evaluate(() => {
    window.AdminPanel.open();
  });
  await new Promise(r => setTimeout(r, 500));

  const hasSection = await page.evaluate(() => {
    const s = document.getElementById('admin-gacha-section');
    return !!s;
  });
  assert(hasSection, 'Seção #admin-gacha-section deve estar presente na VPS');
  console.log('✅ Seção de Tickets e Roleta Gacha confirmada na VPS!');

  console.log('🎟️ 3. Testando injeção de 45.000 tickets via input na VPS...');
  await page.evaluate(() => {
    const input = document.getElementById('admin-tickets-input');
    input.value = '45000';
    document.getElementById('admin-btn-set-tickets').click();
  });
  await new Promise(r => setTimeout(r, 400));

  const ticketsVps = await page.evaluate(() => {
    return {
      save: window.G.DB.save.tickets.t1,
      display: document.getElementById('admin-tickets-display')?.textContent
    };
  });
  console.log('  -> Saldo na VPS:', ticketsVps);
  assert.strictEqual(ticketsVps.save, 45000, 'Saldo no save na VPS deve ser 45.000');
  assert(ticketsVps.display.includes('45.000'), 'Display deve exibir 45.000');
  console.log('✅ Injeção customizada de tickets aprovada na VPS!');

  console.log('👑 4. Forçando Lendário e executando giro de Roleta 1x na VPS...');
  await page.evaluate(() => {
    document.getElementById('admin-btn-force-legend').click();
    document.getElementById('admin-btn-spin-1').click();
  });
  await new Promise(r => setTimeout(r, 500));

  const spinVps = await page.evaluate(() => {
    return {
      remaining: window.G.DB.save.tickets.t1,
      feedback: document.getElementById('admin-unlock-feedback')?.textContent
    };
  });
  console.log('  -> Resultado Giro na VPS:', spinVps);
  assert.strictEqual(spinVps.remaining, 40000, 'Deve restar 40.000 tickets na VPS');
  assert(spinVps.feedback.includes('LENDÁRIO'), 'Feedback na VPS deve acusar Lendário');
  console.log('✅ Giro com Lendário garantido validado na VPS!');

  console.log('🧪 5. Executando simulação de 50 giros na VPS...');
  const simVps = await page.evaluate(() => {
    const inp = document.getElementById('admin-sim-count-input');
    inp.value = '50';
    document.getElementById('admin-btn-run-simulation').click();
    const box = document.getElementById('admin-sim-results');
    return {
      visible: box && box.style.display !== 'none',
      text: box?.textContent
    };
  });
  console.log('  -> Simulação na VPS:', simVps.text);
  assert(simVps.visible, 'Relatório de simulação visível na VPS');
  assert(simVps.text.includes('50 Giros Simulados'), 'Deve reportar 50 giros na VPS');
  console.log('✅ Simulação estatística aprovada na VPS!');

  const shotVpsAdmin = path.join(ARTIFACTS_DIR, 'vps_admin_tickets_gacha_live.png');
  await page.screenshot({ path: shotVpsAdmin });
  console.log('📸 Screenshot da VPS salvo em:', shotVpsAdmin);

  console.log('\n🌟 HOMOLOGAÇÃO NA VPS ONLINE CONCLUÍDA COM 100% DE SUCESSO!');
  await browser.close();
  process.exit(0);
})();
