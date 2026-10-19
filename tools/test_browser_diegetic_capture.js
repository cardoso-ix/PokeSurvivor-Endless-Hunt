const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Iniciando teste no navegador: Captura Diegética no Mapa (Sem Modal)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  let pageErrors = [];
  page.on('pageerror', err => {
    console.error('  [PAGE ERROR]', err.message);
    pageErrors.push(err.message);
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.G.Capture, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Inicia partida e aciona o Rift
  const setupResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { error: 'Jogador não encontrado' };

    // Inicia arena de Rift com um guardião
    window.G.Rift.triggerGuardian('articuno', false);

    const arena = window.G.Rift.arena;
    return {
      success: true,
      arenaActive: !!arena,
      bossId: arena ? arena.bossId : null
    };
  });

  console.log('  -> Arena de Rift iniciada:', setupResult);

  // Aguarda 1 segundo e derrota o guardião
  await new Promise(r => setTimeout(r, 1000));

  const defeatResult = await page.evaluate(() => {
    const arena = window.G.Rift.arena;
    if (!arena) return { error: 'Sem arena ativa' };

    const boss = window.G.EnemyMgr.get(arena.bossId);
    if (!boss) return { error: 'Boss não encontrado' };

    // Reduz HP do boss para 0 para derrotá-lo
    boss.hp = 0;
    boss.dead = true;

    // Dispara a derrota do boss
    window.onGuardianDefeated(boss);

    const modal = document.getElementById('capture-modal');
    const modalDisplay = window.getComputedStyle(modal).display;
    const isPaused = window.G.Game.isPaused;
    const activeBall = window.G.Capture.activeData;

    return {
      success: true,
      isPaused: isPaused,
      modalDisplay: modalDisplay,
      activeBallExists: !!activeBall,
      ballTier: activeBall ? activeBall.ballTier.name : null,
      ballState: activeBall ? activeBall.state : null,
      ballZ: activeBall ? activeBall.ballZ : null
    };
  });

  console.log('  -> Resultado da derrota do Guardião:', defeatResult);

  // Validações
  if (defeatResult.isPaused !== false) {
    console.error('❌ ERRO: O combate foi pausado! isPaused deveria ser false.');
    process.exit(1);
  }
  if (defeatResult.modalDisplay !== 'none') {
    console.error(`❌ ERRO: Modal de captura está visível (${defeatResult.modalDisplay})! Deveria estar 'none'.`);
    process.exit(1);
  }
  if (!defeatResult.activeBallExists) {
    console.error('❌ ERRO: WorldCaptureBall não foi criada no mapa!');
    process.exit(1);
  }

  // Deixa o jogo rodar por 3.5 segundos para a bola quicar, balançar 3 vezes e resolver
  await new Promise(r => setTimeout(r, 3500));

  // Tira screenshot do momento da captura no mapa
  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/gameplay_diegetic_capture.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`  📸 Screenshot salvo em: ${screenshotPath}`);

  const endResult = await page.evaluate(() => {
    const isPaused = window.G.Game.isPaused;
    const modal = document.getElementById('capture-modal');
    const modalDisplay = window.getComputedStyle(modal).display;

    return {
      isPaused,
      modalDisplay,
      pageErrors: window.__errors || []
    };
  });

  console.log('  -> Estado após a captura:', endResult);

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ Erros de página detectados:', pageErrors);
    process.exit(1);
  }

  console.log('🎉 TESTE NO NAVEGADOR CONCLUÍDO COM 100% DE SUCESSO!');
})();
