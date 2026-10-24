/**
 * Teste Automatizado de Engenharia: Recompensa de Duplicata no Rift (+500 Moedas e +500 Tickets)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Iniciando bateria de testes: Recompensa de Pokémon Repetido no Rift...');

// Mock do ambiente global
global.window = global;
global.G = {
  DEX: [
    { dex: 1, name: 'bulbasaur', stage: 1 },
    { dex: 4, name: 'charmander', stage: 1 },
    { dex: 6, name: 'charizard', stage: 3 },
    { dex: 25, name: 'pikachu', stage: 1 },
    { dex: 150, name: 'mewtwo', stage: 1, leg: true }
  ],
  DEX_BY: {
    1: { dex: 1, name: 'bulbasaur' },
    4: { dex: 4, name: 'charmander' },
    6: { dex: 6, name: 'charizard' },
    25: { dex: 25, name: 'pikachu' },
    150: { dex: 150, name: 'mewtwo', leg: true }
  },
  FX: {
    burst: () => {},
    ring: () => {},
    spark: () => {},
    twinkle: () => {},
    dmgText: () => {}
  },
  Audio: {
    sfx: () => {}
  },
  Spawner: {
    say: () => {}
  },
  UI: {
    refreshCoins: () => {}
  },
  Game: {
    player: {
      coins: 100,
      t1: 50,
      level: 25
    }
  }
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

// Carrega capture.js
const captureCode = fs.readFileSync(path.join(__dirname, '../js/systems/capture.js'), 'utf8');
eval(captureCode);

const CaptureSystem = global.CaptureSystem;

assert(CaptureSystem, 'CaptureSystem deve estar carregado');
assert.strictEqual(CaptureSystem.RIFT_DUPLICATE_COINS, 500, 'RIFT_DUPLICATE_COINS deve ser 500');
assert.strictEqual(CaptureSystem.RIFT_DUPLICATE_TICKETS, 500, 'RIFT_DUPLICATE_TICKETS deve ser 500');

// Mock do DB
function createMockDb(initialOwned = {}, initialCoins = 0, initialTickets = 0) {
  return {
    save: {
      owned: Object.assign({}, initialOwned),
      shiny: {},
      coins: initialCoins,
      tickets: { t1: initialTickets, t10: 0 },
      stats: { coinsEarned: initialCoins }
    },
    commits: [],
    isPokemonCaptured(speciesOrDex) {
      if (!this.save || !this.save.owned) return false;
      let dex = null;
      if (typeof speciesOrDex === 'number' || /^\d+$/.test(String(speciesOrDex).trim())) {
        dex = Number(speciesOrDex);
      } else if (typeof speciesOrDex === 'string') {
        const mon = G.DEX.find(p => p.name.toLowerCase() === speciesOrDex.toLowerCase().trim());
        if (mon) dex = mon.dex;
      }
      return dex != null && !!this.save.owned[dex];
    },
    registerCaptured(speciesId, isShiny) {
      let dex = (typeof speciesId === 'number') ? speciesId : (G.DEX.find(p => p.name.toLowerCase() === String(speciesId).toLowerCase()) || {}).dex;
      if (dex) {
        this.save.owned[dex] = { at: Date.now() };
        if (isShiny) this.save.shiny[dex] = { at: Date.now() };
      }
    },
    grantShiny(dex) {
      this.save.shiny[dex] = { at: Date.now() };
    },
    incrementRiftsCleared() {},
    commit(reason) {
      this.commits.push(reason);
    }
  };
}

// =========================================================================
// TESTE 1: Captura de Pokémon INÉDITO (recebe o Gold Bounty, sem bônus de duplicata)
// =========================================================================
console.log('\n--- Teste 1: Pokémon Inédito ---');
const db1 = createMockDb({}, 1000, 200);
global.G.DB = db1;
global.window.db = db1;
global.G.Game.player.coins = 1000;
global.G.Game.player.t1 = 200;

const attemptNew = {
  isSuccess: true,
  speciesId: 'charmander',
  mon: { dex: 4, name: 'charmander' },
  isShiny: false,
  isGoldBall: false
};

const resNew = CaptureSystem.resolveAttempt(attemptNew);
assert.strictEqual(resNew, true, 'Tentativa deve retornar true');
assert.strictEqual(attemptNew.isDuplicate, false, 'Pokémon inédito não pode ser duplicata');
assert(db1.save.owned[4], 'Charmander deve ter sido registrado na Dex');
// Recompensa de Caçador (Gold Bounty) de um Normal Estágio 1: +250
assert.strictEqual(db1.save.coins, 1250, 'Moedas devem receber o Gold Bounty (+250)');
assert.strictEqual(db1.save.tickets.t1, 200, 'Tickets devem permanecer iguais (sem bônus de duplicata)');
console.log('✅ Teste 1 passou com sucesso! (Gold Bounty +250, sem bônus de duplicata)');

// =========================================================================
// TESTE 2: Captura de Pokémon REPETIDO (Deve conceder +500 moedas e +500 tickets)
// =========================================================================
console.log('\n--- Teste 2: Pokémon Repetido (+500 Moedas e +500 Tickets) ---');
const db2 = createMockDb({ 4: { at: 123456 } }, 1500, 300);
global.G.DB = db2;
global.window.db = db2;
global.G.Game.player.coins = 1500;
global.G.Game.player.t1 = 300;

const attemptDup = {
  isSuccess: true,
  speciesId: 'charmander',
  mon: { dex: 4, name: 'charmander' },
  isShiny: false,
  isGoldBall: false
};

const resDup = CaptureSystem.resolveAttempt(attemptDup);
assert.strictEqual(resDup, true, 'Tentativa deve retornar true');
assert.strictEqual(attemptDup.isDuplicate, true, 'Deve ser marcado como duplicata');
// Gold Bounty (250) + bônus de duplicata (500) = 750
assert.strictEqual(db2.save.coins, 2250, 'Moedas no save devem ser 1500 + 250 (bounty) + 500 (duplicata) = 2250');
assert.strictEqual(db2.save.tickets.t1, 800, 'Tickets no save devem ser 300 + 500 = 800');
assert.strictEqual(global.G.Game.player.coins, 2250, 'Moedas do player ativo devem ser 2250');
assert.strictEqual(global.G.Game.player.t1, 800, 'Tickets do player ativo devem ser 800');
assert(db2.commits.includes('rift_duplicate'), 'Commit deve registrar motivo rift_duplicate');
console.log('✅ Teste 2 passou com sucesso! (bounty 250 + duplicata 500, tickets +500)');

// =========================================================================
// TESTE 3: Shiny NÃO é capturável (a recompensa é em Tickets de Roleta)
// =========================================================================
console.log('\n--- Teste 3: Shiny não é capturável ---');
const db3 = createMockDb({ 25: { at: 123456 } }, 500, 100);
global.G.DB = db3;
global.window.db = db3;
global.G.Game.player.coins = 500;
global.G.Game.player.t1 = 100;

const attemptShinyDup = {
  isSuccess: true,
  speciesId: 'pikachu',
  mon: { dex: 25, name: 'pikachu' },
  isShiny: true,
  isGoldBall: false
};

const resShinyDup = CaptureSystem.resolveAttempt(attemptShinyDup);
// resolveAttempt devolve o próprio objeto de tentativa no caminho do Shiny
// (que marca isSuccess = false e retorna sem creditar recompensas).
assert.strictEqual(resShinyDup.isSuccess, false, 'Shiny não é capturável: a tentativa deve ser marcada como falha');
assert.strictEqual(attemptShinyDup.isSuccess, false, 'A tentativa de Shiny deve ser marcada como falha');
assert.strictEqual(db3.save.coins, 500, 'Shiny não concede moedas de captura');
assert.strictEqual(db3.save.tickets.t1, 100, 'Shiny não concede tickets por aqui (a recompensa é de abate)');
console.log('✅ Teste 3 passou com sucesso! (Shiny não é capturável)');

// =========================================================================
// TESTE 4: Captura de Pokémon REPETIDO com GOLD BALL (+500 + +1000 Moedas)
// =========================================================================
console.log('\n--- Teste 4: Pokémon Repetido com Gold Ball ---');
const db4 = createMockDb({ 150: { at: 123456 } }, 0, 0);
global.G.DB = db4;
global.window.db = db4;
global.G.Game.player.coins = 0;
global.G.Game.player.t1 = 0;

const attemptGoldDup = {
  isSuccess: true,
  speciesId: 'mewtwo',
  mon: { dex: 150, name: 'mewtwo' },
  isShiny: false,
  isGoldBall: true
};

const resGoldDup = CaptureSystem.resolveAttempt(attemptGoldDup);
assert.strictEqual(resGoldDup, true, 'Tentativa deve retornar true');
assert.strictEqual(attemptGoldDup.isDuplicate, true, 'Deve ser duplicata');
// Gold Bounty de Lendário (8.000) + bônus de duplicata (500) + Gold Ball (1.000) = 9.500
assert.strictEqual(db4.save.coins, 9500, 'Moedas devem ser 8000 (bounty lendário) + 500 (repetido) + 1000 (gold ball) = 9500');
assert.strictEqual(db4.save.tickets.t1, 500, 'Tickets devem ser 500');
console.log('✅ Teste 4 passou com sucesso!');

// =========================================================================
// TESTE 5: Simulação completa de WorldCaptureBall e Callback onComplete
// =========================================================================
console.log('\n--- Teste 5: WorldCaptureBall Ciclo de Vida e Callback ---');
const db5 = createMockDb({ 1: { at: 123456 } }, 100, 50);
global.G.DB = db5;
global.window.db = db5;
global.G.Game.player.coins = 100;
global.G.Game.player.t1 = 50;

let callbackReceived = null;
const ball = new CaptureSystem.WorldCaptureBall({
  speciesId: 'bulbasaur',
  mon: { dex: 1, name: 'bulbasaur' },
  playerLevel: 30,
  onComplete: (success, isDup) => {
    callbackReceived = { success, isDup };
  }
});

// Força o resultado para sucesso
ball.isSuccess = true;
ball.state = 'RESOLVE';
ball.stateTimer = 0;

// Executa update no estado RESOLVE
ball.update(0.1);
assert.strictEqual(ball.isDuplicate, true, 'ball.isDuplicate deve ser true após RESOLVE');
// Gold Bounty (250, Estágio 1) + bônus de duplicata (500) = 750
assert.strictEqual(db5.save.coins, 850, 'Moedas devem somar bounty 250 + duplicata 500');
assert.strictEqual(db5.save.tickets.t1, 550, 'Tickets devem somar +500');

// Avança o tempo até conclusão (> 1.4s)
ball.update(1.5);
assert.strictEqual(ball.finished, true, 'Pokébola deve finalizar a animação');
assert(callbackReceived, 'Callback onComplete deve ter sido disparado');
assert.strictEqual(callbackReceived.success, true, 'Callback deve reportar sucesso');
assert.strictEqual(callbackReceived.isDup, true, 'Callback deve reportar duplicata');

console.log('✅ Teste 5 passou com sucesso!');

console.log('\n🎉 TODOS OS 5 TESTES DE RECOMPENSA DE REPETIDO PASSARAM COM SUCESSO 100%!');
