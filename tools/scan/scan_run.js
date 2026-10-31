const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot';
const SPEED = +process.argv[3] || 6, GAMESEC = +process.argv[4] || 900;
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--enable-precise-memory-info'], protocolTimeout: 180000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(`[${ctx}] ${e.message.slice(0, 140)}`));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /fallo en un fotograma/.test(t)) errs.push(`[${ctx}] ${t.slice(0, 160)}`); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  const species = +process.argv[2] || 1;
  await p.evaluate(sp => { const s = G.DB.save; s.partner = sp; s.starter = sp; s.owned = s.owned || {}; s.owned[sp] = { at: Date.now() }; G.UI.hideAll(); G.Game.startRun(); }, species);
  await sleep(2500);
  await p.evaluate(sp => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; }, speed = SPEED);
  await p.evaluate(k => G.Game.debugSpeed(k), SPEED);
  // monitor de frametime
  await p.evaluate(() => { window.__ft = []; let l = performance.now(); (function f(t) { window.__ft.push(t - l); l = t; requestAnimationFrame(f); })(l); });
  const rows = [];
  let lastGame = -1, stuck = 0;
  while (true) {
    ctx = 'run';
    // fecha telas de escolha (level up, vínculo, item)
    await p.evaluate(() => { const b = document.querySelector('#scr-levelup:not(.hidden) .card, #scr-bond:not(.hidden) button, #scr-item:not(.hidden) button'); if (b) b.click(); });
    const s = await p.evaluate(() => {
      const ft = window.__ft.splice(0); const avg = ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : 0; const worst = ft.length ? Math.max(...ft) : 0;
      const pl = G.Game.player; const all = G.EnemyMgr.all();
      return { state: G.Game.state, t: Math.round(G.Game.st.time || 0), lvl: pl && pl.level, en: all.length, fx: G.FX.count, ftAvg: +avg.toFixed(1), ftMax: Math.round(worst), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1, kills: pl && pl.kills, moves: pl && pl.moves.length };
    });
    rows.push(s);
    if (s.state === 'over' || s.t >= GAMESEC) break;
    if (s.t === lastGame) { if (++stuck > 12) { rows.push({ stuck: true }); break; } } else stuck = 0;
    lastGame = s.t;
    await sleep(5000);
  }
  console.log('t(s)\tlvl\tenem\tfx\tftAvg\tftMax\theapMB\tkills\tmoves\tstate');
  rows.forEach(r => console.log(r.stuck ? 'TRAVADO' : [r.t, r.lvl, r.en, r.fx, r.ftAvg, r.ftMax, r.heapMB, r.kills, r.moves, r.state].join('\t')));
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => console.log(e));
  await p.screenshot({ path: process.argv[5] || 'run_end.png' });
  await b.close();
})().catch(e => { console.log('FALHA SCANNER', e.message); process.exit(1); });
