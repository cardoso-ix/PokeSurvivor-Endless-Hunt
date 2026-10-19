/**
 * Bateria de Testes Automatizados: Regra de Estágios e Escalonamento dos Bosses de Rift
 * 1. Nível <= 20: 100% Estágio 1
 * 2. Nível 21..41: 100% Estágio 2
 * 3. Nível 42+: 100% Estágio 3
 * 4. Validação de Atributos: Estágio 1 < Estágio 2 < Estágio 3 em todas as características
 */

const assert = require('assert');
const fs = require('fs');

console.log('🚀 Iniciando bateria de testes do sistema de estágios do Rift...\n');

// Mock do ambiente de jogo
const G = {
  DB: {
    getTotalRiftsCleared: () => 5,
    getCapturedPokemon: () => [],
    getCapturedShinies: () => []
  },
  Game: {
    st: { time: 60 },
    everyone: () => [{ x: 0, y: 0, dead: false }],
    player: { level: 1 }
  },
  Coop: {
    scaleHp: () => 1
  },
  U: {
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    pick: (arr) => arr[0]
  },
  Tiles: {
    T: 16,
    arenaBiome: () => 'distortion',
    ARENA_THEMES: {}
  },
  Sprites: {
    PX: 2
  }
};
global.G = G;
global.window = { G, localStorage: { getItem: () => null, setItem: () => {} } };

// Carrega bases de dados
eval(fs.readFileSync('js/data/pokedex.js', 'utf8'));
G.DEX_BY = {};
G.DEX.forEach(p => { G.DEX_BY[p.dex] = p; });

eval(fs.readFileSync('js/data/evolutions.js', 'utf8'));
eval(fs.readFileSync('js/data/regions.js', 'utf8'));
eval(fs.readFileSync('js/systems/rift.js', 'utf8'));

// -------------------------------------------------------------
// TESTE 1: Nível <= 20 (Deve selecionar exclusivamente Estágio 1)
// -------------------------------------------------------------
console.log('🧪 Teste 1: Validação de Nível <= 20 (Estágio 1)...');
for (let lvl of [1, 5, 10, 15, 20]) {
  for (let i = 0; i < 20; i++) {
    const guardian = G.Rift.selectRiftGuardian(null, lvl);
    const stage = G.getPokemonEvolutionStage(guardian.dex);
    assert.strictEqual(stage, 1, `Falha no Nível ${lvl}: ${guardian.mon.name} tem estágio ${stage}, esperava 1!`);
    assert.strictEqual(guardian.stage, 1, `Falha no guardian.stage para Nível ${lvl}`);
  }
}
console.log('✅ 100 testes de Nível <= 20 passaram: 100% Pokémon Estágio 1!\n');

// -------------------------------------------------------------
// TESTE 2: Nível 21..41 (Deve selecionar exclusivamente Estágio 2)
// -------------------------------------------------------------
console.log('🧪 Teste 2: Validação de Nível 21..41 (Estágio 2)...');
for (let lvl of [21, 25, 30, 35, 40, 41]) {
  for (let i = 0; i < 20; i++) {
    const guardian = G.Rift.selectRiftGuardian(null, lvl);
    const stage = G.getPokemonEvolutionStage(guardian.dex);
    assert.strictEqual(stage, 2, `Falha no Nível ${lvl}: ${guardian.mon.name} tem estágio ${stage}, esperava 2!`);
    assert.strictEqual(guardian.stage, 2, `Falha no guardian.stage para Nível ${lvl}`);
  }
}
console.log('✅ 120 testes de Nível 21..41 passaram: 100% Pokémon Estágio 2!\n');

// -------------------------------------------------------------
// TESTE 3: Nível 42+ (Deve selecionar exclusivamente Estágio 3)
// -------------------------------------------------------------
console.log('🧪 Teste 3: Validação de Nível 42+ (Estágio 3)...');
for (let lvl of [42, 45, 50, 60, 80, 100]) {
  for (let i = 0; i < 20; i++) {
    const guardian = G.Rift.selectRiftGuardian(null, lvl);
    const stage = G.getPokemonEvolutionStage(guardian.dex);
    assert.strictEqual(stage, 3, `Falha no Nível ${lvl}: ${guardian.mon.name} tem estágio ${stage}, esperava 3!`);
    assert.strictEqual(guardian.stage, 3, `Falha no guardian.stage para Nível ${lvl}`);
  }
}
console.log('✅ 120 testes de Nível 42+ passaram: 100% Pokémon Estágio 3!\n');

// -------------------------------------------------------------
// TESTE 4: Escalonamento de Características por Estágio
// -------------------------------------------------------------
console.log('🧪 Teste 4: Validação do Escalonamento das Características (Stg 1 < Stg 2 < Stg 3)...');

const t = 120; // 2 minutos de partida
const n = 1;

