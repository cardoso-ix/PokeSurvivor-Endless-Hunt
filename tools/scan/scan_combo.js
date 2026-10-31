// Combo por nível: nv1=1, nv5=2, nv10=3, nv21=4 ataques juntos; sem tela de vínculo. Uso: node tools/scan/scan_combo.js <pasta> [pagina=dev.html]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const OUT = process.argv[2], PAGE = process.argv[3] || 'dev.html';
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto('http://127.0.0.1:8080/' + PAGE, { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; pl.xpNext = 1e12;
    for (const id of ['ember', 'water-gun', 'vine-whip', 'thunder-shock']) pl.addMove(id); });
  let ok = true;
  const want = { 1: 1, 4: 1, 5: 2, 9: 2, 10: 3, 20: 3, 21: 4, 30: 4 };
  for (const lv of Object.keys(want)) {
    await p.evaluate(lv => { const pl = G.Game.player; pl.level = +lv; pl.xp = 0; pl.xpNext = 1e12; if (pl.checkEvolutionMilestones) pl.checkEvolutionMilestones(); }, lv);
    await sleep(500);
    const r = await p.evaluate(() => { const pl = G.Game.player; return { n: pl.activeGroup().length, ids: pl.activeGroup().map(m => m.id), slots: pl.slots.length, title: (document.getElementById('hud-combo-title') || {}).textContent, badge: (document.getElementById('hud-combo-badge') || {}).textContent, dormant: document.querySelectorAll('.hud-skill-card.dormant').length, bondScr: !document.getElementById('scr-bond').classList.contains('hidden'), state: G.Game.state }; });
    const good = r.n === want[lv] && !r.bondScr;
    if (!good) ok = false;
    console.log(`Nv ${lv}: combo=${r.n} (esperado ${want[lv]}) ${good ? 'OK' : 'ERRO'} | ${r.title} | ${r.badge} | guardados=${r.dormant} | estado=${r.state}`);
    if (lv === '1' || lv === '5' || lv === '21') await p.screenshot({ path: `${OUT}/combo_nv${lv}.png` });
  }
  // dispara de verdade: conta os ataques que saem em 1,5 s no nv 21
  const fired = await p.evaluate(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const pl = G.Game.player; pl.level = 21; for (const m of pl.moves) m.t = 0; await sl(1500); return pl.activeGroup().filter(m => m.t > 0 || m.castAt).length; });
  console.log('ataques que dispararam no nv 21:', fired);
  console.log(ok ? 'COMBO OK' : 'COMBO COM ERRO');
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 20).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
