const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot'; const OUT = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  for (const cfg of [{ name: 'mobile', w: 844, h: 390, mobile: true }, { name: 'portrait', w: 390, h: 844, mobile: true }, { name: 'en', w: 1100, h: 700, url: 'en/index.html' }]) {
    const p = await b.newPage();
    await p.setViewport({ width: cfg.w, height: cfg.h, isMobile: !!cfg.mobile, hasTouch: !!cfg.mobile, deviceScaleFactor: 1 });
    p.on('dialog', d => d.dismiss());
    p.on('pageerror', e => errs.push(`[${cfg.name}] ${e.message.slice(0, 140)}`));
    p.on('console', m => { if (m.type() === 'error') errs.push(`[${cfg.name}] ${m.text().slice(0, 140)}`); });
    p.on('response', r => { if (r.status() >= 400) errs.push(`[${cfg.name}] HTTP ${r.status()} ${r.url().slice(-80)}`); });
    await p.goto('http://127.0.0.1:8080/' + (cfg.url || 'dev.html'), { waitUntil: 'networkidle2' });
    await sleep(1200);
    await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
    await p.screenshot({ path: `${OUT}/${cfg.name}_0login.png` });
    await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
    await p.evaluate(() => { const s = G.DB.save; s.partner = 1; s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Flow.goMenu(); }); await sleep(900);
    await p.screenshot({ path: `${OUT}/${cfg.name}_1menu.png` });
    await p.evaluate(() => document.querySelector('#scr-menu [data-go="upgrades"]').click()); await sleep(900);
    await p.screenshot({ path: `${OUT}/${cfg.name}_2upg.png` });
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    console.log(cfg.name, 'overflow horizontal:', ov.sw > ov.cw + 2, JSON.stringify(ov));
    await p.evaluate(() => { G.UI.hideAll(); G.Game.startRun(); }); await sleep(2500);
    await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); G.Game.player.godMode = true; });
    await sleep(2500);
    await p.screenshot({ path: `${OUT}/${cfg.name}_3run.png` });
    await p.close();
  }
  console.log('=== ERROS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
