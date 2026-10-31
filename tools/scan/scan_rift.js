const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot'; const OUT = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(`[${ctx}] ${e.message.slice(0, 150)}`));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /fallo en un fotograma/.test(t)) errs.push(`[${ctx}] ${t.slice(0, 170)}`); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = 1; s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; pl.xpNext = 1e12; });
  const cases = [{ n: 'pikachu', sp: 'pikachu', shiny: false }, { n: 'mewtwo-leg', sp: 'mewtwo', shiny: false }, { n: 'shiny-eevee', sp: 'eevee', shiny: true }, { n: 'dup-bulbasaur', sp: 'bulbasaur', shiny: false }, { n: 'dup-pikachu', sp: 'pikachu', shiny: false }, { n: 'shiny-mewtwo', sp: 'mewtwo', shiny: true }];
  for (const c of cases) {
    ctx = 'rift ' + c.n;
    const r0 = await p.evaluate(c => { const pl = G.Game.player; pl.level = 30; pl.hp = pl.maxHp; const r = { coins: G.DB.save.coins, owned: Object.keys(G.DB.save.owned).length, shinies: Object.keys(G.DB.save.shiny || {}).length, t1: G.DB.save.tickets.t1 + pl.t1 }; G.Rift.start(null, c.sp, c.shiny, 30); return r; }, c);
    await sleep(2500);
    await p.screenshot({ path: OUT + '/r_' + c.n + '_arena.png' });
    await p.evaluate(() => { for (const e of G.EnemyMgr.all()) if (e.boss && !e.dead) e.hurt(1e9, '#fff', 1, 0, 0); });
    let shot = false, last = null;
    for (let i = 0; i < 16; i++) {
      await sleep(900);
      const v = await p.evaluate(() => ({ st: G.Game.state, arena: G.Rift.inArena }));
      if (!shot && i === 2) { await p.screenshot({ path: OUT + '/r_' + c.n + '_ball.png' }); shot = true; }
      if (v.st === 'choice') await p.evaluate(() => { const b = document.querySelector('[id^=scr-]:not(.hidden) .card, [id^=scr-]:not(.hidden) button'); if (b) b.click(); });
      last = v; if (!v.arena && v.st === 'playing') break;
    }
    await sleep(800);
    const r1 = await p.evaluate(() => { const pl = G.Game.player; return { arena: G.Rift.inArena, st: G.Game.state, coins: G.DB.save.coins + pl.coins, owned: Object.keys(G.DB.save.owned).length, shinies: Object.keys(G.DB.save.shiny || {}).length, t1: G.DB.save.tickets.t1 + pl.t1, cleared: G.Rift.completedCount }; });
    console.log(c.n.padEnd(14), 'saiu da arena:', !last.arena, 'estado', r1.st, '| +owned', r1.owned - r0.owned, '+shiny', r1.shinies - r0.shinies, '+coins', r1.coins - r0.coins, '+tickets', r1.t1 - r0.t1);
  }
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA SCANNER', e.message); process.exit(1); });
