const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot'; const OUT = process.argv[2];
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
  const start = async sp => { await p.evaluate(sp => { const s = G.DB.save; s.partner = sp; s.starter = sp; s.owned = s.owned || {}; s.owned[sp] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); }, sp); await sleep(2200); await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; }); };
  const closeCards = () => p.evaluate(() => { const b = document.querySelector('#scr-levelup:not(.hidden) .card, #scr-bond:not(.hidden) button, #scr-item:not(.hidden) button'); if (b) b.click(); });
  const species = [1, 4, 7, 172, 129, 92, 133, 447, 748, 1, 25];
  for (const sp of species) {
    ctx = 'evo ' + sp;
    await start(sp);
    const trail = [];
    for (const lv of [5, 12, 21]) {
      await p.evaluate(lv => { const pl = G.Game.player; pl.level = lv; pl.xp = 0; pl.xpNext = G.Player.xpFor(lv); if (pl.checkEvolutionMilestones) pl.checkEvolutionMilestones(); }, lv);
      await sleep(1800); await closeCards();
      trail.push(await p.evaluate(() => { const pl = G.Game.player; return pl.mon.name + '#' + pl.dex; }));
    }
    console.log(`evo ${sp}:`, trail.join(' -> '), '| estado', await p.evaluate(() => G.Game.state));
    await p.evaluate(() => { G.Game.quitRun && 0; });
  }
  // ---- MEGA ----
  ctx = 'mega';
  await start(4);
  await p.evaluate(() => { const pl = G.Game.player; pl.level = 12; pl.megaEnergy = 100; G.Mega.gauge = 100; });
  await sleep(300);
  await p.keyboard.press('Space'); await sleep(600);
  console.log('MEGA ativo:', await p.evaluate(() => G.Mega.isActive), 'timeLeft', await p.evaluate(() => +G.Mega.timeLeft.toFixed(1)));
  await p.screenshot({ path: `${OUT}/m_mega_0.png` });
  await sleep(2500);
  await p.screenshot({ path: `${OUT}/m_mega_1.png` });
  await sleep(8500);
  console.log('MEGA apos 11s:', await p.evaluate(() => G.Mega.isActive), 'estado', await p.evaluate(() => G.Game.state));
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA SCANNER', e.message); process.exit(1); });
