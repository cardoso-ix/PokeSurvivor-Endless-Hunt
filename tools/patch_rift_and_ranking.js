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

// 1. js/systems/rift.js
const riftPath = path.join(ROOT, 'js', 'systems', 'rift.js');
let riftJs = fs.readFileSync(riftPath, 'utf8');

if (!riftJs.includes('let riftsCompleted = 0;')) {
  riftJs = replaceBoth(riftJs,
    `let arena = null;         // { tx, ty, r, dex, shiny, x, y, back, biome`,
    `let arena = null;         // { tx, ty, r, dex, shiny, x, y, back, biome\n  let riftsCompleted = 0;   // Contador de Fendas concluídas na partida`
  );

  riftJs = replaceBoth(riftJs,
    `function reset() { rift = null; arena = null; checkT = CHECK; asked = false; downT = 0; misses = 0; }`,
    `function reset() { rift = null; arena = null; checkT = CHECK; asked = false; downT = 0; misses = 0; riftsCompleted = 0; }`
  );

  riftJs = replaceBoth(riftJs,
    `function handleGuardianDefeated(boss) {
    if (!arena || arena.phase !== 'fight') return;
    arena.phase = 'capture';`,
    `function handleGuardianDefeated(boss) {
    if (!arena || arena.phase !== 'fight') return;
    arena.phase = 'capture';
    riftsCompleted++;`
  );

  riftJs = replaceBoth(riftJs,
    `get timeLeft() { return arena ? Math.max(0, ARENA_TIME - arena.t) : 0; },`,
    `get timeLeft() { return arena ? Math.max(0, ARENA_TIME - arena.t) : 0; },\n    get completedCount() { return riftsCompleted; },`
  );

  fs.writeFileSync(riftPath, riftJs, 'utf8');
  console.log('✅ js/systems/rift.js atualizado com contador de fendas');
}

// 2. js/game.js
const gamePath = path.join(ROOT, 'js', 'game.js');
let gameJs = fs.readFileSync(gamePath, 'utf8');

if (!gameJs.includes('rifts: G.Rift ? G.Rift.completedCount : 0')) {
  gameJs = replaceBoth(gameJs,
    `const mark = { t: Math.floor(time), lv: pl.level, kills: pl.kills };`,
    `const mark = { t: Math.floor(time), lv: pl.level, kills: pl.kills, rifts: G.Rift ? G.Rift.completedCount : 0 };`
  );
  fs.writeFileSync(gamePath, gameJs, 'utf8');
  console.log('✅ js/game.js atualizado com mark.rifts');
}

// 3. js/net/ranking.js
const rankPath = path.join(ROOT, 'js', 'net', 'ranking.js');
let rankJs = fs.readFileSync(rankPath, 'utf8');

if (!rankJs.includes('rifts: v.rifts || 0')) {
  rankJs = replaceBoth(rankJs,
    `const rowOf = (id, v) => ({ id, t: v.t, uids: v.uids || [], names: v.names || [], dex: v.dex || [], shiny: v.shiny || [], lv: v.lv, kills: v.kills });`,
    `const rowOf = (id, v) => ({ id, t: v.t, uids: v.uids || [], names: v.names || [], dex: v.dex || [], shiny: v.shiny || [], lv: v.lv, kills: v.kills, rifts: v.rifts || 0 });`
  );

  rankJs = replaceBoth(rankJs,
    `const mine = { t: entry.t, uids: entry.uids, names: entry.names, dex: entry.dex, lv: entry.lv, kills: entry.kills };`,
    `const mine = { t: entry.t, uids: entry.uids, names: entry.names, dex: entry.dex, lv: entry.lv, kills: entry.kills, rifts: entry.rifts || 0 };`
  );

  rankJs = replaceBoth(rankJs,
    `const entry = { t: r.t, uids: [fb.uid], names: [G.Social.me.name], dex: [r.dex], shiny: [!!r.shiny], lv: r.lv, kills: r.kills };`,
    `const entry = { t: r.t, uids: [fb.uid], names: [G.Social.me.name], dex: [r.dex], shiny: [!!r.shiny], lv: r.lv, kills: r.kills, rifts: r.rifts || 0 };`
  );

  rankJs = replaceBoth(rankJs,
    `const entry = { t: r.t, uids: ms.map(m => m.uid), names: ms.map(m => m.name), dex: ms.map(m => m.dex),
                    shiny: ms.map(m => !!m.shiny), lv: r.lv, kills: r.kills };`,
    `const entry = { t: r.t, uids: ms.map(m => m.uid), names: ms.map(m => m.name), dex: ms.map(m => m.dex),
                    shiny: ms.map(m => !!m.shiny), lv: r.lv, kills: r.kills, rifts: r.rifts || 0 };`
  );

  fs.writeFileSync(rankPath, rankJs, 'utf8');
  console.log('✅ js/net/ranking.js atualizado com suporte a rifts');
}

// 4. dev.html
const devHtmlPath = path.join(ROOT, 'dev.html');
let devHtml = fs.readFileSync(devHtmlPath, 'utf8');

