/**
 * test_world_capture_and_rarity.js
 * Validação rigorosa da Captura Diegética no Mapa (WorldCaptureBall) e
 * Distribuição Estatística de Raridade de Guardiões de Rift.
 */

const assert = require('assert');

console.log('====================================================');
console.log('🧪 TESTE: CAPTURA DIEGÉTICA & BALANCEAMENTO DE RIFTS');
console.log('====================================================\n');

// Mock de Ambiente de Jogo
global.window = global;
global.G = global.G || {};
global.G.Game = { isPaused: false, player: { level: 25, x: 100, y: 150 } };
global.G.Audio = { sfx(name) { /* mock sfx */ } };
global.G.FX = {
  burst(x, y, color, n, p) {},
  twinkle(x, y) {},
  dmgText(x, y, txt, color, big) {},
  ring(x, y, r0, r1, color, l, w) {},
  spark(x, y, color, dx, dy, n) {}
};

// Mock de DOM
global.document = {
  getElementById: (id) => ({
    id,
    classList: { add() {}, remove() {}, contains: () => false },
    style: {}
  }),
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 32, height: 32,
        getContext: () => ({
          fillRect() {}, clearRect() {}, drawImage() {}, save() {}, restore() {},
          translate() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, stroke() {}
        })
      };
    }
    return { style: {}, classList: { add() {}, remove() {} } };
  }
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

// Carrega dependências
require('../js/data/pokedex.js');
require('../js/data/regions.js');
require('../js/config/balanceConfig.js');
require('../js/systems/capture.js');
require('../js/systems/rift.js');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASSOU] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FALHOU] ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// FRENTE 1: TABELA E DISTRIBUIÇÃO ESTATÍSTICA DE RARIDADE
// -------------------------------------------------------------
console.log('--- [FRENTE 1] Distribuição de Raridade & Trava de 30 Rifts ---');

runTest('Trava de 30 Rifts bloqueia Lendários (0 a 29 rifts)', () => {
  // Configura rifts = 10 (< 30)
  global.localStorage.setItem('poke_total_rifts', '10');
  
  let legendsCount = 0;
  let shiniesCount = 0;
  let commonsCount = 0;
  const N = 5000;

  for (let i = 0; i < N; i++) {
    const res = global.selectRiftGuardian();
    if (res.isLegendary) legendsCount++;
    if (res.isShiny) shiniesCount++;
    if (!res.isLegendary) commonsCount++;
  }

  assert.strictEqual(legendsCount, 0, `Nenhum lendário deveria spawnar antes de 30 rifts! Encontrados: ${legendsCount}`);
  assert.strictEqual(commonsCount, N, `Todos os spawns devem ser comuns antes dos 30 rifts`);

  // Taxa de shinies esperada (alvos vêm de BalanceConfig.rewards.rift.rarity):
  // abaixo de 30 rifts, os tiers de Lendário são rebaixados para Comum.
  // Logo: Comum Shiny = commonShinyMax - legendNormalMax = 2.0%
  const RAR = global.BalanceConfig.rewards.rift.rarity;
  const expectedShinyBelow30 = (RAR.commonShinyMax - RAR.legendNormalMax) / 100;
  const shinyRate = shiniesCount / N;
  console.log(`     -> Rifts < 30: 0% Lendários (OK) | Shinies: ${(shinyRate * 100).toFixed(1)}% (Alvo: ${(expectedShinyBelow30 * 100).toFixed(1)}%)`);
  assert(shinyRate >= expectedShinyBelow30 * 0.7 && shinyRate <= expectedShinyBelow30 * 1.3,
    `Taxa de shiny fora da margem de ${(expectedShinyBelow30 * 100).toFixed(1)}%: ${(shinyRate * 100).toFixed(1)}%`);
});

