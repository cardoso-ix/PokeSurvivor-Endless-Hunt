/**
 * Testes Unitários: Novas Regras Oficiais de Taxa de Captura Base e Bônus das Bolas
 */

global.window = {};
global.G = {
  DEX_BY: {
    4: { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, leg: false },
    25: { dex: 25, name: 'Pikachu', types: ['electric'], hp: 35, leg: false },
    129: { dex: 129, name: 'Magikarp', types: ['water'], hp: 20, leg: false },
    131: { dex: 131, name: 'Lapras', types: ['water', 'ice'], hp: 130, leg: false },
    144: { dex: 144, name: 'Articuno', types: ['ice', 'flying'], hp: 90, leg: true },
    150: { dex: 150, name: 'Mewtwo', types: ['psychic'], hp: 106, leg: true },
    151: { dex: 151, name: 'Mew', types: ['psychic'], hp: 100, rarity: 5, leg: true }
  },
  DEX: [
    { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, leg: false },
    { dex: 25, name: 'Pikachu', types: ['electric'], hp: 35, leg: false },
    { dex: 129, name: 'Magikarp', types: ['water'], hp: 20, leg: false },
    { dex: 131, name: 'Lapras', types: ['water', 'ice'], hp: 130, leg: false },
    { dex: 144, name: 'Articuno', types: ['ice', 'flying'], hp: 90, leg: true },
    { dex: 150, name: 'Mewtwo', types: ['psychic'], hp: 106, leg: true },
    { dex: 151, name: 'Mew', types: ['psychic'], hp: 100, rarity: 5, leg: true }
  ],
  Game: {
    player: { level: 10, x: 0, y: 0 }
  },
  Sprites: {
    Animator: class {
      constructor() {}
      loop() {}
      update() {}
      draw() {}
    }
  },
  Audio: { sfx() {} },
  Camera: { kick() {}, left() { return 0; }, top() { return 0; } },
  U: { damp(a) { return a; } },
  DB: { unlockPokemon() { return { baseDex: 4, baseName: 'Charmander' }; } }
};

global.document = {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({ imageSmoothingEnabled: false, fillStyle: '', fillRect() {} })
  }),
  getElementById: () => null
};

const CaptureSystem = require('../js/systems/capture.js');

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

console.log('--- TESTE 1: TAXA DE CAPTURA BASE (NOVA REGRA OFICIAL) ---');

// 1. Pokémon Básico ou Estágio Único: 50% (0.50)
assert(CaptureSystem.getBaseCatchRate('charmander', false) === 0.50, 'Charmander (Básico) -> Taxa Base: 50%');
assert(CaptureSystem.getBaseCatchRate(4, false) === 0.50, 'Dex 4 (Charmander) -> Taxa Base: 50%');
assert(CaptureSystem.getBaseCatchRate('pikachu', false) === 0.50, 'Pikachu (Básico) -> Taxa Base: 50%');
assert(CaptureSystem.getBaseCatchRate('lapras', false) === 0.50, 'Lapras (Estágio Único) -> Taxa Base: 50%');

// 2. Pokémon Lendário / Mítico: 20% (0.20)
assert(CaptureSystem.getBaseCatchRate('mewtwo', false) === 0.20, 'Mewtwo (Lendário) -> Taxa Base: 20%');
assert(CaptureSystem.getBaseCatchRate(150, false) === 0.20, 'Dex 150 (Mewtwo) -> Taxa Base: 20%');
assert(CaptureSystem.getBaseCatchRate('articuno', false) === 0.20, 'Articuno (Lendário) -> Taxa Base: 20%');
assert(CaptureSystem.getBaseCatchRate('mew', false) === 0.20, 'Mew (Mítico) -> Taxa Base: 20%');

// 3. Pokémon Shiny (prioridade máxima): 15% (0.15)
assert(CaptureSystem.getBaseCatchRate('charmander', true) === 0.15, 'Charmander Shiny -> Taxa Base: 15%');
assert(CaptureSystem.getBaseCatchRate('mewtwo', true) === 0.15, 'Mewtwo Shiny (Prioridade sobre Lendário) -> Taxa Base: 15%');
assert(CaptureSystem.getBaseCatchRate('mew', true) === 0.15, 'Mew Shiny (Prioridade sobre Mítico) -> Taxa Base: 15%');
assert(CaptureSystem.getBaseCatchRate('lapras', true) === 0.15, 'Lapras Shiny -> Taxa Base: 15%');

console.log('\n--- TESTE 2: CHANCE FINAL COM AS POKÉBOLAS (SOMA CUMULATIVA) ---');
const levels = [
  { lvl: 5, ballName: 'Poké Ball', bonus: 0.00, basico: 0.50, lendario: 0.20, shiny: 0.15 },
  { lvl: 15, ballName: 'Great Ball', bonus: 0.05, basico: 0.55, lendario: 0.25, shiny: 0.20 },
  { lvl: 25, ballName: 'Ultra Ball', bonus: 0.10, basico: 0.60, lendario: 0.30, shiny: 0.25 },
  { lvl: 35, ballName: 'Ultimate Ball', bonus: 0.15, basico: 0.65, lendario: 0.35, shiny: 0.30 }
];

for (const row of levels) {
  const ball = CaptureSystem.getBallForPlayerLevel(row.lvl);
  assert(ball.name === row.ballName, `Nível ${row.lvl} resolve para ${row.ballName}`);
  assert(ball.bonus === row.bonus, `Bônus de ${ball.name} é +${Math.round(row.bonus * 100)}%`);

  const calcBasico = Math.round((0.50 + ball.bonus) * 100) / 100;
  const calcLendario = Math.round((0.20 + ball.bonus) * 100) / 100;
  const calcShiny = Math.round((0.15 + ball.bonus) * 100) / 100;

  assert(calcBasico === row.basico, `Nv ${row.lvl} [${row.ballName}]: Básico = ${calcBasico * 100}% (Esperado: ${row.basico * 100}%)`);
  assert(calcLendario === row.lendario, `Nv ${row.lvl} [${row.ballName}]: Lendário = ${calcLendario * 100}% (Esperado: ${row.lendario * 100}%)`);
  assert(calcShiny === row.shiny, `Nv ${row.lvl} [${row.ballName}]: Shiny = ${calcShiny * 100}% (Esperado: ${row.shiny * 100}%)`);
}

console.log('\n--- TESTE 3: EXECUÇÃO REAL DE window.debugTestCatchRates() ---');
window.debugTestCatchRates();

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
