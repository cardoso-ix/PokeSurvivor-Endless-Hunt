// Cutscene + cenário do Mega para os 18 tipos. Uso: node tools/scan/scan_mega.js <pasta> [tipo,tipo]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const OUT = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = s.starter = 4; s.owned = s.owned || {}; s.owned[4] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2200);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; });
  const types = process.argv[3] ? process.argv[3].split(',') : await p.evaluate(() => G.MegaSkillVFXManager.allTypes);
  for (const ty of types) {
    await p.evaluate(ty => { const pl = G.Game.player; pl.mon.types = [ty]; pl.megaEnergy = 100; G.Mega.gauge = 100; G.Mega.reset && 0; G.Mega.trigger(); }, ty);
    await sleep(1100); await p.screenshot({ path: `${OUT}/mega_${ty}_intro.png` });
    await sleep(3200); await p.screenshot({ path: `${OUT}/mega_${ty}_scene.png` });
    const st = await p.evaluate(() => ({ a: G.Mega.isActive, ph: G.MegaScene.phase }));
    console.log(ty, JSON.stringify(st));
    await p.evaluate(() => { G.Mega.reset(); G.Mega.gauge = 100; G.Game.player.megaEnergy = 100; });
    await sleep(300);
  }
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 20).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
