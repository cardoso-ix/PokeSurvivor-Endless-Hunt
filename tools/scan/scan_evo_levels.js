// Em que nível cada linha evolui: 2 estágios -> 12; 3 estágios -> 5 e 12. Uso: node tools/scan/scan_evo_levels.js [pagina=dev.html]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGE = process.argv[2] || 'dev.html';
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage(); await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  await p.goto('http://127.0.0.1:8080/' + PAGE, { waitUntil: 'networkidle2' }); await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  let bad = 0;
  for (const [sp, name, want] of [[19, 'Rattata (2 estágios)', [12]], [58, 'Growlithe (2 estágios)', [12]], [172, 'Pichu (3 estágios)', [5, 12]], [4, 'Charmander (3 estágios)', [5, 12]], [133, 'Eevee (2 estágios, ramificada)', [12]], [1, 'Bulbasaur (3 estágios)', [5, 12]]]) {
    await p.evaluate(sp => { const s = G.DB.save; s.partner = s.starter = sp; s.owned = s.owned || {}; s.owned[sp] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); }, sp);
    await sleep(2200);
    await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; pl.xpNext = 1e12; });
    const seen = [];
    let last = await p.evaluate(() => G.Game.player.dex);
    for (let lv = 2; lv <= 14; lv++) {
      await p.evaluate(lv => { const pl = G.Game.player; pl.level = lv; pl.checkEvolutionMilestones(); }, lv);
      await sleep(250);
      await p.evaluate(() => { const c = document.querySelector('#scr-levelup:not(.hidden) .card'); if (c) c.click(); });
      const d = await p.evaluate(() => G.Game.player.dex);
      if (d !== last) { seen.push(lv); last = d; }
    }
    const ok = JSON.stringify(seen) === JSON.stringify(want);
    if (!ok) bad++;
    console.log(name, 'evoluiu nos níveis', JSON.stringify(seen), 'esperado', JSON.stringify(want), ok ? 'OK' : 'ERRO');
  }
  console.log(bad ? 'COM ERRO' : 'EVOLUÇÃO OK');
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
