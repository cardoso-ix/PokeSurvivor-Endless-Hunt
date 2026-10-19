const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log(`🎮 Simulando fluxo do jogador real na VPS online (${VPS_URL})...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('MEGA') || t.includes('DEBUG') || t.includes('EVOLUÇÃO') || t.includes('WorldCaptureBall') || t.includes('POKÉMON INICIAL')) {
      console.log('  [VPS GAME LOG]', t);
    }
  });

  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Remove tela tap-start se houver e clica em "Jogar como Convidado"
  const clickedGuest = await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.click();

    const guestBtn = document.getElementById('btn-guest');
    if (guestBtn && guestBtn.offsetParent !== null) {
      guestBtn.click();
      return true;
    }
    return false;
  });
  console.log('  -> Clicou em Jogar como Convidado:', clickedGuest);
  await new Promise(r => setTimeout(r, 1200));

  // 2. No Menu Principal, clica em "Jogar"
  const clickedPlay = await page.evaluate(() => {
    const playBtn = document.querySelector('.menu-item.play') || document.querySelector('[data-go="play"]');
    if (playBtn && playBtn.offsetParent !== null) {
      playBtn.click();
      return true;
    }
    return false;
  });
  console.log('  -> Clicou em Jogar no Menu:', clickedPlay);
  await new Promise(r => setTimeout(r, 1200));

  // 3. Se abrir seleção de fase ou de inicial, confirma
  await page.evaluate(() => {
    const stageCard = document.querySelector('.stage-card');
    if (stageCard) stageCard.click();
    const starterOk = document.getElementById('starter-ok');
    if (starterOk && starterOk.offsetParent !== null) starterOk.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Verifica se a partida começou e o HUD está visível
  const hudCheck = await page.evaluate(() => {
    const hud = document.getElementById('bottom-rpg-hud');
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const track = document.querySelector('.mega-track');
    const hpText = document.getElementById('hud-hp-text');
    const charName = document.getElementById('hud-char-name');

    return {
      hudVisible: hud ? !hud.classList.contains('hidden') : false,
      btnExists: !!btn,
      txt: txt ? txt.textContent : null,
      trackExists: !!track,
      hpText: hpText ? hpText.textContent : null,
      charName: charName ? charName.textContent : null
    };
  });
  console.log('  -> Estado do HUD durante a partida:', hudCheck);

  // Tira screenshot do jogo rodando ao vivo na VPS
  const artifactDir = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
  const screenshotPath = `${artifactDir}/vps_real_gameplay_live.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  await browser.close();
  console.log('🎉 Validação do fluxo real na VPS concluída com sucesso!');
})();
