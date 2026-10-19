/**
 * Validação online na VPS Coolify via Puppeteer:
 * Comprova o HUD de Vida e Ataques no Canto Superior Esquerdo rodando na VPS.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log(`🌐 Navegando para ${VPS_URL} para validar HUD no canto superior esquerdo...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('COMBO') || text.includes('HUD')) console.log('  [VPS LOG]', text);
  });
  page.on('pageerror', err => console.error('VPS ERROR:', err.message));

  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.G.HUD, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inicializa o jogo e equipa os ataques na VPS
  const startResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (typeof window.G.DB.ready === 'function') await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1; // Bulbasaur
      window.G.DB.save.starter = 1;
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { success: false, error: 'Jogador não encontrado na VPS' };

    // Equipa 4 ataques nos slots
    pl.slots = [
      [{ id: 'vinewhip', name: 'Chicote de Vinha', lvl: 5, type: 'grass', def: { maxLvl: 5 }, cd: 1.2, t: 0 }],
      [{ id: 'leechseed', name: 'Semente Sanguessuga', lvl: 3, type: 'grass', def: { maxLvl: 5 }, cd: 2.0, t: 0 }],
      [{ id: 'razorleaf', name: 'Folha Navalha', lvl: 4, type: 'grass', def: { maxLvl: 5 }, cd: 1.5, t: 0 }],
      [{ id: 'sludgebomb', name: 'Bomba de Lodo', lvl: 2, type: 'poison', def: { maxLvl: 5 }, cd: 2.4, t: 0 }]
    ];
    pl.moves = pl.slots.map(g => g[0]);
    pl.level = 8;
    pl.maxMoves = 4;
    pl.hp = 92;
    pl.maxHp = 100;
    pl.megaEnergy = 60;
    pl.megaMaxEnergy = 100;

    if (window.G && window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 45 });
    }

    return { success: true };
  });

  console.log('Partida iniciada na VPS:', startResult);
  await new Promise(r => setTimeout(r, 1000));

  // Validação do posicionamento top-left
  const hudCheck = await page.evaluate(() => {
    const el = document.getElementById('bottom-rpg-hud');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const title = document.getElementById('hud-combo-title')?.textContent;
    const badge = document.getElementById('hud-combo-badge')?.textContent;
    const cards = Array.from(document.querySelectorAll('.hud-skill-card')).map(c => ({
      name: c.querySelector('.hud-skill-name')?.textContent,
      lvl: c.querySelector('.hud-skill-lvl-tag')?.textContent
    }));

    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      cssTop: style.top,
      cssLeft: style.left,
      title,
      badge,
      cardsCount: cards.length,
      cards
    };
  });

  console.log('Inspeção do HUD na VPS:', hudCheck);
  assert(hudCheck !== null, 'HUD não encontrado na VPS');
  assert(hudCheck.top < 40, `HUD deveria estar no topo da VPS, mas top = ${hudCheck.top}`);
  assert(hudCheck.left < 40, `HUD deveria estar na esquerda da VPS, mas left = ${hudCheck.left}`);
  assert(hudCheck.cardsCount === 4, 'Deveria ter 4 cards de ataques');

  // Captura de tela da VPS ao vivo
  const shotPath = path.join(ARTIFACTS_DIR, 'vps_hud_top_left_live.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('📸 Screenshot da VPS salvo:', shotPath);

  console.log('🎉 Validação na VPS concluída com sucesso!');
  await browser.close();
  process.exit(0);
})();
