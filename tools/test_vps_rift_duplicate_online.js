/**
 * Validação online na VPS via Puppeteer:
 * Simula a captura diegética de Pokémon repetido no Rift na VPS Coolify
 * e gera screenshot com o feedback visual e o saldo de moedas/tickets atualizados.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log(`🌐 Navegando para ${VPS_URL} para validar captura de repetido no Rift...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WorldCaptureBall') || text.includes('BULBASAUR') || text.includes('REPETIDO') || text.includes('Guardião')) {
      console.log('  [VPS LOG]', text);
    }
  });
  page.on('pageerror', err => console.error('VPS ERROR:', err.message));

  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.G.Capture, { timeout: 15000 });
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
      window.G.DB.save.owned = window.G.DB.save.owned || {};
      // Garante que Bulbasaur (dex 1) já consta como capturado na Pokédex
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
      window.G.DB.save.coins = 2000;
      window.G.DB.save.tickets = { t1: 600, t10: 0 };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Jogador não encontrado' };

    pl.coins = 2000;
    pl.t1 = 600;

    if (window.G.UI && typeof window.G.UI.refreshCoins === 'function') {
      window.G.UI.refreshCoins();
    }

    return {
      success: true,
      hasBulbasaur: !!window.G.DB.save.owned[1],
      coinsBefore: window.G.DB.save.coins,
      ticketsBefore: window.G.DB.save.tickets.t1,
      playerX: pl.x,
      playerY: pl.y
    };
  });

  console.log('  -> Estado inicial configurado na VPS:', startResult);
  assert(startResult.success, 'Partida deve ter iniciado na VPS');

  // Dispara a captura de Bulbasaur repetido
  const captureResult = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const mon = window.G.DEX_BY ? window.G.DEX_BY[1] : null;

    let callbackFired = false;
    let cbData = null;

    const ball = window.G.Capture.startCaptureSequence({
      speciesId: 'bulbasaur',
      mon: mon,
      x: pl.x + 80,
      y: pl.y,
      fromX: pl.x,
      fromY: pl.y,
      level: 20,
      onComplete: (success, isDuplicate) => {
        callbackFired = true;
        cbData = { success, isDuplicate };
      }
    });

    if (ball) {
      ball.isSuccess = true;
      ball.state = 'RESOLVE';
      ball.stateTimer = 0.05;
      ball.ballZ = 0;
      ball.x = pl.x + 80;
      ball.y = pl.y;
      ball.update(0.01);
    }

    return {
      ballCreated: !!ball,
      isDuplicate: ball ? ball.isDuplicate : null,
      coinsAfter: window.G.DB.save.coins,
      ticketsAfter: window.G.DB.save.tickets.t1,
      playerCoins: pl.coins,
      playerTickets: pl.t1
    };
  });

  console.log('  -> ✨ Resultado da captura repetida na VPS:', captureResult);
  assert.strictEqual(captureResult.isDuplicate, true, 'Pokébola deve identificar Pokémon repetido na VPS');
  assert.strictEqual(captureResult.coinsAfter, 2500, 'Moedas no save devem ser 2000 + 500 = 2500');
  assert.strictEqual(captureResult.ticketsAfter, 1100, 'Tickets no save devem ser 600 + 500 = 1100');
  assert.strictEqual(captureResult.playerCoins, 2500, 'Moedas do player devem ser 2500');
  assert.strictEqual(captureResult.playerTickets, 1100, 'Tickets do player devem ser 1100');

  // Aguarda renderização dos efeitos visuais
  await new Promise(r => setTimeout(r, 600));

  const screenshotPath = path.join(ARTIFACTS_DIR, 'vps_rift_duplicate_live.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Screenshot da VPS salvo em:', screenshotPath);

  await browser.close();
  console.log('🏁 Validação na VPS online concluída com 100% de sucesso!');
})();
