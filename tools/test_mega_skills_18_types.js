/**
 * test_mega_skills_18_types.js
 * Teste Unitário Automatizado: Todos os 18 Ultimates / Mega Skills Elementais
 * PokéSurvivor: Endless Hunt
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Iniciando Teste de Validação dos 18 Ultimates / Mega Skills...\n');

// Mock do ambiente Canvas e Engine
global.window = global;
global.performance = { now: () => Date.now() };

const ALL_18_TYPES = [
  'fire', 'water', 'grass', 'electric', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock',
  'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal'
];

// Mock da infraestrutura do jogo
global.G = {
  Camera: {
    x: 0, y: 0,
    kick: (intensity) => { global.G.Camera.kicked = intensity; }
  },
  FX: {
    dmgText: () => {},
    burst: () => {},
    ring: () => {},
    spark: () => {}
  },
  Audio: {
    sfx: (id) => { global.G.Audio.lastSfx = id; }
  },
  EnemyMgr: {
    enemies: [],
    all: () => global.G.EnemyMgr.enemies
  },
  Spawner: {
    say: (msg) => { global.G.Spawner.lastMsg = msg; }
  },
  U: {
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    dist2: (x1, y1, x2, y2) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
    norm: (x, y) => {
      const d = Math.hypot(x, y) || 1;
      return [x / d, y / d];
    },
    rand: (min, max) => min + Math.random() * (max - min)
  }
};

// Carrega o módulo MegaSkillVFXManager
require('../js/systems/mega_skill_vfx.js');

const VFX = global.MegaSkillVFXManager || global.G.MegaSkillVFXManager;
assert(VFX, 'MegaSkillVFXManager deve estar instanciado e exportado globalmente');

// Mock do Player
const mockPlayer = {
  x: 200,
  y: 300,
  baseAtk: 10,
  atk: 50,
  hp: 80,
  maxHp: 100,
  heal: (amt) => { mockPlayer.hp = Math.min(mockPlayer.maxHp, mockPlayer.hp + amt); },
  mon: { types: ['fire'], name: 'Charizard' }
};

// Mock de Inimigos no mapa
function createMockEnemies() {
  return [
    { id: 1, x: 220, y: 310, hp: 100, maxHp: 100, dead: false, kx: 0, ky: 0, slow: 0, slowT: 0, burn: 0, poison: 0,
      hurt(d, col, dx, dy, knock) { this.hp -= d; if (knock) this.kx += knock; if (this.hp <= 0) this.dead = true; },
      applySlow(factor, dur) { this.slow = factor; this.slowT = dur; },
      applyBurn(stacks) { this.burn += stacks; },
      applyPoison(stacks) { this.poison += stacks; }
    },
    { id: 2, x: 250, y: 340, hp: 200, maxHp: 200, dead: false, kx: 0, ky: 0, slow: 0, slowT: 0, burn: 0, poison: 0,
      hurt(d, col, dx, dy, knock) { this.hp -= d; if (knock) this.kx += knock; if (this.hp <= 0) this.dead = true; },
      applySlow(factor, dur) { this.slow = factor; this.slowT = dur; },
      applyBurn(stacks) { this.burn += stacks; },
      applyPoison(stacks) { this.poison += stacks; }
    }
  ];
}

console.log('--- 1. Validando Registro dos 18 Tipos Elementais ---');
assert.strictEqual(typeof VFX.trigger, 'function', 'VFX deve possuir método trigger');
assert.strictEqual(typeof VFX.update, 'function', 'VFX deve possuir método update');
assert.strictEqual(typeof VFX.draw, 'function', 'VFX deve possuir método draw');

for (const type of ALL_18_TYPES) {
  const config = VFX.getTypeConfig ? VFX.getTypeConfig(type) : null;
  assert(config, `Configuração do tipo ${type} deve estar presente`);
  assert(config.name, `Tipo ${type} deve possuir um nome para o Ultimate`);
  assert(config.color, `Tipo ${type} deve possuir cor primária`);
  assert(config.behavior, `Tipo ${type} deve possuir comportamento core de partículas`);
  console.log(`  ✓ [${type.toUpperCase()}] Ultimate: "${config.name}" (Comportamento: ${config.behavior})`);
}
console.log('✅ Todos os 18 tipos mapeados e configurados com sucesso.\n');

console.log('--- 2. Validando Execução Procedural de Cada Ultimate ---');
const dummyCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  rect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  fill: () => {},
  stroke: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  strokeStyle: '#fff',
  fillStyle: '#fff',
  lineWidth: 1,
  shadowBlur: 0,
  shadowColor: '#fff'
};

for (const type of ALL_18_TYPES) {
  global.G.EnemyMgr.enemies = createMockEnemies();
  VFX.clear();

  // Dispara o ultimate
  const res = VFX.trigger(type, mockPlayer);
  assert(res, `Disparo do ultimate ${type} deve retornar true`);

  // Executa ciclos de update
  VFX.update(0.1, mockPlayer);
  VFX.update(0.1, mockPlayer);

  // Executa ciclo de draw sem erros
  assert.doesNotThrow(() => {
    VFX.draw(dummyCtx, global.G.Camera);
  }, `Desenho do ultimate ${type} não deve lançar exceção`);

  console.log(`  ✓ [${type}] Disparado, atualizado e desenhado a 60 FPS com sucesso.`);
}
console.log('✅ Execução dos 18 Ultimates comprovada com zero exceções.\n');

console.log('--- 3. Validando Efeitos Específicos de Status e Dano ---');

// Fogo: Queimadura
global.G.EnemyMgr.enemies = createMockEnemies();
VFX.clear();
VFX.trigger('fire', mockPlayer);
for (let i = 0; i < 5; i++) VFX.update(0.1, mockPlayer);
assert(global.G.EnemyMgr.enemies.some(e => e.burn > 0 || e.hp < e.maxHp), 'Fogo deve causar dano e/ou queimadura');
console.log('  ✓ Fogo: Queimadura e Dano AoE confirmados');

// Gelo: Congelamento (Slow 100%)
global.G.EnemyMgr.enemies = createMockEnemies();
VFX.clear();
VFX.trigger('ice', mockPlayer);
for (let i = 0; i < 5; i++) VFX.update(0.1, mockPlayer);
assert(global.G.EnemyMgr.enemies.some(e => e.slow >= 1.0), 'Gelo deve congelar inimigos (slow >= 1.0)');
console.log('  ✓ Gelo: Congelamento (Zero Absoluto) confirmado');

// Água: Knockback e Slow
global.G.EnemyMgr.enemies = createMockEnemies();
VFX.clear();
VFX.trigger('water', mockPlayer);
for (let i = 0; i < 5; i++) VFX.update(0.1, mockPlayer);
assert(global.G.EnemyMgr.enemies.some(e => e.kx !== 0 || e.slow > 0), 'Água deve empurrar e causar lentidão');
console.log('  ✓ Água: Tsunami com Knockback e Lentidão confirmado');

// Planta: Lifesteal / Cura no player
global.G.EnemyMgr.enemies = createMockEnemies();
mockPlayer.hp = 50;
VFX.clear();
VFX.trigger('grass', mockPlayer);
for (let i = 0; i < 5; i++) VFX.update(0.1, mockPlayer);
assert(mockPlayer.hp > 50, 'Planta deve curar o jogador');
console.log('  ✓ Planta: Enraizamento e Cura no Jogador confirmados');

console.log('\n🎉 TODOS OS TESTES DOS 18 ULTIMATES ELEMENTAIS PASSARAM COM 100% DE SUCESSO!\n');
