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
// 1. ATUALIZAR js/ui/menu.js (Status Reais Oficiais + Painel de Ataques Iniciais)
// =============================================================================
const menuPath = path.join(ROOT, 'js', 'ui', 'menu.js');
let menuJs = fs.readFileSync(menuPath, 'utf8');

// Adiciona renderização dos status oficiais em showDetail
const oldShowDetailStats = `      \${own ? \`
        \${bar('Vida', p.hp, max.hp, p.hp)}
        \${bar('Ataque', p.atk, max.atk, '×' + p.atk.toFixed(2))}
        \${bar('Velocidade', p.spd, max.spd, p.spd)}
        <p style="font-size:14px;margin:10px 0 4px">Começa com <b class="gold">\${G.Moves.BY_ID[G.startMoveOf(dex)].name}</b></p>`;

const newShowDetailStats = `      \${own ? \`
        \${bar('Vida In-game', p.hp, max.hp, p.hp)}
        \${bar('Ataque In-game', p.atk, max.atk, '×' + p.atk.toFixed(2))}
        \${bar('Velocidade In-game', p.spd, max.spd, p.spd)}
        
        <!-- Painel de Status Oficiais The Pokémon Company -->
        \${(() => {
          const bs = (typeof G.getBaseStats === 'function') ? G.getBaseStats(dex) : { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50, bst: 300 };
          return \`
          <div class="poke-official-stats-box" style="margin:10px 0;background:#141624;border:2px solid #3a3f58;border-radius:6px;padding:8px 10px;font-family:'Pixelify','Press Start 2P',monospace;box-shadow:inset 0 0 8px rgba(0,0,0,0.5)">
            <div style="font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:6px;display:flex;justify-content:space-between;border-bottom:1px solid #3a3f58;padding-bottom:4px">
              <span>📊 ATRIBUTOS BASE OFICIAIS</span>
              <span style="color:#00ffcc">BST: \${bs.bst}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px;font-size:11px">
              <div>💖 HP: <b style="color:#ff7777">\${bs.hp}</b></div>
              <div>⚔️ ATK: <b style="color:#ff9f43">\${bs.atk}</b></div>
              <div>🛡️ DEF: <b style="color:#54a0ff">\${bs.def}</b></div>
              <div>✨ S.ATK: <b style="color:#f368e0">\${bs.spa}</b></div>
              <div>🔮 S.DEF: <b style="color:#1dd1a1">\${bs.spd}</b></div>
              <div>👟 SPEED: <b style="color:#00d2d3">\${bs.spe}</b></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:4px;border-top:1px dashed #3a3f58;font-size:10px;color:#aaa">
              <span>🎯 Crítico: <b style="color:#ffd23f">+5%</b></span>
              <span>⏱️ Recarga (CDA): <b style="color:#00ffcc">0%</b></span>
              <span>⚡ Ataques Simultâneos: <b style="color:#fff">Até 4</b></span>
            </div>
          </div>\`;
        })()}

        <p style="font-size:14px;margin:10px 0 4px">Começa com <b class="gold">\${G.Moves.BY_ID[G.startMoveOf(dex)].name}</b></p>`;

menuJs = replaceBoth(menuJs, oldShowDetailStats, newShowDetailStats);

// Adiciona o startMovesPanel em renderUpgrades
const oldRenderUpgradesAppend = `      if (u.id === 'ban' && lvl > 0 && banOpen) box.appendChild(banPicker(lvl));
    }
    box.appendChild(bindPanel());`;

const newRenderUpgradesAppend = `      if (u.id === 'ban' && lvl > 0 && banOpen) box.appendChild(banPicker(lvl));
    }
    box.appendChild(startMovesPanel());
    box.appendChild(bindPanel());`;

menuJs = replaceBoth(menuJs, oldRenderUpgradesAppend, newRenderUpgradesAppend);

// Adiciona a função startMovesPanel no menuJs
const startMovesPanelFn = `
  // ---------------- escolha de ataques iniciais ----------------
  function startMovesPanel() {
    const s = G.DB.save;
    s.customStartMoves = s.customStartMoves || {};
    const defaultStart = G.startMoveOf(upgDex);
    const custom = s.customStartMoves[upgDex] || [defaultStart];
    const mon = G.DEX_BY[upgDex];
    const allMoves = G.Moves.poolFor(mon).concat([defaultStart]).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));

    const move1 = custom[0] || defaultStart;
    const move2 = custom[1] || '';

    const el = document.createElement('div');
    el.className = 'panel start-moves-panel';
    el.style.cssText = 'background:#141624;border:2px solid #3a3f58;border-radius:8px;padding:12px;margin:10px 0;box-shadow:0 4px 12px rgba(0,0,0,0.6)';
    el.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <b style="color:#ffd23f;font-size:14px;display:flex;align-items:center;gap:6px">
          <span>🎯</span> ATAQUES INICIAIS DA PARTIDA
        </b>
        <span style="font-size:11px;color:#00ffcc;font-weight:bold">\${move2 ? '2 Ataques Selecionados' : '1 Ataque Selecionado'}</span>
      </div>
      <p class="sub" style="margin:0 0 10px;font-size:12px;color:#bbb">
        Escolha até 2 ataques para <b>\${mon.name}</b> iniciar a partida. Até o Nível 20 você escolhe mais poderes e, a partir do Nv. 20, todos os 4 ataques permanecem combando juntos sem interrupções!
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:4px">1º Ataque Inicial (Principal):</span>
          <select id="start-move-1" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            \${allMoves.map(id => \`<option value="\${id}" \${id === move1 ? 'selected' : ''}>\${G.Moves.BY_ID[id].name}</option>\`).join('')}
          </select>
        </label>
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:4px">2º Ataque Inicial (Opcional):</span>
          <select id="start-move-2" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            <option value="">Nenhum (Começar com apenas 1 ataque)</option>
            \${allMoves.filter(id => id !== move1).map(id => \`<option value="\${id}" \${id === move2 ? 'selected' : ''}>\${G.Moves.BY_ID[id].name}</option>\`).join('')}
          </select>
        </label>
      </div>
    \`;

    const sel1 = el.querySelector('#start-move-1');
    const sel2 = el.querySelector('#start-move-2');

    const saveChanges = () => {
      const v1 = sel1.value;
      const v2 = sel2.value;
      const chosen = [v1];
      if (v2 && v2 !== v1) chosen.push(v2);
      s.customStartMoves[upgDex] = chosen;
      G.DB.commit();
      G.Audio.sfx('select');
      G.UI.toast(\`Ataques iniciais de \${mon.name} configurados!\`);
      renderUpgrades();
    };

    sel1.onchange = saveChanges;
    sel2.onchange = saveChanges;

    return el;
  }
`;

if (!menuJs.includes('function startMovesPanel()')) {
  menuJs = menuJs.replace('function bindPanel() {', startMovesPanelFn + '\n  function bindPanel() {');
}

fs.writeFileSync(menuPath, menuJs, 'utf8');
console.log('✅ js/ui/menu.js atualizado com atributos oficiais e seleção de ataques iniciais');

// =============================================================================
// 2. ATUALIZAR css/style.css (Otimizações Gráficas de Renderização e 60 FPS)
// =============================================================================
const cssPath = path.join(ROOT, 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const oldGameCss = `#game { display: block; width: 100vw; height: 100vh; height: 100dvh; touch-action: none; }`;
const newGameCss = `#game {
  display: block;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  touch-action: none;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}`;

css = replaceBoth(css, oldGameCss, newGameCss);
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ css/style.css atualizado com aceleração de hardware GPU e renderização pixelada crisp');
