/**
 * test_dynamic_mega_ultimates.js
 * Validação rigorosa do Novo Sistema Dinâmico de Mega:
 * 1. Expurgo do buff de velocidade mecânica tipo metralhadora
 * 2. Detecção dinâmica do elemento primário do líder da equipe
 * 3. Catálogo dos 18 tipos elementais com geradores de perigo (spawnHazard / executeHazard)
 * 4. Drenagem linear do cronômetro de 8.5s e restauração do estado
 */

const assert = require('assert');

console.log('====================================================');
console.log('🧪 TESTE: SISTEMA DINÂMICO DE MEGA & 18 CALAMIDADES');
console.log('====================================================\n');

// Mock básico
global.window = global;
global.G = global.G || {};

global.G.Camera = { kick(v) {} };
global.G.Audio = { sfx(k) {} };
global.G.Spawner = { say(msg, dur, force) {} };
global.G.FX = { burst() {}, dmgText() {}, spark() {} };
global.G.EnemyMgr = { all() { return []; } };

// Carrega dados e sistemas
require('../js/data/pokedex.js');
require('../js/data/mega_ultimates.js');
require('../js/systems/ultimate_vfx.js');
require('../js/systems/mega.js');
require('../js/systems/combat.js');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASSOU] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FALHOU] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// TESTE 1: CATÁLOGO DOS 18 TIPOS ELEMENTAIS & PALETAS
// ---------------------------------------------------------------------------
console.log('--- [FRENTE 1] Catálogo dos 18 Tipos Elementais & Paletas ---');

runTest('Catálogo cobre integralmente os 18 tipos com spawnHazard e executeHazard', () => {
  const ALL_18_TYPES = [
    'fire', 'water', 'grass', 'electric', 'ice', 'fighting',
    'poison', 'ground', 'rock', 'flying', 'psychic', 'ghost',
    'bug', 'dragon', 'steel', 'dark', 'fairy', 'normal'
  ];

  const data = global.MEGA_ULTIMATES || global.G.MEGA_ULTIMATES;
  assert(data, 'MEGA_ULTIMATES deve estar definido');

  for (const t of ALL_18_TYPES) {
    const entry = data[t];
    assert(entry, `Tipo elementar ${t} deve existir em MEGA_ULTIMATES`);
    assert(entry.name, `Tipo ${t} deve ter nome em pt-BR`);
    assert(entry.color, `Tipo ${t} deve ter cor primária`);
    assert(entry.accent, `Tipo ${t} deve ter cor de destaque`);
    assert(typeof entry.spawnHazard === 'function', `Tipo ${t} deve possuir spawnHazard()`);
    assert(typeof entry.executeHazard === 'function', `Tipo ${t} deve possuir executeHazard()`);
    assert(entry.interval >= 0.20 && entry.interval <= 0.35, `Intervalo do tipo ${t} deve ser entre 0.20s e 0.35s (atual: ${entry.interval})`);
  }

  // Verifica paletas
  const pals = global.ELEMENT_PALETTES || global.G.ELEMENT_PALETTES;
  assert(pals, 'ELEMENT_PALETTES deve estar definido');
  for (const t of ALL_18_TYPES) {
    assert(pals[t], `Paleta para ${t} deve estar definida`);
    assert(pals[t].color && pals[t].accent && pals[t].aura, `Paleta ${t} incompleta`);
  }
});

// ---------------------------------------------------------------------------
// TESTE 2: EXPURGO DO BUFF DE VELOCIDADE MECÂNICA
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 2] Expurgo da Velocidade de Ataque Frenética ---');

runTest('Cadência de ataque em combat.js permanece padrão sem aceleração mecânica', () => {
  const fs = require('fs');
  const code = fs.readFileSync(__dirname + '/../js/systems/combat.js', 'utf8');

  // Não deve conter speedUp de 3.0 nem redução de recarga do mega
  assert(!code.includes('speedUp = (pl.megaMode && pl.megaMode.active) ? 3.0 : 1.0'), 'speedUp frenético deve ser removido');
  assert(!code.includes('cdMul * 0.45'), 'multiplicador acelerador de cooldown do mega deve ser removido');
  assert(code.includes('m.t -= dt;'), 'm.t deve ser decrementado normalmente sem multiplicador mecânico');
});

// ---------------------------------------------------------------------------
// TESTE 3: LEITURA DINÂMICA DO ELEMENTO DO LÍDER
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 3] Identificação Dinâmica do Elemento do Líder ---');

