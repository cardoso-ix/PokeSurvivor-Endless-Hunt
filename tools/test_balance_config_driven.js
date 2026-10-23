/**
 * Teste Automatizado de Verificação:
 * Arquitetura Data-Driven via BalanceConfig
 */
const assert = require('assert');
const path = require('path');

console.log('🧪 Iniciando Teste de Arquitetura Data-Driven (BalanceConfig)...\n');

// 1. Carrega BalanceConfig
const BalanceConfig = require('../js/config/balanceConfig.js');
const BalanceConfigSrc = require('../src/config/balanceConfig.js');

const fs = require('fs');
assert(BalanceConfig, 'BalanceConfig deve ser carregado via js/config/balanceConfig.js');
assert.strictEqual(
  fs.readFileSync(path.resolve(__dirname, '../js/config/balanceConfig.js'), 'utf8'),
  fs.readFileSync(path.resolve(__dirname, '../src/config/balanceConfig.js'), 'utf8'),
  'src/config/balanceConfig.js deve ser idêntico a js/config/balanceConfig.js'
);
console.log('✅ BalanceConfig carregado e validado em ambos os caminhos de importação.');

// 2. Valida Seções Vitais do BalanceConfig
assert(BalanceConfig.player, 'Deve conter seção player');
assert(BalanceConfig.xp, 'Deve conter seção xp');
assert(BalanceConfig.spawner, 'Deve conter seção spawner');
assert(BalanceConfig.enemies, 'Deve conter seção enemies');
assert(BalanceConfig.upgrades, 'Deve conter seção upgrades');
assert(BalanceConfig.rewards, 'Deve conter seção rewards');
console.log('✅ Todas as 6 seções centrais de balanceamento estão presentes no BalanceConfig.');

// 3. Validação dos valores de Ascensão e Upgrades
assert.strictEqual(BalanceConfig.upgrades.ascension.costs.length, 10, 'Ascensão deve ter exatamente 10 níveis');
assert.strictEqual(BalanceConfig.upgrades.ascension.totalCost, 5520000, 'Custo acumulado da Ascensão deve ser 5.520.000 moedas');
const sumCosts = BalanceConfig.upgrades.ascension.costs.reduce((a, b) => a + b, 0);
assert.strictEqual(sumCosts, 5520000, 'A soma do array costs deve bater exatamente 5.520.000');
console.log('✅ Tabela de Ascensão: 10 níveis e soma exata de 5.520.000 moedas validada.');

// 4. Validação da Curva de XP
const xpLv1 = BalanceConfig.xp.forLevel(1);
const xpLv10 = BalanceConfig.xp.forLevel(10);
const xpLv20 = BalanceConfig.xp.forLevel(20);
assert.strictEqual(xpLv1, 62, `XP Nível 1 esperado: 62, obtido: ${xpLv1}`);
assert.strictEqual(xpLv10, 631, `XP Nível 10 esperado: 631, obtido: ${xpLv10}`);
assert.strictEqual(xpLv20, 1722, `XP Nível 20 esperado: 1722, obtido: ${xpLv20}`);
console.log('✅ Curva de XP: Nível 1 (62), Nível 10 (631), Nível 20 (1722) validados com precisão.');

// 5. Integração com a Engine (G.Player & G.Upgrades)
global.window = global;
global.BalanceConfig = BalanceConfig;
global.G = {
  Sprites: { hasShiny: () => false, bodyRadius: () => 14, bodyHeight: () => 20, Animator: class { update() {} } },
  BalanceConfig: BalanceConfig
};

require('../js/data/upgrades.js');

// Mock mínimo para Player
global.POKEDEX = { pikachu: { hp: 35, atk: 55, def: 40, spd: 90 } };
require('../js/entities/player.js');

const playerXp1 = G.Player.xpFor(1);
assert.strictEqual(playerXp1, xpLv1, 'G.Player.xpFor(1) deve delegar para BalanceConfig.xp.forLevel(1)');
console.log('✅ G.Player.xpFor delega dinamicamente para BalanceConfig.');

// 6. Teste de Reatividade Data-Driven (Mudança em Tempo de Execução)
const originalFn = BalanceConfig.xp.forLevel;
BalanceConfig.xp.forLevel = (lvl) => lvl * 999;
assert.strictEqual(G.Player.xpFor(5), 5 * 999, 'G.Player.xpFor deve responder dinamicamente a alterações no BalanceConfig');
BalanceConfig.xp.forLevel = originalFn; // Restaura
console.log('✅ Reatividade Data-Driven comprovada: alteração no BalanceConfig reflete na engine em tempo real.');

// 7. Validação do Spawner e Enemies
assert.strictEqual(BalanceConfig.spawner.cap, 64, 'CAP de inimigos deve ser 64');
assert.strictEqual(BalanceConfig.spawner.eliteThreshold, 0.85, 'Elite threshold deve ser 0.85');
assert.strictEqual(BalanceConfig.enemies.tiers.length, 6, 'Devem existir 6 tiers de inimigos');
assert.strictEqual(BalanceConfig.enemies.bossSlots.length, 5, 'Devem existir 5 slots de chefes');
console.log('✅ Spawner e Enemies: CAP 64, Elites 85%, 6 Tiers e 5 Chefes validados.');

console.log('\n🎉 TODOS OS TESTES DATA-DRIVEN PASSARAM COM 100% DE SUCESSO!\n');
