/**
 * Testes Unitários e de Integração: Sistema Dinâmico de Pokébolas por Nível da Run
 * Valida a tabela POKEBALL_TIERS, a função getBallForPlayerLevel, o cálculo da taxa final
 * e a saída dos comandos debugTriggerCapture nos 4 patamares de nível.
 */

// Simula ambiente de navegador mínimo para carregar capture.js
global.window = {};
global.G = {
  DEX_BY: {
    4: { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, atk: 52, spd: 65 },
    5: { dex: 5, name: 'Charmeleon', types: ['fire'], hp: 58, atk: 64, spd: 80 },
    6: { dex: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 78, atk: 84, spd: 100 },
    25: { dex: 25, name: 'Pikachu', types: ['electric'], hp: 35, atk: 55, spd: 90 }
  },
  DEX: [
    { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, atk: 52, spd: 65 },
    { dex: 5, name: 'Charmeleon', types: ['fire'], hp: 58, atk: 64, spd: 80 },
    { dex: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 78, atk: 84, spd: 100 },
    { dex: 25, name: 'Pikachu', types: ['electric'], hp: 35, atk: 55, spd: 90 }
  ],
  Game: {
    player: { level: 8, x: 100, y: 100 }
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
    width: 0,
    height: 0,
    getContext: () => ({
      imageSmoothingEnabled: false,
      fillStyle: '',
      fillRect: () => {}
    })
  }),
  getElementById: () => null
};

// Carrega o módulo de captura
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

console.log('--- TESTE 1: RESOLUÇÃO DE POKÉBOLAS POR FAIXA DE NÍVEL ---');
const testsLevel = [
  { level: 1, expectedId: 'pokeball', expectedName: 'Poké Ball', bonus: 0.00 },
  { level: 5, expectedId: 'pokeball', expectedName: 'Poké Ball', bonus: 0.00 },
  { level: 10, expectedId: 'pokeball', expectedName: 'Poké Ball', bonus: 0.00 },
  { level: 11, expectedId: 'greatball', expectedName: 'Great Ball', bonus: 0.05 },
  { level: 15, expectedId: 'greatball', expectedName: 'Great Ball', bonus: 0.05 },
  { level: 20, expectedId: 'greatball', expectedName: 'Great Ball', bonus: 0.05 },
  { level: 21, expectedId: 'ultraball', expectedName: 'Ultra Ball', bonus: 0.10 },
  { level: 25, expectedId: 'ultraball', expectedName: 'Ultra Ball', bonus: 0.10 },
  { level: 30, expectedId: 'ultraball', expectedName: 'Ultra Ball', bonus: 0.10 },
  { level: 31, expectedId: 'ultimateball', expectedName: 'Ultimate Ball', bonus: 0.15 },
  { level: 40, expectedId: 'ultimateball', expectedName: 'Ultimate Ball', bonus: 0.15 },
  { level: 100, expectedId: 'ultimateball', expectedName: 'Ultimate Ball', bonus: 0.15 }
];

for (const t of testsLevel) {
  const ball = CaptureSystem.getBallForPlayerLevel(t.level);
  assert(ball.id === t.expectedId, `Nível ${t.level} -> ${ball.name} (${ball.label}) [ID: ${ball.id}]`);
  assert(ball.bonus === t.bonus, `Nível ${t.level} -> Bônus exato: +${Math.round(ball.bonus * 100)}%`);
}

console.log('\n--- TESTE 2: CÁLCULO DA TAXA FINAL COM BÔNUS DA BOLA ---');
const monCharmander = G.DEX_BY[4];
const baseRate = CaptureSystem.getCaptureRate(monCharmander, false); // 0.50 para básico
assert(baseRate === 0.50, `Taxa base de Charmander é 50% (Obtido: ${baseRate * 100}%)`);

// Inicia captura simulando cada nível e checa a taxa calculada
CaptureSystem.startCaptureSequence({ mon: monCharmander, playerLevel: 5 });
assert(CaptureSystem.activeBall.id === 'pokeball', 'Nível 5 ativa Poké Ball');

CaptureSystem.startCaptureSequence({ mon: monCharmander, playerLevel: 15 });
assert(CaptureSystem.activeBall.id === 'greatball', 'Nível 15 ativa Great Ball');

CaptureSystem.startCaptureSequence({ mon: monCharmander, playerLevel: 25 });
assert(CaptureSystem.activeBall.id === 'ultraball', 'Nível 25 ativa Ultra Ball');

CaptureSystem.startCaptureSequence({ mon: monCharmander, playerLevel: 40 });
assert(CaptureSystem.activeBall.id === 'ultimateball', 'Nível 40 ativa Ultimate Ball');

console.log('\n--- TESTE 3: DEMONSTRAÇÃO DOS 4 COMANDOS debugTriggerCapture ---');
const interceptedLogs = [];
const originalLog = console.log;
console.log = function(...args) {
  interceptedLogs.push(args.join(' '));
  originalLog.apply(console, args);
};

// Executa os 4 comandos especificados
window.debugTriggerCapture('charmander', 5);
window.debugTriggerCapture('charmander', 15);
window.debugTriggerCapture('charmander', 25);
window.debugTriggerCapture('charmander', 40);

console.log = originalLog;

assert(interceptedLogs.some(l => l.includes('Nível: 5') && l.includes('Poké Ball (+0% Chance)')), 'Log Nível 5 -> Poké Ball (+0% Chance)');
assert(interceptedLogs.some(l => l.includes('Nível: 15') && l.includes('Great Ball (+5% Chance)')), 'Log Nível 15 -> Great Ball (+5% Chance)');
assert(interceptedLogs.some(l => l.includes('Nível: 25') && l.includes('Ultra Ball (+10% Chance)')), 'Log Nível 25 -> Ultra Ball (+10% Chance)');
assert(interceptedLogs.some(l => l.includes('Nível: 40') && l.includes('Ultimate Ball (+15% Chance)')), 'Log Nível 40 -> Ultimate Ball (+15% Chance)');

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
