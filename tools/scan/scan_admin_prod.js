// Painel de admin no BUILD DE PRODUÇÃO (index.html): jogador comum bloqueado, admin consegue abrir. Uso: node tools/scan/scan_admin_prod.js
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'] });
  const errs = [];
  const open = async admin => {
    const p = await b.newPage(); await p.setViewport({ width: 1100, height: 700 });
    p.on('dialog', d => d.dismiss()); p.on('pageerror', e => errs.push(e.message.slice(0, 140)));
    if (admin) await p.evaluateOnNewDocument(() => localStorage.setItem('ps_admin_authenticated', 'true'));
    await p.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' }); await sleep(1500);
    await p.evaluate(() => { const t = document.querySelector('.tapstart'); if (t) t.click(); }); await sleep(400);
    await p.evaluate(() => { const g = document.querySelector('#btn-guest'); if (g) g.click(); }); await sleep(1200);
    return p;
  };
  const disp = p => p.evaluate(() => { const e = document.getElementById('admin-debug-panel'); return e ? getComputedStyle(e).display : 'sem painel'; });
  let p = await open(false);
  await p.keyboard.press('F2'); await sleep(300);
  console.log('comum: F2 ->', await disp(p), '| G no window?', await p.evaluate(() => typeof window.G), '| adminSetTickets ->', await p.evaluate(() => window.adminSetTickets(555)), '| adminUnlockAll ->', await p.evaluate(() => window.adminUnlockAll(true)));
  await p.close();
  p = await open(true);
  await p.keyboard.press('F2'); await sleep(400);
  const open1 = await disp(p);
  const nbtn = await p.evaluate(() => document.querySelectorAll('#admin-debug-panel button').length);
  await p.keyboard.press('Backquote'); await sleep(300);
  console.log('admin: F2 ->', open1, '| botões:', nbtn, '| crase fecha ->', await disp(p), '| pill visível com painel fechado:', await p.evaluate(() => getComputedStyle(document.getElementById('admin-float-pill')).display));
  await p.evaluate(() => window.adminSetTickets(555)); await sleep(100);
  console.log('admin: adminSetTickets(555) ->', await p.evaluate(() => document.getElementById('admin-tickets-display') && document.getElementById('admin-tickets-display').textContent));
  console.log('erros JS:', errs.length, errs.slice(0, 3));
  await b.close();
})();
