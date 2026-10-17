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

console.log('--- TESTE DE DESBLOQUEIO RETROATIVO DA LINHAGEM ---');

// 1. Testes de getBaseAncestor
const ancestorTests = [
  { input: 'charizard', expected: 'charmander', desc: 'Charizard -> Charmander' },
  { input: 'charmeleon', expected: 'charmander', desc: 'Charmeleon -> Charmander' },
  { input: 'charmander', expected: 'charmander', desc: 'Charmander (Base) -> Charmander' },
  { input: 'gyarados', expected: 'magikarp', desc: 'Gyarados -> Magikarp' },
  { input: 'magikarp', expected: 'magikarp', desc: 'Magikarp (Base) -> Magikarp' },
  { input: 'raichu', expected: 'pichu', desc: 'Raichu -> Pichu' },
  { input: 'pikachu', expected: 'pichu', desc: 'Pikachu -> Pichu' },
  { input: 'gengar', expected: 'gastly', desc: 'Gengar -> Gastly' },
  { input: 'haunter', expected: 'gastly', desc: 'Haunter -> Gastly' },
  { input: 'venusaur', expected: 'bulbasaur', desc: 'Venusaur -> Bulbasaur' },
  { input: 'blastoise', expected: 'squirtle', desc: 'Blastoise -> Squirtle' },
  { input: 'tauros', expected: 'tauros', desc: 'Tauros (Estágio Único) -> Tauros' },
  { input: 'lapras', expected: 'lapras', desc: 'Lapras (Estágio Único) -> Lapras' },
  { input: 6, expected: 4, desc: 'Dex 6 (Charizard) -> Dex 4 (Charmander)' },
  { input: 130, expected: 129, desc: 'Dex 130 (Gyarados) -> Dex 129 (Magikarp)' }
];

let allPassed = true;
for (const t of ancestorTests) {
  const res = G.getBaseAncestor(t.input);
  const ok = res === t.expected;
  if (!ok) allPassed = false;
  console.log((ok ? '✅ PASS' : '❌ FAIL') + ': ' + t.desc + ' -> Retornou: ' + res + ' (Esperado: ' + t.expected + ')');
}

(async () => {
  // Inicializa save do convidado
  if (typeof G.DB.playAsGuest === 'function') {
    await G.DB.playAsGuest();
  }

  // Limpa lista de owned para o teste
  G.DB.save.owned = {};
  G.DB.save.playableStarters = [];

  console.log('\n--- TESTE DE unlockPokemon COM REGISTRO DUPLO E LINHAGEM ---');

  // Teste 1: Captura de Gyarados deve registrar Gyarados e liberar Magikarp
  console.log('\n[Cenário 1] Capturando Gyarados...');
  const resGya = G.DB.unlockPokemon('gyarados');
  console.log('Resultado do unlock:', resGya);

  const playableAfterGya = G.DB.getUnlockedPlayable();
  console.log('Pokémon liberados para jogar:', playableAfterGya);

  if (!G.DB.save.owned[130]) {
    console.error('❌ Gyarados (130) não foi registrado em save.owned!');
    allPassed = false;
  }
  if (!G.DB.save.owned[129]) {
    console.error('❌ Magikarp (129) não foi liberado em save.owned!');
    allPassed = false;
  }
  if (!playableAfterGya.includes('magikarp')) {
    console.error('❌ Magikarp não está presente em getUnlockedPlayable()!');
    allPassed = false;
  }
  if (playableAfterGya.includes('gyarados')) {
    console.error('❌ Gyarados NÃO deveria ser jogável como starter!');
    allPassed = false;
  } else {
    console.log('✅ Gyarados está bloqueado para starter (apenas Magikarp liberado)!');
  }

  // Teste 2: debugTestReverseUnlock com Charizard
  console.log('\n[Cenário 2] Executando window.debugTestReverseUnlock("charizard")...');
  window.debugTestReverseUnlock('charizard');

  const playableAfterChar = G.DB.getUnlockedPlayable();
  if (!playableAfterChar.includes('charmander')) {
    console.error('❌ Charmander não foi liberado ao capturar Charizard!');
    allPassed = false;
  } else {
    console.log('✅ Charmander está disponível para iniciar novas partidas!');
  }

  // Teste 3: debugTestReverseUnlock com Raichu
  console.log('\n[Cenário 3] Executando window.debugTestReverseUnlock("raichu")...');
  window.debugTestReverseUnlock('raichu');

  const playableAfterRai = G.DB.getUnlockedPlayable();
  if (!playableAfterRai.includes('pichu')) {
    console.error('❌ Pichu não foi liberado ao capturar Raichu!');
    allPassed = false;
  } else {
    console.log('✅ Pichu está disponível para iniciar novas partidas!');
  }

  if (!allPassed) {
    console.error('\n❌ Falha em alguns testes!');
    process.exit(1);
  } else {
    console.log('\n🎉 TODOS OS TESTES DE DESBLOQUEIO RETROATIVO PASSARAM COM 100% DE SUCESSO!');
  }
})();
