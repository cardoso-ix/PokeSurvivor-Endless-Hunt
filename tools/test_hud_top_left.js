/**
 * Teste Automatizado e Validação Visual via Puppeteer:
 * Posicionamento do HUD de Vida e Ataques no Canto Superior Esquerdo
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando teste Puppeteer do HUD no canto superior esquerdo...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('COMBO') || text.includes('HUD')) {
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
    pl.maxMoves = 4;
    pl.hp = 85;
    pl.maxHp = 100;
    pl.megaEnergy = 45;
    pl.megaMaxEnergy = 100;

    if (window.G && window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
      window.G.HUD.updateBottomRpgHud(pl, { time: 35 });
    }

    return { success: true };
  });

  console.log('Partida iniciada:', initResult);
  await new Promise(r => setTimeout(r, 800));

  // 1. Validar posição do HUD (deve estar no canto superior esquerdo: top <= 30px, left <= 30px)
  const hudPos = await page.evaluate(() => {
    const hud = document.getElementById('bottom-rpg-hud');
    if (!hud) return null;
    const rect = hud.getBoundingClientRect();
    const style = window.getComputedStyle(hud);
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      position: style.position,
      cssTop: style.top,
      cssLeft: style.left,
      visible: !hud.classList.contains('hidden')
    };
  });

  console.log('Posição calculada do HUD:', hudPos);
  assert(hudPos !== null, 'Elemento do HUD não encontrado!');
  assert(hudPos.visible, 'Elemento do HUD está oculto!');
  assert(hudPos.top < 40, `HUD deveria estar no topo, mas top = ${hudPos.top}`);
  assert(hudPos.left < 40, `HUD deveria estar à esquerda, mas left = ${hudPos.left}`);
  console.log('✅ Posição no Canto Superior Esquerdo VALIDADA!');

  // Captura de tela: HUD no canto superior esquerdo (Nv. 8)
  const shot1 = path.join(ARTIFACTS_DIR, 'hud_top_left_display.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('📸 Screenshot 1 salvo:', shot1);

  // 2. Subir para Nível 20 (Super Combo Ativo)
  await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (pl) {
      pl.level = 20;
      pl.hp = 100;
      pl.maxHp = 100;
      pl.megaEnergy = 100;
      if (window.G && window.G.HUD && typeof window.G.HUD.updateBottomRpgHud === 'function') {
        window.G.HUD.updateBottomRpgHud(pl, { time: 120 });
      }
    }
  });

  await new Promise(r => setTimeout(r, 600));

  const comboInfo = await page.evaluate(() => {
    const title = document.getElementById('hud-combo-title');
    const badge = document.getElementById('hud-combo-badge');
    const cards = Array.from(document.querySelectorAll('.hud-skill-card')).map(c => ({
      name: c.querySelector('.hud-skill-name')?.textContent,
      lvl: c.querySelector('.hud-skill-lvl-tag')?.textContent,
      comboActive: c.classList.contains('combo-active')
    }));
    return {
      title: title?.textContent,
      badge: badge?.textContent,
      cards
    };
  });

  console.log('Super Combo no Top-Left:', comboInfo);
  assert(comboInfo.title.includes('SUPER COMBO ATIVO'), 'Título de Super Combo incorreto');
  assert(comboInfo.badge.includes('COMBANDO JUNTOS'), 'Badge de Super Combo incorreto');
  assert(comboInfo.cards.every(c => c.comboActive), 'Todos os cards devem ter combo-active');

  const shot2 = path.join(ARTIFACTS_DIR, 'hud_top_left_lvl20_combo.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('📸 Screenshot 2 salvo:', shot2);

  console.log('🎉 Todos os testes de posicionamento superior esquerdo passaram com sucesso!');
  await browser.close();
  process.exit(0);
})();
