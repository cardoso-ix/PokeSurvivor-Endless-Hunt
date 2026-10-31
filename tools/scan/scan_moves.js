const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot';
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(`[${ctx}] ${e.message.slice(0, 140)}`));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /fallo en un fotograma/.test(t)) errs.push(`[${ctx}] ${t.slice(0, 160)}`); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = 1; s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); G.Game.debugSpeed(3); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; pl.xpNext = 1e12; });
  await sleep(15000); await p.evaluate(() => { if (G.Game.state === 'levelup') { const c = document.querySelector('#scr-levelup .card, #scr-levelup button'); if (c) c.click(); } });
  let ids = await p.evaluate(() => G.Moves.ALL.map(m => m.id)); if (process.argv[3]) ids = ids.slice(ids.indexOf(process.argv[3]));
  console.log('moves:', ids.length);
  const results = [];
  for (const id of ids) {
    for (const lvl of [1, 5]) {
      ctx = `${id}@L${lvl}`;
      await p.evaluate(() => { const b = document.querySelector('#scr-bond:not(.hidden) button, #scr-item:not(.hidden) button, #scr-levelup:not(.hidden) .card'); if (b) b.click(); }); await sleep(300);
      const r = await p.evaluate(async (id, lvl) => {
        const sl = ms => new Promise(r => setTimeout(r, ms));
        const pl = G.Game.player; if (G.Game.state !== 'playing') return { err: 'state=' + G.Game.state };
        if (!pl) return { err: 'sem player' };
        pl.hp = pl.maxHp = 1e7; pl.invuln = 1e9; pl.xpNext = 1e12;
        pl.moves.length = 0; pl.slots.length = 0; pl.active = 0;
        const m = G.Moves.instance(id, lvl);
        pl.moves.push(m); pl.slots.push([m]); pl.setActive(0);
        // reúne inimigos em volta (HP alto para sobreviverem)
        const all = G.EnemyMgr.all();
        let n = 0;
        for (const e of all) { if (e.dead || e.boss) continue; const a = n++ * 0.9; e.x = pl.x + Math.cos(a) * (80 + (n % 5) * 40); e.y = pl.y + Math.sin(a) * (80 + (n % 5) * 40); e.hp = e.maxHp = 1e6; if (n > 14) break; }
        const before = all.reduce((s, e) => s + (e.maxHp - e.hp), 0);
        const pj0 = G.Projectiles && G.Projectiles.count ? G.Projectiles.count : 0;
        let thrown = null;
        m.t = 0;
        const buff0 = JSON.stringify(Object.keys(pl).filter(k => /buff|mul/i.test(k)).map(k => pl[k]));
        await sl(1700);
        const buffMoved = JSON.stringify(Object.keys(pl).filter(k => /buff|mul/i.test(k)).map(k => pl[k])) !== buff0;
        const after = G.EnemyMgr.all().reduce((s, e) => s + (e.maxHp - e.hp), 0);
        return { n, dmg: Math.round(after - before), thrown, fx: G.FX.count, kind: m.kind, buffMoved, state: G.Game.state };
      }, id, lvl);
      results.push({ id, lvl, ...r });
    }
  }
  const bad = results.filter(r => r.thrown || r.err || (r.dmg <= 0 && r.kind !== 'buff') || (r.kind === 'buff' && !r.buffMoved));
  console.log('RESULTADOS:', results.length, ' suspeitos:', bad.length);
  bad.forEach(r => console.log(JSON.stringify(r)));
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 40).forEach(e => console.log(e));
  require('fs').writeFileSync(process.argv[2], JSON.stringify(results));
  await b.close();
})().catch(e => { console.log('FALHA SCANNER', e.message); process.exit(1); });
