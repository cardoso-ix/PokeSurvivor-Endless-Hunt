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
  
  // Taxa de shinies esperada: 15% + 1% rebaixado = ~16% (com tolerância estatística 13% a 19%)
  const shinyRate = shiniesCount / N;
  console.log(`     -> Rifts < 30: 0% Lendários (OK) | Shinies: ${(shinyRate * 100).toFixed(1)}%`);
  assert(shinyRate >= 0.13 && shinyRate <= 0.19, `Taxa de shiny esperada ~16%, obtida: ${(shinyRate * 100).toFixed(1)}%`);
});

runTest('Liberação de Lendários e Proporção 75 / 15 / 9 / 1 (30+ rifts)', () => {
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

  console.log(`     -> Proporção observada em ${N} rolagens:`);
  console.log(`        Comum Normal:    ${(pCommonNormal * 100).toFixed(2)}% (Alvo: 75%)`);
  console.log(`        Comum Shiny:     ${(pCommonShiny * 100).toFixed(2)}% (Alvo: 15%)`);
  console.log(`        Lendário Normal: ${(pLegendNormal * 100).toFixed(2)}% (Alvo: 9%)`);
  console.log(`        Lendário Shiny:  ${(pLegendShiny * 100).toFixed(2)}% (Alvo: 1%)`);

  // Verificações com margens de confiança estatística de 99.9%
  assert(pCommonNormal >= 0.72 && pCommonNormal <= 0.78, `Comum Normal fora da margem de 75%: ${(pCommonNormal * 100).toFixed(2)}%`);
  assert(pCommonShiny >= 0.13 && pCommonShiny <= 0.17, `Comum Shiny fora da margem de 15%: ${(pCommonShiny * 100).toFixed(2)}%`);
  assert(pLegendNormal >= 0.075 && pLegendNormal <= 0.105, `Lendário Normal fora da margem de 9%: ${(pLegendNormal * 100).toFixed(2)}%`);
  assert(pLegendShiny >= 0.005 && pLegendShiny <= 0.018, `Lendário Shiny fora da margem de 1%: ${(pLegendShiny * 100).toFixed(2)}%`);
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

runTest('Gold Ball garante 100% de captura e concede bônus', () => {
  let completed = false;
  let won = false;

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

  assert.strictEqual(ball.isGoldBall, true);
  assert.strictEqual(ball.isSuccess, true, 'Gold Ball deve garantir 100% de sucesso');

  // Roda até a conclusão
  let elapsed = 0;
  while (!completed && elapsed < 6.0) {
    global.CaptureSystem.update(0.1);
    elapsed += 0.1;
  }

  assert.strictEqual(won, true, 'Gold ball deve resultar em captura garantida');
});

console.log('\n====================================================');
console.log(`🎉 TESTES CONCLUÍDOS: ${passed}/${total} APROVADOS!`);
console.log('====================================================\n');

if (passed !== total) process.exit(1);
