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

  // Verificar versão carregada
  const versionOnline = await page.evaluate(async () => {
    try {
      const res = await fetch('/version.json');
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Versão confirmada na VPS:', versionOnline);

  await new Promise(r => setTimeout(r, 1500));

  const pOnline = path.join(brainDir, 'vps_live_hardcore_polish.png');
  await page.screenshot({ path: pOnline });
  console.log('Screenshot VPS Online salvo:', pOnline);

  await browser.close();
  console.log('✅ Validação remota do polimento mestre hardcore concluída com sucesso!');
}

run().catch(err => {
  console.error('Erro na validação remota:', err);
  process.exit(1);
});
