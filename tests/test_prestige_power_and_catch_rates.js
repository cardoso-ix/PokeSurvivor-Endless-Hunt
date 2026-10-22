const fs = require('fs');

console.log('===========================================================');
console.log('🧪 TESTE UNITÁRIO: SISTEMA DE DIFICULDADE POR ESTÁGIO & GOLD BOUNTY');
console.log('===========================================================');

global.window = global;
global.G = {
  U: {
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    damp: (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt)),
    dist2: (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2,
    rand: (min, max) => min + Math.random() * (max - min)
  },
  Sprites: {
    hasShiny: (dex) => true,
    bodyRadius: (dex) => 12,
    bodyHeight: (dex) => 24,
    Animator: class {
      constructor() { this.dir = 1; this.currentAnim = 'walk'; this.frame = 0; }
      draw() {}
    }
  },
  DEX_BY: {
    25: { dex: 25, name: 'Pikachu', hp: 86, atk: 1.0, spd: 116, rarity: 2, starter: false, leg: false },
    150: { dex: 150, name: 'Mewtwo', hp: 118, atk: 1.55, spd: 133, rarity: 5, starter: false, leg: true },
    6: { dex: 6, name: 'Charizard', hp: 105, atk: 1.30, spd: 120, rarity: 4, starter: false, leg: false }
  },
  DB: {
    upgradesOf: () => ({}),
    getSpeciesUpgrades: () => ({ hpBonus: 0, atkBonus: 0, spdBonus: 0, defBonus: 0, cdBonus: 0, regenBonus: 0 }),
    getSpeciesUpgradeBonus: () => ({ hp: 0, atk: 0, speed: 0, def: 0 }),
    save: { owned: {}, shiny: {}, coins: 0, tickets: { t1: 0, t10: 0 }, stats: { coinsEarned: 0 } },
    owns: () => false,
    unlockPokemon: () => {},
    registerCaptured: () => {},
    grantShiny: () => {},
    commit: () => {}
  },
  Upgrades: {
    perks: () => ({ cdMul: 1, dmgReduce: 0, regen: 0, magnetMul: 1, xpMul: 1, coinMul: 1 })
  },
  Moves: {
    poolFor: () => [],
    BY_ID: {}
  },
  startMoveOf: () => 'thunderShock'
};

global.G.DEX = Object.values(global.G.DEX_BY);

eval(fs.readFileSync('js/entities/player.js', 'utf8'));
const CaptureSystem = require('../js/systems/capture.js');

// 1. TESTE DAS TAXAS BASE DE CAPTURA POR ESTÁGIO
console.log('\n--- 1. TAXAS BASE DE CAPTURA POR ESTÁGIO & RARIDADE ---');

const rateNormalStg1 = CaptureSystem.getBaseCatchRate('caterpie', false, false, 1);
const rateNormalStg2 = CaptureSystem.getBaseCatchRate('metapod', false, false, 2);
const rateNormalStg3 = CaptureSystem.getBaseCatchRate('butterfree', false, false, 3);
const rateShinyComum = CaptureSystem.getBaseCatchRate('pikachu', true, false, 1);
const rateLendario = CaptureSystem.getBaseCatchRate('mewtwo', false, true, 3);
const rateShinyLendario = CaptureSystem.getBaseCatchRate('mewtwo', true, true, 3);

console.log(`Normal Estágio 1: ${(rateNormalStg1 * 100).toFixed(0)}% (Esperado: 38%)`);
console.log(`Normal Estágio 2: ${(rateNormalStg2 * 100).toFixed(0)}% (Esperado: 28%)`);
console.log(`Normal Estágio 3: ${(rateNormalStg3 * 100).toFixed(0)}% (Esperado: 18%)`);
console.log(`Shiny Comum:     ${(rateShinyComum * 100).toFixed(0)}% (Esperado: 10%)`);
console.log(`Lendário Normal: ${(rateLendario * 100).toFixed(0)}% (Esperado: 6%)`);
console.log(`Shiny Lendário:  ${(rateShinyLendario * 100).toFixed(0)}% (Esperado: 2%)`);

if (rateNormalStg1 === 0.38 && rateNormalStg2 === 0.28 && rateNormalStg3 === 0.18 &&
    rateShinyComum === 0.10 && rateLendario === 0.06 && rateShinyLendario === 0.02) {
  console.log('✅ Todas as 6 taxas base foram validadas com precisão cirúrgica!');
} else {
  console.error('❌ Falha nas taxas base de captura');
  process.exit(1);
}

// 2. TESTE DA TRAVA MÁXIMA RIGOROSA < 50% (CAP DE 48%)
console.log('\n--- 2. TESTE DA TRAVA MÁXIMA RIGOROSA (CAP DE 48%) ---');

const ballGoldStg1 = new CaptureSystem.WorldCaptureBall({
  speciesId: 'caterpie',
  isShiny: false,
  isLegendary: false,
  stage: 1,
  level: 50,
  forceGold: true
});

console.log(`Normal Estágio 1 (Base 38%) + Gold Ball (+14%):`);
console.log(`  Soma Bruta: ${(ballGoldStg1.baseRate + ballGoldStg1.ballBonus) * 100}%`);
console.log(`  Chance Final Efetiva: ${(ballGoldStg1.finalChance * 100).toFixed(1)}% (Cap: <= 48.0%)`);

if (ballGoldStg1.finalChance <= 0.48) {
  console.log('✅ Trava Rigorosa comprovada: chance máxima cravada em 48.0% (abaixo de 50%)!');
} else {
  console.error('❌ Falha na trava máxima de 48%!');
  process.exit(1);
}

// 3. TESTE DA RECOMPENSA EM OURO (GOLD BOUNTY)
console.log('\n--- 3. TESTE DE RECOMPENSAS TURBINADAS EM OURO (BOUNTY) ---');

const testCasesBounty = [
  { name: 'Normal Estágio 1', stage: 1, isShiny: false, isLeg: false, expected: 250 },
  { name: 'Normal Estágio 2', stage: 2, isShiny: false, isLeg: false, expected: 1200 },
  { name: 'Normal Estágio 3', stage: 3, isShiny: false, isLeg: false, expected: 3000 },
  { name: 'Shiny Estágio 1', stage: 1, isShiny: true, isLeg: false, expected: 5250 },
  { name: 'Shiny Estágio 3', stage: 3, isShiny: true, isLeg: false, expected: 8000 },
  { name: 'Lendário Normal', stage: 3, isShiny: false, isLeg: true, expected: 8000 },
  { name: 'Shiny Lendário Apex', stage: 3, isShiny: true, isLeg: true, expected: 20000 }
];

let allBountiesOk = true;
testCasesBounty.forEach(tc => {
  const dummyAttempt = {
    isSuccess: true,
    speciesId: 'test_mon',
    stage: tc.stage,
    isShiny: tc.isShiny,
    isLegendary: tc.isLeg,
    isGoldBall: false
  };

  const initialCoins = global.G.DB.save.coins;
  CaptureSystem.resolveAttempt(dummyAttempt);
  const earned = global.G.DB.save.coins - initialCoins;

  console.log(`[${tc.name}] Ganho Real: +${earned} Ouro | Esperado: +${tc.expected} Ouro`);
  if (earned !== tc.expected) allBountiesOk = false;
});

if (allBountiesOk) {
  console.log('✅ Todas as recompensas em ouro (Gold Bounty) foram calculadas e creditadas com sucesso!');
} else {
  console.error('❌ Falha nas recompensas de Gold Bounty!');
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO TOTAL!');
