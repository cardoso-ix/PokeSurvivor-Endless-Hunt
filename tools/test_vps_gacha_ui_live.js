const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const url = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Remove a tela de tap-start se presente
  await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.classList.add('hidden');
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convidado'));
    if (guestBtn) guestBtn.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Responde quiz
  for (let i = 0; i < 10; i++) {
    const ok = await page.evaluate(() => {
      const modal = document.getElementById('scr-test');
      const btn = document.querySelector('#test-answers button, #scr-test button');
      if (btn && !modal?.classList.contains('hidden')) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!ok) break;
    await new Promise(r => setTimeout(r, 500));
  }

  await new Promise(r => setTimeout(r, 1500));

  // Avança starter
  await page.evaluate(() => {
    const confirm = document.querySelector('#test-confirm, #btn-test-ok');
    if (confirm) confirm.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Abre roleta e garante que tap-start está oculto
  await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.classList.add('hidden');
    const btns = Array.from(document.querySelectorAll('button'));
    const gachaBtn = btns.find(b => b.textContent.includes('Roleta') || b.textContent.includes('Gacha'));
    if (gachaBtn) gachaBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  const pScr = path.join(brainDir, 'vps_live_gacha_hardcore_clean.png');
  await page.screenshot({ path: pScr });
  console.log('Screenshot limpo salvo:', pScr);

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
