/**
 * test_auto_evolution.js — Validação da Evolução Automática por Nível
 * Requisitos:
 * 1. A evolução de espécie ocorre de forma 100% automática ao alcançar o nível correspondente.
 * 2. NENHUMA carta de evolução de espécie aparece no pool de cartas de Level Up (apenas ataques/stats).
 */

const assert = require('assert');
const path = require('path');

console.log('========================================================');
console.log('🧪 TESTE UNITÁRIO: EVOLUÇÃO AUTOMÁTICA & REMOÇÃO DE CARTAS');
console.log('========================================================\n');

global.window = global;
global.G = global.G || {};

// Mock mínimo do ambiente DOM e Audio/VFX
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.G.Audio = { sfx() {} };
global.G.FX = {
  burst() {},
  ring() {},
  dmgText() {}
};
global.G.Spawner = {
  say() {}
};
global.G.Sprites = {
  hasShiny: () => false,
  bodyRadius: () => 16,
  bodyHeight: () => 32,
  Animator: class {
    constructor() {}
    update() {}
    draw() {}
  }
};

// Carregar utilitários e bases de dados
require('../js/core/util.js');
require('../js/data/types.js');
require('../js/data/pokedex.js');
require('../js/data/evolutions.js');
require('../js/data/moves.js');

// Mock do sistema Game
global.G.Game = {
  triggerLevelUp() {},
  debugLevelUp() {}
};

// Carregar Player e LevelUp
require('../js/entities/player.js');
require('../js/systems/levelup.js');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASSOU] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FALHOU] ${desc}`);
    console.error(`     Erro: ${err.message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// TESTE 1: Evolução Automática ao subir de nível
// -------------------------------------------------------------
it('Bulbasaur evolui automaticamente para Ivysaur (Nv 5) e Venusaur (Nv 12)', () => {
  const mon = G.DEX_BY[1];
  const p = new G.Player(mon);
  assert.strictEqual(p.species, 'bulbasaur', 'Começa como Bulbasaur');
  assert.strictEqual(p.level, 1, 'Começa no nível 1');

  // Ganha XP até o nível 4 (não deve evoluir)
  while (p.level < 4) {
    p.gainXp(p.xpNext);
  }
  assert.strictEqual(p.level, 4);
  assert.strictEqual(p.species, 'bulbasaur', 'Ainda é Bulbasaur no nível 4');

  // Sobe para o nível 5 -> Evolução automática para Ivysaur
  p.gainXp(p.xpNext);
  assert.strictEqual(p.level, 5);
  assert.strictEqual(p.species, 'ivysaur', 'Evoluiu automaticamente para Ivysaur no nível 5');

  // Ganha XP até o nível 11
  while (p.level < 11) {
    p.gainXp(p.xpNext);
  }
  assert.strictEqual(p.level, 11);
  assert.strictEqual(p.species, 'ivysaur', 'Ainda é Ivysaur no nível 11');

  // Sobe para o nível 12 -> Evolução automática para Venusaur
  p.gainXp(p.xpNext);
  assert.strictEqual(p.level, 12);
  assert.strictEqual(p.species, 'venusaur', 'Evoluiu automaticamente para Venusaur no nível 12');

  // Sobe até nível 21 -> Ascensão Mega automática
  while (p.level < 21) {
    p.gainXp(p.xpNext);
  }
  assert.strictEqual(p.level, 21);
  assert.strictEqual(p.isMegaAscended, true, 'Ativou Ascensão Mega no nível 21');
});

// -------------------------------------------------------------
// TESTE 2: Nenhuma carta de evolução de espécie aparece no Level Up
// -------------------------------------------------------------
it('Candidatos de Level Up NUNCA contêm cartas de evolução de espécie (type: EVOLUTION)', () => {
  const mon = G.DEX_BY[4];
  const p = new G.Player(mon);

  // Testa em múltiplos níveis críticos: 1, 5, 12, 16, 25, 36
  const testLevels = [1, 4, 5, 10, 12, 16, 20, 25, 36];

  for (const lvl of testLevels) {
    p.level = lvl;
    p.checkEvolutionMilestones();

    const candidates = G.LevelUp.candidates(p);

    // Verifica que NENHUM candidato tem type 'EVOLUTION' ou chave 'evo_mon:'
    const evoSpeciesCards = candidates.filter(c => c.type === 'EVOLUTION' || (c.key && c.key.startsWith('evo_mon:')));
    assert.strictEqual(evoSpeciesCards.length, 0, `No nível ${lvl}, NÃO deve haver cartas de evolução de espécie no pool.`);

    // Verifica que todas as opções são ataques ('new'/'up'), evoluções de golpe ('evo') ou melhorias de stats ('stat')
    for (const card of candidates) {
      assert(
        card.type === 'new' || card.type === 'up' || card.type === 'evo' || card.type === 'stat',
        `Tipo de carta inesperado: ${card.type}`
      );
    }
  }
});

// -------------------------------------------------------------
// TESTE 3: Charmander evolui automaticamente para Charmeleon e Charizard
// -------------------------------------------------------------
it('Charmander evolui em cascata automática por ganho de nível', () => {
  const mon = G.DEX_BY[4];
  const p = new G.Player(mon);
  assert.strictEqual(p.species, 'charmander');

  // Pula direto para nível 12 via gainXp
  while (p.level < 12) {
    p.gainXp(p.xpNext);
  }
  assert.strictEqual(p.level, 12);
  assert.strictEqual(p.species, 'charizard', 'Charmander atingiu Charizard no nível 12');
});

console.log('\n========================================================');
console.log(`🎉 TESTES CONCLUÍDOS: ${passed}/${total} APROVADOS!`);
console.log('========================================================\n');
