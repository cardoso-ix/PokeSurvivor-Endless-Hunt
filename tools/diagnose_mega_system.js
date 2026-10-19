const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🔍 Diagnóstico do Sistema e Botão Mega...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => console.log('  [BROWSER LOG]', msg.text()));
  page.on('pageerror', err => console.error('  [PAGE ERROR]', err.message));

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 10000 });

  // Inicia jogo
  await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 4; // Charmander (Fogo)
      window.G.DB.save.starter = 4;
      window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // Diagnóstico das variáveis
  const initialStatus = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const mega = window.G.Mega;
    const megaTrack = document.querySelector('.mega-track');
    const hudMegaBar = document.getElementById('hud-mega-bar');
    const hudMegaBtn = document.getElementById('hud-mega-btn');

    return {
      playerExists: !!pl,
      species: pl ? (pl.species || (pl.mon && pl.mon.name)) : null,
      types: pl ? (pl.types || (pl.mon && pl.mon.types)) : null,
      plMegaEnergy: pl ? pl.megaEnergy : null,
      megaGauge: mega ? mega.gauge : null,
      megaMaxGauge: mega ? mega.maxGauge : null,
      megaTrackExists: !!megaTrack,
      megaTrackWired: megaTrack ? megaTrack._wired : null,
      hudMegaBtnExists: !!hudMegaBtn
    };
  });

  console.log('📊 Status inicial do Mega:', initialStatus);

  // Agora enche a barra
  console.log('⚡ Enchendo a barra de Mega com debugFillMega()...');
  await page.evaluate(() => {
    window.debugFillMega();
  });

  await new Promise(r => setTimeout(r, 300));

  // Status após encher
  const filledStatus = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const mega = window.G.Mega;
    const megaLabel = document.getElementById('hud-mega-label');
    return {
      plMegaEnergy: pl.megaEnergy,
      megaGauge: mega.gauge,
      labelText: megaLabel ? megaLabel.textContent : null,
      isReadyTrack: document.getElementById('hud-mega-bar').classList.contains('ready')
    };
  });
  console.log('⚡ Status com Mega cheio:', filledStatus);

  // Agora testa clicar na mega-track
  console.log('🖱️ Testando clique na .mega-track...');
  await page.evaluate(() => {
    const megaTrack = document.querySelector('.mega-track');
    if (megaTrack) megaTrack.click();
  });

  await new Promise(r => setTimeout(r, 500));

  const afterClickStatus = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const mega = window.G.Mega;
    return {
      isActive: mega.isActive,
      currentElement: mega.currentElement,
      timeLeft: mega.timeLeft,
      plMegaActive: pl.megaMode.active,
      hazardCount: window.G.UltimateVFX ? window.G.UltimateVFX.count : 0
    };
  });
  console.log('⚡ Status após clicar na .mega-track:', afterClickStatus);

  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/diagnostico_mega_click.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  await browser.close();
})();
