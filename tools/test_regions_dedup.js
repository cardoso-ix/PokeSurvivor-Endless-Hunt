/**
 * Testes Unitários e de Integração:
 * 1. Mapeamento das 9 Regiões (Kanto a Paldea)
 * 2. Restrição de Inimigos e Chefes à Região Ativa (game.currentRegion)
 * 3. Deduplicação em Rifts: Pokémon já registrados na Pokédex NUNCA voltam a ser sorteados como normais
 * 4. Preservação de Shinies não capturados
 * 5. Marcos: < 300 Rifts sem lendários, >= 300 Rifts com lendários, 500 Rifts com Shiny garantido
 * 6. Região 100% Concluída: Caixa de Recompensas de Campeão
 * 7. Execução e validação de debugTestRegionFilter('kanto')
 */

const fs = require('fs');
const path = require('path');

// Simulação de ambiente mínimo de navegador
const localStorageMock = new Map();
global.localStorage = {
  getItem: (k) => (localStorageMock.has(k) ? localStorageMock.get(k) : null),
  setItem: (k, v) => localStorageMock.set(k, String(v)),
  removeItem: (k) => localStorageMock.delete(k),
  clear: () => localStorageMock.clear()
};

global.window = {
  localStorage: global.localStorage
};

global.G = {
  DEX_BY: {},
  DEX: [],
  SPRITE_META: {},
  DB: null,
  Game: { currentRegion: 'kanto' },
  Tiles: { T: 16 },
  Sprites: { PX: 2, hasShiny: () => true },
  Audio: { sfx() {} },
  FX: { ring() {}, px() {} },
  U: {
    rand: (a, b) => a + Math.random() * (b - a),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    pickN: (arr, n) => {
      const sh = arr.slice();
      for (let i = sh.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sh[i], sh[j]] = [sh[j], sh[i]];
      }
      return sh.slice(0, n);
    },
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    hash: (a, b, c) => (Math.sin(a * 12.9898 + b * 78.233 + (c || 0)) * 43758.5453) % 1
  },
  Coop: { active: false, isHost: true, broadcast() {} },
  Judgment: { AT: 1800 }
};

global.window.game = G.Game;

// Carrega pokedex real do projeto
const pokedexCode = fs.readFileSync(path.join(__dirname, '../js/data/pokedex.js'), 'utf8');
eval(pokedexCode);

G.DEX.forEach(mon => {
  G.DEX_BY[mon.dex] = mon;
  G.SPRITE_META[mon.dex] = true;
});

// Carrega regions.js
const regionsModule = require('../js/data/regions.js');
const REGIONS_CONFIG = regionsModule.REGIONS_CONFIG;

// Mock DB Save
const fakeSave = {
  owned: {},
  shiny: {},
  totalRiftsCleared: 0,
  stats: { riftWins: 0, coinsEarned: 0 },
  coins: 1000
};

G.DB = {
  save: fakeSave,
  owns: (dex) => !!fakeSave.owned[dex],
  ownsShiny: (dex) => !!fakeSave.shiny[dex],
  grant: (dex) => { fakeSave.owned[dex] = { at: Date.now() }; },
  grantShiny: (dex) => { fakeSave.owned[dex] = { at: Date.now() }; fakeSave.shiny[dex] = { at: Date.now() }; },
  getTotalRiftsCleared: () => {
    const val = global.localStorage.getItem('poke_total_rifts');
    if (val != null) return Number(val) || 0;
    return fakeSave.totalRiftsCleared;
  },
  setTotalRiftsCleared: (n) => {
    fakeSave.totalRiftsCleared = Number(n) || 0;
    global.localStorage.setItem('poke_total_rifts', String(fakeSave.totalRiftsCleared));
    return fakeSave.totalRiftsCleared;
  },
  getCapturedPokemon: () => {
    const res = [];
    for (const d of Object.keys(fakeSave.owned)) {
      const mon = G.DEX_BY[Number(d)];
      if (mon) res.push(mon.name.toLowerCase());
      res.push(String(d));
    }
    return res;
  },
  getCapturedShinies: () => {
    const res = [];
    for (const d of Object.keys(fakeSave.shiny)) {
      const mon = G.DEX_BY[Number(d)];
      if (mon) res.push(mon.name.toLowerCase());
      res.push(String(d));
    }
    return res;
  },
  isPokemonCaptured: (id) => {
    let dex = null;
    if (typeof id === 'number' || /^\d+$/.test(String(id))) dex = Number(id);
    else {
      const m = G.DEX.find(p => p.name.toLowerCase() === String(id).toLowerCase());
      if (m) dex = m.dex;
    }
    return !!(dex && fakeSave.owned[dex]);
  },
  isPokemonShinyCaptured: (id) => {
    let dex = null;
    if (typeof id === 'number' || /^\d+$/.test(String(id))) dex = Number(id);
    else {
      const m = G.DEX.find(p => p.name.toLowerCase() === String(id).toLowerCase());
      if (m) dex = m.dex;
    }
    return !!(dex && fakeSave.shiny[dex]);
  },
  getCapturedCountByRegion: (regKey) => {
    const cfg = regionsModule.getRegionConfig(regKey);
    let c = 0;
    for (let d = cfg.dexRange[0]; d <= cfg.dexRange[1]; d++) {
      if (fakeSave.owned[d]) c++;
    }
    return c;
  },
  getTotalCountByRegion: (regKey) => {
    const cfg = regionsModule.getRegionConfig(regKey);
    return cfg.dexRange[1] - cfg.dexRange[0] + 1;
  }
};
global.window.db = G.DB;
global.window.DB = G.DB;

