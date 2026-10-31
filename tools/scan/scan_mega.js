// Golpe do Mega por tipo: screenshots em vários instantes + inimigos atingidos. Uso: node tools/scan/scan_mega.js <pasta> [tipo,tipo] [pagina=dev.html]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const OUT = process.argv[2], PAGE = process.argv[4] || 'dev.html';
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error' || /falhou/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto('http://127.0.0.1:8080/' + PAGE, { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = s.starter = 4; s.owned = s.owned || {}; s.owned[4] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); });
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; });
  const types = process.argv[3] && process.argv[3] !== '-' ? process.argv[3].split(',') : await p.evaluate(() => G.MegaSkillVFXManager.allTypes);
  for (const ty of types) {
    await sleep(2500);   // deixa os inimigos se aproximarem
    const before = await p.evaluate(() => G.EnemyMgr.all().filter(e => !e.dead).length);
    await p.evaluate(ty => { const pl = G.Game.player; pl.mon.types = [ty]; pl.megaEnergy = 100; G.Mega.gauge = 100; G.Mega.trigger(); }, ty);
    await sleep(1000); await p.screenshot({ path: `${OUT}/mg_${ty}_0cut.png` });
    await sleep(1000); // charge
    const shots = [];
    for (let i = 0; i < 6; i++) { await sleep(280); await p.screenshot({ path: `${OUT}/mg_${ty}_s${i}.png` }); }
    await sleep(900);
    const st = await p.evaluate(() => ({ act: G.Mega.isActive, ph: G.MegaScene.phase, alive: G.EnemyMgr.all().filter(e => !e.dead).length }));
    console.log(ty, 'inimigos antes', before, 'depois', st.alive, '| mega ativo', st.act, 'fase', st.ph);
    await p.evaluate(() => { G.Mega.reset(); });
  }
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 20).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
