const assert = require('assert');

// Mock básico para teste de integração em Node
global.window = global;
global.document = {
  getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, innerText: '', style: {} }),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.G = {
  UI: { hideAll: () => {}, chrome: () => {}, toast: () => {}, isOpen: () => false, hide: () => {} },
  FX: { burst: () => {}, ring: () => {}, spark: () => {}, px: () => {}, dmgText: () => {} },
  Projectiles: { clear: () => {} },
  Combat: { clearFields: () => {} },
  Hazards: { clear: () => {} },
  Pickups: { clear: () => {}, pullAll: () => {} },
  Spawner: { reset: () => {}, say: () => {} },
  Judgment: { reset: () => {}, summary: () => null },
  Events: { reset: () => {} },
  Weather: { reset: () => {}, force: () => {}, clear: () => {} },
  Camera: { x: 0, y: 0, shake: 0, kick: () => {}, follow: () => {} },
  Audio: { sfx: () => {}, music: () => {} },
  World: {
    isFree: () => true,
    setArena: () => {},
    setBiome: () => {},
    biome: 0
  },
  Tiles: {
    T: 16,
    arenaBiome: () => 0,
    ARENA_THEMES: {}
  },
  Sprites: {
    PX: 3,
    bodyRadius: () => 14
  },
  DEX: [
    { dex: 25, name: 'Pikachu', hp: 90, atk: 1.0, spd: 100, types: ['electric'] },
    { dex: 150, name: 'Mewtwo', hp: 200, atk: 1.5, spd: 130, types: ['psychic'], leg: true }
  ],
  DEX_BY: {
    25: { dex: 25, name: 'Pikachu', hp: 90, atk: 1.0, spd: 100, types: ['electric'] },
    150: { dex: 150, name: 'Mewtwo', hp: 200, atk: 1.5, spd: 130, types: ['psychic'], leg: true }
  },
  Coop: {
    active: false,
    isHost: true,
    everyone: () => [],
    scaleHp: () => 1,
    broadcast: () => {}
  },
  Progress: {
    event: () => {}
  },
  U: {
    rand: (a, b) => (a + b) / 2,
    randInt: (a, b) => Math.floor((a + b) / 2),
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    pick: arr => arr[0]
  }
};

const enemies = [];
G.EnemyMgr = {
  add: e => enemies.push(e),
  all: () => enemies,
  get: id => enemies.find(e => e.id === id),
  stash: () => {},
  restore: () => {},
  clear: () => { enemies.length = 0; },
  clearRemote: () => {}
};

// Enemy class mock
G.Enemy = class {
  constructor(def, x, y) {
    this.id = Math.random();
    this.name = def.name;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.spd = def.spd;
    this.dmg = def.dmg;
    this.shotDmg = def.shotDmg;
    this.shotCd = def.shotCd;
    this.scale = 1;
    this.r = 16;
    this.bodyH = 20;
    this.dead = false;
  }
  makeShiny() { this.shiny = true; }
};

// Carrega o módulo Rift atualizado
const Rift = require('../js/systems/rift.js');

console.log('===========================================================');
console.log('🧪 TESTE: ESCALONAMENTO DO RIFT POR NÍVEL (NV 10 A 100)');
console.log('===========================================================');

// 1. Validar Tiers matematicamente
const tiers = Rift.RIFT_TIERS;
assert(Array.isArray(tiers) && tiers.length === 11, 'Deve possuir 11 Tiers (0 a 10)');

