/**
 * test_combat_and_iframes.js
 * Teste Automatizado de Verificação:
 * 1. Multiplicadores Aditivos vs. Multiplicativos de Dano
 * 2. Sistema de I-Frames Justo & Proteção Anti-One-Shot
 * 3. Otimizações de Alcance e Limpeza de Status Duplicados
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Iniciando Teste de Combate, I-Frames e Multiplicadores...\n');

// Mock global do ambiente
global.window = global;
global.BalanceConfig = require('../js/config/balanceConfig.js');
global.POKEDEX = {
  pikachu: { dex: 25, name: 'Pikachu', hp: 100, atk: 50, spd: 100, types: ['electric'] }
};
global.G = {
  Sprites: {
    hasShiny: () => false,
    bodyRadius: () => 14,
    bodyHeight: () => 20,
    Animator: class { update() {} play() {} loop() {} busy() { return false; } }
  },
  BalanceConfig: global.BalanceConfig,
  Types: {
    mult: () => 1.0,
    label: () => 'normal'
  },
  Weather: {
    mult: () => 1.0,
    getAtkMul: () => 1.0,
    getSpdMul: () => 1.0,
    getDodgeChance: () => 0.0
  },
  FX: {
    dmgText: () => {},
    burst: () => {},
    ring: () => {},
    spark: () => {},
    slash: () => {},
    beam: () => {}
  },
  Audio: {
    sfx: () => {}
  },
  Camera: {
    kick: () => {}
  },
  Projectiles: {
    clearOrbs: () => {}
  },
  World: {
    collide: () => {},
    isLiquid: () => false,
    liquidEffect: () => ({})
  }
};

require('../js/entities/player.js');

const player = new G.Player('pikachu');

// -------------------------------------------------------------
// 1. TESTE DE MULTIPLICADORES ADITIVOS VS. MULTIPLICATIVOS
// -------------------------------------------------------------
console.log('--- 1. Multiplicadores Aditivos de Dano ---');
const baseAtkDmg = player.baseAtk;
assert(baseAtkDmg > 0, 'Dano base deve ser maior que zero');

// Aplica 3 bônus de 10% (estilo cartas de Potência)
player.addAtkBonus(0.10);
player.addAtkBonus(0.10);
player.addAtkBonus(0.10);

// Em sistema aditivo puro: 1 + 0.10 + 0.10 + 0.10 = 1.30 (e NÃO 1.10^3 = 1.331)
const expectedAdditive = Math.round(baseAtkDmg * 1.30 * 100) / 100;
const actualAtk = Math.round(player.atk * 100) / 100;
assert.strictEqual(actualAtk, expectedAdditive, `Dano com 3 cartas de 10% deve ser 1.30x aditivo (${expectedAdditive}), obtido: ${actualAtk}`);
console.log(`✅ Multiplicador aditivo comprovado: 3 cartas de +10% resultaram em exatamente +30% (${actualAtk} de dano).`);

// Testa multiplicador independente (More Damage)
player.addAtkBonus(0.50, true); // +50% multiplicativo independente (ex: Forma Ápice)
const expectedIndependent = Math.round(baseAtkDmg * 1.30 * 1.50 * 100) / 100;
const actualWithIndep = Math.round(player.atk * 100) / 100;
assert.strictEqual(actualWithIndep, expectedIndependent, `Multiplicador independente deve multiplicar o total aditivo: esperado ${expectedIndependent}, obtido: ${actualWithIndep}`);
console.log(`✅ Multiplicador independente comprovado: (Base * 1.30) * 1.50 = ${actualWithIndep}.`);

// -------------------------------------------------------------
// 2. TESTE DE I-FRAMES E PROTEÇÃO ANTI-ONE-SHOT
// -------------------------------------------------------------
console.log('\n--- 2. I-Frames Justos & Mitigação Anti-One-Shot ---');
player.hp = 100;
player.maxHp = 100;
player.invuln = 0;

// Golpe normal de 20 de dano
player.hurt(20);
assert.strictEqual(player.hp, 80, 'HP deve cair de 100 para 80');
assert(player.invuln >= 0.65, `I-Frames devem ser de no mínimo 0.65s, obtido: ${player.invuln}`);
console.log(`✅ I-Frames base ativados: ${player.invuln}s de invulnerabilidade após o golpe.`);

// Golpe simultâneo no mesmo frame (outro inimigo tentando bater durante o i-frame)
player.hurt(30);
assert.strictEqual(player.hp, 80, 'Golpe durante i-frame NÃO deve causar dano');
console.log('✅ Proteção de i-frame confirmada: dano subsequente foi 100% prevenido.');

// Testa i-frames estendidos quando em estado crítico (< 30% HP)
player.invuln = 0;
player.hp = 25; // 25% de vida
player.hurt(5);
assert(player.invuln >= 0.80, `I-Frames em estado crítico devem ser de no mínimo 0.80s, obtido: ${player.invuln}`);
console.log(`✅ I-Frames estendidos em perigo crítico (< 30% HP): ${player.invuln}s concedidos.`);

// Testa mitigação anti-one-shot de monstro comum
player.invuln = 0;
player.hp = 100;
player.maxHp = 100;
// Monstro comum tenta causar 90 de dano de uma vez (90% do maxHp)
player.hurt(90);
// Deve ser mitigado para no máximo 35% do maxHp (dano max = 35)
assert(player.hp >= 65, `Anti-One-Shot deve limitar dano de monstro comum a no máx 35% (HP restante deve ser >= 65), obtido: ${player.hp}`);
console.log(`✅ Anti-One-Shot ativado: dano massivo de 90 atenuado com sucesso para ${100 - player.hp} PV.`);

// -------------------------------------------------------------
// 3. LIMPEZA DE CÓDIGO MORTO & VARS DUPLICADAS
// -------------------------------------------------------------
console.log('\n--- 3. Verificação de Código Morto e Limpeza ---');
assert.strictEqual(player.damageBonus, undefined, 'damageBonus morto não deve existir no player');
console.log('✅ Propriedade morta damageBonus removida com sucesso.');

console.log('\n🎉 TODOS OS TESTES DE COMBATE E I-FRAMES PASSARAM COM 100% DE SUCESSO!\n');
