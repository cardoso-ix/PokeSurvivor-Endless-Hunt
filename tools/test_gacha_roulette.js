const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🎰 [TEST] Iniciando Validação da Roleta Gacha (5.000 Tickets)...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('ROULETTE') || t.includes('GACHA') || t.includes('TICKETS') || t.includes('COINS')) {
      console.log('  [CONSOLE]', t);
    }
  });

  // 1. Acessa dev.html
  console.log('1. Carregando http://127.0.0.1:8080/dev.html...');
  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Gacha && window.G.GachaUI && window.G.DB, { timeout: 10000 });

  // 2. Prepara jogador de teste com tickets
  console.log('2. Configurando save do jogador convidado...');
  await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    const s = window.G.DB.save;
    s.tickets = { t1: 15000, t10: 0 };
    s.coins = 2500;
    s.partner = 4; // Charmander
    s.owned = { 4: { at: Date.now(), from: 'starter' } };
    s.shiny = {};
    window.G.DB.commit(true);
    window.G.UI.refreshCoins();
    if (window.G.MenuUI && window.G.MenuUI.open) window.G.MenuUI.open();
  });

  await new Promise(r => setTimeout(r, 600));

  // 3. Valida botão no menu e topbar
  console.log('3. Validando botão Roleta Gacha no menu e topbar...');
  const menuInfo = await page.evaluate(() => {
    const gachaBtn = document.querySelector('#scr-menu [data-go="gacha"]');
    const ticketsPill = document.querySelector('#tickets-pill');
    return {
      btnVisible: gachaBtn && !gachaBtn.classList.contains('hidden') && getComputedStyle(gachaBtn).display !== 'none',
      btnText: gachaBtn ? gachaBtn.innerText.replace(/\s+/g, ' ') : '',
      pillVisible: ticketsPill && !ticketsPill.classList.contains('hidden') && getComputedStyle(ticketsPill).display !== 'none',
      pillText: ticketsPill ? ticketsPill.innerText.trim() : ''
    };
  });
  console.log('  Menu Button:', menuInfo);
  if (!menuInfo.btnVisible) throw new Error('Botão da Roleta Gacha não está visível no menu!');

  // 4. Clica em Roleta Gacha e valida tela
  console.log('4. Abrindo tela da Roleta Gacha...');
  await page.evaluate(() => {
    document.querySelector('#scr-menu [data-go="gacha"]').click();
  });

  await new Promise(r => setTimeout(r, 800));

  const gachaScreen = await page.evaluate(() => {
    const scr = document.getElementById('scr-gacha');
    const title = document.getElementById('banner-title').textContent;
    const rates = document.getElementById('gacha-rates').innerText;
    const balanceTickets = document.getElementById('gacha-balance-tickets').innerText;
    const balanceCoins = document.getElementById('gacha-balance-coins').innerText;
    return {
      visible: scr && !scr.classList.contains('hidden'),
      title,
      balanceTickets,
      balanceCoins,
      rates
    };
  });
  console.log('  Gacha Screen Info:', gachaScreen);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gacha_roulette_screen.png') });
  console.log('  📸 Screenshot salvo: gacha_roulette_screen.png');

  // 5. Testa girar a roleta com 5.000 tickets
  console.log('5. Girando a Roleta da Sorte (1 giro = 5.000 tickets)...');
  await page.evaluate(() => {
    document.getElementById('pull-roulette-1').click();
  });

  // Aguarda 400ms e tira screenshot da máquina de caça-níqueis animando
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gacha_slot_spinning.png') });
  console.log('  📸 Screenshot salvo: gacha_slot_spinning.png');

  // Aguarda a roleta terminar e o card ser revelado
  console.log('6. Aguardando revelação do card do Pokémon...');
  await page.waitForFunction(() => {
    const closeBtn = document.getElementById('pull-close');
    return closeBtn && !closeBtn.classList.contains('hidden');
  }, { timeout: 15000 });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gacha_card_revealed.png') });
  console.log('  📸 Screenshot salvo: gacha_card_revealed.png');

  const pull1Result = await page.evaluate(() => {
    const s = window.G.DB.save;
    const card = document.querySelector('.pull-results .pcard');
    return {
      cardName: card ? card.querySelector('b').textContent : '',
      cardTag: card ? card.querySelector('.tag').textContent : '',
      remainingTickets: s.tickets.t1,
      coins: s.coins,
      ownedCount: Object.keys(s.owned).length
    };
  });
  console.log('  Resultado do Giro 1:', pull1Result);

  // Fecha o resultado
  await page.evaluate(() => {
    document.getElementById('pull-close').click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 7. Testa Pokémon Repetido na Dex -> Deve conceder 1.000 PokéMoedas!
  console.log('7. Testando regra de duplicata na Pokédex (Garante +1.000 PokéMoedas)...');
  const duplicateTest = await page.evaluate(async () => {
    const s = window.G.DB.save;
    s.tickets.t1 = 5000;
    const coinsBefore = s.coins;

    // Pega o Pokémon que acabamos de obter para forçar duplicação
    const ownedDexes = Object.keys(s.owned).map(Number);
    const targetDex = ownedDexes[ownedDexes.length - 1]; // O último obtido
    const targetMon = window.G.DEX_BY[targetDex];

    // Força pick a retornar esse mesmo Pokémon
    const originalPick = window.G.U.pick;
    window.G.U.pick = () => targetMon;

    const pullRes = window.G.Gacha.pullRoulette(s, 1);
    window.G.U.pick = originalPick;

    return {
      targetDex,
      targetName: targetMon.name,
      coinsBefore,
      coinsAfter: s.coins,
      refund: pullRes[0].refund,
      isNew: pullRes[0].isNew,
      ticketsLeft: s.tickets.t1
    };
  });
  console.log('  Teste de Duplicata:', duplicateTest);

  if (duplicateTest.coinsAfter !== duplicateTest.coinsBefore + 1000) {
    throw new Error('Falha no bônus de duplicata: moedas não aumentaram em 1.000!');
  }
  if (duplicateTest.refund !== 1000) {
    throw new Error('Refund não foi marcado como 1000!');
  }
  if (duplicateTest.isNew !== false) {
    throw new Error('isNew deveria ser false para Pokémon repetido!');
  }
  console.log('  ✅ Regra de Duplicata aprovada: +1.000 PokéMoedas concedidas perfeitamente!');

  // 8. Teste no index.html de produção
  console.log('8. Testando versão em produção compilada (http://127.0.0.1:8080/index.html)...');
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.getElementById('scr-menu'), { timeout: 10000 });

  await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();
    const guestBtn = document.getElementById('btn-guest');
    if (guestBtn && guestBtn.offsetParent !== null) guestBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const gachaBtn = document.querySelector('#scr-menu [data-go="gacha"]');
    if (gachaBtn) gachaBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gacha_production_live.png') });
  console.log('  📸 Screenshot salvo: gacha_production_live.png');

  console.log('🎉 TODOS OS TESTES DA ROLETA GACHA FORAM CONCLUÍDOS COM SUCESSO TOTAL!');
  await browser.close();
})();
