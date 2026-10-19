const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log(`🌐 Conectando à VPS Online para validar Super Combo Nv 20: ${VPS_URL}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('COMBO') || t.includes('MARCO') || t.includes('EVOLUÇÃO')) {
      console.log('  [VPS GAME LOG]', t);
    }
  });

  await page.goto(VPS_URL + '?v=' + Date.now(), { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.db && (window.game || (window.G && window.G.Game)), { timeout: 15000 });

  // 1. Inicia jogo na VPS
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

  // 2. Preenche os 4 ataques e atinge o nível 20
  const lvl20Result = await page.evaluate(() => {
    const pl = (window.game && window.game.player) || (window.G && window.G.Game && window.G.Game.player);
    if (!pl) return null;

    const pool = ['flamethrower', 'firespin', 'heatwave'];
    for (const id of pool) {
      if (pl.slots.length < 4) pl.addMove(id);
    }

    // Sobe para o nível 20
    pl.level = 20;
    pl.checkEvolutionMilestones();

    if (window.G && window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 0 });
    }

    return {
      level: pl.level,
      species: pl.species,
      quadComboActive: pl.quadComboActive,
      activeGroupLen: pl.activeGroup().length,
      movesLen: pl.moves.length
    };
  });
  console.log('  -> Estado após subir para Nv 20 na VPS:', lvl20Result);

  // Aguarda 400ms para renderizar o banner de Nível 20
  await new Promise(r => setTimeout(r, 400));
  const shotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_lvl20_combo_live.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot ao vivo da VPS salvo em: ${shotPath}`);

  // 3. Deixa rodar por 1.2s para os ataques combarem
  await new Promise(r => setTimeout(r, 1200));
  const shotCombat = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_lvl20_combo_combat.png';
  await page.screenshot({ path: shotCombat });
  console.log(`📸 Screenshot ao vivo do combate na VPS salvo em: ${shotCombat}`);

  await browser.close();

  if (!lvl20Result || !lvl20Result.quadComboActive || lvl20Result.activeGroupLen !== 4) {
    console.error('❌ Falha na validação do Super Combo Nv 20 na VPS!');
    process.exit(1);
  }

  console.log('🎉 Validação do Super Combo Nv 20 na VPS CONCLUÍDA COM 100% DE SUCESSO!');
})();
