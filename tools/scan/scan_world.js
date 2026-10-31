// Cenário: screenshot de cada bioma (normais + 2 arenas) e FPS médio. Uso: node tools/scan/scan_world.js <pasta> [pagina=dev.html]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const OUT = process.argv[2], PAGE = process.argv[3] || 'dev.html';
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:8080/' + PAGE, { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = s.starter = 4; s.owned = s.owned || {}; s.owned[4] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; pl.xpNext = 1e12; });
  for (const bi of [0, 1, 2, 3, 8]) {
    await p.evaluate(bi => { G.World.setBiome(bi, true); const pl = G.Game.player; pl.x += 900 + bi * 400; pl.y += 700; }, bi);
    await sleep(1200);
    const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else r(Math.round(n / ((performance.now() - t0) / 1000))); })(); }));
    console.log('bioma', bi, 'FPS', fps);
    await p.screenshot({ path: `${OUT}/world_${bi}.png` });
  }
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 20).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