if (!devHtml.includes('id="rk-cat"')) {
  devHtml = replaceBoth(devHtml,
    `<div class="gen-tabs" id="rk-mode"></div>`,
    `<div class="gen-tabs" id="rk-cat"></div>\n    <div class="gen-tabs" id="rk-mode"></div>`
  );
  fs.writeFileSync(devHtmlPath, devHtml, 'utf8');
  console.log('✅ dev.html atualizado com #rk-cat');
}

if (!devHtml.includes('js/data/base_stats.js')) {
  devHtml = replaceBoth(devHtml,
    `<script defer src="js/data/pokedex.js"></script>`,
    `<script defer src="js/data/pokedex.js"></script>\n<script defer src="js/data/base_stats.js"></script>`
  );
  fs.writeFileSync(devHtmlPath, devHtml, 'utf8');
  console.log('✅ dev.html atualizado com base_stats.js');
}

// 5. js/ui/ranking-ui.js
const rankUiPath = path.join(ROOT, 'js', 'ui', 'ranking-ui.js');
let rankUiJs = fs.readFileSync(rankUiPath, 'utf8');

// Atualiza o subtítulo e ordenação em load()
const oldLoadProcess = `    const uid = G.Social.uid;
    const b = G.Ranking.board(mode, period, dex), done = G.Ranking.reported();
    rows.forEach((r, i) => list.appendChild(rowEl(r, i + 1, r.uids.includes(uid), b, done)));`;

const newLoadProcess = `    const uid = G.Social.uid;
    const b = G.Ranking.board(mode, period, dex), done = G.Ranking.reported();
    if ($('rk-sub')) {
      $('rk-sub').textContent = category === 'rifts' ? '· fendas concluídas' : '· tempo sobrevivido';
    }
    // Ordena conforme a categoria selecionada (Tempo vs Fendas)
    if (category === 'rifts') {
      rows.sort((a, b) => (b.rifts || 0) - (a.rifts || 0) || b.t - a.t);
    } else {
      rows.sort((a, b) => b.t - a.t || (b.rifts || 0) - (a.rifts || 0));
    }
    rows.forEach((r, i) => list.appendChild(rowEl(r, i + 1, r.uids.includes(uid), b, done, category)));`;

rankUiJs = replaceBoth(rankUiJs, oldLoadProcess, newLoadProcess);

// Atualiza a assinatura e corpo de rowEl
const oldRowEl = `  function rowEl(r, pos, mine, b, done) {
    const el = document.createElement('div');
    el.className = 'rk-row' + (mine ? ' mine' : '') + (pos <= 3 ? ' top' + pos : '');
    el.insertAdjacentHTML('beforeend', \`<span class="pos">\${pos <= 3 ? G.Icons.html('trophy', 20) : ''}\${pos}</span>\`);
    const mons = document.createElement('span');
    mons.className = 'mons';
    r.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!r.shiny[i] })); });
    el.appendChild(mons);
    el.insertAdjacentHTML('beforeend',
      \`<span class="who"><b translate="no">\${r.names.map((n, i) => \`<a href="#" class="plink" data-u="\${esc(r.uids[i] || '')}">\${esc(n)}</a>\`).join(' · ')}</b><small>Nv. \${r.lv || 1} · \${(r.kills || 0).toLocaleString('pt-BR')} derrotados</small></span>
       <span class="time">\${fmt(r.t)}</span>\`);`;

const newRowEl = `  function rowEl(r, pos, mine, b, done, cat = 'time') {
    const el = document.createElement('div');
    el.className = 'rk-row' + (mine ? ' mine' : '') + (pos <= 3 ? ' top' + pos : '');
    el.insertAdjacentHTML('beforeend', \`<span class="pos">\${pos <= 3 ? G.Icons.html('trophy', 20) : ''}\${pos}</span>\`);
    const mons = document.createElement('span');
    mons.className = 'mons';
    r.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!r.shiny[i] })); });
    el.appendChild(mons);

    const isRifts = cat === 'rifts';
    const subText = isRifts
      ? \`Nv. \${r.lv || 1} · Tempo: \${fmt(r.t)} · \${(r.kills || 0).toLocaleString('pt-BR')} derrotados\`
      : \`Nv. \${r.lv || 1} · \${(r.kills || 0).toLocaleString('pt-BR')} derrotados · \${(r.rifts || 0)} fendas\`;
    const scoreDisplay = isRifts
      ? \`<span class="time" style="color:#00ffcc;font-weight:bold">🌀 \${r.rifts || 0} fendas</span>\`
      : \`<span class="time">\${fmt(r.t)}</span>\`;

    el.insertAdjacentHTML('beforeend',
      \`<span class="who"><b translate="no">\${r.names.map((n, i) => \`<a href="#" class="plink" data-u="\${esc(r.uids[i] || '')}">\${esc(n)}</a>\`).join(' · ')}</b><small>\${subText}</small></span>
       \${scoreDisplay}\`);`;

rankUiJs = replaceBoth(rankUiJs, oldRowEl, newRowEl);

fs.writeFileSync(rankUiPath, rankUiJs, 'utf8');
console.log('✅ js/ui/ranking-ui.js atualizado com suporte completo a categorias');