runTest('Liberação de Lendários e Proporção 94 / 3.8 / 2.0 / 0.2 (30+ rifts)', () => {
  // Configura rifts = 50 (>= 30)
  global.localStorage.setItem('poke_total_rifts', '50');

  let countCommonNormal = 0;
  let countCommonShiny = 0;
  let countLegendNormal = 0;
  let countLegendShiny = 0;
  const N = 20000;

  for (let i = 0; i < N; i++) {
    const res = global.selectRiftGuardian();
    if (!res.isLegendary && !res.isShiny) countCommonNormal++;
    else if (!res.isLegendary && res.isShiny) countCommonShiny++;
    else if (res.isLegendary && !res.isShiny) countLegendNormal++;
    else if (res.isLegendary && res.isShiny) countLegendShiny++;
  }

  const pCommonNormal = countCommonNormal / N;
  const pCommonShiny = countCommonShiny / N;
  const pLegendNormal = countLegendNormal / N;
  const pLegendShiny = countLegendShiny / N;

  // Alvos derivados da configuração (fonte única de verdade)
  const RAR = global.BalanceConfig.rewards.rift.rarity;
  const targetCommonNormal = RAR.commonNormalMax / 100;
  const targetLegendNormal = (RAR.legendNormalMax - RAR.commonNormalMax) / 100;
  const targetCommonShiny = (RAR.commonShinyMax - RAR.legendNormalMax) / 100;
  const targetLegendShiny = (100 - RAR.commonShinyMax) / 100;

  console.log(`     -> Proporção observada em ${N} rolagens:`);
  console.log(`        Comum Normal:    ${(pCommonNormal * 100).toFixed(2)}% (Alvo: ${(targetCommonNormal * 100).toFixed(2)}%)`);
  console.log(`        Comum Shiny:     ${(pCommonShiny * 100).toFixed(2)}% (Alvo: ${(targetCommonShiny * 100).toFixed(2)}%)`);
  console.log(`        Lendário Normal: ${(pLegendNormal * 100).toFixed(2)}% (Alvo: ${(targetLegendNormal * 100).toFixed(2)}%)`);
  console.log(`        Lendário Shiny:  ${(pLegendShiny * 100).toFixed(2)}% (Alvo: ${(targetLegendShiny * 100).toFixed(2)}%)`);

  // Margens de confiança estatística, centradas no alvo vindo da config
  const within = (obs, target, tol) => obs >= target * (1 - tol) && obs <= target * (1 + tol);
  assert(within(pCommonNormal, targetCommonNormal, 0.03), `Comum Normal fora da margem: ${(pCommonNormal * 100).toFixed(2)}%`);
  assert(within(pCommonShiny, targetCommonShiny, 0.20), `Comum Shiny fora da margem: ${(pCommonShiny * 100).toFixed(2)}%`);
  assert(within(pLegendNormal, targetLegendNormal, 0.15), `Lendário Normal fora da margem: ${(pLegendNormal * 100).toFixed(2)}%`);
  assert(within(pLegendShiny, targetLegendShiny, 0.50), `Lendário Shiny fora da margem: ${(pLegendShiny * 100).toFixed(2)}%`);
});

runTest('Pity de 500 Rifts garante 100% de Guardião Shiny', () => {
  // Configura rifts = 500 (múltiplo exato)
  global.localStorage.setItem('poke_total_rifts', '500');

  for (let i = 0; i < 50; i++) {
    const res = global.selectRiftGuardian();
    assert.strictEqual(res.isShiny, true, `No Rift 500 o guardião gerado DEVE ser 100% Shiny!`);
  }
});

// -------------------------------------------------------------
// FRENTE 2: CAPTURA DIEGÉTICA NO MAPA (WorldCaptureBall)
// -------------------------------------------------------------
console.log('\n--- [FRENTE 2] Captura Diegética no Mapa (WorldCaptureBall) ---');

runTest('startCaptureSequence NÃO pausa o combate e cria WorldCaptureBall', () => {
  global.G.Game.isPaused = false;

  let completed = false;
  let wonResult = null;

  const ball = global.CaptureSystem.startCaptureSequence({
    speciesId: 'pikachu',
    level: 15,
    x: 200,
    y: 300,
    onComplete: (caught) => {
      completed = true;
      wonResult = caught;
    }
  });

  assert(ball, 'WorldCaptureBall deve ser instanciada');
  assert.strictEqual(global.G.Game.isPaused, false, 'O combate NUNCA deve ser pausado durante a captura diegética!');
  assert.strictEqual(ball.x, 200);
  assert.strictEqual(ball.y, 300);
  assert.strictEqual(ball.state, 'DROPPING');
  assert.strictEqual(ball.ballZ, 120, 'A bola deve começar caindo do alto (z = 120)');
  assert.strictEqual(ball.ballTier.id, 'great_ball', 'Nível 15 deve usar Great Ball');
});

