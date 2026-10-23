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

  // Clica no botão Jogar como Convidado
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const guestBtn = btns.find(b => b.textContent.includes('Convidado') || b.textContent.includes('Invitado'));
    if (guestBtn) guestBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Tira print do menu principal logado como convidado
  const pMenu = path.join(brainDir, 'vps_live_hardcore_menu.png');
  await page.screenshot({ path: pMenu });
  console.log('Screenshot VPS Menu salvo:', pMenu);

  // Iniciar partida
  await page.evaluate(() => {
    const playBtn = document.getElementById('btn-play') || document.querySelector('.btn-play');
    if (playBtn) playBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Selecionar mapa/iniciar se houver modal
  await page.evaluate(() => {
    const startBtn = document.getElementById('btn-stage-start') || document.querySelector('.stage-start-btn');
    if (startBtn) startBtn.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  const pGame = path.join(brainDir, 'vps_live_hardcore_battle.png');
  await page.screenshot({ path: pGame });
  console.log('Screenshot VPS Batalha salvo:', pGame);

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
