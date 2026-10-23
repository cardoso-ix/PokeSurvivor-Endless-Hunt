/**
 * Teste Automatizado de Verificação:
 * Pokémons Shiny no mapa NÃO são capturáveis e concedem 5.000 Tickets ao morrer.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Teste de Validação: Shinies no Mapa (5.000 Tickets & Não Capturáveis)...\n');

// Mock mínimo de DOM
global.window = global;
global.document = {
  getElementById: (id) => ({
    getContext: () => ({
      fillRect: () => {},
      drawImage: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 })
    }),
    classList: { add: () => {}, remove: () => {} },
    style: {}
  }),
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Mock do ambiente G
global.G = {
  U: {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  },
  FX: {
    burst: () => {},
    ring: () => {},
    dmgText: () => {},
    spark: () => {}
  },
  Audio: {
    sfx: () => {},
    music: () => {}
  },
  Spawner: {
    say: () => {}
  },
  DEX_BY: {
    25: { name: 'Pikachu', dex: 25 },
    6: { name: 'Charizard', dex: 6 },
    150: { name: 'Mewtwo', dex: 150 }
  },
  DB: {
    save: {
      tickets: { t1: 0, t10: 0 },
      coins: 0,
      shiny: {},
      stats: {
        shiniesDefeated: 0,
        shinies: 0
      }
    },
    grantShiny: function(dex) {
      this.save.shiny[dex] = true;
      return true;
    },
    commit: function() {}
  },
  Input: { init: () => {}, update: () => {} },
  Touch: { init: () => {} },
  Sprites: { ready: Promise.resolve() },
  Camera: { x: 0, y: 0, w: 800, h: 600, reset: () => {} },
  World: { init: () => {}, update: () => {}, draw: () => {}, currentRegion: 'kanto' },
  Weather: { init: () => {}, update: () => {}, draw: () => {} },
  Pickups: { init: () => {}, update: () => {}, draw: () => {}, drop: () => {} },
  Projectiles: { init: () => {}, update: () => {}, draw: () => {} },
  EnemyMgr: { init: () => {}, update: () => {}, draw: () => {}, all: () => [] },
  Combat: { init: () => {}, update: () => {} },
  UI: { hideAll: () => {}, hide: () => {}, toast: () => {} },
  HUD: { update: () => {}, draw: () => {} },
  RunUI: { init: () => {}, update: () => {} }
};

// Carrega scripts relevantes
const captureCode = fs.readFileSync(path.join(__dirname, '../js/systems/capture.js'), 'utf8');
const gameCode = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');

// Executa os códigos no contexto global
eval(captureCode);
eval(gameCode);

// Mock de player no G.Game
const mockPlayer = {
  x: 100,
  y: 100,
  t1: 0,
  t10: 0,
  coins: 0,
  level: 1,
  kills: 0,
  bosses: 0
};

// Configura G.Game.player
let pl = mockPlayer;
Object.defineProperty(G.Game, 'player', {
  get: () => pl,
  configurable: true
});

console.log('✅ Ambiente de jogo mockado com sucesso.');

// 1. Teste de Abate de Inimigo Shiny no Mapa
console.log('\n--- 1. Testando Morte de Inimigo Shiny no Mapa ---');
const initialTickets = G.DB.save.tickets.t1;
const initialPlayerT1 = pl.t1 || 0;

const enemyShiny = {
  dex: 25,
  name: 'Pikachu',
  shiny: true,
  x: 200,
  y: 300
};

// Simula chamada de morte que ocorre em enemy.die()
G.onShinyCaught(enemyShiny);

assert.strictEqual(pl.t1, initialPlayerT1 + 5000, `pl.t1 deve ser 5000 (atual: ${pl.t1})`);
assert.strictEqual(G.DB.save.tickets.t1, initialTickets + 5000, `G.DB.save.tickets.t1 deve ser 5000 (atual: ${G.DB.save.tickets.t1})`);
assert.strictEqual(G.DB.save.shiny[25], undefined, 'Pikachu Shiny NÃO deve ter sido adicionado ao save.shiny');
assert.strictEqual(G.DB.save.stats.shiniesDefeated, 1, 'stats.shiniesDefeated deve ser 1');
console.log(`✅ Abate de Shiny: +5.000 tickets concedidos (Total: ${G.DB.save.tickets.t1}) e Pokédex NÃO desbloqueou Shiny.`);

// Teste de Idempotência: Chamar novamente com o mesmo inimigo
G.onShinyCaught(enemyShiny);
assert.strictEqual(G.DB.save.tickets.t1, initialTickets + 5000, 'Chamada repetida não deve duplicar os tickets');
console.log('✅ Idempotência validada: O mesmo inimigo derrotado não concede tickets duplicados.');

// 2. Teste de startCaptureSequence para Shiny
console.log('\n--- 2. Testando startCaptureSequence para Pokémon Shiny ---');
let captureCompleted = false;
let captureResult = null;

const captureSeqResult = CaptureSystem.startCaptureSequence({
  speciesId: 'charizard',
  dex: 6,
  isShiny: true,
  onComplete: (success, isNew) => {
    captureCompleted = true;
    captureResult = { success, isNew };
  }
});

assert.strictEqual(captureSeqResult, null, 'startCaptureSequence com isShiny deve retornar null (não inicia arremesso)');
assert.strictEqual(captureCompleted, true, 'onComplete deve ser chamado imediatamente');
assert.strictEqual(captureResult.success, false, 'Captura de shiny deve falhar');
assert.strictEqual(G.DB.save.tickets.t1, initialTickets + 10000, 'startCaptureSequence de novo shiny deve conceder +5.000 tickets');
console.log('✅ startCaptureSequence com Shiny aborta captura, concede 5.000 tickets e retorna sucesso=false.');

// 3. Teste de resolveAttempt para Shiny
console.log('\n--- 3. Testando resolveAttempt com isShiny=true ---');
const attemptData = {
  isShiny: true,
  isSuccess: true,
  speciesId: 'mewtwo'
};
const resolved = CaptureSystem.resolveAttempt(attemptData);
assert.strictEqual(resolved.isSuccess, false, 'resolveAttempt deve forçar isSuccess = false quando isShiny=true');
assert.strictEqual(G.DB.save.shiny[150], undefined, 'Mewtwo Shiny NÃO deve estar no save.shiny');
console.log('✅ resolveAttempt blindado: isSuccess forçado para false para qualquer Shiny.');

// 4. Teste de WorldCaptureBall para Shiny
console.log('\n--- 4. Testando WorldCaptureBall com isShiny=true ---');
const ball = new CaptureSystem.WorldCaptureBall({
  speciesId: 'mewtwo',
  isShiny: true,
  ballType: 'master'
});
assert.strictEqual(ball.baseRate, 0, 'WorldCaptureBall baseRate de Shiny deve ser 0');
assert.strictEqual(ball.finalChance, 0, 'WorldCaptureBall finalChance de Shiny deve ser 0');
console.log('✅ WorldCaptureBall: Taxas de captura de Shiny zeradas (baseRate=0, finalChance=0).');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
