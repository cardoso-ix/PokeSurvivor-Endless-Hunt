const assert = require('assert');

console.log('🧪 Iniciando Testes do Ecossistema de Introdução & Criação, Treinador e Fila Indiana...');

global.window = global;
global.G = global.G || {};

// Dependências centrais
require('../js/core/util.js');
require('../js/data/pokedex.js');
require('../js/data/sprites-meta.js');
require('../js/core/sprites.js');
require('../js/data/moves.js');
require('../js/data/evolutions.js');
require('../js/ui/intro_creation.js');
require('../js/entities/player.js');
require('../js/systems/levelup.js');

// 1. Validação de IntroCreationUI
assert(G.IntroCreationUI, 'G.IntroCreationUI deve estar definido');
assert.strictEqual(G.IntroCreationUI.TRAINERS.male.length, 4, 'Devem existir 4 Treinadores meninos');
assert.strictEqual(G.IntroCreationUI.TRAINERS.female.length, 4, 'Devem existir 4 Treinadoras meninas');
assert.strictEqual(G.IntroCreationUI.ALL_STARTERS.length, 27, 'Devem existir os 27 iniciais das 9 gerações');

console.log('✅ Validação 1: Elenco de 8 Treinadores e 27 Iniciais das 9 Gerações configurados com sucesso!');

// 2. Validação de Player e Inicialização do Esquadrão
G.World = {
  collide: () => null,
  isLiquid: () => false,
  liquidEffect: () => ({}),
  nearestBreakable: () => null
};
G.Audio = { sfx: () => {}, music: () => {} };
G.Camera = { x: 0, y: 0, scale: 1, shake: 0, follow: (x, y) => { G.Camera.x = x; G.Camera.y = y; } };

const bulba = G.POKEDEX[1];
const pl = new G.Player(bulba, {}, false);
assert(pl.posHistory, 'posHistory deve existir');
assert.strictEqual(pl.maxHistory, 60, 'maxHistory deve ser 60');

pl.initSquad([1, 4, 7]); // Bulbasaur, Charmander, Squirtle
assert.strictEqual(pl.team.length, 3, 'Equipe de 3 Pokémon inicializada');
assert.strictEqual(pl.team[0].trailDelay, 12, 'Slot 1 trailDelay deve ser 12');
assert.strictEqual(pl.team[1].trailDelay, 24, 'Slot 2 trailDelay deve ser 24');
assert.strictEqual(pl.team[2].trailDelay, 36, 'Slot 3 trailDelay deve ser 36');

console.log('✅ Validação 2: Equipe de 3 Pokémon inicializada com atrasos escalonados de Fila Indiana (12, 24, 36 frames)!');

// 3. Validação do Movimento em Fila Indiana com posHistory
const firedProjectiles = [];
G.EnemyMgr = {
  all: () => [{ x: pl.team[1].x + 60, y: pl.team[1].y, hp: 50, dead: false }]
};
G.Projectiles = {
  spawn: (proj) => { firedProjectiles.push(proj); },
  nearest: () => null
};

G.Input = {
  axis: () => [1, 0], // Andando para a direita
  tap: () => false,
  held: () => false
};

// Simula 40 frames de caminhada
for (let f = 1; f <= 40; f++) {
  pl.update(0.016);
}

// Comprova que posHistory gravou as posições e que a fila indiana está atrás do líder
assert(pl.posHistory.length > 30, 'posHistory deve ter acumulado posições');
assert(pl.team[0].x < pl.x, 'Membro 0 deve seguir atrás do líder');
assert(pl.team[1].x <= pl.team[0].x, 'Membro 1 deve seguir atrás do Membro 0');
assert(pl.team[2].x <= pl.team[1].x, 'Membro 2 deve seguir atrás do Membro 1');

console.log(`✅ Validação 3: Fila Indiana comprovada! Líder em x=${pl.x.toFixed(1)}, M0 em x=${pl.team[0].x.toFixed(1)}, M1 em x=${pl.team[1].x.toFixed(1)}, M2 em x=${pl.team[2].x.toFixed(1)}.`);

pl.performSquadMemberAttack(pl.team[1]); // Charmander ataca
const lastProj = firedProjectiles[firedProjectiles.length - 1];
assert(lastProj, 'Projétil deve ter sido disparado pelo membro');
assert.strictEqual(lastProj.source, 'squad', 'Projétil deve ter source squad');
assert.strictEqual(lastProj.color, '#f97316', 'Projétil do Charmander deve ser cor de fogo');

console.log(`✅ Validação 4: Ataque autônomo disparado com sucesso! Dano: ${firedProjectiles[0].dmg}, Cor: ${firedProjectiles[0].color}.`);

// 5. Validação de Upgrades e Evolução Individual do Trio
const m1 = pl.team[1]; // Charmander
assert.strictEqual(m1.upgrades, 0);
pl.upgradeSquadMember(1);
assert.strictEqual(m1.upgrades, 1, 'Membro 1 deve estar com 1 upgrade');
assert(m1.damage > 15, 'Dano aumentado com upgrade');

pl.evolveSquadMember(1, 'charmeleon');
assert.strictEqual(m1.dex, 5, 'Dex atualizada para 5 (Charmeleon)');
assert.strictEqual(m1.name, 'Charmeleon', 'Nome atualizado para Charmeleon');
assert.strictEqual(m1.stage, 2, 'Estágio atualizado para 2');

console.log('✅ Validação 5: Melhorias e evolução do membro comprovadas (Charmander ➔ Charmeleon)!');

// 6. Validação de Cartas de Level Up
pl.level = 16;
const cards = G.LevelUp.candidates(pl);
const squadUpCards = cards.filter(c => c.type === 'squad_up');
const squadEvoCards = cards.filter(c => c.type === 'squad_evo');

assert(squadUpCards.length > 0, 'Deve gerar cartas de reforço squad_up');
assert(squadEvoCards.length > 0, 'Deve gerar cartas de evolução squad_evo');
console.log(`✅ Validação 6: Cartas de Level Up geradas com sucesso: ${squadUpCards.length} squad_up e ${squadEvoCards.length} squad_evo!`);

console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
