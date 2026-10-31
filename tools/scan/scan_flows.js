const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; let ctx = 'boot'; const OUT = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 120000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1100, height: 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(`[${ctx}] ${e.message.slice(0, 140)}`));
  p.on('console', m => { if (m.type() === 'error') errs.push(`[${ctx}] ${m.text().slice(0, 160)}`); });
  await p.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  await p.evaluate(() => { const s = G.DB.save; s.partner = 1; s.starter = 1; s.owned = s.owned || {}; s.owned[1] = { at: Date.now() }; s.coins = 2000000; s.tickets = { t1: 2000, t10: 5 }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Flow.goMenu(); });
  await sleep(1000);
  const log = (...a) => console.log(...a);
  // ---- LOJA ----
  ctx = 'upgrades';
  await p.evaluate(() => document.querySelector('#scr-menu [data-go="upgrades"]').click()); await sleep(800);
  const buy = await p.evaluate(async () => {
    const sl = ms => new Promise(r => setTimeout(r, ms)); let clicks = 0; const c0 = G.DB.save.coins;
    for (let i = 0; i < 400; i++) {
      const bs = [...document.querySelectorAll('#scr-upgrades button')].filter(b => !b.disabled && /\d/.test(b.textContent) && b.closest('.upg, .row, div'));
      const target = bs.find(b => /\d{2,}/.test(b.textContent) && !/Voltar/i.test(b.textContent));
      if (!target) break; target.click(); clicks++; await sl(15);
    }
    return { clicks, c0, coinsAfter: G.DB.save.coins, spent: c0 - G.DB.save.coins, lv: JSON.stringify(G.DB.upgradesOf(1)) };
  });
  log('LOJA:', JSON.stringify(buy));
  await p.screenshot({ path: `${OUT}/f_upgrades.png` });
  // ---- GACHA ----
  ctx = 'gacha';
  await p.evaluate(() => { G.UI.hideAll(); G.Flow.goMenu(); }); await sleep(400);
  await p.evaluate(() => document.querySelector('#scr-menu [data-go="gacha"]').click()); await sleep(800);
  const g = await p.evaluate(async () => {
    const sl = ms => new Promise(r => setTimeout(r, ms)); const out = [];
    const btns = [...document.querySelectorAll('#scr-gacha button')].filter(b => /GIRAR/i.test(b.textContent));
    for (const b of btns) { const t0 = G.DB.save.tickets.t1; b.click(); await sl(2500); out.push({ btn: b.textContent.trim().slice(0, 30), ticketsUsed: t0 - G.DB.save.tickets.t1 }); }
    return { out, owned: Object.keys(G.DB.save.owned).length, pulls: G.DB.save.stats.pulls };
  });
  log('GACHA:', JSON.stringify(g));
  await p.screenshot({ path: `${OUT}/f_gacha.png` });
  // ---- RUN + PAUSA + FIM ----
  ctx = 'run';
  await p.evaluate(() => { G.UI.hideAll(); G.Game.startRun(); }); await sleep(3000);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); G.Game.player.godMode = true; });
  await p.keyboard.press('Escape'); await sleep(700);
  log('PAUSA estado:', await p.evaluate(() => G.Game.state), 'visivel:', await p.evaluate(() => [...document.querySelectorAll('[id^=scr-]')].filter(e => !e.classList.contains('hidden')).map(e => e.id).join(',')));
  await p.screenshot({ path: `${OUT}/f_pause.png` });
  await p.keyboard.press('Escape'); await sleep(700);
  log('apos retomar:', await p.evaluate(() => G.Game.state));
  await p.evaluate(() => { try { const b = document.querySelector('#scr-pause button'); } catch (e) {} });
  ctx = 'endrun';
  await p.evaluate(() => { G.Game.quitRun && G.Game.quitRun(); }); await sleep(1500);
  log('FIM estado:', await p.evaluate(() => G.Game.state), 'visivel:', await p.evaluate(() => [...document.querySelectorAll('[id^=scr-]')].filter(e => !e.classList.contains('hidden')).map(e => e.id).join(',')));
  await p.screenshot({ path: `${OUT}/f_over.png` });
  log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => log(e));
  await b.close();
})().catch(e => { console.log('FALHA SCANNER', e.message); process.exit(1); });
