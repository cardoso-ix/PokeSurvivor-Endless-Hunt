const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('🚀 Iniciando testes E2E completos das novas funcionalidades...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Acessa o jogo local
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Remove tapstart e entra como convidado
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    if (window.G && window.G.DB && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Injeta savegame com Pokémon e recursos para testar tudo
  await page.evaluate(() => {
    const s = G.DB.save;
    if (!s) return;
    s.owned = s.owned || {};
    s.owned[1] = 1; // Bulbasaur
    s.owned[4] = 1; // Charmander
    s.owned[6] = 1; // Charizard
    s.owned[25] = 1; // Pikachu
    s.coins = 50000;
    s.partner = 1;
    G.DB.commit();
  });

  // TESTE 1: Status Reais Oficiais na Pokédex
  console.log('📋 Testando Painel de Status Oficiais na Pokédex...');
  await page.evaluate(() => {
    G.MenuUI.openDex();
    G.MenuUI.showDetail(4); // Charmander
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'pokedex_official_stats_live.png') });
  console.log('📸 Screenshot salvo: pokedex_official_stats_live.png');

  // TESTE 2: Aba de Melhorias com Seleção de Ataques Iniciais
  console.log('🎯 Testando Seleção de Ataques Iniciais na aba de Melhorias...');
  await page.evaluate(() => {
    G.MenuUI.openUpgrades();
  });
  await new Promise(r => setTimeout(r, 800));

  const hasStartMovesPanel = await page.evaluate(() => {
    const p = document.querySelector('.start-moves-panel');
    return !!p;
  });
  console.log('Painel de Ataques Iniciais renderizado:', hasStartMovesPanel);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'upgrades_start_moves_picker_live.png') });
  console.log('📸 Screenshot salvo: upgrades_start_moves_picker_live.png');

  // TESTE 3: Ranking Duplo (Tempo vs Fendas)
  console.log('🏆 Testando Ranking Duplo (Tempo e Fendas)...');
  await page.evaluate(() => {
    G.RankingUI.open();
  });
  await new Promise(r => setTimeout(r, 800));

  const hasCatTabs = await page.evaluate(() => {
    const cat = document.getElementById('rk-cat');
    return cat && cat.children.length === 2;
  });
  console.log('Abas de Categoria do Ranking renderizadas (Tempo e Fendas):', hasCatTabs);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'ranking_double_category_live.png') });
  console.log('📸 Screenshot salvo: ranking_double_category_live.png');

  // Alterna para "Mais Fendas"
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('#rk-cat button');
    if (buttons && buttons[1]) buttons[1].click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'ranking_rifts_category_live.png') });
  console.log('📸 Screenshot salvo: ranking_rifts_category_live.png');

  // TESTE 4: Gameplay - Painel de Status Retrátil abaixo dos ataques
  console.log('⚔️ Testando HUD de Status Retrátil em Gameplay...');
  await page.evaluate(() => {
    G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Verifica estado inicial: colapsado
  const initialCollapsed = await page.evaluate(() => {
    const panel = document.getElementById('stats-rpg-panel');
    return panel ? panel.classList.contains('collapsed') : false;
  });
  console.log('Painel de status inicia colapsado:', initialCollapsed);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gameplay_hud_collapsed_clean_live.png') });
  console.log('📸 Screenshot salvo: gameplay_hud_collapsed_clean_live.png');

  // Clica no toggle para expandir os parâmetros
  await page.evaluate(() => {
    const toggle = document.getElementById('hud-stats-toggle');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const expandedState = await page.evaluate(() => {
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    return {
      collapsed: panel ? panel.classList.contains('collapsed') : true,
      arrowText: arrow ? arrow.textContent : ''
    };
  });
  console.log('Estado após clique no toggle:', expandedState);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gameplay_hud_expanded_parameters_live.png') });
  console.log('📸 Screenshot salvo: gameplay_hud_expanded_parameters_live.png');

  // TESTE 5: Nível 20 e Combo dos 4 ataques sem modal
  console.log('⚡ Testando progressão para o Nível 20 e combo quádruplo...');
  const lvl20Result = await page.evaluate(() => {
    const pl = G.Game.player;
    pl.gainXp(500000);
    // Garante 4 ataques
    while (pl.moves.length < 4) {
      const p = G.Moves.poolFor(pl.mon).filter(m => !pl.hasMove(m));
      if (p.length) pl.addMove(p[0]); else break;
    }
    return {
      level: pl.level,
      quadComboActive: pl.quadComboActive,
      movesCount: pl.moves.length,
      activeGroupCount: pl.activeGroup().length,
      isLvlUpOpen: G.UI.isOpen('scr-lvlup')
    };
  });
  console.log('Resultado do Nível 20:', lvl20Result);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'gameplay_lvl20_quad_combo_live.png') });
  console.log('📸 Screenshot salvo: gameplay_lvl20_quad_combo_live.png');

  // TESTE 6: Roleta Regional e Estágio 1
  console.log('🎰 Testando Roleta Regional Kanto...');
  const gachaResult = await page.evaluate(() => {
    // Sorteia 10x na aba Kanto (gen 1)
    const pulls = [];
    for (let i = 0; i < 10; i++) {
      const res = G.Gacha.pullRoulette(G.DB.save, 1, 1);
      if (res && res.mon) pulls.push({ dex: res.mon.dex, gen: res.mon.gen, name: res.mon.name });
    }
    const allGen1 = pulls.every(p => p.gen === 1);
    return { pullsCount: pulls.length, allGen1, sample: pulls.slice(0, 3) };
  });
  console.log('Resultado da Roleta Regional Kanto:', gachaResult);

  await browser.close();
  console.log('✨ Todos os testes foram executados com êxito!');
}

run().catch(err => {
  console.error('❌ Erro no teste E2E:', err);
  process.exit(1);
});
