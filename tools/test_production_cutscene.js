const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Testando Cutscene e Poderes em Produção Local (index.html)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('MEGA') || t.includes('DEBUG') || t.includes('DANO')) {
      console.log('  [PROD LOG]', t);
    }
  });

  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.db && (window.game || (window.G && window.G.Game)), { timeout: 10000 });

  // 1. Inicia jogo diretamente via window.db e window.game
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
  console.log('  -> Jogo iniciado em Produção:', started);
  await new Promise(r => setTimeout(r, 1200));

  // 4. Carrega o Mega com debugFillMega()
  console.log('  -> Carregando o Mega com window.debugFillMega()...');
  const filled = await page.evaluate(() => {
    if (typeof window.debugFillMega === 'function') {
      window.debugFillMega();
      return true;
    }
    return false;
  });
  console.log('  -> debugFillMega executado:', filled);
  await new Promise(r => setTimeout(r, 400));

  // 5. Clica no Botão Mega HUD
  console.log('  -> Clicando no Botão HUD do Mega...');
  await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
  });

  // Aguarda 350ms para o pico da Cutscene
  await new Promise(r => setTimeout(r, 350));

  const shot1 = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/prod_cutscene_live.png';
  await page.screenshot({ path: shot1 });
  console.log(`  📸 Screenshot Cutscene de Produção salva em: ${shot1}`);

  // Aguarda 1.5s para poderes caindo no solo
  await new Promise(r => setTimeout(r, 1500));

  const shot2 = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/prod_powers_falling_live.png';
  await page.screenshot({ path: shot2 });
  console.log(`  📸 Screenshot Poderes Caindo de Produção salva em: ${shot2}`);

  await browser.close();
  console.log('✅ Teste de produção local finalizado!');
})();
