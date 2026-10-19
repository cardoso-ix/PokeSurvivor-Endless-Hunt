const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log(`🌐 Conectando à VPS Online: ${VPS_URL}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('MEGA') || t.includes('DEBUG') || t.includes('DANO')) {
      console.log('  [VPS LOG]', t);
    }
  });

  await page.goto(VPS_URL + '?v=' + Date.now(), { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.db && (window.game || (window.G && window.G.Game)), { timeout: 15000 });

  // 1. Inicia jogo na VPS com Charmander
  const started = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart') || document.getElementById('tap-start');
    if (tap) tap.remove();

    if (window.db) {
      await window.db.ready();
      window.db.playAsGuest();
      window.db.save.partner = 4; // Charmander
      window.db.save.starter = 4;
      window.db.save.owned[4] = { at: Date.now(), from: 'starter' };
    }

    if (window.game && typeof window.game.startRun === 'function') {
      window.game.startRun();
    } else if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = (window.game && window.game.player) || (window.G && window.G.Game && window.G.Game.player);
    return {
      started: !!pl,
      species: pl ? pl.species : null
    };
  });
  console.log('  -> Jogo iniciado na VPS:', started);
  await new Promise(r => setTimeout(r, 1200));

  // 2. Enche a barra com debugFillMega()
  console.log('  -> Enchendo o Mega na VPS...');
  await page.evaluate(() => {
    if (typeof window.debugFillMega === 'function') {
      window.debugFillMega();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // 3. Clica no Botão Mega HUD na VPS
  console.log('  -> Ativando o Mega na VPS...');
  await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
  });

  // Aguarda 350ms para capturar a Cutscene ao vivo na VPS
  await new Promise(r => setTimeout(r, 350));
  const vpsCutscenePath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_mega_cutscene_live.png';
  await page.screenshot({ path: vpsCutscenePath });
  console.log(`  📸 Screenshot Cutscene VPS salva em: ${vpsCutscenePath}`);

  // Aguarda 1.5s para capturar poderes caindo no solo na VPS
  await new Promise(r => setTimeout(r, 1500));
  const vpsPowersPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_mega_powers_falling_live.png';
  await page.screenshot({ path: vpsPowersPath });
  console.log(`  📸 Screenshot Poderes Caindo VPS salva em: ${vpsPowersPath}`);

  await browser.close();
  console.log('🎉 Validação ao vivo na VPS concluída com sucesso!');
})();
