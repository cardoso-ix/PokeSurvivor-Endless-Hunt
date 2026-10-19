/**
 * Validação online na VPS via Puppeteer:
 * Comprova a exibição dos ataques com nome, nível, ícones e Super Combo ativado no HUD inferior na VPS.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log(`🌐 Navegando para ${VPS_URL} para validar exibição de ataques e combo no HUD...`);
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
      window.G.DB.save.partner = 1;
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
    pl.level = 20;
    pl.quadComboActive = true;

    if (window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 0 });
    }

    return {
      success: true,
      species: pl.species,
      level: pl.level,
      slotsCount: pl.slots.length
    };
  });

  console.log('  -> Estado inicial na VPS:', startResult);
  assert(startResult.success, 'Partida deve ter iniciado na VPS');

  await new Promise(r => setTimeout(r, 600));

  // Coleta dados dos cards de ataques no DOM da VPS
  const hudData = await page.evaluate(() => {
    const title = document.getElementById('hud-combo-title');
    const badge = document.getElementById('hud-combo-badge');
    const cards = document.querySelectorAll('.hud-skill-card');

    const cardDetails = Array.from(cards).map(c => {
      const name = c.querySelector('.hud-skill-name') ? c.querySelector('.hud-skill-name').textContent : '';
      const lvl = c.querySelector('.hud-skill-lvl-tag') ? c.querySelector('.hud-skill-lvl-tag').textContent : '';
      const isComboActive = c.classList.contains('combo-active');
      return { name, lvl, isComboActive };
    });

    return {
      titleText: title ? title.textContent : '',
      badgeText: badge ? badge.textContent : '',
      cardsCount: cards.length,
      allCombosActive: cardDetails.every(c => c.isComboActive),
      cardDetails
    };
  });

  console.log('  -> 📊 Dados do Deck de Ataques na VPS:', JSON.stringify(hudData, null, 2));
  assert.strictEqual(hudData.cardsCount, 4, 'Devem existir 4 cards de ataques na VPS');
  assert.strictEqual(hudData.allCombosActive, true, 'Todos os cards devem estar em combo ativo na VPS');
  assert.strictEqual(hudData.cardDetails[0].name, 'Chicote de Vinha');
  assert.strictEqual(hudData.cardDetails[0].lvl, 'NV. 5 MAX');

  const screenshotPath = path.join(ARTIFACTS_DIR, 'vps_combo_attacks_live.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Screenshot da VPS salvo em:', screenshotPath);

  await browser.close();
  console.log('🏁 Validação na VPS online concluída com 100% de sucesso!');
})();
