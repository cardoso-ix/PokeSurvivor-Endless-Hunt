/**
 * Teste Automatizado e Validação Visual via Puppeteer:
 * Exibição dos Ataques e Níveis Combando no HUD Inferior
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando teste Puppeteer da exibição de ataques e combo no HUD...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('COMBO') || text.includes('EVOLUÇÃO') || text.includes('HUD')) {
      console.log('  [BROWSER LOG]', text);
    }
  });

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inicializa o jogo e equipa 4 ataques
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

    // Equipa 4 ataques com níveis variados
    pl.slots = [
      [{ id: 'vinewhip', name: 'Chicote de Vinha', lvl: 5, type: 'grass', def: { maxLvl: 5 }, cd: 1.2, t: 0 }],
      [{ id: 'leechseed', name: 'Semente Sanguessuga', lvl: 3, type: 'grass', def: { maxLvl: 5 }, cd: 2.0, t: 0 }],
      [{ id: 'razorleaf', name: 'Folha Navalha', lvl: 4, type: 'grass', def: { maxLvl: 5 }, cd: 1.5, t: 0 }],
      [{ id: 'sludgebomb', name: 'Bomba de Lodo', lvl: 2, type: 'poison', def: { maxLvl: 5 }, cd: 2.4, t: 0 }]
    ];
    pl.moves = pl.slots.map(g => g[0]);
    pl.level = 8;
    pl.quadComboActive = false;

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

  console.log('⚙️ Estado inicial configurado:', initResult);
  assert(initResult.success, 'Jogo deve ter iniciado');

  await new Promise(r => setTimeout(r, 400));

  // Verifica elementos do HUD no Cenário 1 (Nv 8 - Pré-combo)
  const preComboState = await page.evaluate(() => {
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
      cardDetails
    };
  });

  console.log('\n📊 Estado do HUD no Nível 8 (Pré-combo):', JSON.stringify(preComboState, null, 2));
  assert.strictEqual(preComboState.cardsCount, 4, 'Devem existir 4 cards de ataques no HUD');
  assert.strictEqual(preComboState.cardDetails[0].name, 'Chicote de Vinha', 'Card 1 deve ter nome correto');
  assert.strictEqual(preComboState.cardDetails[0].lvl, 'NV. 5 MAX', 'Card 1 deve mostrar NV. 5 MAX');
  assert.strictEqual(preComboState.cardDetails[1].lvl, 'NV. 3', 'Card 2 deve mostrar NV. 3');
  assert.strictEqual(preComboState.badgeText, 'NV. 8/20', 'Badge deve indicar Nível 8/20');

  const screenshotPre20 = path.join(ARTIFACTS_DIR, 'hud_combo_attacks_pre20.png');
  await page.screenshot({ path: screenshotPre20 });
  console.log('📸 Screenshot Pré-Combo Nv. 8 salvo em:', screenshotPre20);

  // Cenário 2: Evolui para Nível 20 (Super Combo Ativo)
  console.log('\n⚡ Ativando Marco Nível 20 (Super Combo dos 4 Ataques)...');
  const lvl20State = await page.evaluate(() => {
    const pl = window.G.Game.player;
    pl.level = 20;
    pl.quadComboActive = true;

    if (window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 0 });
    }

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
      allCombosActive: cardDetails.every(c => c.isComboActive),
      cardDetails
    };
  });

  console.log('📊 Estado do HUD no Nível 20 (Super Combo):', JSON.stringify(lvl20State, null, 2));
  assert.strictEqual(lvl20State.allCombosActive, true, 'Todos os 4 cards devem estar com a classe .combo-active ativada!');
  assert.strictEqual(lvl20State.badgeText, '🔥 COMBANDO JUNTOS', 'Badge deve indicar COMBANDO JUNTOS');
  assert(lvl20State.titleText.includes('SUPER COMBO ATIVO'), 'Título deve indicar SUPER COMBO ATIVO');

  await new Promise(r => setTimeout(r, 400));

  const screenshotLvl20 = path.join(ARTIFACTS_DIR, 'hud_combo_attacks_lvl20_active.png');
  await page.screenshot({ path: screenshotLvl20 });
  console.log('📸 Screenshot Super Combo Nv. 20 salvo em:', screenshotLvl20);

  await browser.close();
  console.log('\n🏁 Teste de exibição de ataques e combo concluído com 100% de sucesso!');
})();
