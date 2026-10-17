/**
 * Testes Unitários e de Integração: Regras de Spawn de Guardiões de Rift
 * 1. 0 a 299 Rifts -> 100% Aleatório entre comuns (Lendários BLOQUEADOS)
 * 2. 300+ Rifts -> Lendários DESBLOQUEADOS (15% ponderado)
 * 3. Marco dos 500 Rifts -> Shiny Pity 100% GARANTIDO
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
  Tiles: { T: 16 },
  Sprites: { PX: 2, hasShiny: () => true },
  Audio: { sfx() {} },
  FX: { ring() {}, px() {} },
  U: {
    rand: (a, b) => a + Math.random() * (b - a),
    pick: arr => arr[Math.floor(Math.random() * arr.length)]
  },
  Coop: { active: false, isHost: true, broadcast() {} },
  Judgment: { AT: 1800 }
};

// Carrega pokedex real do projeto
const pokedexCode = fs.readFileSync(path.join(__dirname, '../js/data/pokedex.js'), 'utf8');
eval(pokedexCode);

G.DEX.forEach(mon => {
  G.DEX_BY[mon.dex] = mon;
  G.SPRITE_META[mon.dex] = true;
});

// Mock DB
let totalRiftsCount = 0;
G.DB = {
  getTotalRiftsCleared: () => {
    const val = global.localStorage.getItem('poke_total_rifts');
    if (val != null) return Number(val) || 0;
    return totalRiftsCount;
  },
  setTotalRiftsCleared: (n) => {
    totalRiftsCount = Number(n) || 0;
    global.localStorage.setItem('poke_total_rifts', String(totalRiftsCount));
    return totalRiftsCount;
  }
};
global.window.db = G.DB;

// Carrega o módulo de Rifts
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

console.log('--- TESTE 1: SIMULAÇÃO COM 50 RIFTS (0 A 299 RIFTS) ---');
console.log('Executando window.debugSimulateRiftSpawn(50)...');
const res50 = window.debugSimulateRiftSpawn(50);
assert(!res50.isLegendary, `debugSimulateRiftSpawn(50) -> Guardião ${res50.speciesId.toUpperCase()} NÃO é lendário`);
assert(!res50.isShiny, `debugSimulateRiftSpawn(50) -> Não forçou Shiny`);

// Executa 100 sorteios para comprovar estatisticamente que NENHUM lendário surge com rifts < 300
let legendariesFoundUnder300 = 0;
for (let i = 0; i < 100; i++) {
  const g = Rift.selectRiftGuardian();
  if (g.isLegendary) legendariesFoundUnder300++;
}
assert(legendariesFoundUnder300 === 0, `100 sorteios com 50 rifts concluídos: 0 lendários gerados (Obtido: ${legendariesFoundUnder300})`);

console.log('\n--- TESTE 2: SIMULAÇÃO COM 300 RIFTS (LENDÁRIOS DESBLOQUEADOS) ---');
console.log('Executando window.debugSimulateRiftSpawn(300)...');
const res300 = window.debugSimulateRiftSpawn(300);
assert(typeof res300.isLegendary === 'boolean', `debugSimulateRiftSpawn(300) -> Guardião sorteado com sucesso: ${res300.speciesId.toUpperCase()}`);

// Executa 300 sorteios para comprovar que lendários surgem na faixa de 10% a 20%
let legendariesFound300 = 0;
for (let i = 0; i < 300; i++) {
  const g = Rift.selectRiftGuardian();
  if (g.isLegendary) legendariesFound300++;
}
const legPercentage = (legendariesFound300 / 300) * 100;
console.log(`Estatística de Lendários em 300 sorteios: ${legendariesFound300}/300 (${legPercentage.toFixed(1)}%)`);
assert(legendariesFound300 > 0, `Lendários foram gerados a partir de 300 rifts (${legendariesFound300} vezes)`);
assert(legPercentage >= 8 && legPercentage <= 25, `Frequência de Lendários dentro da faixa ponderada esperada (~15%): ${legPercentage.toFixed(1)}%`);

console.log('\n--- TESTE 3: SIMULAÇÃO COM 500 RIFTS (SHINY PITY 100% GARANTIDO) ---');
console.log('Executando window.debugSimulateRiftSpawn(500)...');
const res500 = window.debugSimulateRiftSpawn(500);
assert(res500.isShiny === true, `debugSimulateRiftSpawn(500) -> Guardião ${res500.speciesId.toUpperCase()} é SHINY 100% GARANTIDO ✨!`);

// Testa 20 sorteios consecutivos com exatamente 500 rifts para garantir 100% de consistência
let shiniesFound500 = 0;
for (let i = 0; i < 20; i++) {
  const g = Rift.selectRiftGuardian();
  if (g.isShiny) shiniesFound500++;
}
assert(shiniesFound500 === 20, `20/20 sorteios no marco 500 retornaram Shiny garantido (100%)`);

// Testa com marco de 1000 rifts
window.debugSimulateRiftSpawn(1000);
const res1000 = Rift.selectRiftGuardian();
assert(res1000.isShiny === true, `Marco de 1000 rifts -> Também garante Shiny 100%!`);

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
