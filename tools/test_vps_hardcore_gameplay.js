const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Mega]') || text.includes('error') || text.includes('Error')) {
      console.log('Console VPS:', text);
    }
  });

  const url = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
  console.log('Iniciando teste de gameplay ao vivo na VPS:', url);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Clicar para entrar na tela principal
  await page.mouse.click(640, 360);
  await new Promise(r => setTimeout(r, 1000));

  // Iniciar partida clicando no botão Jogar / selecionar inicial
  const playBtn = await page.$('#btn-play, .btn-play, #btn-start');
  if (playBtn) {
    await playBtn.click();
    console.log('Botão de jogar clicado.');
  } else {
    // Tenta clicar pelo teclado Enter ou espaço
    await page.keyboard.press('Space');
  }

  await new Promise(r => setTimeout(r, 2000));

  // Se estiver no modal de seleção de mapa ou pokémon, confirmar
  const confirmBtn = await page.$('#btn-stage-start, .btn-primary, #btn-select-confirm');
  if (confirmBtn) {
    await confirmBtn.click();
    console.log('Botão de confirmação de fase clicado.');
  }

  // Deixar rodar alguns segundos para verificar spawn e combate
  await new Promise(r => setTimeout(r, 4000));

  const pOnlineGameplay = path.join(brainDir, 'vps_live_hardcore_gameplay.png');
  await page.screenshot({ path: pOnlineGameplay });
  console.log('Screenshot VPS Gameplay salvo:', pOnlineGameplay);

  await browser.close();
  console.log('✅ Validação de gameplay ao vivo finalizada com êxito!');
}

run().catch(err => {
  console.error('Erro no teste de gameplay ao vivo:', err);
  process.exit(1);
});
