const puppeteer = require('C:/Users/eduar/AppData/Local/../Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = process.argv[2];
const errs = [];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  let ctx = 'boot'; p.on('dialog', d => { errs.push(`[${ctx}] DIALOG ${d.type()}: ${d.message().slice(0,80)}`); d.dismiss(); });
  p.on('pageerror', e => errs.push(`[${ctx}] PAGEERROR ${e.message.slice(0,160)}`));
  p.on('console', m => { if (m.type() === 'error') errs.push(`[${ctx}] CONSOLE ${m.text().slice(0,160)}`); });
  p.on('response', r => { if (r.status() >= 400) errs.push(`[${ctx}] HTTP ${r.status()} ${r.url().slice(0,120)}`); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1500);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(800);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('[id^=scr-]')].filter(e => !e.classList.contains('hidden')).map(e => e.id).join(','));
  console.log('inicial:', await vis());
  await p.screenshot({ path: `${OUT}/00_login.png` });
  ctx = 'guest';
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); });
  await sleep(1500);
  console.log('apos guest:', await vis());
  await p.screenshot({ path: `${OUT}/01_after_guest.png` });
  // pular o teste de personalidade
  await p.evaluate(() => { try { const s = G.DB.save; if (!s.partner) { s.partner = 1; s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; G.DB.commit && G.DB.commit(true); } G.UI.hideAll(); G.Flow.goMenu(); } catch (e) { console.log('skip test fail', e.message); } });
  await sleep(1200);
  await p.evaluate(() => { document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); }); await sleep(300);
  console.log('menu:', await vis());
  await p.screenshot({ path: `${OUT}/02_menu.png` });
  const gos = ['dex', 'upgrades', 'gacha', 'goals', 'friends', 'rank', 'settings', 'play'];
  for (const go of gos) {
    ctx = 'menu:' + go;
    await p.evaluate(g => { const b = document.querySelector(`#scr-menu [data-go="${g}"]`); if (b) b.click(); }, go);
    await sleep(1200);
    const v = await vis();
    console.log(go, '->', v);
    await p.screenshot({ path: `${OUT}/10_${go}.png` });
    await p.evaluate(() => { try { G.UI.hideAll(); G.Flow.goMenu(); } catch (e) {} });
    await sleep(500);
  }
  for (const id of ['scr-news', 'scr-support', 'scr-profile', 'scr-legal']) {
    ctx = id;
    await p.evaluate(i => { try { G.UI.hideAll(); G.UI.show(i, true); } catch (e) {} }, id);
    await sleep(600);
    await p.screenshot({ path: `${OUT}/20_${id}.png` });
  }
  console.log('\n=== ERROS (' + errs.length + ') ===');
  [...new Set(errs)].forEach(e => console.log(e));
  await b.close();
})();
