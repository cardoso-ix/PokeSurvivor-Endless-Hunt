const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log('🌐 Conectando à VPS Coolify Online:', VPS_URL);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Injeta sessão antes de carregar
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ps.accounts', JSON.stringify({
      tester: { name: 'Tester', created: Date.now() }
    }));
    localStorage.setItem('ps.session', JSON.stringify('tester'));
    localStorage.setItem('ps.save.tester', JSON.stringify({
      name: 'Tester',
      partner: 4,
      starter: 4,
      owned: { 4: { at: Date.now(), from: 'starter' } },
      tickets: { t1: 15000, t10: 0 },
      coins: 3000,
      shiny: {},
      stats: {},
      pity: {}
    }));
  });

  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.getElementById('scr-menu'), { timeout: 15000 });

  // Remove tapstart se houver
  await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Valida e clica no botão da Roleta Gacha
  const clicked = await page.evaluate(() => {
    const b = document.querySelector('#scr-menu [data-go="gacha"]');
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log('  Botão Roleta Gacha clicado na VPS:', clicked);

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Tela da Roleta Gacha Online na VPS
  const liveGachaScreenshot = path.join(ARTIFACTS_DIR, 'vps_gacha_roulette_live.png');
  await page.screenshot({ path: liveGachaScreenshot });
  console.log('📸 Screenshot da Roleta Gacha na VPS salvo:', liveGachaScreenshot);

  // Inspeciona textos do DOM na VPS
  const vpsInfo = await page.evaluate(() => {
    return {
      title: document.getElementById('banner-title').textContent,
      rates: document.getElementById('gacha-rates').innerText,
      ticketsLine: document.getElementById('gacha-tickets').innerText
    };
  });
  console.log('  Dados da Roleta na VPS:', vpsInfo);

  // Dispara giro na VPS
  console.log('  Testando giro da roleta ao vivo na VPS...');
  await page.evaluate(() => {
    const btn = document.getElementById('pull-roulette-1');
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 600));
  const spinningScreenshot = path.join(ARTIFACTS_DIR, 'vps_gacha_spinning_live.png');
  await page.screenshot({ path: spinningScreenshot });
  console.log('📸 Screenshot dos rolos girando na VPS salvo:', spinningScreenshot);

  // Aguarda término da animação do caça-níqueis e revelação do card
  console.log('  Aguardando revelação do prêmio da roleta na VPS...');
  await page.waitForFunction(() => {
    const closeBtn = document.getElementById('pull-close');
    return closeBtn && !closeBtn.classList.contains('hidden');
  }, { timeout: 15000 });

  await new Promise(r => setTimeout(r, 800));
  const cardScreenshot = path.join(ARTIFACTS_DIR, 'vps_gacha_card_revealed_live.png');
  await page.screenshot({ path: cardScreenshot });
  console.log('📸 Screenshot do card de prêmio na VPS salvo:', cardScreenshot);

  console.log('🎉 Validação Online na VPS Concluída com Sucesso Total!');
  await browser.close();
})();
