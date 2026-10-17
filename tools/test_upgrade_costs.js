global.window = global;
global.G = {};
require('../js/data/pokedex.js');
require('../js/data/evolutions.js');
require('../js/data/upgrades.js');

console.log('--- TESTE DE ESTÁGIO EVOLUTIVO ---');
const stageTests = [
  { id: 'charmander', expected: 1, desc: 'Charmander (Base)' },
  { id: 'charmeleon', expected: 2, desc: 'Charmeleon (Intermediário)' },
  { id: 'charizard',  expected: 3, desc: 'Charizard (Final)' },
  { id: 'bulbasaur',  expected: 1, desc: 'Bulbasaur (Base)' },
  { id: 'ivysaur',    expected: 2, desc: 'Ivysaur (Intermediário)' },
  { id: 'venusaur',   expected: 3, desc: 'Venusaur (Final)' },
  { id: 'squirtle',   expected: 1, desc: 'Squirtle (Base)' },
  { id: 'wartortle',  expected: 2, desc: 'Wartortle (Intermediário)' },
  { id: 'blastoise',  expected: 3, desc: 'Blastoise (Final)' },
  { id: 'tauros',     expected: 1, desc: 'Tauros (Estágio Único)' },
  { id: 'lapras',     expected: 1, desc: 'Lapras (Estágio Único)' },
  { id: 'mewtwo',     expected: 3, desc: 'Mewtwo (Lendário)' },
  { id: 'rayquaza',   expected: 3, desc: 'Rayquaza (Lendário)' },
  { id: 'magikarp',   expected: 1, desc: 'Magikarp (Base)' },
  { id: 'gyarados',   expected: 2, desc: 'Gyarados (1ª Evolução)' },
  { id: 4,            expected: 1, desc: 'Dex 4 - Charmander (Base)' },
  { id: 5,            expected: 2, desc: 'Dex 5 - Charmeleon (Intermediário)' },
  { id: 6,            expected: 3, desc: 'Dex 6 - Charizard (Final)' }
];

let allPassed = true;
for (const t of stageTests) {
  const stage = G.getPokemonEvolutionStage(t.id);
  const ok = stage === t.expected;
  if (!ok) allPassed = false;
  console.log((ok ? '✅ PASS' : '❌ FAIL') + ': ' + t.desc + ' -> Estágio: ' + stage + ' (Esperado: ' + t.expected + ')');
}

console.log('\n--- TESTE DE CUSTO ESCALONADO DE OURO ---');
for (const lvl of [0, 1, 2, 5]) {
  const c1 = window.getUpgradeCost('charmander', lvl);
  const c2 = window.getUpgradeCost('charmeleon', lvl);
  const c3 = window.getUpgradeCost('charizard', lvl);

  const ratio2 = c2 / c1;
  const ratio3 = c3 / c1;
  const okRatio = (ratio2 === 2) && (ratio3 === 3);
  if (!okRatio) allPassed = false;

  console.log((okRatio ? '✅ PASS' : '❌ FAIL') + ` [Nível ${lvl}] Charmander: ${c1}g | Charmeleon: ${c2}g (${ratio2}x) | Charizard: ${c3}g (${ratio3}x)`);
}

console.log('\n--- SAÍDA DO DEBUG HELPER window.debugTestUpgradeCosts(1) ---');
window.debugTestUpgradeCosts(1);

if (!allPassed) {
  console.error('\n❌ Falha em alguns testes!');
  process.exit(1);
} else {
  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
}
