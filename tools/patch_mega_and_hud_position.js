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
// 1. ATUALIZAR js/systems/mega.js (Duração 20s + Buff Absurdo 5x + Cutscene Rápida)
// =============================================================================
const megaPath = path.join(ROOT, 'js', 'systems', 'mega.js');
let megaJs = fs.readFileSync(megaPath, 'utf8');

// Ajusta duração padrão para 20 segundos
megaJs = replaceBoth(megaJs, `duration: 10.0, // 10.0 segundos`, `duration: 20.0, // 20 segundos de Overdrive Supremo`);
megaJs = replaceBoth(megaJs, `duration: 10.0,`, `duration: 20.0,`);

// Ajusta cutscene para ser rápida (0.3s) sem travar gameplay
megaJs = replaceBoth(megaJs, `duration: 2.8,`, `duration: 0.3,`);
megaJs = replaceBoth(megaJs, `this.duration = 2.8;`, `this.duration = 0.3;`);

// Ajusta multiplicador de dano absurdo (5.0x de dano!)
megaJs = megaJs.replace(/pl\.megaDmgMul\s*=\s*2\.0;/g, `pl.megaDmgMul = 5.0; // Buff Absurdo de Dano (5x)`);

fs.writeFileSync(megaPath, megaJs, 'utf8');
console.log('✅ js/systems/mega.js atualizado: 20 segundos de duração e buff absurdo de 5x dano');

// =============================================================================
// 2. ATUALIZAR js/entities/player.js (Crescimento Gigante 1.85x + Dano 5x)
// =============================================================================
const playerPath = path.join(ROOT, 'js', 'entities', 'player.js');
let playerJs = fs.readFileSync(playerPath, 'utf8');

// Escala visual de crescimento para 1.85x (Pokémon visivelmente gigante!)
playerJs = replaceBoth(playerJs,
  `const targetScale = isMegaActive ? 1.55 : 1.0;`,
  `const targetScale = isMegaActive ? 1.85 : 1.0; // Pokémon cresce e fica gigante na tela`
);

// Multiplicador no get atk()
playerJs = replaceBoth(playerJs,
  `const megaMul = isMega ? 2.0 : 1;`,
  `const megaMul = isMega ? (this.megaDmgMul || 5.0) : 1;`
);

fs.writeFileSync(playerPath, playerJs, 'utf8');
console.log('✅ js/entities/player.js atualizado: escala gigante 1.85x e multiplicador 5x');

// =============================================================================
// 3. ATUALIZAR css/hud.css (Status descendo estritamente abaixo do Pokémon e vida)
// =============================================================================
const hudCssPath = path.join(ROOT, 'css', 'hud.css');
let hudCss = fs.readFileSync(hudCssPath, 'utf8');

// Assegura que o container do HUD top left e profile card fiquem sempre limpos no topo
// e o painel de status nunca sobreponha o personagem nem a barra de vida.
const enforceFlowCss = `
/* ==========================================================================
   Garantia Estrutural: Status SEMPRE abaixo do Personagem, Vida e Ataques
   ========================================================================== */
#bottom-rpg-hud.hud-top-left {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  position: fixed !important;
  top: 14px !important;
  left: 14px !important;
  z-index: 90 !important;
}

.hud-profile-card {
  position: relative !important;
  z-index: 10 !important;
}

.hud-skills-deck {
  position: relative !important;
  z-index: 9 !important;
}

.hud-stats-toggle {
  position: relative !important;
  z-index: 8 !important;
  margin-top: 6px !important;
}

#stats-rpg-panel {
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  z-index: 7 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
`;

if (!hudCss.includes('Garantia Estrutural: Status SEMPRE abaixo')) {
  hudCss += '\n' + enforceFlowCss;
}

fs.writeFileSync(hudCssPath, hudCss, 'utf8');
console.log('✅ css/hud.css atualizado: fluxo vertical estrito garantido');
