const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const cssPath = path.join(ROOT, 'css', 'hud.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Localiza o início da seção antiga de stats (linha 498)
const marker = '/* ==========================================================================\n   Painel Retro de Atributos & Status (Estilo DS / GBA)';
const markerCRLF = marker.replace(/\n/g, '\r\n');

let splitIdx = css.indexOf(marker);
if (splitIdx === -1) splitIdx = css.indexOf(markerCRLF);

if (splitIdx === -1) {
  // Fallback para '#stats-rpg-panel {'
  splitIdx = css.indexOf('#stats-rpg-panel {');
}

if (splitIdx !== -1) {
  css = css.substring(0, splitIdx).trim();
}

const cleanStatsCss = `
/* ==========================================================================
   Flagzinha e Painel Retro de Atributos & Status (Descendo Abaixo dos Ataques)
   ========================================================================== */
.hud-stats-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  background: #141624;
  border: 2px solid #3a3f58;
  border-radius: 6px;
  padding: 4px 10px;
  margin-top: 6px;
  cursor: pointer;
  user-select: none;
  font-family: 'Pixelify', 'Press Start 2P', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #ffd23f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.hud-stats-toggle:hover {
  background: #1e2238;
  border-color: #ffd23f;
  color: #ffffff;
}

.hud-stats-toggle-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.hud-stats-arrow {
  font-size: 11px;
  color: #ffd23f;
  transition: transform 0.2s ease;
}

#stats-rpg-panel {
  position: static !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 6px 0 0 0 !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  background: #141624;
  border: 2px solid #3a3f58;
  border-radius: 6px;
  box-shadow: inset -2px -2px 0px #090a10, inset 2px 2px 0px #5c648d, 0 4px 12px rgba(0, 0, 0, 0.7);
  padding: 8px 10px;
  box-sizing: border-box;
  font-family: 'Pixelify', 'Press Start 2P', monospace;
  user-select: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.2s ease;
  max-height: 240px;
  opacity: 1;
  overflow: hidden;
  z-index: 10;
}

#stats-rpg-panel.collapsed {
  max-height: 0 !important;
  opacity: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  border-width: 0 !important;
  pointer-events: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 8px;
}

.stat-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #090a10;
  border: 1px solid #282d44;
  border-radius: 4px;
  box-shadow: inset 1px 1px 0px #3a3f58;
  padding: 4px 8px;
  box-sizing: border-box;
}

.stat-lbl {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  color: #b4c8e6;
  text-shadow: 1px 1px 0px #000;
}

.stat-ico {
  font-size: 12px;
}

.stat-val {
  font-size: 11px;
  font-weight: 900;
  text-shadow: 1px 1px 0px #000;
  letter-spacing: 0.5px;
}

.stat-atk { color: #ff6b4d; }
.stat-def { color: #67e8f9; }
.stat-spd { color: #4ade80; }
.stat-cda { color: #facc15; }
.stat-crt { color: #f472b6; }
.stat-mag { color: #c084fc; }
.stat-apr { color: #38bdf8; }
.stat-reg { color: #a3e635; }
`;

css += '\n' + cleanStatsCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ css/hud.css atualizado: stats-rpg-panel posicionado estritamente abaixo do personagem e ataques.');
