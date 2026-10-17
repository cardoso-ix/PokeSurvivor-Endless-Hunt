const assert = require('assert');
const fs = require('fs');

console.log('========================================================');
console.log('🔬 AUDITORIA TOTAL DE ESTÁGIOS DA POKÉDEX (966 ESPÉCIES)');
console.log('========================================================\n');

// Mock do ambiente de jogo
const G = {};
global.G = G;
global.window = { G };

// Carrega pokedex e evolutions
eval(fs.readFileSync('js/data/pokedex.js', 'utf8'));
eval(fs.readFileSync('js/data/evolutions.js', 'utf8'));

assert(Array.isArray(G.DEX), 'G.DEX deve existir');
assert.strictEqual(G.DEX.length, 966, 'Deve haver 966 Pokémon na Pokédex');

console.log('1. Varredura Universal de Estágios em 966 Pokémon:');
let baseCount = 0;
let stage2Count = 0;
let stage3Count = 0;

for (const p of G.DEX) {
  const isBase = G.isBaseStage(p.dex);
  const stage = G.getPokemonEvolutionStage(p.dex);
  const eligible = G.isEligibleToStartRun(p.dex);

  assert(stage >= 1 && stage <= 3, `Estágio inválido para ${p.name}: ${stage}`);

  if (isBase) {
    baseCount++;
    assert.strictEqual(stage, 1, `${p.name} é Base mas seu estágio é ${stage}`);
    assert.strictEqual(eligible, true, `${p.name} é Base mas não está elegível para iniciar`);
  } else {
    assert(stage > 1, `${p.name} não é Base mas tem estágio ${stage}`);
    assert.strictEqual(eligible, false, `${p.name} é Evolução mas foi marcado como elegível`);
    if (stage === 2) stage2Count++;
    else if (stage === 3) stage3Count++;
  }

  // Verifica consistência de busca por nome
  const isBaseName = G.isBaseStage(p.name);
  assert.strictEqual(isBase, isBaseName, `Discrepância por dex vs nome para ${p.name}`);
}

console.log(`  ✅ [PASSOU] 966/966 Pokémon auditados e validados com 100% de consistência`);
console.log(`  📊 Estágio 1 (Base - Liberados): ${baseCount}`);
console.log(`  📊 Estágio 2 (Intermediários - Bloqueados): ${stage2Count}`);
console.log(`  📊 Estágio 3 (Finais - Bloqueados): ${stage3Count}`);
console.log(`  🔒 Total de Formas Bloqueadas para início: ${stage2Count + stage3Count}`);

assert.strictEqual(baseCount, 507, 'Deve haver exatamente 507 formas base na Pokédex');
assert.strictEqual(stage2Count, 341, 'Deve haver exatamente 341 formas de estágio 2');
assert.strictEqual(stage3Count, 118, 'Deve haver exatamente 118 formas de estágio 3');
assert.strictEqual(baseCount + stage2Count + stage3Count, 966, 'Soma total deve ser 966');

console.log('\n2. Teste de Linhagens Emblemáticas & Ancestrais Raiz:');
const lineages = [
  { ev: 'charizard', stage: 3, root: 'charmander', rootDex: 4 },
  { ev: 'charmeleon', stage: 2, root: 'charmander', rootDex: 4 },
  { ev: 'charmander', stage: 1, root: 'charmander', rootDex: 4 },
  { ev: 'raichu', stage: 3, root: 'pichu', rootDex: 172 },
  { ev: 'pikachu', stage: 2, root: 'pichu', rootDex: 172 },
  { ev: 'pichu', stage: 1, root: 'pichu', rootDex: 172 },
  { ev: 'gyarados', stage: 2, root: 'magikarp', rootDex: 129 },
  { ev: 'magikarp', stage: 1, root: 'magikarp', rootDex: 129 },
  { ev: 'gengar', stage: 3, root: 'gastly', rootDex: 92 },
  { ev: 'haunter', stage: 2, root: 'gastly', rootDex: 92 },
  { ev: 'gastly', stage: 1, root: 'gastly', rootDex: 92 },
  { ev: 'lucario', stage: 2, root: 'riolu', rootDex: 447 },
  { ev: 'riolu', stage: 1, root: 'riolu', rootDex: 447 },
  { ev: 'solgaleo', stage: 3, root: 'cosmog', rootDex: 789 },
  { ev: 'cosmoem', stage: 2, root: 'cosmog', rootDex: 789 },
  { ev: 'cosmog', stage: 1, root: 'cosmog', rootDex: 789 },
  { ev: 'urshifu', stage: 2, root: 'kubfu', rootDex: 891 },
  { ev: 'kubfu', stage: 1, root: 'kubfu', rootDex: 891 },
  { ev: 'dragapult', stage: 3, root: 'dreepy', rootDex: 885 },
  { ev: 'meowscarada', stage: 3, root: 'sprigatito', rootDex: 906 },
  { ev: 'mewtwo', stage: 1, root: 'mewtwo', rootDex: 150 }
];

