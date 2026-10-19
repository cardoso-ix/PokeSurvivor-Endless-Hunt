/**
 * Validação visual em navegador via Puppeteer:
 * Simula a captura de Pokémon repetido no Rift e captura screenshots do Canvas e HUD
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando navegador Chrome para teste visual de captura repetida...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 1500));

  // Inicializa o jogo e o player
  const setupResult = await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (!window.G.DB.save && typeof window.G.DB.init === 'function') {
        window.G.DB.init();
      }
      if (window.G.DB.save && !window.G.DB.save.partner) {
        window.G.DB.save.partner = 1;
      }
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Player não inicializado' };

    const db = window.G.DB;
    if (!db.save && typeof db.playAsGuest === 'function') {
      db.playAsGuest();
    }
    if (!db.save) {
      db.save = { owned: {}, shiny: {}, coins: 1200, tickets: { t1: 350, t10: 0 }, stats: {} };
    }
    db.save.owned = db.save.owned || {};
    // Registra Bulbasaur como já pertencente à Pokédex (repetido!)
    db.save.owned[1] = { at: Date.now() };
    db.save.coins = 1200;
    db.save.tickets = db.save.tickets || { t1: 350, t10: 0 };
    db.save.tickets.t1 = 350;
    pl.coins = 1200;
    pl.t1 = 350;

    if (window.G.UI && typeof window.G.UI.refreshCoins === 'function') {
      window.G.UI.refreshCoins();
    }

    return {
      success: true,
      coinsBefore: db.save.coins,
      ticketsBefore: db.save.tickets.t1,
      hasBulbasaur: !!db.save.owned[1],
      playerX: pl.x,
      playerY: pl.y
    };
  });

  console.log('⚙️ Estado inicial do jogo:', setupResult);
  assert(setupResult.success, 'Jogo deve ter sido inicializado');

  // Dispara a captura repetida de Bulbasaur
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

  console.log('✨ Resultado do disparo da captura repetida:', captureResult);
  assert.strictEqual(captureResult.isDuplicate, true, 'Pokébola deve identificar Pokémon repetido');
  assert.strictEqual(captureResult.coinsAfter, 1700, 'Moedas no save devem ser 1200 + 500 = 1700');
  assert.strictEqual(captureResult.ticketsAfter, 850, 'Tickets no save devem ser 350 + 500 = 850');
  assert.strictEqual(captureResult.playerCoins, 1700, 'Moedas do player devem ser 1700');
  assert.strictEqual(captureResult.playerTickets, 850, 'Tickets do player devem ser 850');

  // Aguarda 600ms para renderizar a explosão estelar e o texto no Canvas
  await new Promise(r => setTimeout(r, 600));

  const screenshotPath = path.join(ARTIFACTS_DIR, 'rift_duplicate_reward_live.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Screenshot salva em:', screenshotPath);

  await browser.close();
  console.log('🏁 Validação visual concluída com 100% de sucesso!');
})();
