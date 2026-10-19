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
  console.log('Acessando VPS Coolify Online:', url);
  await page.goto(url, { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 1200));

  const pOnline = path.join(brainDir, 'vps_live_i18n_ptbr_verified.png');
  await page.screenshot({ path: pOnline });
  console.log('Screenshot VPS Online salvo:', pOnline);

  await browser.close();
  console.log('✅ Validação remota concluída!');
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
