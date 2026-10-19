const fs = require('fs');

global.window = global;
global.G = {
  UI: { spriteCanvas: () => ({}), sprite: () => ({}), stars: () => '', typeChips: () => '', dmgText: () => {} },
  Audio: { sfx: () => {} },
  Sprites: { hasShiny: () => false, bodyRadius: () => 16, bodyHeight: () => 24, Animator: class { setTrack() {} update() {} currentFrame() { return {}; } } },
  DB: { grant: () => {}, grantShiny: () => {}, ownsShiny: () => false, save: { stats: {}, pupg: {} } },
  FX: { burst: () => {}, ring: () => {}, dmgText: () => {} },
  Spawner: { say: () => {} }
};

// Carrega pokedex
const pokedexCode = fs.readFileSync('js/data/pokedex.js', 'utf8');
eval(pokedexCode);

// Carrega evolutions
const evoCode = fs.readFileSync('js/data/evolutions.js', 'utf8');
eval(evoCode);

// Carrega player
const playerCode = fs.readFileSync('js/entities/player.js', 'utf8');
eval(playerCode);

const bulba = G.DEX.find(p => p.dex === 1);
const player = new G.Player(bulba);

console.log('--- TESTE INICIAL ---');
console.log('Player species:', player.species);
console.log('Player dex:', player.dex);
console.log('Player level:', player.level);
console.log('typeof getEvolutionData:', typeof getEvolutionData);
console.log('typeof G.getEvolutionData:', typeof G.getEvolutionData);

console.log('\n--- SIMULANDO SUBIDA PARA NÍVEL 5 COM gainXp ---');
player.level = 4;
player.xp = 0;
player.xpNext = G.Player.xpFor(4);
console.log('Subindo de nível para 5...');
player.gainXp(player.xpNext + 10);

console.log('Nível final:', player.level);
console.log('Espécie final:', player.species);
console.log('Nome final:', player.mon.name);
console.log('Dex final:', player.dex);