runTest('Máquina de Estados de Animação Física e Resolução', () => {
  let completed = false;
  let capturedResult = null;

  const ball = global.CaptureSystem.startCaptureSequence({
    speciesId: 'charizard',
    level: 5,
    x: 150,
    y: 180,
    onComplete: (caught) => {
      completed = true;
      capturedResult = caught;
    }
  });

  // Simula queda (dt = 0.5s)
  ball.update(0.5);
  // Deve ter chegado ao chão ou quicado
  assert(ball.state === 'BOUNCE' || ball.state === 'PAUSE_1', `Estado pós-queda inválido: ${ball.state}`);

  // Simula repouso e avanço pelos 3 balanços
  // Avança tempo total de ~4 segundos para completar toda a sequência de balanços
  let elapsed = 0;
  const dt = 0.05;
  const statesVisited = new Set([ball.state]);

  while (!completed && elapsed < 8.0) {
    global.CaptureSystem.update(dt);
    if (global.CaptureSystem.activeData) {
      statesVisited.add(global.CaptureSystem.activeData.state);
    }
    elapsed += dt;
  }

  assert(statesVisited.has('SHAKE_1'), 'Deveria ter visitado o Balanço 1 (-25°)');
  assert(statesVisited.has('SHAKE_2'), 'Deveria ter visitado o Balanço 2 (+25°)');
  assert(statesVisited.has('SHAKE_3'), 'Deveria ter visitado o Balanço 3 (-25°)');
  assert(statesVisited.has('RESOLVE'), 'Deveria ter visitado o estado RESOLVE');
  assert.strictEqual(completed, true, 'O callback onComplete deve ser chamado ao finalizar');
  assert(typeof capturedResult === 'boolean', 'capturedResult deve ser booleano');
});

runTest('Gold Ball concede bônus de chance e não garante captura', () => {
  let completed = false;
  let won = false;

  // A Gold Ball NÃO garante a captura: ela concede bônus de chance respeitando
  // o teto de cap da raridade. Fixamos o RNG para 0 (sucesso) e depois testamos
  // que a taxa final é menor que 100%.
  const origRandom = Math.random;
  Math.random = () => 0;

  const ball = global.CaptureSystem.startCaptureSequence({
    speciesId: 'mewtwo',
    level: 45,
    forceGold: true,
    x: 100,
    y: 100,
    onComplete: (c) => {
      completed = true;
      won = c;
    }
  });

  assert.strictEqual(ball.isGoldBall, true, 'forceGold ativou a Gold Ball');
  assert.strictEqual(ball.isSuccess, true, 'Com o RNG em 0, a captura tem sucesso');
  assert(ball.finalChance < 1.0, `A Gold Ball NÃO garante captura (chance final ${(ball.finalChance * 100).toFixed(1)}%)`);
  assert(ball.ballBonus > 0, 'A Gold Ball concede bônus de chance');

  // Roda até a conclusão
  let elapsed = 0;
  while (!completed && elapsed < 6.0) {
    global.CaptureSystem.update(0.1);
    elapsed += 0.1;
  }
  Math.random = origRandom;

  assert.strictEqual(won, true, 'A captura foi confirmada');
});

runTest('Gold Ball falha quando o RNG não atinge a chance final', () => {
  let completed = false;
  let won = null;

  // RNG em 0.99: para um alvo comum (chance 48%) a captura deve falhar.
  const origRandom = Math.random;
  Math.random = () => 0.99;

  const ball = global.CaptureSystem.startCaptureSequence({
    speciesId: 'pikachu',
    level: 45,
    forceGold: true,
    x: 100,
    y: 100,
    onComplete: (c) => {
      completed = true;
      won = c;
    }
  });

  assert.strictEqual(ball.isSuccess, false, 'Com o RNG em 0.99 a captura deve falhar');

  let elapsed = 0;
  while (!completed && elapsed < 6.0) {
    global.CaptureSystem.update(0.1);
    elapsed += 0.1;
  }
  Math.random = origRandom;

  assert.strictEqual(won, false, 'A Gold Ball pode falhar (não é garantia)');
});

console.log('\n====================================================');
console.log(`🎉 TESTES CONCLUÍDOS: ${passed}/${total} APROVADOS!`);
console.log('====================================================\n');

if (passed !== total) process.exit(1);
