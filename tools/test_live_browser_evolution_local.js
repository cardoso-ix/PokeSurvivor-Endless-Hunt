const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando teste no navegador Chrome headless...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EVOLUÇÃO') || text.includes('[ASCENSÃO') || text.includes('WorldCaptureBall') || text.includes('Guardião')) {
      console.log('  [BROWSER CONSOLE]', text);
    }
  });

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Iniciar partida e testar evolução de Bulbasaur, Pikachu e Riolu
  const testResults = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (!window.G.DB.save && typeof window.G.DB.init === 'function') {
        window.G.DB.init();
      }
      if (window.G.DB.save && !window.G.DB.save.partner) {
        window.G.DB.save.partner = 1; // Bulbasaur
      }
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Player não inicializado' };

    const results = {};

    // 1. Bulbasaur Nv 1 -> 5 -> 12
    results.initialBulba = { species: pl.species, stage: pl.currentEvolutionStage, level: pl.level };

    // Sobe para Nível 5
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(5);
    } else {
      pl.level = 5;
      pl.checkEvolutionMilestones();
    }
    results.bulbaAt5 = { species: pl.species, stage: pl.currentEvolutionStage, level: pl.level };

    // Sobe para Nível 12
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(12);
    } else {
      pl.level = 12;
      pl.checkEvolutionMilestones();
    }
    results.bulbaAt12 = { species: pl.species, stage: pl.currentEvolutionStage, level: pl.level };

    // 2. Testar Pikachu (Espécie cujo level oficial é 22)
    pl.evolveTo('pikachu');
    pl.currentEvolutionStage = 1;
    pl.evolutionHistory = [25];
    pl._milestonesReached.clear();

    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(5);
    } else {
      pl.level = 5;
      pl.checkEvolutionMilestones();
    }
    results.pikaAt5 = { species: pl.species, stage: pl.currentEvolutionStage };

    // 3. Testar Riolu (Espécie Gen 4 que antes retornava null)
    pl.evolveTo('riolu');
    pl.currentEvolutionStage = 1;
    pl.evolutionHistory = [447];
    pl._milestonesReached.clear();

    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(5);
    } else {
      pl.level = 5;
      pl.checkEvolutionMilestones();
    }
    results.rioluAt5 = { species: pl.species, stage: pl.currentEvolutionStage };

    // 4. Testar Disparo da Pokébola do Rift
    let captureStarted = false;
    if (window.G && window.G.Capture && typeof window.G.Capture.startCaptureSequence === 'function') {
      const ball = window.G.Capture.startCaptureSequence({
        speciesId: 'lucario',
        x: pl.x + 50,
        y: pl.y + 50,
        fromX: pl.x,
        fromY: pl.y,
        level: 15
      });
      captureStarted = !!ball;
    }
    results.captureStarted = captureStarted;

    return { success: true, results };
  });

  console.log('\n📊 Resultados do teste in-game:', JSON.stringify(testResults, null, 2));

  // Tira screenshot de validação
  const artifactDir = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
  const screenshotPath = path.join(artifactDir, 'gameplay_auto_evolution_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  await browser.close();

  // Asserções estritas
  if (!testResults.success) {
    console.error('❌ Falha ao executar testes no navegador:', testResults.error);
    process.exit(1);
  }

  const r = testResults.results;
  if (r.bulbaAt5.species !== 'ivysaur') throw new Error(`Bulbasaur no Nv 5 devia ser ivysaur, foi ${r.bulbaAt5.species}`);
  if (r.bulbaAt12.species !== 'venusaur') throw new Error(`Bulbasaur no Nv 12 devia ser venusaur, foi ${r.bulbaAt12.species}`);
  if (r.pikaAt5.species !== 'raichu') throw new Error(`Pikachu no Nv 5 devia ser raichu, foi ${r.pikaAt5.species}`);
  if (r.rioluAt5.species !== 'lucario') throw new Error(`Riolu no Nv 5 devia ser lucario, foi ${r.rioluAt5.species}`);
  if (!r.captureStarted) throw new Error('CaptureSystem não iniciou sequência de captura!');

  console.log('\n🎉 TODOS OS TESTES NO NAVEGADOR FORAM CONCLUÍDOS COM 100% DE SUCESSO! 🎉');
})().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
