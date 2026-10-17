global.window = global;
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); },
  removeItem: function(k) { delete this._store[k]; }
};

global.G = {};
require('../js/core/util.js');
require('../js/data/pokedex.js');
require('../js/data/evolutions.js');
require('../js/data/upgrades.js');
require('../js/core/db.js');

// Mock de sprites e efeitos visuais/sonoros para teste em Node.js
G.Sprites = {
  hasShiny: () => true,
  bodyRadius: () => 12,
  bodyHeight: () => 24,
  preload: () => {},
  Animator: class {
    constructor() {}
    loop() {}
    update() {}
    draw() {}
  }
};
G.Audio = { sfx: () => {}, music: () => {} };
G.Spawner = { say: () => {} };
G.FX = { dmgText: () => {} };

require('../js/entities/player.js');

console.log('===========================================================');
console.log('🧪 TESTE DE INTEGRAÇÃO: META-UPGRADES NO POKÉMON INICIAL');
console.log('===========================================================\n');

(async () => {
  // Inicializa banco de dados
  if (typeof G.DB.playAsGuest === 'function') {
    await G.DB.playAsGuest();
  }

  const charmanderMon = G.DEX_BY[4];
  if (!charmanderMon) {
    console.error('❌ Charmander (#4) não encontrado no DEX!');
    process.exit(1);
  }

  console.log(`[Informações Base da Espécie: ${charmanderMon.name}]`);
  console.log(`HP Base: ${charmanderMon.hp}`);
  console.log(`ATK Base: ${charmanderMon.atk}`);
  console.log(`DEF Base: ${charmanderMon.def || 0}`);
  console.log(`SPD Base: ${charmanderMon.spd}\n`);

  // --- CENÁRIO 1: Pokémon Inicial sem nenhum upgrade comprado ---
  console.log('--- CENÁRIO 1: Charmander SEM Upgrades (Nível 0) ---');
  G.DB.save.pupg = {};
  G.DB.save.upgrades = {};

  const bonusZero = G.DB.getSpeciesUpgradeBonus(4);
  console.log('Bônus calculados pelo DB:', bonusZero);
  if (bonusZero.hp !== 0 || bonusZero.atk !== 0 || bonusZero.def !== 0 || bonusZero.speed !== 0) {
    console.error('❌ Falha: Bônus de espécie sem upgrades deveria ser zero!');
    process.exit(1);
  }

  const playerZero = new G.Player(charmanderMon);
  console.log(`Status do Player (Zero Upgrades):`);
  console.log(`HP: ${playerZero.maxHp} / ${playerZero.hp}`);
  console.log(`Ataque: ${playerZero.attack}`);
  console.log(`Defesa: ${playerZero.defense}`);
  console.log(`Velocidade: ${playerZero.speed}\n`);

  if (playerZero.maxHp !== charmanderMon.hp) {
    console.error(`❌ Falha no HP Base! Esperado: ${charmanderMon.hp}, Obtido: ${playerZero.maxHp}`);
    process.exit(1);
  }
  if (playerZero.attack !== charmanderMon.atk) {
    console.error(`❌ Falha no Ataque Base! Esperado: ${charmanderMon.atk}, Obtido: ${playerZero.attack}`);
    process.exit(1);
  }
  if (playerZero.speed !== charmanderMon.spd) {
    console.error(`❌ Falha na Velocidade Base! Esperado: ${charmanderMon.spd}, Obtido: ${playerZero.speed}`);
    process.exit(1);
  }
  console.log('✅ Cenário 1 (Zero Upgrades) passou com perfeição!\n');

  // --- CENÁRIO 2: Pokémon Inicial com Upgrades no NÍVEL MÁXIMO ---
  console.log('--- CENÁRIO 2: Charmander COM Upgrades Máximos (HP 10, ATK 10, DEF 8, SPD 8) ---');
  G.DB.save.pupg[4] = {
    hp: 10,
    atk: 10,
    def: 8,
    spd: 8,
    cd: 8,
    regen: 5
  };

  const bonusMax = G.DB.getSpeciesUpgradeBonus(4);
  console.log('Bônus calculados pelo DB:', bonusMax);

  // Validações da matemática do DB:
  // HP: 10 * 8 = 80
  // ATK: 1.03 * (10 * 0.04) = 1.03 * 0.40 = 0.41
  // DEF: 8 * 0.02 = 0.16
  // SPD: 105 * (8 * 0.03) = 105 * 0.24 = 25.2
  if (bonusMax.hp !== 80) {
    console.error(`❌ Bônus de HP incorreto! Esperado: 80, Obtido: ${bonusMax.hp}`);
    process.exit(1);
  }
  if (Math.abs(bonusMax.atk - 0.41) > 0.01) {
    console.error(`❌ Bônus de ATK incorreto! Esperado: 0.41, Obtido: ${bonusMax.atk}`);
    process.exit(1);
  }
  if (Math.abs(bonusMax.def - 0.16) > 0.01) {
    console.error(`❌ Bônus de DEF incorreto! Esperado: 0.16, Obtido: ${bonusMax.def}`);
    process.exit(1);
  }
  if (Math.abs(bonusMax.speed - 25.2) > 0.1) {
    console.error(`❌ Bônus de SPD incorreto! Esperado: 25.2, Obtido: ${bonusMax.speed}`);
    process.exit(1);
  }
  console.log('✅ Bônus numéricos do banco de dados validados com precisão matemática!\n');

  // Instancia jogador simulando a entrada na partida
  console.log('Instanciando novo Player com upgrades máximos aplicados...');
  const playerMax = new G.Player(charmanderMon);
  global.player = playerMax;

  console.log(`Status do Player em Jogo:`);
  console.log(`HP Total: ${playerMax.maxHp} (Base: ${charmanderMon.hp} + Upgrade: ${bonusMax.hp})`);
  console.log(`Ataque Total: ${playerMax.attack} (Base: ${charmanderMon.atk} + Upgrade: ${bonusMax.atk})`);
  console.log(`Defesa Total: ${playerMax.defense} (Base: ${charmanderMon.def || 0} + Upgrade: ${bonusMax.def})`);
  console.log(`Velocidade Total: ${playerMax.speed} (Base: ${charmanderMon.spd} + Upgrade: ${bonusMax.speed})\n`);

  const expectedHp = charmanderMon.hp + bonusMax.hp;
  const expectedAtk = Number((charmanderMon.atk + bonusMax.atk).toFixed(2));
  const expectedDef = Number(((charmanderMon.def || 0) + bonusMax.def).toFixed(2));
  const expectedSpd = Number((charmanderMon.spd + bonusMax.speed).toFixed(1));

  if (playerMax.maxHp !== expectedHp) {
    console.error(`❌ Falha no HP Total! Esperado: ${expectedHp}, Obtido: ${playerMax.maxHp}`);
    process.exit(1);
  }
  if (playerMax.hp !== expectedHp) {
    console.error(`❌ Falha na barra de HP inicial! Esperado: ${expectedHp}, Obtido: ${playerMax.hp}`);
    process.exit(1);
  }
  if (Math.abs(playerMax.attack - expectedAtk) > 0.02) {
    console.error(`❌ Falha no Ataque Total! Esperado: ${expectedAtk}, Obtido: ${playerMax.attack}`);
    process.exit(1);
  }
  if (Math.abs(playerMax.defense - expectedDef) > 0.01) {
    console.error(`❌ Falha na Defesa Total! Esperado: ${expectedDef}, Obtido: ${playerMax.defense}`);
    process.exit(1);
  }
  if (Math.abs(playerMax.speed - expectedSpd) > 0.2) {
    console.error(`❌ Falha na Velocidade Total! Esperado: ${expectedSpd}, Obtido: ${playerMax.speed}`);
    process.exit(1);
  }
  console.log('✅ Cenário 2 (Upgrades Máximos) passou com perfeição!\n');

  // --- CENÁRIO 3: Validação da ferramenta de inspeção debugCheckStarterStats ---
  console.log('--- CENÁRIO 3: Inspeção via debugCheckStarterStats() ---');
  if (typeof global.debugCheckStarterStats !== 'function') {
    console.error('❌ debugCheckStarterStats não foi exposta globalmente!');
    process.exit(1);
  }

  const tableData = global.debugCheckStarterStats();
  console.log('Resultado retornado por debugCheckStarterStats():', tableData);

  if (!tableData || !tableData['HP'] || !tableData['Ataque'] || !tableData['Defesa'] || !tableData['Velocidade']) {
    console.error('❌ Estrutura inválida retornada por debugCheckStarterStats()!');
    process.exit(1);
  }

  if (tableData['HP']['Total Real'] !== expectedHp ||
      Math.abs(tableData['Ataque']['Total Real'] - expectedAtk) > 0.02 ||
      Math.abs(tableData['Defesa']['Total Real'] - expectedDef) > 0.01 ||
      Math.abs(tableData['Velocidade']['Total Real'] - expectedSpd) > 0.2) {
    console.error('❌ Inconsistência nos dados tabulados por debugCheckStarterStats()!');
    process.exit(1);
  }
  console.log('✅ debugCheckStarterStats validada com 100% de conformidade!\n');

  // --- CENÁRIO 4: Isolamento entre espécies (Squirtle não recebe upgrades do Charmander) ---
  console.log('--- CENÁRIO 4: Isolamento de Upgrades (Squirtle #7) ---');
  const squirtleMon = G.DEX_BY[7];
  const squirtleBonus = G.DB.getSpeciesUpgradeBonus(7);
  if (squirtleBonus.hp !== 0 || squirtleBonus.atk !== 0) {
    console.error('❌ Falha: Upgrades de Charmander vazaram para Squirtle!');
    process.exit(1);
  }
  const squirtlePlayer = new G.Player(squirtleMon);
  if (squirtlePlayer.maxHp !== squirtleMon.hp) {
    console.error('❌ Falha: HP do Squirtle foi afetado por Charmander!');
    process.exit(1);
  }
  console.log('✅ Isolamento entre espécies validado com sucesso!\n');

  console.log('===========================================================');
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  console.log('===========================================================');
})();