for (const t of lineages) {
  const stg = G.getPokemonEvolutionStage(t.ev);
  const base = G.isBaseStage(t.ev);
  const root = G.getBaseAncestor(t.ev);
  const rootNum = G.getBaseAncestor(G.POKEMON_NAME_TO_DEX[t.ev]);

  assert.strictEqual(stg, t.stage, `Estágio incorreto para ${t.ev}: obtido ${stg}, esperado ${t.stage}`);
  assert.strictEqual(base, t.stage === 1, `Status de base incorreto para ${t.ev}`);
  assert.strictEqual(root, t.root, `Ancestral raiz incorreto para ${t.ev}: obtido ${root}, esperado ${t.root}`);
  assert.strictEqual(rootNum, t.rootDex, `Ancestral raiz numérico incorreto para ${t.ev}`);
}
console.log('  ✅ [PASSOU] Todas as 21 linhagens evolutivas verificadas com precisão absoluta');

console.log('\n3. Teste de Bloqueio em DB e Sanitização de Save:');
// Mock de localStorage
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};

// Injeta evoluções propositalmente no localStorage
storage['pokesurvivor_playable'] = JSON.stringify([
  'bulbasaur', 'ivysaur', 'venusaur',
  'charmander', 'charmeleon', 'charizard',
  'pichu', 'pikachu', 'raichu',
  'magikarp', 'gyarados',
  'cosmog', 'solgaleo', 'lunala'
]);

global.matchMedia = () => ({ matches: false });
global.window.matchMedia = global.matchMedia;

eval(fs.readFileSync('js/core/util.js', 'utf8'));
eval(fs.readFileSync('js/core/settings.js', 'utf8'));
eval(fs.readFileSync('js/core/db.js', 'utf8'));

const playable = G.DB.getUnlockedPlayable();
console.log(`  Lista de jogáveis sanitizada (esperado: apenas formas base):`, playable);

for (const name of playable) {
  assert.strictEqual(G.isBaseStage(name), true, `${name} está na lista de jogáveis mas NÃO é Estágio 1!`);
}
assert(!playable.includes('ivysaur'), 'Ivysaur deve ter sido expurgado');
assert(!playable.includes('venusaur'), 'Venusaur deve ter sido expurgado');
assert(!playable.includes('charizard'), 'Charizard deve ter sido expurgado');
assert(!playable.includes('raichu'), 'Raichu deve ter sido expurgado');
assert(!playable.includes('gyarados'), 'Gyarados deve ter sido expurgado');
assert(!playable.includes('solgaleo'), 'Solgaleo deve ter sido expurgado');

console.log('  ✅ [PASSOU] Formas de Estágio 2 e 3 foram 100% expurgadas da lista de jogáveis');

// Tenta desbloquear uma forma evoluída diretamente
const tryCharizard = G.DB.unlockPlayable('charizard');
assert.strictEqual(tryCharizard, false, 'unlockPlayable para Charizard deveria ter retornado false');
assert(!G.DB.getUnlockedPlayable().includes('charizard'), 'Charizard não pode entrar nos jogáveis');

const tryGyarados = G.DB.unlockPlayable('gyarados');
assert.strictEqual(tryGyarados, false, 'unlockPlayable para Gyarados deveria ter retornado false');

const tryCharmander = G.DB.unlockPlayable('charmander');
assert.strictEqual(tryCharmander, true, 'unlockPlayable para Charmander deve retornar true');

console.log('  ✅ [PASSOU] unlockPlayable rejeita estritamente qualquer tentativa de adicionar Estágio 2/3');

console.log('\n========================================================');
console.log('🎉 AUDITORIA CONCLUÍDA: 100% DAS REGRAS APROVADAS COM SUCESSO!');
console.log('========================================================');
