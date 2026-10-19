const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Testando Botão Mega e Ultimate em PRODUÇÃO (index.html)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    if (msg.text().includes('MEGA') || msg.text().includes('DEBUG')) {
      console.log('  [PROD LOG]', msg.text());
    }
  });

  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 10000 });

  const result = await page.evaluate(async () => {
    document.querySelector('.tapstart')?.remove();
    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 4; // Charmander
    window.G.DB.save.starter = 4;
    window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };

    window.G.Game.startRun();
    window.debugFillMega();

    const btn = document.getElementById('hud-mega-btn');
    const wasReady = btn ? btn.classList.contains('ready') : false;

    // Clica no botão
    if (btn) btn.click();

    const mega = window.G.Mega;
    const pl = window.G.Game.player;

    return {
      btnExists: !!btn,
      wasReady,
      isActive: mega.isActive,
      currentElement: mega.currentElement,
      timeLeft: mega.timeLeft,
      plActive: pl ? pl.megaMode.active : false,
      hazardCount: window.G.UltimateVFX ? window.G.UltimateVFX.count : 0
    };
  });

  console.log('  -> Resultado em produção (index.html):', result);

  if (!result.btnExists || !result.wasReady || !result.isActive) {
    console.error('❌ ERRO no teste de produção do Mega!');
    process.exit(1);
  }

  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/production_mega_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot de produção salvo em: ${screenshotPath}`);

  console.log('✅ TESTE EM PRODUÇÃO APROVADO COM 100% DE SUCESSO!');
  await browser.close();
})();
