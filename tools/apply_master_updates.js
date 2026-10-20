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
// 1. REPOSICIONAMENTO DO PAINEL DE STATUS COM FLAGZINHA RETRÁTIL NO HTML
// =============================================================================
function updateHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove o bloco antigo de stats-rpg-panel se estiver fora
  const oldPanelBlockRegex = /<!-- ====== Painel de Status Retro Pixel Art \(Estilo DS \/ GBA\) ====== -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

  const targetDeckEnd = `    <div id="hud-skills-tray" class="hud-skills-row"></div>
  </div>
</div>`;

  const newDeckAndPanel = `    <div id="hud-skills-tray" class="hud-skills-row"></div>
  </div>

  <!-- Flagzinha / Botão Retrátil para Parâmetros de Status -->
  <div id="hud-stats-toggle" class="hud-stats-toggle" title="Abrir/Recolher Parâmetros de Status (Atributos)">
    <span class="hud-stats-toggle-label">📊 STATUS & ATRIBUTOS</span>
    <span id="hud-stats-arrow" class="hud-stats-arrow">▼</span>
  </div>

  <!-- Painel de Status Retro Pixel Art Retrátil -->
  <div id="stats-rpg-panel" class="pixel-panel notranslate collapsed" translate="no">
    <div class="stats-grid">
      <!-- Coluna 1 -->
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">⚔️</span> ATK</span>
        <span id="stat-val-atk" class="stat-val stat-atk">+0%</span>
      </div>
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">🛡️</span> DEF</span>
        <span id="stat-val-def" class="stat-val stat-def">0%</span>
      </div>
      <!-- Coluna 2 -->
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">👟</span> SPD</span>
        <span id="stat-val-spd" class="stat-val stat-spd">+0%</span>
      </div>
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">⏱️</span> CDA</span>
        <span id="stat-val-cda" class="stat-val stat-cda">0%</span>
      </div>
      <!-- Coluna 3 -->
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">🎯</span> CRT</span>
        <span id="stat-val-crt" class="stat-val stat-crt">+0%</span>
      </div>
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">🧲</span> MAG</span>
        <span id="stat-val-mag" class="stat-val stat-mag">+0%</span>
      </div>
      <!-- Coluna 4 -->
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">📖</span> APR</span>
        <span id="stat-val-apr" class="stat-val stat-apr">+0%</span>
      </div>
      <div class="stat-slot">
        <span class="stat-lbl"><span class="stat-ico">🌿</span> REG</span>
        <span id="stat-val-reg" class="stat-val stat-reg">+0.0/s</span>
      </div>
    </div>
  </div>
</div>`;

  // Se já tiver fora, limpa primeiro
  if (html.includes('<!-- ====== Painel de Status Retro Pixel Art (Estilo DS / GBA) ====== -->')) {
    html = html.replace(oldPanelBlockRegex, '');
  }

  if (html.includes(targetDeckEnd)) {
    html = html.replace(targetDeckEnd, newDeckAndPanel);
    console.log(`✅ ${path.basename(filePath)}: Painel de Status movido para baixo dos ataques com toggle`);
  } else {
    const targetDeckEndCRLF = targetDeckEnd.replace(/\n/g, '\r\n');
    const newDeckAndPanelCRLF = newDeckAndPanel.replace(/\n/g, '\r\n');
    if (html.includes(targetDeckEndCRLF)) {
      html = html.replace(targetDeckEndCRLF, newDeckAndPanelCRLF);
      console.log(`✅ ${path.basename(filePath)}: Painel de Status movido (CRLF)`);
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
}

updateHtmlFile(path.join(ROOT, 'dev.html'));

// =============================================================================
// 2. ATUALIZAR css/hud.css
// =============================================================================
const cssPath = path.join(ROOT, 'css', 'hud.css');
let css = fs.readFileSync(cssPath, 'utf8');

const newStatsCss = `
/* ==========================================================================
   Flagzinha e Painel Retro de Atributos & Status (Canto Superior Esquerdo)
   ========================================================================== */
.hud-stats-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  width: 100%;
  margin-top: 4px;
  background: #141624;
  border: 3px solid #3a3f58;
  border-radius: 6px;
  box-shadow: inset -2px -2px 0px #090a10, inset 2px 2px 0px #5c648d, 0 4px 12px rgba(0, 0, 0, 0.7);
  padding: 8px 10px;
  box-sizing: border-box;
  font-family: 'Pixelify', 'Press Start 2P', monospace;
  user-select: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.2s ease;
  max-height: 220px;
  opacity: 1;
  overflow: hidden;
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
`;

css += '\n' + newStatsCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ css/hud.css atualizado com estilos do toggle e painel retrátil');

// =============================================================================
// 3. ATUALIZAR js/ui/hud.js: Wire do botão toggle e preservação do colapso
// =============================================================================
const hudJsPath = path.join(ROOT, 'js', 'ui', 'hud.js');
let hudJs = fs.readFileSync(hudJsPath, 'utf8');

const toggleWiringCode = `
  function wireStatsToggle() {
    const btn = document.getElementById('hud-stats-toggle');
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    if (!btn || !panel || btn._wired) return;
    btn._wired = true;

    // Recupera preferência do usuário (padrão: recolhido para não poluir o mapa)
    const isExpanded = localStorage.getItem('ps_stats_panel_expanded') === 'true';
    if (isExpanded) {
      panel.classList.remove('collapsed');
      if (arrow) arrow.textContent = '▲';
    } else {
      panel.classList.add('collapsed');
      if (arrow) arrow.textContent = '▼';
    }

    btn.onclick = e => {
      e.stopPropagation();
      const nowCollapsed = panel.classList.toggle('collapsed');
      if (arrow) arrow.textContent = nowCollapsed ? '▼' : '▲';
      localStorage.setItem('ps_stats_panel_expanded', String(!nowCollapsed));
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('click');
    };
  }
`;

const hudInitOld = `  function init() {`;
const hudInitNew = `  function init() {
    wireStatsToggle();`;

hudJs = replaceBoth(hudJs, hudInitOld, hudInitNew);

const oldDomStatsHandling = `        if (statsEl.classList.contains('hidden')) statsEl.classList.remove('hidden');`;
const newDomStatsHandling = `        wireStatsToggle();`;

hudJs = replaceBoth(hudJs, oldDomStatsHandling, newDomStatsHandling);

// Adiciona wireStatsToggle no final do arquivo
hudJs = toggleWiringCode + '\n' + hudJs;
fs.writeFileSync(hudJsPath, hudJs, 'utf8');
console.log('✅ js/ui/hud.js atualizado com controle retrátil de status');

// =============================================================================
// 4. ATUALIZAR js/game.js: Ataques Iniciais Customizados
// =============================================================================
const gameJsPath = path.join(ROOT, 'js', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

const oldStartMoves = `    (save.pbind && save.pbind[mon.dex] || []).forEach((id, i) => { if (id) pl.bind[id] = i; });
    pl.addMove(G.startMoveOf(mon.dex));
    // Mejora "Veto": movimientos que no quieres que te salgan.
    pl.banned = new Set((save.pban && save.pban[mon.dex] || []).slice(0, perks.bans));
    // Mejora "Repertorio": un segundo movimiento de ataque al azar.
    if (perks.startMoves >= 2) {
      const pool = G.Moves.poolFor(mon).filter(id => !pl.hasMove(id) && !pl.banned.has(id) && G.Moves.BY_ID[id].kind !== 'buff');
      if (pool.length) pl.addMove(G.U.pick(pool));
      pl.setActive(0);
    }`;

const newStartMoves = `    (save.pbind && save.pbind[mon.dex] || []).forEach((id, i) => { if (id) pl.bind[id] = i; });
    
    // Suporte aos Ataques Iniciais Customizados escolhidos pelo jogador na Pokédex/Melhorias:
    const customStarts = (save.customStartMoves && save.customStartMoves[mon.dex]) || [];
    if (customStarts.length > 0) {
      for (const mId of customStarts.slice(0, 2)) {
        if (G.Moves.BY_ID[mId] && !pl.hasMove(mId)) pl.addMove(mId);
      }
    } else {
      pl.addMove(G.startMoveOf(mon.dex));
      if (perks.startMoves >= 2) {
        const pool = G.Moves.poolFor(mon).filter(id => !pl.hasMove(id) && !pl.banned.has(id) && G.Moves.BY_ID[id].kind !== 'buff');
        if (pool.length) pl.addMove(G.U.pick(pool));
      }
    }
    pl.setActive(0);
    // Mejora "Veto": movimientos que no quieres que te salgan.
    pl.banned = new Set((save.pban && save.pban[mon.dex] || []).slice(0, perks.bans));`;

gameJs = replaceBoth(gameJs, oldStartMoves, newStartMoves);
fs.writeFileSync(gameJsPath, gameJs, 'utf8');
console.log('✅ js/game.js atualizado com suporte a ataques iniciais customizados');

// =============================================================================
// 5. ATUALIZAR js/ui/ranking-ui.js: Suporte a Métrica de Tempo e Fendas
// =============================================================================
const rankUiPath = path.join(ROOT, 'js', 'ui', 'ranking-ui.js');
let rankUi = fs.readFileSync(rankUiPath, 'utf8');

const oldTabsFn = `    mk($('rk-mode'), [['s', \`<b>\${G.Icons.html('user', 16)} Solo</b>\`], ['g', \`<b>\${G.Icons.html('friends', 16)} Grupo</b>\`]],
       mode, k => { mode = k; }, 'gen-tab');`;

const newTabsFn = `    // Seletor de Categoria: Tempo Sobrevivido vs Fendas Feitas
    if ($('rk-cat')) {
      mk($('rk-cat'), [
        ['time', \`<b>⏱️ Maior Tempo</b>\`],
        ['rifts', \`<b>🌀 Mais Fendas</b>\`]
      ], category, k => { category = k; }, 'gen-tab');
    }
    mk($('rk-mode'), [['s', \`<b>\${G.Icons.html('user', 16)} Solo</b>\`], ['g', \`<b>\${G.Icons.html('friends', 16)} Grupo</b>\`]],
       mode, k => { mode = k; }, 'gen-tab');`;

rankUi = replaceBoth(rankUi, `let mode = 's', period = 'w', scope = 'all', dex = null;`, `let mode = 's', period = 'w', scope = 'all', dex = null, category = 'time';`);
rankUi = replaceBoth(rankUi, oldTabsFn, newTabsFn);

fs.writeFileSync(rankUiPath, rankUi, 'utf8');
console.log('✅ js/ui/ranking-ui.js atualizado com suporte a Ranking de Tempo e Fendas');

console.log('🚀 Todas as atualizações mestres foram aplicadas com sucesso!');