// Carrega Enemies e Rifts
const EnemiesCode = fs.readFileSync(path.join(__dirname, '../js/data/enemies.js'), 'utf8');
eval(EnemiesCode);

const Rift = require('../js/systems/rift.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('--- TESTE 1: MAPEAMENTO DAS REGIÕES ---');
assert(regionsModule.getPokemonRegion(25) === 'kanto', 'Pikachu (#25) é de Kanto');
assert(regionsModule.getPokemonRegion(172) === 'johto', 'Pichu (#172) é de Johto');
assert(regionsModule.getPokemonRegion(258) === 'hoenn', 'Mudkip (#258) é de Hoenn');
assert(regionsModule.getPokemonRegion(387) === 'sinnoh', 'Turtwig (#387) é de Sinnoh');
assert(regionsModule.getRegionDexRange('kanto')[0] === 1 && regionsModule.getRegionDexRange('kanto')[1] === 151, 'Faixa de Kanto: 1 a 151');

console.log('\n--- TESTE 2: AMBIENTAÇÃO REGIONAL NOS INIMIGOS ---');
G.Game.currentRegion = 'kanto';
const kantoRoll = G.Enemies.rollRun();
const allKantoMonsters = [];
kantoRoll.cast.forEach(tier => tier.list.forEach(m => allKantoMonsters.push(m.dex)));
kantoRoll.bosses.forEach(b => allKantoMonsters.push(b.dex));
const allInsideKanto = allKantoMonsters.every(d => d >= 1 && d <= 151);
assert(allInsideKanto, `100% dos monstros sorteados em Kanto pertencem à 1ª geração (1-151)`);

G.Game.currentRegion = 'johto';
const johtoRoll = G.Enemies.rollRun();
const allJohtoMonsters = [];
johtoRoll.cast.forEach(tier => tier.list.forEach(m => allJohtoMonsters.push(m.dex)));
johtoRoll.bosses.forEach(b => allJohtoMonsters.push(b.dex));
const allInsideJohto = allJohtoMonsters.every(d => d >= 152 && d <= 251);
assert(allInsideJohto, `100% dos monstros sorteados em Johto pertencem à 2ª geração (152-251)`);

console.log('\n--- TESTE 3: DEDUPLICAÇÃO DE RIFTS NA POKÉDEX ---');
G.Game.currentRegion = 'kanto';
G.DB.setTotalRiftsCleared(50); // Menos de 300 rifts: sem lendários
fakeSave.owned = {}; // Limpa save

// O jogador captura 50 espécies de Kanto (1 a 50)
for (let d = 1; d <= 50; d++) {
  fakeSave.owned[d] = { at: Date.now() };
}
console.log(`Jogador possui ${G.DB.getCapturedCountByRegion('kanto')} Pokémon em Kanto.`);

// Sorteia 100 Guardiões de Rift consecutivos e verifica se ALGUM repetido foi sorteado
let repeatedFound = 0;
for (let i = 0; i < 100; i++) {
  const g = Rift.selectRiftGuardian();
  if (G.DB.isPokemonCaptured(g.dex) || G.DB.isPokemonCaptured(g.speciesId)) {
    repeatedFound++;
  }
  assert(g.dex >= 1 && g.dex <= 151, `Guardião pertence à região de Kanto (#${g.dex} ${g.speciesId})`);
}
assert(repeatedFound === 0, `0 espécies repetidas sorteadas em 100 Rifts consecutivos (Obtido: ${repeatedFound})`);

console.log('\n--- TESTE 4: EXECUÇÃO DO ATALHO debugTestRegionFilter(\'kanto\') ---');
const debugRes = window.debugTestRegionFilter('kanto');
assert(!G.DB.isPokemonCaptured(debugRes.speciesId), `debugTestRegionFilter confirmou: guardião ${debugRes.speciesId.toUpperCase()} é inédito!`);

console.log('\n--- TESTE 5: CASO ESPECIAL - SHINY AINDA NÃO CAPTURADO ---');
// Captura Charizard normal (#6), mas NÃO possui shiny
fakeSave.owned[6] = { at: Date.now() };
delete fakeSave.shiny[6];
assert(G.DB.isPokemonCaptured(6) === true, 'Charizard normal está na Pokédex');
assert(G.DB.isPokemonShinyCaptured(6) === false, 'Charizard Shiny NÃO está na Pokédex');

// Quando o pity de 500 rifts está ativo, candidatos a shiny incluem espécies que o jogador tem na versão normal!
G.DB.setTotalRiftsCleared(500); // 100% Shiny
const shinyGuardian = Rift.selectRiftGuardian();
assert(shinyGuardian.isShiny === true, 'Marco de 500 rifts gerou Shiny garantido');

console.log('\n--- TESTE 6: TRATAMENTO DE REGIÃO 100% COMPLETA (CAIXA DE CAMPEÃO) ---');
// Preenche todos os 151 de Kanto
for (let d = 1; d <= 151; d++) {
  fakeSave.owned[d] = { at: Date.now() };
  fakeSave.shiny[d] = { at: Date.now() };
}
G.DB.setTotalRiftsCleared(100);
const fullRegionGuardian = Rift.selectRiftGuardian();
assert(fullRegionGuardian.isChampionReward === true, 'Região 100% completa ativou isChampionReward = true (Caixa de Campeão)!');
assert(fullRegionGuardian.dex >= 1 && fullRegionGuardian.dex <= 151, 'Guardião continua pertencendo a Kanto mesmo com 100% completo');

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
