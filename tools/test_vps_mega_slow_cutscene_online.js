/**
 * Validação online na VPS via Puppeteer:
 * Dispara o Mega Supremo, captura o frame da Cutscene em plena sustentação (aos 1.2s de 2.8s)
 * e o frame subsequente da tempestade de poderes com o dano 2x ativo.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log(`🌐 Navegando para ${VPS_URL} para validar Cutscene Mega Prolongada e Lenta...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MEGA') || text.includes('Overdrive')) console.log('  [VPS LOG]', text);
  });
  page.on('pageerror', err => console.error('VPS ERROR:', err.message));

  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.MegaSystem, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inicializa a partida na VPS
  const startResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (typeof window.G.DB.ready === 'function') await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Jogador não encontrado na VPS' };

    // Enche a barra do Mega
    window.debugFillMega();

    return {
      success: true,
      species: pl.species,
      gauge: window.MegaSystem.gauge,
      maxGauge: window.MegaSystem.maxGauge
    };
  });

  console.log('  -> Estado inicial configurado na VPS:', startResult);
  assert(startResult.success, 'Partida deve ter iniciado na VPS');

  // Dispara o Mega Overdrive
  console.log('  -> ⚡ Disparando Mega Overdrive na VPS...');
  await page.evaluate(() => {
    window.MegaSystem.trigger();
  });

  // Aguarda 1.2 segundos (tempo amplo de sustentação da cutscene lenta de 2.8s)
  await new Promise(r => setTimeout(r, 1200));

  const cutsceneState = await page.evaluate(() => {
    return {
      active: window.MegaCutscene.active,
      timer: window.MegaCutscene.timer,
      duration: window.MegaCutscene.duration,
      megaTimeLeft: window.MegaSystem.timeLeft,
      megaActive: window.MegaSystem.isActive
    };
  });

  console.log('  -> 🎬 Estado da Cutscene aos 1.2s na VPS:', cutsceneState);
  assert.strictEqual(cutsceneState.active, true, 'Cutscene DEVE permanecer ativa aos 1.2s (duração 2.8s)');
  assert.strictEqual(cutsceneState.megaTimeLeft, 10.0, 'Tempo do Mega deve continuar intacto em 10.0s durante a cutscene');

  const screenshotCutscene = path.join(ARTIFACTS_DIR, 'vps_mega_slow_cutscene_live.png');
  await page.screenshot({ path: screenshotCutscene });
  console.log('📸 Screenshot da Cutscene na VPS salvo em:', screenshotCutscene);

  // Aguarda mais 2.0s para a cutscene finalizar e a tempestade de poderes entrar em cena
  await new Promise(r => setTimeout(r, 2000));

  const afterCutsceneState = await page.evaluate(() => {
    return {
      cutsceneActive: window.MegaCutscene.active,
      megaActive: window.MegaSystem.isActive,
      megaTimeLeft: window.MegaSystem.timeLeft
    };
  });

  console.log('  -> ⛈️ Estado após término da Cutscene na VPS:', afterCutsceneState);
  assert.strictEqual(afterCutsceneState.cutsceneActive, false, 'Cutscene deve ter finalizado após 2.8s');
  assert.strictEqual(afterCutsceneState.megaActive, true, 'Mega deve continuar ativo com a chuva de poderes');
  assert(afterCutsceneState.megaTimeLeft < 10.0, 'Tempo do Mega agora deve estar drenando os 10s');

  const screenshotStorm = path.join(ARTIFACTS_DIR, 'vps_mega_powers_falling_live.png');
  await page.screenshot({ path: screenshotStorm });
  console.log('📸 Screenshot da Tempestade de Poderes na VPS salvo em:', screenshotStorm);

  await browser.close();
  console.log('🏁 Validação na VPS online concluída com 100% de sucesso!');
})();
