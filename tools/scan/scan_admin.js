// Painel de admin/testes: 1) um jogador comum não ganha poderes; 2) todos os botões funcionam (sem erro de JS, com efeito);
// 3) nada cortado/fora da tela em 4 tamanhos. Uso: node tools/scan/scan_admin.js <pasta> [pagina=dev.html]
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = process.argv[2], PAGE = process.argv[3] || 'dev.html';
const errs = [];
const VIEWS = [['desktop', 1366, 768], ['notebook', 1100, 700], ['celular-v', 390, 844], ['celular-h', 844, 390]];

async function boot(b, w, h, admin) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: w < 700 });
  p.on('dialog', d => d.dismiss());
  p.on('pageerror', e => errs.push(`[${admin ? 'admin' : 'comum'} ${w}x${h}] ${e.message.slice(0, 160)}`));
  p.on('console', m => { if (m.type() === 'error') errs.push(`[${admin ? 'admin' : 'comum'} ${w}x${h}] ${m.text().slice(0, 160)}`); });
  if (admin) await p.evaluateOnNewDocument(() => { try { localStorage.setItem('ps_admin_authenticated', 'true'); } catch (e) { /* nada */ } });
  await p.goto('http://127.0.0.1:8080/' + PAGE, { waitUntil: 'networkidle2' });
  await sleep(1200);
  await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(500);
  await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
  return p;
}
async function startRun(p, dex) {
  await p.evaluate(sp => { const s = G.DB.save; s.partner = s.starter = sp; s.owned = s.owned || {}; s.owned[sp] = { at: Date.now() }; document.querySelectorAll('#scr-recover').forEach(e => e.classList.add('hidden')); G.UI.hideAll(); G.Game.startRun(); }, dex);
  await sleep(2500);
  await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); });
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'], protocolTimeout: 180000 });

  // ---------- 1) jogador comum ----------
  {
    const p = await boot(b, 1100, 700, false);
    await startRun(p, 4);
    const before = await p.evaluate(() => { const pl = G.Game.player; return { god: !!pl.godMode, lv: pl.level, mega: !!(G.Mega && G.Mega.isActive) }; });
    for (const k of ['KeyG', 'KeyL', 'KeyK', 'KeyE', 'KeyR', 'KeyM']) { await p.keyboard.press(k); await sleep(150); }
    await sleep(400);
    const after = await p.evaluate(() => { const pl = G.Game.player; return { god: !!pl.godMode, lv: pl.level, state: G.Game.state, mega: !!(G.Mega && G.Mega.isActive) }; });
    await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); });
    const globals = await p.evaluate(() => ({ admin: typeof window.admin, AdminPanel: typeof window.AdminPanel, adminUnlockAll: typeof window.adminUnlockAll, adminSetTickets: typeof window.adminSetTickets, adminTools: typeof window.adminTools, adminLogin: typeof window.adminLogin, G: typeof window.G }));
    const pill = await p.evaluate(() => { const e = document.getElementById('admin-float-pill'); return e ? getComputedStyle(e).display : 'sem pill'; });
    await p.keyboard.press('F2'); await sleep(300);
    const panelOpen = await p.evaluate(() => { const e = document.getElementById('admin-debug-panel'); return e ? getComputedStyle(e).display : 'sem painel'; });
    const tk = await p.evaluate(() => { try { window.adminSetTickets && window.adminSetTickets(777); return G.DB && G.DB.save.tickets; } catch (e) { return 'erro ' + e.message; } });
    console.log('--- JOGADOR COMUM (sem flag de admin) ---');
    console.log('antes', JSON.stringify(before), 'depois de G/L/K/E/R/M', JSON.stringify(after));
    console.log('atalhos de teste funcionam para jogador comum?', (after.god || after.lv > before.lv || after.mega) ? 'SIM (FALHA DE SEGURANÇA)' : 'não');
    const blocked = tk && tk.t1 === 777 ? 'NÃO BLOQUEADO' : 'bloqueado';
    console.log('adminSetTickets pelo console (jogador comum):', blocked);
    console.log('globais no window:', JSON.stringify(globals), '| pill:', pill, '| F2 abre painel:', panelOpen, '| adminSetTickets pelo console:', JSON.stringify(tk));
    await p.close();
  }

  // login com a chave real (lida do histórico do git, nunca impressa) e com chave errada
  {
    let secret = '';
    try { const src = require('child_process').execSync('git show e609eab:js/ui/debug_panel.js', { cwd: 'E:/pokesurvivor-main', encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); secret = (src.match(/ADMIN_SECRET = '([^']*)'/) || [])[1] || ''; } catch (e) { /* sem git */ }
    const p = await boot(b, 1100, 700, false);
    const wrong = await p.evaluate(() => window.adminLogin('senha-errada'));
    const ok = secret ? await p.evaluate(s => window.adminLogin(s), secret) : null;
    const flag = await p.evaluate(() => localStorage.getItem('ps_admin_authenticated'));
    console.log('login com chave errada:', wrong, '| com a chave real:', ok, '| flag gravada:', flag, '| texto da chave no código atual:', require('fs').readFileSync('E:/pokesurvivor-main/js/ui/debug_panel.js', 'utf8').includes(secret) ? 'AINDA PRESENTE' : 'removido');
    await p.close();
  }

  // ---------- 2) admin: botões ----------
  const p = await boot(b, 1366, 768, true);
  await startRun(p, 4);
  await p.evaluate(() => { const pl = G.Game.player; pl.godMode = false; });
  // F2 de verdade: o painel precisa ficar ABERTO depois de uma tecla (já houve duplo toggle)
  await p.keyboard.press('F2'); await sleep(400);
  const f2 = await p.evaluate(() => getComputedStyle(document.getElementById('admin-debug-panel')).display);
  console.log('F2 abre o painel (admin)?', f2 !== 'none' ? 'sim' : 'NÃO (display: ' + f2 + ')');
  await p.keyboard.press('Backquote'); await sleep(300);
  const bq = await p.evaluate(() => getComputedStyle(document.getElementById('admin-debug-panel')).display);
  console.log('Crase alterna o painel?', bq !== f2 ? 'sim' : 'NÃO (display continua ' + bq + ')');
  await p.evaluate(() => window.adminTools.open()); await sleep(300);
  const panelInfo = await p.evaluate(() => {
    const el = document.getElementById('admin-debug-panel');
    const all = [...document.querySelectorAll('#admin-debug-panel button')].map(b => ({ id: b.id, txt: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 50) }));
    return { exists: !!el, display: el && getComputedStyle(el).display, buttons: all, pills: document.querySelectorAll('#admin-float-pill').length, panels: document.querySelectorAll('#admin-debug-panel').length };
  });
  console.log('\n--- PAINEL (admin) --- painéis:', panelInfo.panels, 'pills:', panelInfo.pills, 'botões:', panelInfo.buttons.length, 'display:', panelInfo.display);

  await p.evaluate(() => { const o = G.UI.toast; window.__lastToast = ''; G.UI.toast = function (m, t) { window.__lastToast = String(m); return o.apply(this, arguments); }; });
  const snap = () => p.evaluate(() => {
    const pl = G.Game.player, s = G.DB.save;
    return { lv: pl && pl.level, xp: pl && Math.round(pl.xp), hp: pl && Math.round(pl.hp), god: pl && !!pl.godMode, dex: pl && pl.dex, coins: s.coins, runCoins: pl && pl.coins, t1: (s.tickets || {}).t1, rifts: G.DB.getTotalRiftsCleared ? G.DB.getTotalRiftsCleared() : null,
      spawnOff: !!G.Spawner.disabled, zoom: G.Camera.zoom, wx: window.WeatherSystem && window.WeatherSystem.current ? window.WeatherSystem.current.id || window.WeatherSystem.current.name : (G.Weather && G.Weather.current && (G.Weather.current.id || G.Weather.current.name)),
      mega: !!(G.Mega && G.Mega.isActive), scene: G.MegaScene && G.MegaScene.phase, state: G.Game.state, capture: !!(G.Capture && G.Capture.isCapturing), arena: !!G.Rift.inArena, owned: Object.keys(s.owned || {}).length,
      toast: window.__lastToast || '', fb: (document.getElementById('admin-unlock-feedback') || {}).textContent || '', shiny: pl && !!pl.shiny, combo: pl && G.Player.comboSize ? G.Player.comboSize(pl.level) : null, force: G.Gacha ? JSON.stringify([G.Gacha.debugForceShiny && 0]) : '' };
  });
  const closeStuff = () => p.evaluate(() => { document.querySelectorAll('#scr-levelup:not(.hidden) .card, #scr-item:not(.hidden) button').forEach((c, i) => { if (i === 0) c.click(); }); const g = document.querySelector('#scr-gacha:not(.hidden) .back, #scr-gacha:not(.hidden) [data-close], #scr-gacha:not(.hidden) .btn-back'); if (g) g.click(); G.UI.hideAll && G.UI.hideAll(); });
  const report = [];
  // dados de entrada nos campos que os botões leem
  await p.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    set('admin-species-input', 'pikachu'); set('admin-coins-input', '500'); set('admin-tickets-debug-input', '300'); set('admin-dex-search', 'charizard'); set('admin-tickets-input', '1000'); set('admin-sim-count-input', '20'); });
  for (const bt of panelInfo.buttons) {
    if (!bt.id) continue;   // chips do menu: testados à parte
    if (['admin-close-btn', 'admin-panel-close-btn'].includes(bt.id)) continue;
    const st = await p.evaluate(() => G.Game.state);
    if (st !== 'playing') { await closeStuff(); await startRun(p, 4); await p.evaluate(() => window.adminTools.open()); await sleep(200); }
    await p.evaluate(() => { window.__lastToast = ''; const f = document.getElementById('admin-unlock-feedback'); if (f) { f.textContent = ''; f.style.display = 'none'; } });
    const before = await snap();
    const errBefore = errs.length;
    let clicked = true;
    try { await p.evaluate(id => { const e = document.getElementById(id); e.scrollIntoView({ block: 'center' }); }, bt.id); await sleep(60); await p.click('#' + bt.id); } catch (e) { clicked = false; }
    await sleep(bt.id.includes('simulation') || bt.id.includes('capture') ? 900 : 350);
    const after = await snap();
    const diff = Object.keys(after).filter(k => !['toast', 'fb'].includes(k) && JSON.stringify(after[k]) !== JSON.stringify(before[k])).map(k => `${k}:${JSON.stringify(before[k])}->${JSON.stringify(after[k])}`);
    const newErrs = errs.slice(errBefore);
    report.push({ id: bt.id, txt: bt.txt, clicked, diff, toast: after.toast.slice(0, 60), fb: (after.fb || '').slice(0, 60), errs: newErrs });
    if (after.capture || after.state !== 'playing') { await closeStuff(); }
  }
  console.log('\nBOTÃO | EFEITO');
  for (const r of report) console.log(`${r.id.padEnd(30)} ${r.clicked === false ? 'NÃO CLICÁVEL' : (r.diff && r.diff.length ? r.diff.join(' ; ') + (r.toast || r.fb ? '  | "' + (r.toast || r.fb).slice(0, 40) + '"' : '') : (r.toast || r.fb ? '(aviso) ' + (r.toast || r.fb) : 'SEM EFEITO VISÍVEL'))}${r.errs && r.errs.length ? '  !! ERRO: ' + r.errs.join(' | ') : ''}`);

  // menu de seções: cada chip leva à seção certa (que fica visível dentro do painel)
  {
    const navRes = await p.evaluate(async () => {
      const panel = document.getElementById('admin-debug-panel'), out = [];
      panel.scrollTop = 0;
      for (const b of panel.querySelectorAll('#admin-nav button')) {
        panel.scrollTop = 0; b.click();
        await new Promise(r => setTimeout(r, 650));
        const t = document.getElementById(b.dataset.go), pr = panel.getBoundingClientRect(), tr = t ? t.getBoundingClientRect() : null;
        out.push(b.textContent + ':' + (tr && tr.top >= pr.top - 2 && tr.top < pr.bottom - 20 ? 'ok' : 'FORA'));
      }
      panel.scrollTop = 0;
      return out;
    });
    const nv = await p.evaluate(() => { const n = document.getElementById('admin-nav'), pr = document.getElementById('admin-debug-panel').getBoundingClientRect(), r = n.getBoundingClientRect(); return { top: Math.round(r.top - pr.top), noTopo: r.top - pr.top < 70 }; });
    console.log('Menu de seções (no topo do painel: ' + nv.noTopo + '):', navRes.join(' '));
  }

  // "Ver golpe": os 18 tipos pela caixa de seleção do painel
  {
    await p.evaluate(() => { G.Mega.reset(); G.MegaScene.stop(); G.Game.player.godMode = true; });
    const res = [];
    const types = await p.evaluate(() => [...document.querySelectorAll('#admin-megaskill-type option')].map(o => o.value));
    for (const t of types) {
      await p.evaluate(t => { const s = document.getElementById('admin-megaskill-type'); s.value = t; }, t);
      await p.click('#admin-btn-trigger-megaskill'); await sleep(250);
      const during = await p.evaluate(() => ({ ph: G.MegaScene.phase, buff: !!G.Mega.isActive }));
      await sleep(4300);
      const after = await p.evaluate(() => ({ ph: G.MegaScene.phase, buff: !!G.Mega.isActive }));
      res.push(t + ':' + (during.ph !== 'idle' && !during.buff && after.ph === 'idle' && !after.buff ? 'ok' : 'ERRO ' + JSON.stringify([during, after])));
    }
    console.log('Ver golpe (' + types.length + ' tipos; só o golpe, sem buff):', res.join(' '));
  }

  // atalhos de teste: com painel FECHADO não fazem nada; com painel ABERTO funcionam (admin)
  {
    await p.evaluate(() => { window.adminTools.close(); const pl = G.Game.player; pl.godMode = false; pl.isGodMode = false; });
    await p.keyboard.press('KeyG'); await sleep(200);
    const closed = await p.evaluate(() => !!G.Game.player.godMode);
    await p.evaluate(() => window.adminTools.open());
    await p.keyboard.press('KeyG'); await sleep(200);
    const open = await p.evaluate(() => !!G.Game.player.godMode);
    await p.evaluate(() => { G.Game.player.godMode = false; });
    console.log('Atalho G com painel fechado:', closed ? 'ATIVOU (ruim)' : 'não faz nada (ok)', '| com painel aberto:', open ? 'ativa (ok)' : 'NÃO ATIVOU');
  }

  // ---------- 3) enquadramento ----------
  console.log('\n--- ENQUADRAMENTO (painel aberto) ---');
  for (const [name, w, h] of VIEWS) {
    await p.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: w < 700 });
    await sleep(500);
    await p.evaluate(() => { document.querySelectorAll('[id^=scr-]').forEach(e => e.classList.add('hidden')); const e = document.getElementById('admin-debug-panel'); if (e) { e.style.display = 'block'; e.scrollTop = 0; } });
    await sleep(300);
    const m = await p.evaluate(() => {
      const panel = document.getElementById('admin-debug-panel'), vw = innerWidth, vh = innerHeight, r = panel.getBoundingClientRect();
      const bad = [];
      const pr = panel.getBoundingClientRect();
      for (const el of panel.querySelectorAll('button, input, select, div[id]')) {
        if (el.offsetParent === null) continue;
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') bad.push('texto cortado: ' + (el.id || el.textContent.trim().slice(0, 30)));
        else if (el.tagName === 'BUTTON' && el.scrollWidth > el.clientWidth + 1) bad.push('estoura o botão: ' + (el.id || el.textContent.trim().slice(0, 30)));
        const er = el.getBoundingClientRect();
        if (er.right > pr.right + 1 || er.left < pr.left - 1) bad.push('passa da borda do painel: ' + (el.id || el.textContent.trim().slice(0, 30)));
      }
      const pill = document.getElementById('admin-float-pill'), pl = pill ? pill.getBoundingClientRect() : null;
      const over = pl && getComputedStyle(pill).display !== 'none' ? !(pl.right < r.left || pl.left > r.right || pl.bottom < r.top || pl.top > r.bottom) : false;
      const hud = document.getElementById('bottom-rpg-hud') || document.querySelector('.hud-combo-container'); const hr = hud ? hud.getBoundingClientRect() : null;
      const hudOver = hr ? !(hr.right < r.left || hr.left > r.right || hr.bottom < r.top || hr.top > r.bottom) : false;
      return { vw, vh, left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), foraTela: r.left < 0 || r.right > vw + 0.5 || r.top < 0 || r.bottom > vh + 0.5, scrollavel: panel.scrollHeight > panel.clientHeight, altura: panel.scrollHeight, bad: [...new Set(bad)].slice(0, 12), pillSobrePainel: over, hudSobrePainel: hudOver,
        z: getComputedStyle(panel).zIndex, pillTam: pl ? [Math.round(pl.width), Math.round(pl.height)] : null };
    });
    console.log(`${name} ${w}x${h}: painel x ${m.left}-${m.right} (largura ${m.w}) y ${m.top}-${m.bottom} | fora da tela: ${m.foraTela} | rola: ${m.scrollavel} (conteúdo ${m.altura}px) | pill sobre painel: ${m.pillSobrePainel} | HUD sobreposto: ${m.hudSobrePainel} | z=${m.z}`);
    if (m.bad.length) console.log('   problemas:', m.bad.join(' ; '));
    await p.screenshot({ path: `${OUT}/admin_${name}.png` });
    // rola até o fim e confere se o último botão fica visível
    const last = await p.evaluate(() => { const panel = document.getElementById('admin-debug-panel'); panel.scrollTop = panel.scrollHeight; const bs = [...panel.querySelectorAll('button')].filter(b => b.offsetParent); const lb = bs[bs.length - 1], r = lb.getBoundingClientRect(); return { id: lb.id, visivel: r.bottom <= innerHeight + 1 && r.top >= 0 }; });
    console.log(`   último botão (${last.id}) visível após rolar: ${last.visivel}`);
    await p.screenshot({ path: `${OUT}/admin_${name}_fim.png` });
  }
  console.log('\n=== ERROS JS (' + errs.length + ') ===');
  [...new Set(errs)].slice(0, 30).forEach(e => console.log(e));
  await b.close();
})().catch(e => { console.log('FALHA', e.message, e.stack ? e.stack.split('\n')[1] : ''); process.exit(1); });
