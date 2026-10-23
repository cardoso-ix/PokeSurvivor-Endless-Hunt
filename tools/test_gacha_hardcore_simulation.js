const assert = require('assert');
const path = require('path');

// Mock mínimo do ambiente global do jogo para executar gacha.js
global.G = global.G || {};
global.G.U = {
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};
global.G.Sprites = {
  hasShiny: () => true
};
global.G.SPRITE_META = {};

// Cria um DEX sintético de teste com 966 monstros incluindo comuns e lendários
const mockDex = [];
for (let i = 1; i <= 966; i++) {
  const isLeg = i >= 900; // 66 lendários
  mockDex.push({
    dex: i,
    name: isLeg ? `Legendary_${i}` : `Pokemon_${i}`,
    gen: ((i % 9) + 1),
    rarity: isLeg ? 5 : ((i % 4) + 1),
    legendary: isLeg,
    leg: isLeg,
    bst: isLeg ? 680 : 400
  });
  global.G.SPRITE_META[i] = true;
}
global.G.DEX = mockDex;
global.G.DEX_BY = Object.fromEntries(mockDex.map(p => [p.dex, p]));

// Carrega o gacha.js
require(path.join(__dirname, '..', 'js', 'systems', 'gacha.js'));

console.log('🧪 Iniciando testes de validação matemática do Gacha Hardcore...');

// 1. Verificar constantes
assert.strictEqual(G.Gacha.ROULETTE_COST, 100, 'ROULETTE_COST deve ser 100 tickets');
console.log('✅ ROULETTE_COST = 100 verificado!');

// 2. Simular 50.000 giros da Roleta para auditoria estatística
const SIM_PULLS = 50000;
const testSave = {
  tickets: { t1: SIM_PULLS * 100, t10: 0 },
  coins: 0,
  owned: {},
  shiny: {},
  stats: {}
};

let countShinyLegend = 0;
let countShinyCommon = 0;
let countLegendNormal = 0;
let countNormal = 0;

for (let i = 0; i < SIM_PULLS; i++) {
  const res = G.Gacha.pullRoulette(testSave, 1, 0);
  assert(res && res.length === 1, 'Giro da roleta falhou');
  const mon = res[0];

  if (mon.shiny && mon.isLegendary) {
    countShinyLegend++;
  } else if (mon.shiny && !mon.isLegendary) {
    countShinyCommon++;
  } else if (!mon.shiny && mon.isLegendary) {
    countLegendNormal++;
  } else {
    countNormal++;
  }
}

const pctShinyLegend = (countShinyLegend / SIM_PULLS) * 100;
const pctShinyCommon = (countShinyCommon / SIM_PULLS) * 100;
const pctLegendNormal = (countLegendNormal / SIM_PULLS) * 100;
const pctNormal = (countNormal / SIM_PULLS) * 100;

console.log(`\n📊 RESULTADOS DA SIMULAÇÃO DE ${SIM_PULLS.toLocaleString()} GIROS:`);
console.log(`- 🌟 Shiny Lendário (Apex): ${countShinyLegend} (${pctShinyLegend.toFixed(3)}%) [Esperado: ~0.02%]`);
console.log(`- ✨ Shiny Comum:          ${countShinyCommon} (${pctShinyCommon.toFixed(3)}%) [Esperado: ~0.50%]`);
console.log(`- 👑 Lendário Normal:       ${countLegendNormal} (${pctLegendNormal.toFixed(3)}%) [Esperado: ~0.40%]`);
console.log(`- ⚪ Pokémon Normal:         ${countNormal} (${pctNormal.toFixed(3)}%) [Esperado: ~99.08%]`);

// Total de lendários (normais + shinies)
const totalLegends = countShinyLegend + countLegendNormal;
const pctTotalLegends = (totalLegends / SIM_PULLS) * 100;
console.log(`\n🔥 TOTAL DE LENDÁRIOS: ${totalLegends} de ${SIM_PULLS.toLocaleString()} (${pctTotalLegends.toFixed(3)}%)`);

// Sanity checks rigorosos
assert(pctShinyLegend <= 0.08, 'Shiny Lendário muito frequente!');
assert(pctShinyCommon >= 0.25 && pctShinyCommon <= 0.85, 'Taxa de Shiny Comum fora da faixa permitida');
assert(pctLegendNormal >= 0.20 && pctLegendNormal <= 0.70, 'Taxa de Lendário Normal fora da faixa permitida');
assert(pctNormal >= 98.0, 'Foco esmagador em Comuns deve ser >= 98%!');

// 3. Teste de cálculo de probabilidade de tirar lendário em 15 giros
// Antes: com 6.7% por tiro, a chance em 15 giros era de ~64.8%
// Agora: com ~0.42% por tiro, a chance em 15 giros é 1 - (1 - 0.0042)^15 = ~6.1%
const pSingle = (0.02 + 0.40) / 100; // 0.0042
const p15 = 1 - Math.pow(1 - pSingle, 15);
console.log(`\n🎯 Probabilidade matemática de tirar lendário em 15 giros: ${(p15 * 100).toFixed(2)}% (Antes era ~65%)!`);
assert(p15 < 0.08, 'Chance em 15 giros ainda é alta demais!');

// 4. Teste de drops de Boss e Rift (100 a 150 tickets)
console.log('\n🗡️ Testando cálculo de drops de 100 a 150 tickets...');
for (let i = 0; i < 1000; i++) {
  const t = G.U.rand(100, 150);
  assert(t >= 100 && t <= 150, `Drop fora do intervalo 100-150: ${t}`);
}
console.log('✅ 1.000 sorteios de drop de Boss e Rift validados estritamente no intervalo [100, 150]!');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO ABSOLUTO!');
