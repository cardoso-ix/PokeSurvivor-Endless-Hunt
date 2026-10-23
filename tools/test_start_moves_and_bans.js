// tools/test_start_moves_and_bans.js
// Teste unitário e de integração para Ataques Iniciais (50.000 moedas) e Banir (máx 3 sem ascensão).

const assert = require('assert');
const fs = require('fs');

global.window = {};
global.G = { Moves: { BY_ID: {}, poolFor: () => [] } };

// Mock minimal dependencies
global.getPokemonEvolutionStage = (dex) => {
  if (dex === 'charizard' || dex === 6) return 3;
  if (dex === 'charmeleon' || dex === 5) return 2;
  return 1;
};
global.G.getPokemonEvolutionStage = global.getPokemonEvolutionStage;

// Carrega upgrades.js
require('../js/data/upgrades.js');

console.log('--- TESTANDO UPGRADES.JS ---');

const movesUpg = G.Upgrades.BY['moves'];
const banUpg = G.Upgrades.BY['ban'];
const hpUpg = G.Upgrades.BY['hp'];

// 1. Verificação de configuração de LIST
assert.strictEqual(movesUpg.max, 1, 'Moves deve ter max 1');
assert.strictEqual(movesUpg.base, 50000, 'Moves deve ter base cost 50000');
assert.strictEqual(banUpg.max, 3, 'Ban deve ter max 3');
console.log('✓ Configurações de LIST válidas (moves max 1 / base 50k, ban max 3)');

// 2. maxOf
assert.strictEqual(G.Upgrades.maxOf('moves'), 1, 'maxOf(moves) deve ser 1 (sem ascensão)');
assert.strictEqual(G.Upgrades.maxOf('ban'), 3, 'maxOf(ban) deve ser 3 (sem ascensão)');
assert.strictEqual(G.Upgrades.maxOf('hp'), 20, 'maxOf(hp) deve ser 20 (10 + 10 ascensão)');
console.log('✓ maxOf sem ascensão para ban (3) e moves (1)');

// 3. Custos de compra
assert.strictEqual(G.Upgrades.cost('moves', 0, 'charmander'), 50000, 'Custo de moves para Charmander deve ser 50000');
assert.strictEqual(G.Upgrades.cost('moves', 0, 'charizard'), 50000, 'Custo de moves para Charizard deve ser 50000 (sem multiplicar por estágio)');
assert.strictEqual(G.Upgrades.getUpgradeCost('charizard', 0, 'moves'), 50000, 'getUpgradeCost moves charizard deve ser 50000');

assert.strictEqual(G.Upgrades.cost('ban', 0), 300, 'Custo base nível 1 de ban deve ser 300');
assert.strictEqual(G.Upgrades.cost('ban', 3), 0, 'Custo de ban no nível 3 deve ser 0 (máximo atingido, sem ascensão)');
console.log('✓ Custos de 50.000 moedas e travas de nível máximo validados');

// 4. Perks de combate
const perksZero = G.Upgrades.perks({ moves: 0, ban: 0 });
assert.strictEqual(perksZero.startMoves, 1, 'Sem moves deve ter 1 ataque inicial');
assert.strictEqual(perksZero.bans, 0, 'Sem ban deve ter 0 bans');

const perksUnlocked = G.Upgrades.perks({ moves: 1, ban: 2 });
assert.strictEqual(perksUnlocked.startMoves, 2, 'Com moves: 1 deve ter 2 ataques iniciais');
assert.strictEqual(perksUnlocked.bans, 2, 'Com ban: 2 deve ter 2 bans');

// Teste de tentativa de extrapolação / ascensão em ban e moves
const perksOver = G.Upgrades.perks({ moves: 5, ban: 10 });
assert.strictEqual(perksOver.startMoves, 2, 'Moves não pode ultrapassar 2 mesmo se o save tiver valor maior');
assert.strictEqual(perksOver.bans, 3, 'Ban não pode ultrapassar 3 mesmo se o save tiver valor maior');
assert.strictEqual(perksOver.overLevels.ban, 0, 'overLevels.ban deve ser 0');
assert.strictEqual(perksOver.overLevels.moves, 0, 'overLevels.moves deve ser 0');
console.log('✓ Perks com teto de 1 ataque base (2 com unlock) e 3 bans máximos validados');

console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
