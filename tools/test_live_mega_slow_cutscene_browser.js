/**
 * Validação visual com Puppeteer: Cutscene Mega Prolongada (2.8s) e Slow-Motion
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando teste Puppeteer da Cutscene Mega Lenta no navegador...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MEGA') || text.includes('Overdrive')) console.log('BROWSER LOG:', text);
  });

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inicia a partida e carrega o Mega
  const initResult = await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (typeof window.G.DB.ready === 'function') window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1; // Bulbasaur
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Player não inicializado' };

    // Carrega a barra de Mega para 100%
    window.debugFillMega();

    return {
      success: true,
      species: pl.species,
      gauge: window.MegaSystem.gauge,
      maxGauge: window.MegaSystem.maxGauge
    };
  });

  console.log('⚙️ Estado inicial do jogo:', initResult);
  assert(initResult.success, 'Jogo deve ter iniciado');

  // Dispara o Mega Overdrive
  console.log('⚡ Disparando Mega Overdrive...');
  await page.evaluate(() => {
    window.MegaSystem.trigger();
  });

  // Aguarda 1.1s (tempo de sobra para a entrada lenta e agora em plena sustentação aos 1.1s de 2.8s)
  await new Promise(r => setTimeout(r, 1100));

  const cutsceneState = await page.evaluate(() => {
    return {
      active: window.MegaCutscene.active,
      timer: window.MegaCutscene.timer,
      duration: window.MegaCutscene.duration,
      megaTimeLeft: window.MegaSystem.timeLeft,
      megaActive: window.MegaSystem.isActive
    };
  });

  console.log('🎬 Estado da Cutscene aos 1.1s:', cutsceneState);
  assert.strictEqual(cutsceneState.active, true, 'Cutscene DEVE permanecer ativa aos 1.1s (duração total 2.8s)');
  assert.strictEqual(cutsceneState.megaTimeLeft, 10.0, 'Tempo do Mega deve continuar intacto em 10.0s durante a cutscene');

  const screenshotCutscene = path.join(ARTIFACTS_DIR, 'mega_slow_cutscene_live.png');
  await page.screenshot({ path: screenshotCutscene });
  console.log('📸 Screenshot da Cutscene salvo em:', screenshotCutscene);

  // Aguarda mais 2.0s para a cutscene finalizar e a tempestade de poderes entrar em cena
  await new Promise(r => setTimeout(r, 2000));

  const afterCutsceneState = await page.evaluate(() => {
    return {
      cutsceneActive: window.MegaCutscene.active,
      megaActive: window.MegaSystem.isActive,
      megaTimeLeft: window.MegaSystem.timeLeft
    };
  });

  console.log('⛈️ Estado após término da Cutscene:', afterCutsceneState);
  assert.strictEqual(afterCutsceneState.cutsceneActive, false, 'Cutscene deve ter finalizado após 2.8s');
  assert.strictEqual(afterCutsceneState.megaActive, true, 'Mega deve continuar ativo com a chuva de poderes');
  assert(afterCutsceneState.megaTimeLeft < 10.0, 'Tempo do Mega agora deve estar drenando os 10s');

  const screenshotStorm = path.join(ARTIFACTS_DIR, 'mega_powers_falling_live.png');
  await page.screenshot({ path: screenshotStorm });
  console.log('📸 Screenshot da Tempestade de Poderes salvo em:', screenshotStorm);

  await browser.close();
  console.log('🏁 Teste de visualização no navegador local concluído com 100% de sucesso!');
})();
