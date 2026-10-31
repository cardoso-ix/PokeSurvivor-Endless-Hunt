// Mostra um Pokémon (dex) dentro do jogo em várias direções. Uso: node tools/scan/scan_hd.js <pasta> <dex>
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const OUT = process.argv[2], DEX = +process.argv[3] || 6;
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
  await p.evaluate(sp => { const s = G.DB.save; s.partner = s.starter = sp; s.owned = s.owned || {}; s.owned[sp] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); }, DEX);
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const pl = G.Game.player; pl.godMode = true; pl.hp = pl.maxHp = 1e7; });
  // Pokémon evoluído não é jogável direto: sobe o nível da linha até a forma pedida (nv 5/12/21)
  for (const lv of [5, 12, 21]) { await p.evaluate(lv => { const pl = G.Game.player; pl.level = lv; pl.xp = 0; pl.xpNext = G.Player.xpFor(lv); if (pl.checkEvolutionMilestones) pl.checkEvolutionMilestones(); }, lv); await sleep(1800); await p.evaluate(() => { const b = document.querySelector('#scr-levelup:not(.hidden) .card, #scr-bond:not(.hidden) button, #scr-item:not(.hidden) button'); if (b) b.click(); }); }
  await sleep(800);
  console.log('dex jogador:', await p.evaluate(() => G.Game.player.dex));
  await p.screenshot({ path: `${OUT}/hd_idle.png` });
  for (const k of ['KeyD', 'KeyS']) { await p.keyboard.down(k); await sleep(900); await p.screenshot({ path: `${OUT}/hd_walk_${k}.png` }); await p.keyboard.up(k); }
  await sleep(2500); await p.screenshot({ path: `${OUT}/hd_combat.png` });
  console.log('=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 20).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
