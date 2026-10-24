/**
 * test_slot_selection_and_bonds.js
 *
 * Regressão para o contrato de seleção de slot de ataque e fusão (Elo de Fusão):
 *
 * 1. Antes do Nível 20, SÓ o grupo do slot ativo dispara (seleção com 1-4 / Q / E / Tab).
 * 2. A partir do Nível 20 (Super Combo), TODOS os slots disparam juntos.
 * 3. O Super Combo usa `slots`, não `moves`: um ataque fundido sai do slot mas
 *    continua em `moves` — se usasse `moves`, o ataque fundido dispararia
 *    duas vezes (uma no grupo, uma fora).
 * 4. Fusão: `bondOptions()`/`fuse()` unem dois ataques soltos num único slot,
 *    liberando espaço na barra, e gastam 1 Elo.
 * 5. `G.Combat.tick` só executa os movimentos de `activeGroup()`.
 */

const assert = require('assert');

console.log('🧪 Iniciando Teste de Seleção de Slot e Fusão (Bonds)...\n');

// ------------------------------------------------------------------
// Mock do ambiente (mesmo padrão de tools/test_combat_and_iframes.js)
// ------------------------------------------------------------------
global.window = global;
global.BalanceConfig = require('../js/config/balanceConfig.js');

const MOVES = {
  tackle: { id: 'tackle', name: 'Tackle', kind: 'projectile', type: 'normal', lvl: 1, t: 0, cd: 1, dmg: 10, evolved: false, def: { maxLvl: 5 } },
  ember: { id: 'ember', name: 'Ember', kind: 'projectile', type: 'fire', lvl: 1, t: 0, cd: 1, dmg: 10, evolved: false, def: { maxLvl: 5 } },
  bubble: { id: 'bubble', name: 'Bubble', kind: 'projectile', type: 'water', lvl: 1, t: 0, cd: 1, dmg: 10, evolved: false, def: { maxLvl: 5 } },
  vine: { id: 'vine', name: 'Vine Whip', kind: 'projectile', type: 'grass', lvl: 1, t: 0, cd: 1, dmg: 10, evolved: false, def: { maxLvl: 5 } }
};

global.G = {
  Sprites: {
    hasShiny: () => false,
    bodyRadius: () => 14,
    bodyHeight: () => 20,
    Animator: class { update() {} play() {} loop() {} busy() { return false; } }
  },
  BalanceConfig: global.BalanceConfig,
  Types: { mult: () => 1.0, label: () => 'normal' },
  Weather: { mult: () => 1.0, getAtkMul: () => 1.0, getSpdMul: () => 1.0, getDodgeChance: () => 0.0 },
  FX: { dmgText: () => {}, burst: () => {}, ring: () => {}, spark: () => {}, slash: () => {}, beam: () => {} },
  Audio: { sfx: () => {} },
  Camera: { kick: () => {} },
  Projectiles: { clearOrbs: () => {} },
  World: { collide: () => {}, isLiquid: () => false, liquidEffect: () => ({}) },
  U: { TYPE_COLOR: {}, TYPE_NAME: {}, clamp: (a, b, c) => Math.min(c, Math.max(b, a)), rand: (a, b) => a },
  Moves: {
    BY_ID: MOVES,
    instance: (id) => Object.assign({}, MOVES[id])
  },
  LIFT: 10,
  Rift: { inArena: false }
};

require('../js/entities/player.js');

// ------------------------------------------------------------------
// 1. SELEÇÃO DE SLOT ANTES DO NÍVEL 20
// ------------------------------------------------------------------
console.log('--- 1. Seleção de Slot antes do Nível 20 ---');
const pl = new G.Player('pikachu');
pl.addMove('tackle');
pl.addMove('ember');
pl.addMove('bubble');

assert.strictEqual(pl.slots.length, 3, 'Devem existir 3 slots preenchidos');
assert.strictEqual(pl.slots[0].length, 1, 'Cada slot começa com 1 ataque');

// Só o grupo ativo dispara
assert.strictEqual(pl.activeGroup().length, 1, 'Antes do Nv 20, só 1 grupo (o ativo) dispara');
assert.strictEqual(pl.activeGroup()[0].id, pl.slots[pl.active][0].id, 'O grupo ativo deve ser o do slot selecionado');
console.log('✅ Antes do Nv 20, apenas o grupo do slot ativo é disparado.');

// Trocar de slot muda o grupo disparado
const firstId = pl.activeGroup()[0].id;
pl.setActive(1);
assert.notStrictEqual(pl.activeGroup()[0].id, firstId, 'Trocar de slot deve trocar o grupo disparado');
assert.strictEqual(pl.activeGroup()[0].id, pl.slots[1][0].id, 'O grupo ativo deve seguir o slot selecionado');
console.log('✅ setActive() troca de fato o grupo disparado.');

