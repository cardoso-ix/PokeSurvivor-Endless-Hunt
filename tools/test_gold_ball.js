/**
 * Testes Unitários e de Integração: Mecânica Oficial da Gold Ball
 * Valida:
 * 1. Configuração GOLD_BALL_CONFIG (100% de taxa, atributos visuais e recompensa de 1.000 Ouro).
 * 2. Condições de nível (>= 41) e chance de aparição (10% proc).
 * 3. Captura 100% garantida incondicional para qualquer espécie e Shiny.
 * 4. Concessão dos 1.000 de Ouro ao save persistente do jogador.
 * 5. Atalhos de console window.debugTriggerGoldBall e window.debugTestGoldBallRate.
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

console.log('===========================================================');
console.log('🧪 TESTES DA GOLD BALL: CAPTURA 100% GARANTIDA & 1.000 OURO');
console.log('===========================================================\n');

// --- TESTE 1: CONFIGURAÇÃO OFICIAL DA GOLD BALL ---
console.log('--- TESTE 1: ESTRUTURA E ATRIBUTOS DA GOLD_BALL_CONFIG ---');
const goldCfg = CaptureSystem.GOLD_BALL_CONFIG;
assert(goldCfg.id === 'goldball', 'ID é "goldball"');
assert(goldCfg.name === 'Gold Ball', 'Nome é "Gold Ball"');
assert(goldCfg.isGuaranteed === true, 'isGuaranteed é true (100% garantido)');
assert(goldCfg.isGold === true, 'isGold é true');
assert(goldCfg.catchRate === 1.00, 'catchRate é 1.00 (100% fixo)');
assert(goldCfg.colorTop === '#ffd700', 'colorTop é "#ffd700" (Dourado metálico)');
assert(goldCfg.accent === '#ffaa00', 'accent é "#ffaa00" (Dourado escuro/âmbar)');
assert(goldCfg.goldReward === 1000, 'goldReward é 1.000 Ouro');
assert(goldCfg.label.includes('100% CAPTURA GARANTIDA'), 'Label contém "100% CAPTURA GARANTIDA"');

// --- TESTE 2: RESOLUÇÃO DA GOLD BALL POR NÍVEL E FLAG FORÇADA ---
console.log('\n--- TESTE 2: REGRAS DE NÍVEL E PROC DE 10% ---');

// Nível abaixo de 41 sem forçar nunca deve ativar a Gold Ball
let below41GoldCount = 0;
for (let i = 0; i < 500; i++) {
  const ball = CaptureSystem.resolveCaptureBall(40, false);
  if (ball.id === 'goldball') below41GoldCount++;
}
assert(below41GoldCount === 0, 'Nível 40 ou menor NUNCA ativa Gold Ball sem forceGold (0/500)');

// forceGold = true ativa Gold Ball em qualquer nível
const forcedBallLow = CaptureSystem.resolveCaptureBall(5, true);
assert(forcedBallLow.id === 'goldball', 'forceGold = true ativa Gold Ball no nível 5');

const forcedBallHigh = CaptureSystem.resolveCaptureBall(45, true);
assert(forcedBallHigh.id === 'goldball', 'forceGold = true ativa Gold Ball no nível 45');

// Nível 41+ deve ter cerca de 10% de proc aleatório
let level45ProcCount = 0;
const totalSims = 5000;
for (let i = 0; i < totalSims; i++) {
  const ball = CaptureSystem.resolveCaptureBall(45, false);
  if (ball.id === 'goldball') level45ProcCount++;
}
const procRate = level45ProcCount / totalSims;
console.log(`Procs observados no nível 45: ${level45ProcCount} de ${totalSims} (${(procRate * 100).toFixed(2)}%)`);
assert(procRate >= 0.075 && procRate <= 0.125, `Taxa de proc no nível 45 é de ~10% (esperado entre 7.5% e 12.5%, obtido ${(procRate * 100).toFixed(2)}%)`);

// --- TESTE 3: CAPTURA 100% INCONDICIONAL (MESMO PARA LENDÁRIOS E SHINY) ---
console.log('\n--- TESTE 3: PROVA DE 100% DE SUCESSO INCONDICIONAL ---');
const mewtwoMon = G.DEX_BY[150];

// Inicia captura com Gold Ball forçada para Mewtwo Shiny
CaptureSystem.startCaptureSequence(mewtwoMon, 45, true, true);
assert(CaptureSystem.activeBall.isGold === true, 'A bola ativa é a Gold Ball');
assert(CaptureSystem.activeBall.catchRate === 1.00, 'Taxa da bola é 100%');

// Simula resolução completa 50 vezes com Gold Ball ativa
let successCount = 0;
for (let i = 0; i < 50; i++) {
  let caughtResult = null;
  CaptureSystem.startCaptureSequence({
    mon: mewtwoMon,
    playerLevel: 45,
    isShiny: true,
    forceGold: true,
    onComplete: (caught) => { caughtResult = caught; }
  });
  // Avança todos os estados até a conclusão da sequência (7.0s total)
  for (let t = 0; t < 85; t++) {
    CaptureSystem.update(0.1);
  }
  if (caughtResult === true) successCount++;
}
assert(successCount === 50, '50 de 50 capturas com Gold Ball foram 100% bem sucedidas contra Mewtwo Shiny!');

// --- TESTE 4: CONCESSÃO DA RECOMPENSA DE +1.000 OURO ---
console.log('\n--- TESTE 4: CRÉDITO DE +1.000 OURO NO SAVE ---');
const coinsBefore = G.DB.save.coins;
G.Game.player.coins = coinsBefore;

CaptureSystem.startCaptureSequence('mewtwo', 45, true, true);
// Avança o loop de updates (0.65s throw + 0.8s absorb + 0.45s drop + 3.2s wobble = ~5.1s)
for (let t = 0; t < 60; t++) {
  CaptureSystem.update(0.1);
}

const coinsAfter = G.DB.save.coins;
console.log(`Moedas antes: ${coinsBefore} | Moedas depois: ${coinsAfter} (Diferença: +${coinsAfter - coinsBefore})`);
assert(coinsAfter === coinsBefore + 1000, `O save recebeu exatamente +1.000 de Ouro (Esperado: ${coinsBefore + 1000}, Obtido: ${coinsAfter})`);
assert(G.Game.player.coins === coinsBefore + 1000, `O jogador da partida recebeu +1.000 de Ouro (Obtido: ${G.Game.player.coins})`);

// --- TESTE 5: COMANDOS DEBUG DE CONSOLE (F12) ---
console.log('\n--- TESTE 5: EXECUÇÃO DOS COMANDOS DEBUG ---');
assert(typeof global.debugTriggerGoldBall === 'function', 'global.debugTriggerGoldBall está disponível');
assert(typeof global.debugTestGoldBallRate === 'function', 'global.debugTestGoldBallRate está disponível');

console.log('\n[Executando debugTestGoldBallRate()]');
const rateTest = global.debugTestGoldBallRate();
assert(rateTest.isGuaranteed === true, 'debugTestGoldBallRate confirmou captura garantida');

console.log('\n[Executando debugTriggerGoldBall("mewtwo", true)]');
global.debugTriggerGoldBall('mewtwo', true);
assert(CaptureSystem.activeBall.id === 'goldball', 'debugTriggerGoldBall ativou com sucesso a Gold Ball');

console.log('\n===========================================================');
console.log(`🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('===========================================================');