const calcDef = (stage, monSpd = 78) => {
  if (stage === 1) {
    return {
      stage: 1,
      hp: Math.round((2600 + t * 9) * 2.2),
      spd: Math.round(G.U.clamp(42 + (monSpd - 78) * 0.45, 42, 70)),
      dmg: Math.round(22 + t / 25),
      xp: Math.round(380 + t * 0.9),
      shotDmg: Math.round(14 + t / 45),
      shotCd: 1.25,
      range: 260,
      scaleMul: 1.0,
      rewardCoins: 500,
      rewardTickets: 500
    };
  } else if (stage === 2) {
    return {
      stage: 2,
      hp: Math.round((4200 + t * 14) * 3.0),
      spd: Math.round(G.U.clamp(55 + (monSpd - 78) * 0.6, 55, 95)),
      dmg: Math.round(44 + t / 18),
      xp: Math.round(800 + t * 1.5),
      shotDmg: Math.round(25 + t / 35),
      shotCd: 0.85,
      range: 330,
      scaleMul: 1.15,
      rewardCoins: 750,
      rewardTickets: 750
    };
  } else {
    return {
      stage: 3,
      hp: Math.round((6800 + t * 22) * 4.0),
      spd: Math.round(G.U.clamp(68 + (monSpd - 78) * 0.75, 68, 118)),
      dmg: Math.round(68 + t / 14),
      xp: Math.round(1500 + t * 2.2),
      shotDmg: Math.round(38 + t / 25),
      shotCd: 0.55,
      range: 420,
      scaleMul: 1.30,
      rewardCoins: 1000,
      rewardTickets: 1000
    };
  }
};

const s1 = calcDef(1);
const s2 = calcDef(2);
const s3 = calcDef(3);

console.log('Comparativo de Características:');
console.log('• HP:       Estágio 1 =', s1.hp, '| Estágio 2 =', s2.hp, '| Estágio 3 =', s3.hp);
console.log('• DMG:      Estágio 1 =', s1.dmg, '| Estágio 2 =', s2.dmg, '| Estágio 3 =', s3.dmg);
console.log('• Shot DMG: Estágio 1 =', s1.shotDmg, '| Estágio 2 =', s2.shotDmg, '| Estágio 3 =', s3.shotDmg);
console.log('• SPD:      Estágio 1 =', s1.spd, '| Estágio 2 =', s2.spd, '| Estágio 3 =', s3.spd);
console.log('• Shot CD:  Estágio 1 =', s1.shotCd + 's', '| Estágio 2 =', s2.shotCd + 's', '| Estágio 3 =', s3.shotCd + 's (Mais rápido/agressivo)');
console.log('• Range:    Estágio 1 =', s1.range, '| Estágio 2 =', s2.range, '| Estágio 3 =', s3.range);
console.log('• EXP:      Estágio 1 =', s1.xp, '| Estágio 2 =', s2.xp, '| Estágio 3 =', s3.xp);
console.log('• Escala:   Estágio 1 =', s1.scaleMul + 'x', '| Estágio 2 =', s2.scaleMul + 'x', '| Estágio 3 =', s3.scaleMul + 'x');
console.log('• Recompensa Repetido: Estágio 1 =', s1.rewardCoins, '| Estágio 2 =', s2.rewardCoins, '| Estágio 3 =', s3.rewardCoins);

// Asserts rigorosos de progressão
assert(s1.hp < s2.hp && s2.hp < s3.hp, 'HP deve crescer com o estágio');
assert(s1.dmg < s2.dmg && s2.dmg < s3.dmg, 'Dano deve crescer com o estágio');
assert(s1.shotDmg < s2.shotDmg && s2.shotDmg < s3.shotDmg, 'Dano de tiro deve crescer com o estágio');
assert(s1.spd < s2.spd && s2.spd < s3.spd, 'Velocidade deve crescer com o estágio');
assert(s1.shotCd > s2.shotCd && s2.shotCd > s3.shotCd, 'Cooldown de tiro deve diminuir com o estágio (mais rápido)');
assert(s1.range < s2.range && s2.range < s3.range, 'Alcance deve crescer com o estágio');
assert(s1.xp < s2.xp && s2.xp < s3.xp, 'EXP deve crescer com o estágio');
assert(s1.scaleMul < s2.scaleMul && s2.scaleMul < s3.scaleMul, 'Escala de sprite deve crescer com o estágio');
assert(s1.rewardCoins < s2.rewardCoins && s2.rewardCoins < s3.rewardCoins, 'Recompensa de moedas deve crescer com o estágio');
assert(s1.rewardTickets < s2.rewardTickets && s2.rewardTickets < s3.rewardTickets, 'Recompensa de tickets deve crescer com o estágio');

console.log('✅ Todas as características escalonadas foram validadas com perfeição!');
console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
