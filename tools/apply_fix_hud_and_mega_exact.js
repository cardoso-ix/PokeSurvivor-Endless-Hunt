const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. ATUALIZAR css/hud.css
const cssPath = path.join(ROOT, 'css', 'hud.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Remove o bloco final incorreto se existir
const markerIdx = css.indexOf('/* ==========================================================================\n   Garantia Estrutural: Status SEMPRE abaixo');
if (markerIdx !== -1) {
  css = css.substring(0, markerIdx).trim();
}

const definitiveHudCss = `
/* ==========================================================================
   Garantia Estrutural: HUD 100% Oculto no Boot/Menu e Status Descendo Abaixo
   ========================================================================== */
#bottom-rpg-hud.hidden {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
  opacity: 0 !important;
}

#bottom-rpg-hud.hud-top-left:not(.hidden) {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  position: fixed !important;
  top: 14px !important;
  left: 14px !important;
  z-index: 90 !important;
  pointer-events: auto !important;
}

.hud-profile-card {
  position: relative !important;
  z-index: 10 !important;
}

.hud-skills-deck {
  position: relative !important;
  z-index: 9 !important;
}

#hud-stats-toggle,
.hud-stats-toggle {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  position: relative !important;
  z-index: 95 !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none !important;
  margin-top: 6px !important;
  background: #141624 !important;
  border: 2px solid #3a3f58 !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  font-family: 'Pixelify', 'Press Start 2P', monospace !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #ffd23f !important;
}

#hud-stats-toggle:hover,
.hud-stats-toggle:hover {
  background: #1e2238 !important;
  border-color: #ffd23f !important;
  color: #ffffff !important;
}

#stats-rpg-panel {
  width: 100% !important;
  box-sizing: border-box !important;
  position: relative !important;
  top: auto !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  background: #141624 !important;
  border: 2px solid #3a3f58 !important;
  border-radius: 6px !important;
  padding: 8px 10px !important;
  font-family: 'Pixelify', 'Press Start 2P', monospace !important;
  user-select: none !important;
  image-rendering: pixelated !important;
  image-rendering: crisp-edges !important;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.2s ease;
}

#stats-rpg-panel.collapsed {
  display: none !important;
  max-height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

#stats-rpg-panel:not(.collapsed) {
  display: block !important;
  max-height: 300px !important;
  opacity: 1 !important;
  margin-top: 6px !important;
  pointer-events: auto !important;
  z-index: 94 !important;
}
`;

css += '\n' + definitiveHudCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ css/hud.css atualizado: HUD oculto no boot e toggle 100% funcional.');

// 2. ATUALIZAR js/ui/hud.js (Event Listener Global de Clique/Touch para o Toggle)
const hudJsPath = path.join(ROOT, 'js', 'ui', 'hud.js');
let hudJs = fs.readFileSync(hudJsPath, 'utf8');

const globalToggleListener = `
// Listener Global e Infalível para o Botão Retrátil de Status (Mouse e Touch)
if (typeof document !== 'undefined') {
  function handleStatsToggleClick(e) {
    const btn = e.target && e.target.closest('#hud-stats-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    if (!panel) return;
    const nowCollapsed = panel.classList.toggle('collapsed');
    if (arrow) arrow.textContent = nowCollapsed ? '▼' : '▲';
    try { localStorage.setItem('ps_stats_panel_expanded', String(!nowCollapsed)); } catch (err) {}
    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('click');
  }
  document.addEventListener('click', handleStatsToggleClick, true);
  document.addEventListener('touchend', handleStatsToggleClick, true);
}
`;

if (!hudJs.includes('handleStatsToggleClick')) {
  hudJs = globalToggleListener + '\n' + hudJs;
  fs.writeFileSync(hudJsPath, hudJs, 'utf8');
  console.log('✅ js/ui/hud.js atualizado com listener global infalível');
}