// Ciclo (Q / E / Tab)
const before = pl.active;
pl.cycle(1);
assert.notStrictEqual(pl.active, before, 'cycle() deve avançar o slot ativo');
pl.cycle(-1);
assert.strictEqual(pl.active, before, 'cycle(-1) deve voltar ao slot anterior');
console.log('✅ cycle(+1)/cycle(-1) navegam entre os slots.');

// ------------------------------------------------------------------
// 2. SUPER COMBO A PARTIR DO NÍVEL 20
// ------------------------------------------------------------------
console.log('\n--- 2. Super Combo a partir do Nível 20 ---');
pl.level = 20;
const combo = pl.activeGroup();
assert.strictEqual(combo.length, 3, 'No Nv 20, todos os slots disparam juntos (3 ataques)');
const comboIds = combo.map(m => m.id).sort();
assert.deepStrictEqual(comboIds, ['bubble', 'ember', 'tackle'].sort(), 'O Super Combo deve conter todos os ataques dos slots');
console.log('✅ No Nv 20, todos os slots disparam simultaneamente.');

// ------------------------------------------------------------------
// 3. FUSÃO: ATAQUE FUNDIDO SAI DO SLOT, MAS CONTINUA EM `moves`
// ------------------------------------------------------------------
console.log('\n--- 3. Fusão (Elo de Fusão) ---');
pl.level = 1; // fora do Super Combo
pl.setActive(0);
assert.strictEqual(pl.bonds, 0, 'O jogador começa sem Elo de Fusão');

// bondOptions: sem grupos formados e <2 soltos não há o que fazer
pl.bonds = 1;
pl.addMove('vine'); // agora há 4 slots
const opt = pl.bondOptions();
assert(opt, 'Com 2+ ataques soltos deve haver opção de fusão');
assert.strictEqual(opt.mode, 'pair', 'Sem grupo formado, a fusão une dois ataques soltos');
console.log('✅ bondOptions() detecta a fusão de dois ataques soltos.');

// Fusão de 2 soltos: os 2 attacks saem de 2 slots e passam a 1 slot com 2 ataques
const slotsBefore = pl.slots.length;
const looseA = opt.loose[0], looseB = opt.loose[1];
const group = pl.fuse([looseA, looseB], null);
assert.strictEqual(pl.slots.length, slotsBefore - 1, 'A fusão deve liberar 1 espaço na barra');
assert.strictEqual(group.length, 2, 'O grupo fundido deve conter 2 ataques');
assert.strictEqual(pl.bonds, 0, 'A fusão deve gastar 1 Elo de Fusão');
assert(pl.moves.some(m => m.id === looseA.id), 'O ataque fundido continua em `moves` (histórico)');
assert(!pl.slots.some(s => s.length === 1 && s[0].id === looseA.id), 'O ataque fundido não pode continuar num slot solto');
console.log('✅ fuse() une 2 ataques num slot, libera espaço e gasta o Elo.');

// O ataque fundido NÃO pode disparar em duplicidade no Super Combo
pl.level = 20;
const comboIds2 = pl.activeGroup().map(m => m.id);
const totalMovesInSlots = pl.slots.reduce((n, s) => n + s.length, 0);
assert.strictEqual(comboIds2.length, totalMovesInSlots, 'Super Combo: um disparo por ataque nos slots, sem duplicar o fundido');
const dupes = comboIds2.filter((id, i) => comboIds2.indexOf(id) !== i);
assert.strictEqual(dupes.length, 0, 'Nenhum ataque pode disparar duas vezes: ' + dupes.join(','));
console.log('✅ O Super Combo usa `slots`: o ataque fundido dispara uma única vez.');

// Fusionado: 1 slot com 2 ataques => os 2 disparam juntos quando o slot está ativo
pl.level = 1;
pl.setActive(pl.slots.indexOf(group));
assert.strictEqual(pl.activeGroup().length, 2, 'O slot fundido dispara seus 2 ataques juntos');
console.log('✅ O slot fundido dispara seus 2 ataques em conjunto.');

// ------------------------------------------------------------------
// 4. COMBAT TICK SÓ EXECUTA O GRUPO ATIVO
// ------------------------------------------------------------------
console.log('\n--- 4. G.Combat.tick executa apenas o grupo ativo ---');
const combatSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'systems', 'combat.js'), 'utf8');
assert(
  !/pl\.moves\s*&&\s*pl\.moves\.length/.test(combatSrc),
  'combat.js não pode mais disparar `pl.moves` diretamente (ignora a seleção de slot)'
);
assert(
  /pl\.activeGroup\(\)/.test(combatSrc),
  'combat.js deve chamar pl.activeGroup()'
);
console.log('✅ combat.js usa pl.activeGroup() e não dispara mais `pl.moves` diretamente.');

console.log('\n====================================================');
console.log('🎉 TODOS OS TESTES DE SELEÇÃO DE SLOT E FUSÃO PASSARAM COM 100% DE SUCESSO!');
console.log('====================================================');
