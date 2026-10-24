/**
 * Testes Unitários e de Integração: Sistema Dinâmico de Pokébolas por Nível da Run
 * Valida a tabela POKEBALL_TIERS, a função getBallForPlayerLevel, o cálculo da taxa
 * final e a resolução da bola em cada patamar de nível.
 *
 * As expectativas derivam de POKEBALL_TIERS (a fonte real) e de
 * BalanceConfig.rewards.captureRates — o teste não repete literais, para não
 * poder divergir do balanceamento.
 */

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

const BalanceConfig = require('../js/config/balanceConfig.js');
const CaptureSystem = require('../js/systems/capture.js');
const CR = BalanceConfig.rewards.captureRates;
const TIERS = CaptureSystem.POKEBALL_TIERS;

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
// Cada patamar é derivado da própria tabela POKEBALL_TIERS.
const testsLevel = [
  { level: 1, tier: TIERS.POKEBALL },
  { level: 5, tier: TIERS.POKEBALL },
  { level: 10, tier: TIERS.POKEBALL },
  { level: 11, tier: TIERS.GREATBALL },
  { level: 15, tier: TIERS.GREATBALL },
  { level: 20, tier: TIERS.GREATBALL },
  { level: 21, tier: TIERS.ULTRABALL },
  { level: 25, tier: TIERS.ULTRABALL },
  { level: 30, tier: TIERS.ULTRABALL },
  { level: 31, tier: TIERS.ULTIMATEBALL },
  { level: 40, tier: TIERS.ULTIMATEBALL },
  { level: 100, tier: TIERS.ULTIMATEBALL }
];

for (const t of testsLevel) {
  // O sorteio da Gold Ball (10% a partir do Nv 41) é aleatório: fixamos o RNG
  // para que o teste seja determinístico e exercite o tier não-dourado.
  const origRandom = Math.random;
  Math.random = () => 0.99;
  const ball = CaptureSystem.getBallForPlayerLevel(t.level);
  Math.random = origRandom;
  assert(ball.id === t.tier.id, `Nível ${t.level} -> ${t.tier.name} (${ball.label}) [ID: ${ball.id}]`);
  assert(ball.bonus === t.tier.bonus, `Nível ${t.level} -> Bônus exato: +${Math.round(ball.bonus * 100)}%`);
  assert(ball.name === t.tier.name, `Nível ${t.level} -> Nome: ${ball.name}`);
  // O label exibido ao jogador precisa refletir o bônus real do tier
  assert(ball.label.includes(String(Math.round(t.tier.bonus * 100))),
    `Nível ${t.level} -> Label anuncia o bônus real: ${ball.label}`);
}

// Faixas min/max declaradas na tabela batem com a resolução
assert(CaptureSystem.getBallForPlayerLevel(TIERS.POKEBALL.minLevel).id === TIERS.POKEBALL.id,
  'minLevel da Poké Ball resolve para a própria Poké Ball');
assert(CaptureSystem.getBallForPlayerLevel(TIERS.GREATBALL.minLevel).id === TIERS.GREATBALL.id,
  'minLevel da Great Ball resolve para a própria Great Ball');
assert(CaptureSystem.getBallForPlayerLevel(TIERS.ULTRABALL.minLevel).id === TIERS.ULTRABALL.id,
  'minLevel da Ultra Ball resolve para a própria Ultra Ball');
assert(CaptureSystem.getBallForPlayerLevel(TIERS.ULTIMATEBALL.minLevel).id === TIERS.ULTIMATEBALL.id,
  'minLevel da Ultimate Ball resolve para a própria Ultimate Ball');

console.log('\n--- TESTE 2: CÁLCULO DA TAXA FINAL COM BÔNUS DA BOLA ---');
const monCharmander = G.DEX_BY[4];
const baseRate = CaptureSystem.getBaseCatchRate(monCharmander.name, false, false, 1);
assert(baseRate === CR.stage1, `Taxa base de Charmander (Estágio 1) é ${CR.stage1 * 100}% (Obtido: ${baseRate * 100}%)`);

// A bola resolvida em cada patamar tem a taxa final = base + bônus, dentro do cap
const tierChecks = [
  { level: 5, tier: TIERS.POKEBALL },
  { level: 15, tier: TIERS.GREATBALL },
  { level: 25, tier: TIERS.ULTRABALL },
  { level: 40, tier: TIERS.ULTIMATEBALL }
];
for (const c of tierChecks) {
  const ball = CaptureSystem.startCaptureSequence({ mon: monCharmander, level: c.level, stage: 1 });
  assert(ball.ballTier.id === c.tier.id, `Nível ${c.level} ativa ${c.tier.name}`);
  const expectedChance = Math.min(CR.maxCap, CR.stage1 + c.tier.bonus);
  assert(ball.finalChance === expectedChance,
    `Nível ${c.level} [${c.tier.name}]: taxa final ${(ball.finalChance * 100).toFixed(1)}% (esperado ${(expectedChance * 100).toFixed(1)}%)`);
  assert(ball.finalChance <= CR.maxCap, `Nível ${c.level}: taxa final respeita o teto de ${CR.maxCap * 100}%`);
}

console.log('\n--- TESTE 3: GOLD BALL NÃO ENTRA NA RESOLUÇÃO AUTOMÁTICA ABAIXO DO NV 41 ---');
const below41 = CaptureSystem.getBallForPlayerLevel(40);
assert(below41.isGold !== true, 'Nível 40 nunca resolve para Gold Ball');
const forced = CaptureSystem.getBallForPlayerLevel(40, true);
assert(forced.isGold === true, 'forceGold=true resolve para Gold Ball no nível 40');

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
