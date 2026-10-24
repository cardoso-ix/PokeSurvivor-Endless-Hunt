/**
 * Testes Unitários: Taxas de Captura Base e Bônus das Bolas
 *
 * Fonte única de verdade: BalanceConfig.rewards.captureRates (taxas base)
 * e CaptureSystem.POKEBALL_TIERS (bônus por tier).
 * O teste NÃO repete números literais: deriva tudo da configuração,
 * para não poder divergir do balanceamento em um balance pass futuro.
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

const BalanceConfig = require('../js/config/balanceConfig.js');
const CaptureSystem = require('../js/systems/capture.js');

const CR = BalanceConfig.rewards.captureRates;

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

console.log('--- TESTE 1: TAXA DE CAPTURA BASE (FONTE: BalanceConfig) ---');

// 1. Pokémon Básico ou Estágio Único
assert(CaptureSystem.getBaseCatchRate('charmander', false) === CR.stage1,
  `Charmander (Básico) -> Taxa Base: ${CR.stage1 * 100}%`);
assert(CaptureSystem.getBaseCatchRate(4, false) === CR.stage1,
  `Dex 4 (Charmander) -> Taxa Base: ${CR.stage1 * 100}%`);
assert(CaptureSystem.getBaseCatchRate('pikachu', false) === CR.stage1,
  `Pikachu (Básico) -> Taxa Base: ${CR.stage1 * 100}%`);
assert(CaptureSystem.getBaseCatchRate('lapras', false) === CR.stage1,
  `Lapras (Estágio Único) -> Taxa Base: ${CR.stage1 * 100}%`);

// 2. Pokémon Lendário / Mítico
assert(CaptureSystem.getBaseCatchRate('mewtwo', false) === CR.legendary,
  `Mewtwo (Lendário) -> Taxa Base: ${CR.legendary * 100}%`);
assert(CaptureSystem.getBaseCatchRate(150, false) === CR.legendary,
  `Dex 150 (Mewtwo) -> Taxa Base: ${CR.legendary * 100}%`);
assert(CaptureSystem.getBaseCatchRate('articuno', false) === CR.legendary,
  `Articuno (Lendário) -> Taxa Base: ${CR.legendary * 100}%`);
assert(CaptureSystem.getBaseCatchRate('mew', false) === CR.legendary,
  `Mew (Mítico) -> Taxa Base: ${CR.legendary * 100}%`);

// 3. Pokémon Shiny comum
assert(CaptureSystem.getBaseCatchRate('charmander', true) === CR.shinyCommon,
  `Charmander Shiny -> Taxa Base: ${CR.shinyCommon * 100}%`);
assert(CaptureSystem.getBaseCatchRate('mewtwo', true) === CR.shinyLegendary,
  `Mewtwo Shiny (Prioridade sobre Lendário) -> Taxa Base: ${CR.shinyLegendary * 100}%`);
assert(CaptureSystem.getBaseCatchRate('mew', true) === CR.shinyLegendary,
  `Mew Shiny (Prioridade sobre Mítico) -> Taxa Base: ${CR.shinyLegendary * 100}%`);
assert(CaptureSystem.getBaseCatchRate('lapras', true) === CR.shinyCommon,
  `Lapras Shiny -> Taxa Base: ${CR.shinyCommon * 100}%`);

// 4. Estágios evolutivos
assert(CaptureSystem.getBaseCatchRate('bulbasaur', false, false, 1) === CR.stage1,
  `Estágio 1 -> Taxa Base: ${CR.stage1 * 100}%`);
assert(CaptureSystem.getBaseCatchRate('ivysaur', false, false, 2) === CR.stage2,
  `Estágio 2 -> Taxa Base: ${CR.stage2 * 100}%`);
assert(CaptureSystem.getBaseCatchRate('venusaur', false, false, 3) === CR.stage3,
  `Estágio 3 -> Taxa Base: ${CR.stage3 * 100}%`);

console.log('\n--- TESTE 2: TIERS DE POKÉBOLA POR NÍVEL DO JOGADOR ---');
const TIERS = CaptureSystem.POKEBALL_TIERS;
const tierCases = [
  { lvl: 5, tier: TIERS.POKEBALL, name: 'Poké Ball' },
  { lvl: 15, tier: TIERS.GREATBALL, name: 'Great Ball' },
  { lvl: 25, tier: TIERS.ULTRABALL, name: 'Ultra Ball' },
  { lvl: 35, tier: TIERS.ULTIMATEBALL, name: 'Ultimate Ball' }
];

for (const c of tierCases) {
  const ball = CaptureSystem.getBallForPlayerLevel(c.lvl);
  assert(ball.name === c.name, `Nível ${c.lvl} resolve para ${c.name}`);
  assert(ball.bonus === c.tier.bonus,
    `Bônus de ${c.name} é +${Math.round(c.tier.bonus * 100)}%`);
  assert(ball.label.includes(String(Math.round(c.tier.bonus * 100))),
    `Label de ${c.name} anuncia o bônus real (+${Math.round(c.tier.bonus * 100)}%)`);
}

// Faixas de nível dos tiers
assert(CaptureSystem.getBallForPlayerLevel(10).name === 'Poké Ball', 'Nv 10 ainda é Poké Ball');
assert(CaptureSystem.getBallForPlayerLevel(11).name === 'Great Ball', 'Nv 11 vira Great Ball');
assert(CaptureSystem.getBallForPlayerLevel(20).name === 'Great Ball', 'Nv 20 ainda é Great Ball');
assert(CaptureSystem.getBallForPlayerLevel(21).name === 'Ultra Ball', 'Nv 21 vira Ultra Ball');
assert(CaptureSystem.getBallForPlayerLevel(30).name === 'Ultra Ball', 'Nv 30 ainda é Ultra Ball');
assert(CaptureSystem.getBallForPlayerLevel(31).name === 'Ultimate Ball', 'Nv 31 vira Ultimate Ball');

console.log('\n--- TESTE 3: CHANCE FINAL COM O TETO RÍGIDO ---');
for (const c of tierCases) {
  const ball = CaptureSystem.getBallForPlayerLevel(c.lvl);
  const calcBasico = CR.stage1 + ball.bonus;
  const calcLendario = CR.legendary + ball.bonus;
  const calcShiny = CR.shinyCommon + ball.bonus;

  assert(calcBasico === CR.stage1 + c.tier.bonus,
    `Nv ${c.lvl} [${c.name}]: Básico = ${(calcBasico * 100).toFixed(0)}%`);
  assert(calcLendario === CR.legendary + c.tier.bonus,
    `Nv ${c.lvl} [${c.name}]: Lendário = ${(calcLendario * 100).toFixed(0)}%`);
  assert(calcShiny === CR.shinyCommon + c.tier.bonus,
    `Nv ${c.lvl} [${c.name}]: Shiny = ${(calcShiny * 100).toFixed(0)}%`);
}

// Toda combinação (base + bônus da melhor bola) respeita o teto rígido
const bestBonus = Math.max(
  TIERS.POKEBALL.bonus, TIERS.GREATBALL.bonus,
  TIERS.ULTRABALL.bonus, TIERS.ULTIMATEBALL.bonus
);
const combos = [
  { label: 'Normal Estágio 1', base: CR.stage1, cap: CR.maxCap },
  { label: 'Normal Estágio 3', base: CR.stage3, cap: CR.maxCap },
  { label: 'Shiny Comum', base: CR.shinyCommon, cap: 0.22 },
  { label: 'Lendário', base: CR.legendary, cap: 0.16 },
  { label: 'Shiny Lendário', base: CR.shinyLegendary, cap: 0.08 }
];
for (const cb of combos) {
  const finalChance = Math.min(cb.cap, cb.base + bestBonus);
  assert(finalChance <= cb.cap,
    `${cb.label}: chance final ${(finalChance * 100).toFixed(0)}% respeita o teto de ${(cb.cap * 100).toFixed(0)}%`);
}

console.log('\n--- TESTE 4: GOLD BALL ---');
const gold = CaptureSystem.GOLD_BALL_CONFIG;
assert(gold.isGold === true, 'Gold Ball está marcada como dourada');
assert(gold.isGuaranteed === false, 'Gold Ball NÃO garante a captura (preserva mérito)');
assert(gold.chance === 0.10, 'Gold Ball tem 10% de chance de proc');
assert(gold.minLevel === 41, 'Gold Ball só aparece a partir do Nv 41');
assert(gold.bonus > 0 && gold.bonus < CR.maxCap, 'Bônus da Gold Ball respeita o teto de cap');
assert(gold.goldReward === 1000, 'Gold Ball rende 1.000 de Ouro');

// forceGold força a Gold Ball em qualquer nível
const forcedLow = CaptureSystem.resolveCaptureBall(5, true);
assert(forcedLow.isGold === true, 'forceGold=true ativa a Gold Ball mesmo no Nv 5');
const normalLow = CaptureSystem.resolveCaptureBall(5, false);
assert(!!normalLow.isGold === false, 'Sem forceGold, Nv 5 nunca é Gold Ball');

console.log(`\n🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
if (passedTests !== totalTests) {
  process.exit(1);
}
