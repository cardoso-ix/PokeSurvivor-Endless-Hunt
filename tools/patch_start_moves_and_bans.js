const fs = require('fs');
let file = fs.readFileSync('js/ui/menu.js', 'utf8');

const target = `  // ---------------- escolha de ataques iniciais ----------------
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
  }`;

const replacement = `  // ---------------- escolha de ataques iniciais ----------------
  function startMovesPanel() {
    const s = G.DB.save;
    s.customStartMoves = s.customStartMoves || {};
    const defaultStart = G.startMoveOf(upgDex);
    const custom = s.customStartMoves[upgDex] || [defaultStart];
    const mon = G.DEX_BY[upgDex];
    const lv = G.DB.upgradesOf(upgDex);
    const hasSecondSlot = (lv['moves'] || 0) >= 1;
    const allMoves = G.Moves.poolFor(mon).concat([defaultStart]).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));

    const move1 = custom[0] || defaultStart;
    const move2 = hasSecondSlot ? (custom[1] || '') : '';

    const el = document.createElement('div');
    el.className = 'panel start-moves-panel';
    el.style.cssText = 'background:#141624;border:2px solid #3a3f58;border-radius:8px;padding:12px;margin:10px 0;box-shadow:0 4px 12px rgba(0,0,0,0.6)';
    el.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <b style="color:#ffd23f;font-size:14px;display:flex;align-items:center;gap:6px">
          <span>🎯</span> ATAQUES INICIAIS DA PARTIDA
        </b>
        <span style="font-size:11px;color:\${hasSecondSlot ? '#00ffcc' : '#f59e0b'};font-weight:bold">
          \${hasSecondSlot ? (move2 ? '2 Ataques Selecionados' : '1 Ataque Selecionado (Slot 2 Liberado)') : '🔒 Apenas 1 Ataque (Slot 2 Bloqueado)'}
        </span>
      </div>
      <p class="sub" style="margin:0 0 10px;font-size:12px;color:#bbb">
        \${hasSecondSlot
          ? \`Escolha os ataques para <b>\${mon.name}</b> iniciar a partida. Até o Nível 20 você escolhe mais poderes e, a partir do Nv. 20, todos os 4 ataques disparam juntos!\`
          : \`Escolha 1 ataque para <b>\${mon.name}</b> iniciar a partida. O <b>2º Ataque Inicial</b> pode ser desbloqueado por 🪙 <b>50.000</b> moedas para começar com 2 golpes!\`
        }
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#ffd23f;margin-bottom:4px">1º Ataque Inicial (Principal):</span>
          <select id="start-move-1" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            \${allMoves.map(id => \`<option value="\${id}" \${id === move1 ? 'selected' : ''}>\${G.Moves.BY_ID[id].name}</option>\`).join('')}
          </select>
        </label>
        \${hasSecondSlot ? \`
        <label style="flex:1;min-width:200px">
          <span style="display:block;font-size:11px;font-weight:bold;color:#00ffcc;margin-bottom:4px">2º Ataque Inicial (Desbloqueado):</span>
          <select id="start-move-2" class="field" style="width:100%;background:#1e2238;color:#fff;border:1px solid #4a5170;padding:6px;border-radius:4px">
            <option value="">Nenhum (Começar com apenas 1 ataque)</option>
            \${allMoves.filter(id => id !== move1).map(id => \`<option value="\${id}" \${id === move2 ? 'selected' : ''}>\${G.Moves.BY_ID[id].name}</option>\`).join('')}
          </select>
        </label>
        \` : \`
        <div style="flex:1;min-width:200px;background:#1a1d2e;border:1px dashed #f59e0b;padding:8px 12px;border-radius:6px;display:flex;flex-direction:column;justify-content:center;gap:6px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;font-weight:bold;color:#f59e0b;display:flex;align-items:center;gap:4px">
              <span>🔒</span> 2º Ataque Inicial
            </span>
            <span style="font-size:10px;color:#888;background:#111;padding:1px 5px;border-radius:3px">Bloqueado</span>
          </div>
          <span style="font-size:11px;color:#aaa">Inicie a partida com 2 golpes simultâneos para \${mon.name}.</span>
          <button id="btn-unlock-second-move" class="btn small gold" style="padding:4px 8px;font-size:11px;font-weight:bold;background:linear-gradient(180deg,#f59e0b,#b45309);border:1px solid #fbbf24;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
            🔓 Desbloquear por <span class="coin"></span> 50.000
          </button>
        </div>
        \`}
      </div>
    \`;

    const sel1 = el.querySelector('#start-move-1');
    const sel2 = el.querySelector('#start-move-2');
    const unlockBtn = el.querySelector('#btn-unlock-second-move');

    if (unlockBtn) {
      unlockBtn.onclick = () => {
        const cost = 50000;
        if (s.coins < cost) {
          if (G.UI && G.UI.toast) G.UI.toast('PokéMoedas insuficientes! Necessário 50.000 moedas.');
          return;
        }
        s.coins -= cost;
        lv['moves'] = 1;
        G.DB.commit(true);
        G.Audio.sfx('buy');
        G.UI.refreshCoins();
        G.UI.toast(\`✨ 2º Ataque Inicial desbloqueado para \${mon.name}!\`, 4500);
        renderUpgrades();
      };
    }

    const saveChanges = () => {
      const v1 = sel1 ? sel1.value : defaultStart;
      const v2 = (hasSecondSlot && sel2) ? sel2.value : '';
      const chosen = [v1];
      if (hasSecondSlot && v2 && v2 !== v1) chosen.push(v2);
      s.customStartMoves[upgDex] = chosen;
      G.DB.commit();
      G.Audio.sfx('select');
      G.UI.toast(\`Ataques iniciais de \${mon.name} configurados!\`);
      renderUpgrades();
    };

    if (sel1) sel1.onchange = saveChanges;
    if (sel2) sel2.onchange = saveChanges;

    return el;
  }`;

