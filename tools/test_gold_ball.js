/**
 * Testes Unitários e de Integração: Mecânica Oficial da Gold Ball
 * Valida:
 * 1. Configuração GOLD_BALL_CONFIG (bônus de chance, atributos visuais e recompensa de 1.000 Ouro).
 * 2. Condições de nível (>= 41) e chance de aparição (10% proc).
 * 3. Bônus dinâmico por raridade do alvo, respeitando o teto rígido de cap.
 * 4. Concessão dos 1.000 de Ouro ao save persistente do jogador.
 * 5. forceGold como override explícito (admin/debug).
 *
 * A Gold Ball NÃO garante a captura: ela concede bônus de chance e ouro.
 * O teste deriva as expectativas de BalanceConfig e do próprio CaptureSystem,
 * para não poder divergir do balanceamento.
 */

global.window = global;
global.G = {
  DEX_BY: {
    4: { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, atk: 52, spd: 65 },
    6: { dex: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 78, atk: 84, spd: 100 },
    150: { dex: 150, name: 'Mewtwo', types: ['psychic'], hp: 106, atk: 110, spd: 130, leg: true }
  },
  DEX: [
    { dex: 4, name: 'Charmander', types: ['fire'], hp: 39, atk: 52, spd: 65 },
    { dex: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 78, atk: 84, spd: 100 },
    { dex: 150, name: 'Mewtwo', types: ['psychic'], hp: 106, atk: 110, spd: 130, leg: true }
  ],
  Game: {
    player: { level: 45, x: 100, y: 100, coins: 500 },
    flash: () => {}
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
  DB: {
    save: {
      coins: 500,
      stats: { coinsEarned: 500 },
      owned: {},
      shiny: {}
    },
    addGold(amount) {
      this.save.coins = (this.save.coins || 0) + amount;
      this.save.stats.coinsEarned = (this.save.stats.coinsEarned || 0) + amount;
      return this.save.coins;
    },
    unlockPokemon(dex, shiny) {
      this.save.owned[dex] = true;
      if (shiny) this.save.shiny[dex] = true;
      return { baseDex: dex, baseName: 'Pokemon' };
    },
    commit: () => {}
  },
  Spawner: { say: () => {} },
  UI: { toast: () => {}, refreshCoins: () => {} }
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

console.log('===========================================================');
console.log('🧪 TESTES DA GOLD BALL: BÔNUS DE CHANCE, CAP RÍGIDO E 1.000 OURO');
console.log('===========================================================\n');

// --- TESTE 1: CONFIGURAÇÃO OFICIAL DA GOLD_BALL_CONFIG ---
console.log('--- TESTE 1: ESTRUTURA E ATRIBUTOS DA GOLD_BALL_CONFIG ---');
const goldCfg = CaptureSystem.GOLD_BALL_CONFIG;
assert(goldCfg.id === 'gold_ball', 'ID é "gold_ball"');
assert(goldCfg.name === 'Gold Ball', 'Nome é "Gold Ball"');
assert(goldCfg.isGuaranteed === false, 'isGuaranteed é false (a garantia foi removida para preservar mérito)');
assert(goldCfg.isGold === true, 'isGold é true');
assert(goldCfg.chance === 0.10, 'chance de proc é 0.10 (10%)');
assert(goldCfg.minLevel === 41, 'minLevel é 41');
assert(goldCfg.colorTop === '#ffd700', 'colorTop é "#ffd700" (Dourado metálico)');
assert(goldCfg.accent === '#ffaa00', 'accent é "#ffaa00" (Dourado escuro/âmbar)');
assert(goldCfg.goldReward === 1000, 'goldReward é 1.000 Ouro');
assert(goldCfg.coinBonus === 1000, 'coinBonus é 1.000 Ouro');
assert(goldCfg.label.includes('14%'), 'Label anuncia o bônus real (+14%)');
assert(!('catchRate' in goldCfg), 'A Gold Ball não tem campo catchRate (o cap usa bonus)');

// --- TESTE 2: RESOLUÇÃO DA GOLD BALL POR NÍVEL E PROC ---
console.log('\n--- TESTE 2: REGRAS DE NÍVEL E PROC DE 10% ---');

// Nível abaixo de 41 sem forçar nunca deve ativar a Gold Ball
let below41GoldCount = 0;
for (let i = 0; i < 500; i++) {
  const ball = CaptureSystem.resolveCaptureBall(40, false);
  if (ball.isGold) below41GoldCount++;
}
assert(below41GoldCount === 0, 'Nível 40 ou menor NUNCA ativa Gold Ball sem forceGold (0/500)');

// forceGold = true ativa Gold Ball em qualquer nível (override explícito)
const forcedBallLow = CaptureSystem.resolveCaptureBall(5, true);
assert(forcedBallLow.isGold === true, 'forceGold = true ativa Gold Ball no nível 5');
const forcedBallHigh = CaptureSystem.resolveCaptureBall(45, true);
assert(forcedBallHigh.isGold === true, 'forceGold = true ativa Gold Ball no nível 45');

// Nível 41+ deve ter cerca de 10% de proc aleatório
let level45ProcCount = 0;
const totalSims = 5000;
for (let i = 0; i < totalSims; i++) {
  const ball = CaptureSystem.resolveCaptureBall(45, false);
  if (ball.isGold) level45ProcCount++;
}
const procRate = level45ProcCount / totalSims;
console.log(`Procs observados no nível 45: ${level45ProcCount} de ${totalSims} (${(procRate * 100).toFixed(2)}%)`);
assert(procRate >= 0.075 && procRate <= 0.125, `Taxa de proc no nível 45 é de ~10% (obtido ${(procRate * 100).toFixed(2)}%)`);

// --- TESTE 3: BÔNUS DINÂMICO POR RARIDADE E CAP RÍGIDO ---
console.log('\n--- TESTE 3: BÔNUS DINÂMICO E TETO RÍGIDO DE CAP ---');
const mewtwoMon = G.DEX_BY[150];

function makeGoldBall(opts) {
  return new CaptureSystem.WorldCaptureBall(Object.assign({
    speciesId: opts.mon ? opts.mon.name : 'charmander',
    mon: opts.mon,
    level: 45,
    forceGold: true,
    stage: 1
  }, opts));
}
const ballNormal = makeGoldBall({ mon: G.DEX_BY[4], isShiny: false, isLegendary: false });
assert(ballNormal.ballBonus === goldCfg.bonus, `Normal recebe o bônus cheio (+${goldCfg.bonus * 100}%)`);
assert(ballNormal.finalChance === Math.min(CR.maxCap, CR.stage1 + goldCfg.bonus),
  `Normal Estágio 1: chance final ${(ballNormal.finalChance * 100).toFixed(1)}% (cap ${CR.maxCap * 100}%)`);
assert(ballNormal.finalChance <= CR.maxCap, 'A chance final do Normal respeita o teto rígido de 48%');

const ballLeg = makeGoldBall({ mon: mewtwoMon, isShiny: false, isLegendary: true });
assert(ballLeg.ballBonus === goldCfg.bonusRare, `Lendário recebe o bônus raro (+${goldCfg.bonusRare * 100}%)`);
assert(ballLeg.finalChance <= 0.16, 'A chance final do Lendário respeita o teto de 16%');

const ballShinyLeg = makeGoldBall({ mon: mewtwoMon, isShiny: true, isLegendary: true });
assert(ballShinyLeg.ballBonus === goldCfg.bonusApex, `Shiny Lendário recebe o bônus ápice (+${goldCfg.bonusApex * 100}%)`);
assert(ballShinyLeg.finalChance <= 0.08, 'A chance final do Shiny Lendário respeita o teto de 8%');

// A Gold Ball NÃO garante captura: nunca deve passar do cap da raridade
assert(ballNormal.finalChance < 1.0, 'A Gold Ball NÃO garante captura (chance final < 100%)');
assert(ballLeg.finalChance < 1.0, 'A Gold Ball NÃO garante captura de Lendário');

// Shiny não é capturável: o球 é criado com taxa 0
const ballShiny = makeGoldBall({ mon: G.DEX_BY[4], isShiny: true, isLegendary: false });
assert(ballShiny.finalChance === 0, 'Shiny não é capturável (chance final 0%)');

// --- TESTE 4: CONCESSÃO DA RECOMPENSA DE +1.000 OURO ---
console.log('\n--- TESTE 4: CRÉDITO DE +1.000 OURO NO SAVE ---');

const coinsBefore = G.DB.save.coins;
G.Game.player.coins = coinsBefore;

// O crédito de ouro acontece na RESOLVAÇÃO de uma captura bem-sucedida.
// Fixamos o RNG para 0 ( sempre sucesso, pois a chance é > 0).
const origRandom = Math.random;
Math.random = () => 0;

CaptureSystem.startCaptureSequence({
  speciesId: mewtwoMon.name,
  mon: mewtwoMon,
  level: 45,
  forceGold: true,
  isShiny: false,
  isLegendary: true,
  stage: 3
});
// Avança o loop de updates até a resolução
for (let t = 0; t < 60; t++) {
  CaptureSystem.update(0.1);
}
Math.random = origRandom;

const coinsAfter = G.DB.save.coins;
// A captura de um Lendário rende Gold Bounty (8.000) + o bônus da Gold Ball (1.000).
const expectedTotal = 8000 + goldCfg.goldReward;
console.log(`Moedas antes: ${coinsBefore} | Moedas depois: ${coinsAfter} (Diferença: +${coinsAfter - coinsBefore})`);
assert(coinsAfter === coinsBefore + expectedTotal,
  `O save recebeu o Gold Bounty do Lendário + o bônus da Gold Ball (Esperado: +${expectedTotal}, Obtido: +${coinsAfter - coinsBefore})`);
assert(G.Game.player.coins === coinsBefore + expectedTotal,
  `O jogador da partida recebeu +${expectedTotal} de Ouro (Obtido: ${G.Game.player.coins})`);

// O bônus isolado da Gold Ball (sem bounty) é 1.000
{
  const before2 = G.DB.save.coins;
  const plBefore = G.Game.player.coins;
  Math.random = () => 0;
  CaptureSystem.startCaptureSequence({
    speciesId: G.DEX_BY[4].name,
    mon: G.DEX_BY[4],
    level: 45,
    forceGold: true,
    isShiny: false,
    isLegendary: false,
    stage: 1
  });
  for (let t = 0; t < 60; t++) CaptureSystem.update(0.1);
  Math.random = origRandom;
  // Normal Estágio 1: bounty 250 + gold ball 1.000 = 1.250
  const expected2 = 250 + goldCfg.goldReward;
  assert(G.DB.save.coins === before2 + expected2,
    `Captura normal com Gold Ball rende bounty + bônus (Esperado: +${expected2}, Obtido: +${G.DB.save.coins - before2})`);
  assert(G.Game.player.coins === plBefore + expected2, 'O jogador da partida recebeu o valor combinado');
}

console.log('\n===========================================================');
console.log(`🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('===========================================================');
if (passedTests !== totalTests) process.exit(1);
