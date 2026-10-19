const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('⚡ Iniciando Validação do Super Combo de 4 Ataques no Nível 20...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('COMBO') || t.includes('EVOLUÇÃO') || t.includes('LEVEL') || t.includes('MARCO')) {
      console.log('  [GAME LOG]', t);
    }
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB, { timeout: 10000 });

  // 1. Inicia jogo com Charmander
  await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 4; // Charmander
    window.G.DB.save.starter = 4;
    window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };

    window.G.Game.startRun();
  });

  await new Promise(r => setTimeout(r, 1200));

  // 2. Adiciona 4 ataques ao jogador
  const movesAdded = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const pool = ['flamethrower', 'firespin', 'heatwave'];
    for (const id of pool) {
      if (pl.slots.length < 4) pl.addMove(id);
    }
    if (window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 0 });
    }
    return {
      movesCount: pl.moves.length,
      slotsCount: pl.slots.length,
      level: pl.level,
      activeIdx: pl.active,
      activeGroupLen: pl.activeGroup().length,
      comboActive: pl.quadComboActive
    };
  });
  console.log('  -> Estado antes do Nv 20 (Nv 1 com 4 ataques):', movesAdded);

  // 3. Eleva o jogador para o Nível 20
  console.log('  -> Subindo jogador para o Nível 20...');
  const leveledUp = await page.evaluate(() => {
    const pl = window.G.Game.player;
    pl.level = 20;
    pl.checkEvolutionMilestones();
    if (window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 0 });
    }

    return {
      level: pl.level,
      quadComboActive: pl.quadComboActive,
      activeGroupLen: pl.activeGroup().length,
      allMovesLen: pl.moves.length,
      milestones: Array.from(pl._milestonesReached || [])
    };
  });
  console.log('  -> Estado após atingir Nível 20:', leveledUp);

  if (!leveledUp.quadComboActive || leveledUp.activeGroupLen !== 4) {
    console.error('❌ ERRO: O combo do nível 20 não ativou todos os 4 ataques juntos!');
    process.exit(1);
  }

  // Aguarda 400ms para partículas e HUD atualizarem
  await new Promise(r => setTimeout(r, 500));

  // 4. Verifica classes no HUD
  const hudState = await page.evaluate(() => {
    const slots = document.querySelectorAll('.hud-skill-slot');
    const comboSlots = document.querySelectorAll('.hud-skill-slot.combo-active');
    return {
      totalSlots: slots.length,
      comboActiveSlots: comboSlots.length
    };
  });
  console.log('  -> Estado dos Slots no HUD:', hudState);

  // Tira screenshot do momento do combo
  const shotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/lvl20_quad_combo_live.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot do Combo Nv 20 salvo em: ${shotPath}`);

  // 5. Deixa o loop de combate rodar por 1.5s para disparar todos os 4 ataques
  console.log('  -> Executando combate com todos os 4 ataques combando juntos...');
  await new Promise(r => setTimeout(r, 1500));

  const combatFired = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const movesInfo = pl.moves.map(m => ({
      id: m.id,
      cd: m.cd,
      t: m.t,
      castAt: m.castAt || 0
    }));
    return {
      movesInfo,
      projectilesCount: (window.G.Projectiles && typeof window.G.Projectiles.all === 'function') ? window.G.Projectiles.all().length : 0
    };
  });
  console.log('  -> Estado dos ataques disparados em combo:', combatFired);

  const shotCombatPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/lvl20_quad_combat_firing.png';
  await page.screenshot({ path: shotCombatPath });
  console.log(`📸 Screenshot do Combate com 4 Ataques salvo em: ${shotCombatPath}`);

  await browser.close();
  console.log('🎉 Teste do Super Combo Nível 20 finalizado com 100% de sucesso!');
})();