if (file.indexOf(target) === -1) {
  console.error('Target not found in menu.js');
  process.exit(1);
}

file = file.replace(target, replacement);

const targetBan = `  // ---------------- veto / banimento: ataques bloqueados ----------------
  let banOpen = false;
  function banList() {
    const s = G.DB.save;
    s.pban = s.pban || {};
    return s.pban[upgDex] || (s.pban[upgDex] = []);
  }
  function banPicker(max) {
    const mon = G.DEX_BY[upgDex];
    const start = G.startMoveOf(upgDex);
    const ids = G.Moves.poolFor(mon).filter(id => id !== start)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));
    const list = banList();
    const el = document.createElement('div');
    el.className = 'panel ban-picker';
    el.innerHTML = \`<p class="sub" style="margin:0 0 8px">Toque nos ataques que você não quer que apareçam nas cartas (\${list.length}/\${max}). O ataque inicial não pode ser banido.</p>
      <div class="ban-moves">\${ids.map(id => { const d = G.Moves.BY_ID[id]; const on = list.includes(id);
        return \`<button class="chip \${on ? 'on ban' : ''}" data-id="\${id}">\${G.Icons.html('move:' + id, 16)} \${d.name}\${on ? ' ' + G.Icons.html('ban', 14) : ''}</button>\`; }).join('')}</div>\`;
    el.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const l = banList(), id = b.dataset.id, i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1);
        else if (l.length >= max) { G.UI.toast(\`Você já baniu \${max} ataques: remova um primeiro.\`); return; }
        else l.push(id);
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }`;

const replacementBan = `  // ---------------- veto / banimento: ataques bloqueados (máximo 3) ----------------
  let banOpen = false;
  function banList() {
    const s = G.DB.save;
    s.pban = s.pban || {};
    const l = s.pban[upgDex] || (s.pban[upgDex] = []);
    if (l.length > 3) l.splice(3);
    return l;
  }
  function banPicker(max) {
    const actualMax = Math.min(3, max);
    const mon = G.DEX_BY[upgDex];
    const start = G.startMoveOf(upgDex);
    const ids = G.Moves.poolFor(mon).filter(id => id !== start)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'pt-BR'));
    const list = banList();
    const el = document.createElement('div');
    el.className = 'panel ban-picker';
    el.innerHTML = \`<p class="sub" style="margin:0 0 8px">Toque nos ataques que você não quer que apareçam nas cartas (\${list.length}/\${actualMax}). O ataque inicial não pode ser banido (máx. 3 vetos).</p>
      <div class="ban-moves">\${ids.map(id => { const d = G.Moves.BY_ID[id]; const on = list.includes(id);
        return \`<button class="chip \${on ? 'on ban' : ''}" data-id="\${id}">\${G.Icons.html('move:' + id, 16)} \${d.name}\${on ? ' ' + G.Icons.html('ban', 14) : ''}</button>\`; }).join('')}</div>\`;
    el.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const l = banList(), id = b.dataset.id, i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1);
        else if (l.length >= actualMax) { G.UI.toast(\`Você já baniu \${actualMax} ataques: remova um primeiro.\`); return; }
        else l.push(id);
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }`;

if (file.indexOf(targetBan) === -1) {
  console.error('targetBan not found in menu.js');
  process.exit(1);
}

file = file.replace(targetBan, replacementBan);
fs.writeFileSync('js/ui/menu.js', file, 'utf8');
console.log('Successfully patched menu.js!');