console.log('\n--- VERIFICAÇÃO DOS PATAMARES DE NÍVEL ---');
const testCases = [
  { lvl: 5,   expectedTier: 0,  minHpMul: 1.0,  minDmgMul: 1.0,  minions: 0 },
  { lvl: 10,  expectedTier: 1,  minHpMul: 1.45, minDmgMul: 1.3,  minions: 0 },
  { lvl: 15,  expectedTier: 1,  minHpMul: 1.45, minDmgMul: 1.3,  minions: 0 },
  { lvl: 20,  expectedTier: 2,  minHpMul: 2.10, minDmgMul: 1.7,  minions: 2 },
  { lvl: 30,  expectedTier: 3,  minHpMul: 2.90, minDmgMul: 2.15, minions: 3 },
  { lvl: 40,  expectedTier: 4,  minHpMul: 3.90, minDmgMul: 2.70, minions: 3 },
  { lvl: 50,  expectedTier: 5,  minHpMul: 5.10, minDmgMul: 3.35, minions: 4 },
  { lvl: 60,  expectedTier: 6,  minHpMul: 6.50, minDmgMul: 4.10, minions: 4 },
  { lvl: 70,  expectedTier: 7,  minHpMul: 8.10, minDmgMul: 4.95, minions: 5 },
  { lvl: 80,  expectedTier: 8,  minHpMul: 10.0, minDmgMul: 5.90, minions: 5 },
  { lvl: 90,  expectedTier: 9,  minHpMul: 12.2, minDmgMul: 7.00, minions: 6 },
  { lvl: 100, expectedTier: 10, minHpMul: 15.0, minDmgMul: 8.50, minions: 7 },
  { lvl: 120, expectedTier: 10, minHpMul: 15.0, minDmgMul: 8.50, minions: 7 }
];

testCases.forEach(tc => {
  const t = Rift.getRiftTierData(tc.lvl);
  console.log(`Lvl ${tc.lvl.toString().padStart(3)}: Tier ${t.tier} [${t.name}] -> HP ×${t.hpMul.toFixed(2)}, DMG ×${t.dmgMul.toFixed(2)}, Minions: ${t.minions}`);
  assert.strictEqual(t.tier, tc.expectedTier, `Nível ${tc.lvl} deve ser Tier ${tc.expectedTier}`);
  assert(t.hpMul >= tc.minHpMul, `HP Mul incorreto no Nível ${tc.lvl}`);
  assert(t.dmgMul >= tc.minDmgMul, `DMG Mul incorreto no Nível ${tc.lvl}`);
  assert.strictEqual(t.minions, tc.minions, `Minions incorretos no Nível ${tc.lvl}`);
});

console.log('✅ Tabela matemática de Tiers (10 a 100) 100% validada!');

// 2. Testar Spawn do Guardião em Nível 30 vs Nível 1
console.log('\n--- VERIFICAÇÃO DE INSTANCIAÇÃO DO GUARDIÃO ---');
// Mock Player
G.Game = {
  player: { x: 0, y: 0, level: 30, dead: false },
  everyone: () => [G.Game.player],
  st: { time: 100 },
  flash: () => {}
};

enemies.length = 0;
Rift.reset();
Rift.start(null, 150, false, 30); // Nível 30

const boss = enemies.find(e => e.isRiftGuardian);
assert(boss, 'Guardião do Rift deve ter sido instanciado');
console.log('Guardião criado:', {
  nome: boss.name,
  hp: boss.hp,
  dmg: boss.dmg,
  shotDmg: boss.shotDmg,
  shotCd: boss.shotCd,
  tier: boss.riftTier,
  tierName: boss.riftTierName
});

assert.strictEqual(boss.riftTier, 3, 'O boss deve ter riftTier = 3');
assert(boss.hp > 15000, 'O boss de tier 3 deve ter vida turbinada (>15000)');
assert(boss.dmg > 50, 'O boss de tier 3 deve ter dano aumentado (>50)');

const minions = enemies.filter(e => e.isRiftMinion);
console.log(`Sombras Dimensionais invocadas: ${minions.length}`);
assert.strictEqual(minions.length, 3, 'No Tier 3 (Lvl 30) devem ser invocadas 3 Sombras Dimensionais');

// 3. Testar Dissipação de Minions ao derrotar Guardião
console.log('\n--- TESTE DE DISSIPAÇÃO DE SOMBRAS AO VENCER O BOSS ---');
Rift.handleGuardianDefeated(boss);
const aliveMinions = enemies.filter(e => e.isRiftMinion && !e.dead);
assert.strictEqual(aliveMinions.length, 0, 'Todas as sombras devem morrer quando o Guardião é derrotado');
console.log('✅ Sombras da Fenda dissipadas com sucesso!');

console.log('\n🎉 TODOS OS TESTES UNITÁRIOS DE RIFT PASSARAM COM SUCESSO!');
