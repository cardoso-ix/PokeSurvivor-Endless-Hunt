global.window = global;
global.G = {};
require('../js/data/pokedex.js');
require('../js/data/evolutions.js');

console.log('--- TESTE DE ELEGIBILIDADE ---');
const tests = [
  { id: 'charmander', expected: true, desc: 'Charmander (Base)' },
  { id: 'charmeleon', expected: false, desc: 'Charmeleon (Evolução Estágio 2)' },
  { id: 'charizard', expected: false, desc: 'Charizard (Evolução Estágio 3)' },
  { id: 'tauros', expected: true, desc: 'Tauros (Estágio Único)' },
  { id: 'lapras', expected: true, desc: 'Lapras (Estágio Único)' },
  { id: 'mewtwo', expected: true, desc: 'Mewtwo (Lendário)' },
  { id: 4, expected: true, desc: 'Dex 4 - Charmander (Base)' },
  { id: 5, expected: false, desc: 'Dex 5 - Charmeleon (Evolução)' },
  { id: 6, expected: false, desc: 'Dex 6 - Charizard (Evolução)' },
  { id: 150, expected: true, desc: 'Dex 150 - Mewtwo (Lendário)' },
  { id: 'gyarados', expected: false, desc: 'Gyarados (Evolução de Magikarp)' },
  { id: 'magikarp', expected: true, desc: 'Magikarp (Base)' },
  { id: 'gengar', expected: false, desc: 'Gengar (Evolução Estágio 3)' },
  { id: 'gastly', expected: true, desc: 'Gastly (Base)' },
  { id: 'rayquaza', expected: true, desc: 'Rayquaza (Lendário)' }
];

let allPassed = true;
for (const t of tests) {
  const res = G.isEligibleToStartRun(t.id);
  const ok = res === t.expected;
  if (!ok) allPassed = false;
  console.log((ok ? '✅ PASS' : '❌ FAIL') + ': ' + t.desc + ' -> Retornou: ' + res + ' (Esperado: ' + t.expected + ')');
}

console.log('\n--- TESTE DO DEBUG HELPER window.debugCheckStarter ---');
const debugRes1 = window.debugCheckStarter('charizard');
const debugRes2 = window.debugCheckStarter('charmander');
if (debugRes1 !== false || debugRes2 !== true) {
  allPassed = false;
  console.log('❌ FAIL: debugCheckStarter falhou');
} else {
  console.log('✅ PASS: debugCheckStarter funciona como esperado');
}

if (!allPassed) {
  console.error('\nFalha nos testes de elegibilidade!');
  process.exit(1);
} else {
  console.log('\nTodos os testes de elegibilidade passaram com sucesso!');
}
