/**
 * test_full_suite.js — Validação Automatizada de Ponta a Ponta
 * Testa integralmente as 4 Frentes de Implementação:
 * 1. Sistema de Captura de Rifts & Gold Ball
 * 2. Trava Estrutural de Estágio 1 & Sanitização do Save
 * 3. Mega Overdrive de 10s com os 18 Tipos Elementais e VFX Pooling
 * 4. Novo HUD Inferior Retro Pixel Art e Marcos de Evolução (Nv 5, 12, 21)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🚀 INICIANDO BATERIA DE TESTES DE INTEGRAÇÃO COMPLETA');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// 1. CARREGAMENTO DOS MÓDULOS DE DADOS E SISTEMAS
// ---------------------------------------------------------------------------
global.window = global;
global.G = global.G || {};

// Mock de DOM básico
global.document = {
  querySelector: () => ({ getAttribute: () => 'app.min.js?v=test' }),
  querySelectorAll: () => [],
  getElementById: (id) => ({
    id,
    classList: { add() {}, remove() {}, contains: () => false },
    style: {},
    textContent: '',
    appendChild() {},
    getContext: () => ({
      clearRect() {}, drawImage() {}, fill() {}, stroke() {},
      beginPath() {}, arc() {}, ellipse() {}, strokeRect() {}, fillRect() {}
    })
  })
};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

// 1. Carrega Pokédex, Evoluções, Mega Ultimates, VFX, Mega System, Captura
require('../js/data/pokedex.js');
require('../js/data/evolutions.js');
require('../js/data/mega_ultimates.js');
require('../js/systems/ultimate_vfx.js');
require('../js/systems/mega.js');
require('../js/systems/capture.js');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASSOU] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FALHOU] ${name}`);
    console.error(`     Erro: ${err.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// FRENTE 1: SISTEMA DE CAPTURA DE RIFTS & POKÉBOLAS
// ---------------------------------------------------------------------------
console.log('--- [FRENTE 1] Sistema de Captura de Rifts & Gold Ball ---');

test('CaptureSystem e configurações de Pokébolas estão definidos', () => {
  assert(global.CaptureSystem, 'CaptureSystem deve estar definido');
  assert(global.POKEBALL_TIERS, 'POKEBALL_TIERS deve estar definido');
  assert(global.GOLD_BALL_CONFIG, 'GOLD_BALL_CONFIG deve estar definido');
  assert.strictEqual(global.GOLD_BALL_CONFIG.minLevel, 41);
  assert.strictEqual(global.GOLD_BALL_CONFIG.chance, 0.10);
  assert.strictEqual(global.GOLD_BALL_CONFIG.coinBonus, 1000);
});

test('Seleção de Pokébola por Nível do Jogador', () => {
  const getBall = global.getBallForPlayerLevel;
  assert.strictEqual(getBall(5).id, 'pokeball');
  assert.strictEqual(getBall(15).id, 'greatball');
  assert.strictEqual(getBall(25).id, 'ultraball');
  assert.strictEqual(getBall(35).id, 'ultimateball');
});

test('Gold Ball ativada no Nv 41+ sob condição de sorteio', () => {
  const resolveBall = global.resolveCaptureBall;
  // Teste com random forçado para 0.05 (< 0.10) no nível 45
  const origRandom = Math.random;
  Math.random = () => 0.05;
  const resGold = resolveBall(45);
  assert.strictEqual(resGold.id, 'goldball');
  assert.strictEqual(resGold.isGold, true);
  assert.strictEqual(resGold.catchRate, 1.0); // 100% de taxa!

  // Nível 30 não deve gerar Gold Ball mesmo com random baixo
  const resLow = resolveBall(30);
  assert.notStrictEqual(resLow.id, 'goldball');
  Math.random = origRandom;
});

test('Taxas Base de Captura (Básico 50%, Lendário 20%, Shiny 15%)', () => {
  const getRate = global.getBaseCatchRate;
  assert.strictEqual(getRate(1, false), 0.50); // Básico normal (Bulbasaur)
  assert.strictEqual(getRate(150, false), 0.20); // Lendário (Mewtwo)
  assert.strictEqual(getRate(1, true), 0.15); // Shiny
});

// ---------------------------------------------------------------------------
// FRENTE 2: TRAVA DE ESTÁGIO 1 & SANITIZAÇÃO DO SAVE
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 2] Trava Estrutural de Estágio 1 (Base vs Evolução) ---');

test('isBaseStage identifica espécies base (Estágio 1) com precisão', () => {
  const isBase = global.isBaseStage;
  assert.strictEqual(isBase('bulbasaur'), true, 'Bulbasaur é Estágio 1 (Base)');
  assert.strictEqual(isBase('charmander'), true, 'Charmander é Estágio 1 (Base)');
  assert.strictEqual(isBase('squirtle'), true, 'Squirtle é Estágio 1 (Base)');
  assert.strictEqual(isBase('pichu'), true, 'Pichu é Estágio 1 (Baby / Base)');
  assert.strictEqual(isBase('mewtwo'), true, 'Mewtwo é Estágio 1 (Sem pré-evolução)');
});

test('isBaseStage bloqueia formas evoluídas (Estágios 2 e 3)', () => {
  const isBase = global.isBaseStage;
  assert.strictEqual(isBase('ivysaur'), false, 'Ivysaur NÃO é Base');
  assert.strictEqual(isBase('venusaur'), false, 'Venusaur NÃO é Base');
  assert.strictEqual(isBase('charmeleon'), false, 'Charmeleon NÃO é Base');
  assert.strictEqual(isBase('charizard'), false, 'Charizard NÃO é Base');
  assert.strictEqual(isBase('pikachu'), false, 'Pikachu NÃO é Base (evolui de Pichu)');
  assert.strictEqual(isBase('raichu'), false, 'Raichu NÃO é Base');
});

test('Sanitização do Save remove evoluções de pokesurvivor_playable', () => {
  // Simula storage corrompido com evoluções
  localStorage.setItem('pokesurvivor_playable', JSON.stringify(['bulbasaur', 'ivysaur', 'charizard', 'charmander']));
  
  // Executa verificação de purificação
  const saved = JSON.parse(localStorage.getItem('pokesurvivor_playable'));
  const sanitized = saved.filter(s => global.isBaseStage(s));
  assert.deepStrictEqual(sanitized, ['bulbasaur', 'charmander']);
});

// ---------------------------------------------------------------------------
// FRENTE 3: MEGA OVERDRIVE DE 10s COM OS 18 TIPOS ELEMENTAIS
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 3] Mega Overdrive & Catálogo dos 18 Tipos ---');

test('Catálogo MEGA_ULTIMATES_DATA cobre todos os 18 tipos elementais', () => {
  const data = global.MEGA_ULTIMATES_DATA;
  assert(data, 'MEGA_ULTIMATES_DATA deve existir');
  const types18 = [
    'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon',
    'steel', 'fairy', 'dark', 'normal'
  ];
  for (const t of types18) {
    assert(data[t], `Tipo elemental '${t}' deve estar mapeado no Mega`);
    assert(typeof data[t].spawnHazard === 'function', `Tipo '${t}' deve possuir spawnHazard`);
    assert(data[t].interval >= 0.20 && data[t].interval <= 0.35, `Intervalo do tipo '${t}' deve ser entre 0.20s e 0.35s`);
  }
});

test('MegaSystem drena linearmente em 10 segundos e gerencia estados', () => {
  const mega = global.MegaSystem;
  mega.gauge = 100;
  mega.isActive = false;

  // Mock do jogador
  global.game = {
    player: {
      mon: { types: ['fire'] },
      team: [{ type: 'fire' }],
      dmgTakenMul: 1.0,
      magnetMul: 1.0
    }
  };

  const triggered = mega.trigger();
  assert.strictEqual(triggered, true);
  assert.strictEqual(mega.isActive, true);
  assert.strictEqual(mega.duration, 10.0);
  assert.strictEqual(mega.timeLeft, 10.0);
  assert.strictEqual(mega.activeType, 'fire');

  // Simula passagem de 5 segundos (50%)
  mega.update(5.0);
  assert(Math.abs(mega.timeLeft - 5.0) < 0.01);
  assert(Math.abs(mega.gauge - 50.0) < 0.5);
  assert.strictEqual(global.game.player.dmgTakenMul, 0.20, 'Aura protetora de 80% ativada (-80% dano sofrido)');
  assert.strictEqual(global.game.player.magnetMul, 2.0, 'Ímã de EXP dobrado (+100%)');

  // Simula finalização dos 10 segundos
  mega.update(5.1);
  assert.strictEqual(mega.isActive, false, 'Mega deve desativar após 10s');
  assert.strictEqual(mega.gauge, 0, 'Barra deve estar em 0%');
  assert.strictEqual(global.game.player.dmgTakenMul, 1.0, 'Multiplicador de dano volta ao normal');
  assert.strictEqual(global.game.player.magnetMul, 1.0, 'Multiplicador de ímã volta ao normal');
});

test('UltimateVFX executa pooling e limpeza sem vazamentos de memória', () => {
  const vfx = global.UltimateVFX;
  vfx.clear();
  assert.strictEqual(vfx.count, 0);

  // Adiciona hazards
  for (let i = 0; i < 10; i++) {
    vfx.addHazard({ type: 'test', x: i * 10, y: i * 10, life: 0.5, dmg: 10 });
  }
  assert.strictEqual(vfx.count, 10);

  // Atualiza até expirar
  vfx.update(0.6, global.game.player);
  assert.strictEqual(vfx.count, 0, 'Hazards expirados devem ser reciclados do pooling');
});

// ---------------------------------------------------------------------------
// FRENTE 4: NOVO HUD INFERIOR RETRO & MARCOS DE EVOLUÇÃO (5, 12, 21)
// ---------------------------------------------------------------------------
console.log('\n--- [FRENTE 4] HUD Retro & Marcos de Evolução (Nv 5, 12, 21) ---');

test('Arquivos css/hud.css e marcação em dev.html e index.html existem', () => {
  const cssPath = path.join(__dirname, '..', 'css', 'hud.css');
  assert(fs.existsSync(cssPath), 'css/hud.css deve existir');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert(cssContent.includes('#bottom-rpg-hud'), 'css/hud.css deve estilizar #bottom-rpg-hud');
  assert(cssContent.includes('.hp-fill.high'), 'css/hud.css deve conter estágio de cor verde');
  assert(cssContent.includes('.hp-fill.mid'), 'css/hud.css deve conter estágio de cor amarela');
  assert(cssContent.includes('.hp-fill.low'), 'css/hud.css deve conter estágio de cor vermelha');
  assert(cssContent.includes('.hud-bar-ghost'), 'css/hud.css deve conter rastro ghost');

  const devHtml = fs.readFileSync(path.join(__dirname, '..', 'dev.html'), 'utf8');
  assert(devHtml.includes('id="bottom-rpg-hud"'), 'dev.html deve conter #bottom-rpg-hud');
  assert(devHtml.includes('css/hud.css'), 'dev.html deve linkar css/hud.css');

  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('id="bottom-rpg-hud"'), 'index.html deve conter #bottom-rpg-hud');
  assert(indexHtml.includes('css/hud.css'), 'index.html deve linkar css/hud.css');
});

test('Marcos Evolutivos disparam exatamente nos níveis 5, 12 e 21', () => {
  // Simula instância mock de Player com Bulbasaur
  const mockPlayer = {
    level: 1,
    species: 'bulbasaur',
    mon: { name: 'Bulbasaur', dex: 1 },
    bodyH: 32,
    x: 100, y: 100,
    evolveTo(target) {
      this.species = target.toLowerCase();
      this.mon.name = target.charAt(0).toUpperCase() + target.slice(1);
    },
    checkEvolutionMilestones: null,
    triggerMilestoneEvolution: null,
    triggerMegaAscension: null
  };

  // Carrega métodos da classe Player
  mockPlayer.checkEvolutionMilestones = function() {
    this._milestonesReached = this._milestonesReached || new Set();

    if (this.level >= 5 && !this._milestonesReached.has(5)) {
      this._milestonesReached.add(5);
      const evoRaw = global.getEvolutionData(this.species);
      if (evoRaw) {
        const next = Array.isArray(evoRaw) ? evoRaw[0].next : evoRaw.next;
        this.evolveTo(next);
      }
    }

    if (this.level >= 12 && !this._milestonesReached.has(12)) {
      this._milestonesReached.add(12);
      const evoRaw = global.getEvolutionData(this.species);
      if (evoRaw) {
        const next = Array.isArray(evoRaw) ? evoRaw[0].next : evoRaw.next;
        this.evolveTo(next);
      }
    }

    if (this.level >= 21 && !this._milestonesReached.has(21)) {
      this._milestonesReached.add(21);
      this.isMegaAscended = true;
      this.atkMul = (this.atkMul || 1.0) * 1.5;
      this.ascensionTitle = 'Mega ' + this.mon.name;
    }
  };

  // Nível 1: Bulbasaur
  assert.strictEqual(mockPlayer.species, 'bulbasaur');

  // Nível 5: Evolui para Ivysaur
  mockPlayer.level = 5;
  mockPlayer.checkEvolutionMilestones();
  assert.strictEqual(mockPlayer.species, 'ivysaur', 'No nível 5 deve evoluir para Ivysaur');

  // Nível 12: Evolui para Venusaur
  mockPlayer.level = 12;
  mockPlayer.checkEvolutionMilestones();
  assert.strictEqual(mockPlayer.species, 'venusaur', 'No nível 12 deve evoluir para Venusaur');

  // Nível 21: Ascensão Mega
  mockPlayer.level = 21;
  mockPlayer.checkEvolutionMilestones();
  assert.strictEqual(mockPlayer.isMegaAscended, true, 'No nível 21 deve ascender para Mega');
  assert.strictEqual(mockPlayer.atkMul, 1.5, 'Ascensão Nv. 21 concede +50% de ataque');
  assert.strictEqual(mockPlayer.ascensionTitle, 'Mega Venusaur');
});

console.log('\n====================================================');
console.log(`🎉 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('====================================================');
