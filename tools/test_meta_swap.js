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

// Mock dos sprites e animators para Player rodar em Node.js
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

console.log('--- TESTE DE META-UPGRADE SWAP POR ESTÁGIO ---');

(async () => {
  if (typeof G.DB.playAsGuest === 'function') {
    await G.DB.playAsGuest();
  }
  G.DB.save.pupg = {
    4: { atk: 8, hp: 5 },
    5: { atk: 3, hp: 2 },
    6: { atk: 0, hp: 0 }
  };

const charmanderUpgrades = G.DB.getSpeciesUpgrades(4);
const charmeleonUpgrades = G.DB.getSpeciesUpgrades('charmeleon');
const charizardUpgrades = G.DB.getSpeciesUpgrades('charizard');

console.log('Charmander Meta Atk Bonus:', charmanderUpgrades.atkBonus, '(Esperado: 0.32)');
console.log('Charmeleon Meta Atk Bonus:', charmeleonUpgrades.atkBonus, '(Esperado: 0.12)');
console.log('Charizard  Meta Atk Bonus:', charizardUpgrades.atkBonus, '(Esperado: 0)');

const near = (x, y) => Math.abs(x - y) < 1e-9;
if (!near(charmanderUpgrades.atkBonus, 0.32) || !near(charmeleonUpgrades.atkBonus, 0.12) || !near(charizardUpgrades.atkBonus, 0)) {
  console.error('❌ Erro na leitura de upgrades por espécie em db.js!');
  process.exit(1);
}

// 1. Iniciar run com Charmander
const charmanderMon = G.DEX_BY[4];
const player = new G.Player(charmanderMon, charmanderUpgrades.perks);
window.player = player;

console.log('\n[1] Player iniciado com Charmander:');
console.log('Dex:', player.pokemonId);
console.log('HP Máx:', player.maxHp);
console.log('Meta Atk Bonus:', player.permanentMetaStats.atkBonus);
console.log('Dano Total Base:', player.stats.attack);

const atkInicial = player.stats.attack;

// 2. Aplicar cartas in-run da partida
console.log('\n[2] Aplicando cartas da partida (Potência x1.10 e Vigor +20 HP)...');
player.atkMul *= 1.10;
player.addMaxHp(20);

console.log('Dano com Carta (+10%):', player.stats.attack);
console.log('HP Máx com Carta (+20):', player.maxHp);

const expectedAtkWithCard = Math.round(atkInicial * 1.10 * 100) / 100;
if (Math.abs(player.stats.attack - expectedAtkWithCard) > 0.05) {
  console.error('❌ Erro: Carta de ataque in-run não modificou o ataque corretamente!');
  process.exit(1);
}

// Danificar um pouco o player para testar proporção de HP
player.hp = Math.round(player.maxHp * 0.5); // 50% de HP
const hpRatioBefore = player.hp / player.maxHp;

// 3. Evoluir para Charmeleon
console.log('\n[3] Evoluindo para Charmeleon...');
player.evolveTo('charmeleon');

console.log('Nova Espécie:', player.pokemonId, '(' + player.species + ')');
console.log('Meta Atk Bonus (Charmeleon):', player.permanentMetaStats.atkBonus);
console.log('Dano Total Recalculado:', player.stats.attack);
console.log('HP Proporcional:', player.hp, '/', player.maxHp, `(${(player.hp / player.maxHp * 100).toFixed(1)}%)`);

if (player.pokemonId !== 5) {
  console.error('❌ Erro: Não evoluiu para Charmeleon (dex 5)!');
  process.exit(1);
}
if (Math.abs(player.permanentMetaStats.atkBonus - 0.12) > 1e-9) {
  console.error('❌ Erro: Meta Atk Bonus não foi trocado para o de Charmeleon (0.12)!');
  process.exit(1);
}
// Verificar que o inRunModifiers.atkMul ainda é 1.10
if (Math.abs(player.inRunModifiers.atkMul - 1.10) > 0.001) {
  console.error('❌ Erro: O bônus in-run da partida foi perdido na evolução!');
  process.exit(1);
}
const hpRatioAfter = player.hp / player.maxHp;
if (Math.abs(hpRatioBefore - hpRatioAfter) > 0.05) {
  console.error('❌ Erro: A proporção de HP não foi preservada na evolução!');
  process.exit(1);
}

// 4. Evoluir para Charizard
console.log('\n[4] Evoluindo para Charizard...');
player.evolveTo('charizard');

console.log('Nova Espécie:', player.pokemonId, '(' + player.species + ')');
console.log('Meta Atk Bonus (Charizard):', player.permanentMetaStats.atkBonus);
console.log('Dano Total Recalculado:', player.stats.attack);

if (player.pokemonId !== 6) {
  console.error('❌ Erro: Não evoluiu para Charizard (dex 6)!');
  process.exit(1);
}
if (Math.abs(player.permanentMetaStats.atkBonus) > 1e-9) {
  console.error('❌ Erro: Meta Atk Bonus não foi trocado para o de Charizard (0)!');
  process.exit(1);
}
if (Math.abs(player.inRunModifiers.atkMul - 1.10) > 0.001) {
  console.error('❌ Erro: O bônus in-run da partida foi perdido ao evoluir para Charizard!');
  process.exit(1);
}

// 5. Devolução
console.log('\n[5] Testando Devolução para Charmeleon...');
player.devolve();
console.log('Espécie após devolve:', player.pokemonId, '(' + player.species + ')');
console.log('Meta Atk Bonus restaurado:', player.permanentMetaStats.atkBonus);
if (Math.abs(player.permanentMetaStats.atkBonus - 0.12) > 1e-9) {
  console.error('❌ Erro: Ao devolver, não restaurou o Meta Atk Bonus do Charmeleon (0.12)!');
  process.exit(1);
}

// 6. Testando window.debugTestMetaSwap()
console.log('\n[6] Testando window.debugTestMetaSwap():');
// Resetar para Charmander
player.pokemonId = 4;
player.species = 'charmander';
player.basePokedexStats = { hp: 100, atk: 1.0, spd: 100, def: 0 };
player.permanentMetaStats = G.DB.getSpeciesUpgrades(4);
player.recalculateTotalStats();

window.debugTestMetaSwap();

console.log('\n🎉 TODOS OS TESTES DE META-SWAP PASSARAM COM 100% DE SUCESSO!');
})();
