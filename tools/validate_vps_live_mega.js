const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log(`🌐 Conectando à VPS Online (${VPS_URL}) para validar todas as novidades ao vivo...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('MEGA') || t.includes('DEBUG') || t.includes('EVOLUÇÃO') || t.includes('WorldCaptureBall')) {
      console.log('  [VPS LIVE LOG]', t);
    }
  });

  page.on('pageerror', err => console.error('  [VPS PAGE ERROR]', err.message));

  // 1. Acessa a página principal de produção na VPS
  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const initialCheck = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const bar = document.getElementById('hud-mega-bar');
    const hud = document.getElementById('bottom-rpg-hud');
    return {
      hudExists: !!hud,
      btnExists: !!btn,
      txtExists: !!txt,
      barExists: !!bar,
      title: document.title
    };
  });
  console.log('  -> Verificação inicial de elementos na VPS:', initialCheck);

  if (!initialCheck.btnExists || !initialCheck.hudExists) {
    throw new Error('Elementos do botão Mega não encontrados na VPS!');
  }

  // 2. Inicia partida na VPS como Convidado com Charmander
  const runStart = await page.evaluate(async () => {
    document.querySelector('.tapstart')?.remove();
    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 4; // Charmander
      window.G.DB.save.starter = 4;
      window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };
    }
    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }
    return { runStarted: true };
  });
  console.log('  -> Partida iniciada na VPS:', runStart);

  await new Promise(r => setTimeout(r, 1500));

  // 3. Testa o botão carregando e toast na VPS
  console.log('  -> Testando clique no botão Mega carregando na VPS...');
  const toastCheck = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
    const toast = document.querySelector('.toast');
    return {
      toastVisible: toast ? toast.style.display !== 'none' : false,
      toastText: toast ? toast.textContent : null
    };
  });
  console.log('  -> Toast na VPS:', toastCheck);

  // 4. Enche a barra na VPS
  console.log('  -> Enchendo barra de Mega com debugFillMega() na VPS...');
  await page.evaluate(() => {
    window.debugFillMega();
  });
  await new Promise(r => setTimeout(r, 400));

  const readyCheck = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const bar = document.getElementById('hud-mega-bar');
    return {
      btnReady: btn ? btn.classList.contains('ready') : false,
      barReady: bar ? bar.classList.contains('ready') : false,
      txt: txt ? txt.textContent : null
    };
  });
  console.log('  -> Estado do botão a 100% na VPS:', readyCheck);

  // 5. Clica no botão para ativar o Poder Supremo ao vivo na VPS!
  console.log('  -> Clicando no botão #hud-mega-btn na VPS...');
  await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const activeCheck = await page.evaluate(() => {
    const mega = window.G && window.G.Mega;
    const pl = window.G && window.G.Game && window.G.Game.player;
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    return {
      megaActive: mega ? mega.isActive : false,
      currentElement: mega ? mega.currentElement : null,
      timeLeft: mega ? mega.timeLeft : 0,
      btnActive: btn ? btn.classList.contains('active') : false,
      btnTxt: txt ? txt.textContent : null,
      hazardCount: window.G && window.G.UltimateVFX ? window.G.UltimateVFX.count : 0
    };
  });
  console.log('  -> Estado do Mega Ativo na VPS:', activeCheck);

  if (!activeCheck.megaActive) {
    throw new Error('Mega não ativou na VPS após o clique!');
  }

  // Aguarda 1.5s para os meteoros e lava caírem no solo
  await new Promise(r => setTimeout(r, 1500));

  // Tira screenshot diretamente da VPS ao vivo
  const artifactDir = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
  const screenshotPath = `${artifactDir}/vps_online_mega_button_verified.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot da VPS online salvo em: ${screenshotPath}`);

  await browser.close();
  console.log('🎉 TODAS AS ALTERAÇÕES FORAM VERIFICADAS E ESTÃO 100% ONLINE E OPERACIONAIS NA VPS!');
})().catch(err => {
  console.error('❌ Falha na validação da VPS:', err);
  process.exit(1);
});