runTest('Trigger detecta o elemento primário de cada líder de equipe', () => {
  const testCases = [
    { team: [{ type: 'fire', name: 'Charizard' }], expected: 'fire' },
    { team: [{ type: 'water', name: 'Blastoise' }], expected: 'water' },
    { team: [{ type: 'grass', name: 'Venusaur' }], expected: 'grass' },
    { team: [{ type: 'electric', name: 'Pikachu' }], expected: 'electric' },
    { team: [{ type: 'ghost', name: 'Gengar' }], expected: 'ghost' },
    { team: [{ type: 'dragon', name: 'Dragonite' }], expected: 'dragon' },
    { team: [{ type: 'psychic', name: 'Mewtwo' }], expected: 'psychic' },
    { team: [{ type: 'normal', name: 'Snorlax' }], expected: 'normal' },
    { team: [{ types: ['ice', 'flying'], name: 'Articuno' }], expected: 'ice' }
  ];

  for (const tc of testCases) {
    const mockPlayer = {
      team: tc.team,
      megaMode: { active: false, timer: 0 },
      atk: 50,
      r: 16
    };
    global.G.Game = { player: mockPlayer };

    global.MegaSystem.gauge = 100;
    global.MegaSystem.isActive = false;

    const ok = global.MegaSystem.trigger();
    assert.strictEqual(ok, true, `Trigger falhou para ${tc.team[0].name}`);
    assert.strictEqual(global.MegaSystem.currentElement, tc.expected, `Elemento incorreto para ${tc.team[0].name}: esperado ${tc.expected}, obtido ${global.MegaSystem.currentElement}`);
    assert.strictEqual(mockPlayer.megaAuraElement, tc.expected, 'Aura do jogador deve receber o elemento');
    assert.strictEqual(mockPlayer.dmgTakenMul, 0.20, 'Redução defensiva de 80% deve ser aplicada');
    assert.strictEqual(mockPlayer.magnetMul, 2.0, 'Atração de EXP de +100% deve ser aplicada');

    // Reseta para o próximo caso
    global.MegaSystem.isActive = false;
    global.MegaSystem.gauge = 0;
  }
});

// ---------------------------------------------------------------------------
// TESTE 4: MÁQUINA DE ESTADOS & DRENAGEM DO CRONÔMETRO DE 8.5s
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 4] Drenagem Linear do Cronômetro (8.5 Segundos) ---');

runTest('Gauge drena regressivamente e dispara perigos contínuos sem erros', () => {
  const mockPlayer = {
    x: 100, y: 100, r: 16, atk: 40, maxHp: 100, hp: 80,
    team: [{ type: 'electric', name: 'Pikachu' }],
    megaMode: { active: false, timer: 0 },
    heal(amt) { this.hp = Math.min(this.maxHp, this.hp + amt); }
  };
  global.G.Game = { player: mockPlayer };

  global.UltimateVFX.clear();
  global.MegaSystem.gauge = 100;
  global.MegaSystem.isActive = false;

  const triggered = global.MegaSystem.trigger();
  assert(triggered);
  assert(global.MegaSystem.duration >= 8.0 && global.MegaSystem.duration <= 10.0);
  assert.strictEqual(global.MegaSystem.timeLeft, global.MegaSystem.duration);

  // Avança metade do tempo
  const halfTime = global.MegaSystem.duration / 2;
  let elapsed = 0;
  const dt = 0.05;
  while (elapsed < halfTime) {
    global.MegaSystem.update(dt);
    elapsed += dt;
  }

  // Gauge deve estar em ~50%
  const gaugeHalf = global.MegaSystem.gauge;
  console.log(`     -> Em t=${halfTime}s: Gauge = ${gaugeHalf.toFixed(1)}% (Esperado ~50%)`);
  assert(gaugeHalf >= 45 && gaugeHalf <= 55, `Drenagem incorreta na metade do tempo: ${gaugeHalf}`);

  // Devem ter sido instanciados hazards de eletricidade
  assert(global.UltimateVFX.count > 0, 'UltimateVFX deve conter calamidades ativas');

  // Roda até o final (mais 4.3s)
  while (global.MegaSystem.isActive && elapsed < 10) {
    global.MegaSystem.update(dt);
    elapsed += dt;
  }

  assert.strictEqual(global.MegaSystem.isActive, false, 'Mega deve se desativar ao fim do tempo');
  assert.strictEqual(global.MegaSystem.gauge, 0, 'Gauge deve estar zerado');
  assert.strictEqual(mockPlayer.dmgTakenMul, 1.0, 'Resistência deve retornar a 1.0');
  assert.strictEqual(mockPlayer.magnetMul, 1.0, 'Magnet deve retornar a 1.0');
});

console.log('\n====================================================');
console.log(`🎉 TESTES CONCLUÍDOS: ${passed}/${total} APROVADOS COM SUCESSO!`);
console.log('====================================================\n');

if (passed !== total) process.exit(1);
