const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const replaceBoth = (str, target, replacement) => {
  if (str.includes(target)) return str.replace(target, replacement);
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (str.includes(targetCRLF)) return str.replace(targetCRLF, replacementCRLF);
  return str;
};

// =============================================================================
// 1. DESATIVAR TELA DE ESCOLHA DE ATAQUES APÓS O RIFT EM js/systems/rift.js
// =============================================================================
const riftPath = path.join(ROOT, 'js', 'systems', 'rift.js');
let riftJs = fs.readFileSync(riftPath, 'utf8');

// Remove a chamada de offerBond ao terminar o Rift
const oldRiftFinish = `    if (pl && pl.bonds > 0 && G.Game && typeof G.Game.offerBond === 'function') G.Game.offerBond();`;
const newRiftFinish = `    // Não abre mais tela de escolher ataques: a partir do Nv. 20 todos os 4 ataques já combam juntos automaticamente!`;

riftJs = replaceBoth(riftJs, oldRiftFinish, newRiftFinish);
fs.writeFileSync(riftPath, riftJs, 'utf8');
console.log('✅ js/systems/rift.js atualizado: tela de escolha de ataques desativada após o rift');

// =============================================================================
// 2. DESATIVAR offerBond EM js/game.js
// =============================================================================
const gamePath = path.join(ROOT, 'js', 'game.js');
let gameJs = fs.readFileSync(gamePath, 'utf8');

const oldOfferBondFn = `  function offerBond(quiet = false) {
    if (!pl || pl.bonds <= 0 || pl.dead || (state !== 'playing' && state !== 'held') || G.Rift.inArena) return;`;

const newOfferBondFn = `  function offerBond(quiet = false) {
    // Como os 4 ataques combam juntos automaticamente a partir do Nível 20,
    // não há necessidade de pausar a partida com a tela de vínculo de ataques.
    return;
    if (!pl || pl.bonds <= 0 || pl.dead || (state !== 'playing' && state !== 'held') || G.Rift.inArena) return;`;

gameJs = replaceBoth(gameJs, oldOfferBondFn, newOfferBondFn);
fs.writeFileSync(gamePath, gameJs, 'utf8');
console.log('✅ js/game.js atualizado: offerBond neutralizado para garantir fluxo contínuo');

// =============================================================================
// 3. ATUALIZAR MEGA 20s + DANO 5X + CRESCIMENTO EM js/systems/mega.js
// =============================================================================
const megaPath = path.join(ROOT, 'js', 'systems', 'mega.js');
let megaJs = fs.readFileSync(megaPath, 'utf8');

megaJs = replaceBoth(megaJs, `duration: 10.0, // 10.0 segundos`, `duration: 20.0, // 20 segundos de Overdrive Supremo`);
megaJs = replaceBoth(megaJs, `duration: 10.0,`, `duration: 20.0,`);
megaJs = replaceBoth(megaJs, `duration: 2.8,`, `duration: 0.3,`);
megaJs = replaceBoth(megaJs, `this.duration = 2.8;`, `this.duration = 0.3;`);
megaJs = megaJs.replace(/pl\.megaDmgMul\s*=\s*[0-9.]+;/g, `pl.megaDmgMul = 5.0; // Buff Absurdo de Dano (5x)`);

fs.writeFileSync(megaPath, megaJs, 'utf8');
console.log('✅ js/systems/mega.js atualizado: 20 segundos e dano 5x');

// =============================================================================
// 4. ATUALIZAR CRESCIMENTO DO POKÉMON EM js/entities/player.js
// =============================================================================
const playerPath = path.join(ROOT, 'js', 'entities', 'player.js');
let playerJs = fs.readFileSync(playerPath, 'utf8');

playerJs = replaceBoth(playerJs,
  `const targetScale = isMegaActive ? 1.55 : 1.0;`,
  `const targetScale = isMegaActive ? 1.85 : 1.0; // Pokémon cresce e fica gigante na tela`
);

playerJs = replaceBoth(playerJs,
  `const megaMul = isMega ? 2.0 : 1;`,
  `const megaMul = isMega ? (this.megaDmgMul || 5.0) : 1;`
);

fs.writeFileSync(playerPath, playerJs, 'utf8');
console.log('✅ js/entities/player.js atualizado: escala gigante 1.85x e multiplicador 5x');
