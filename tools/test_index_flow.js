const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const tap = await page.$('.tapstart');
  if (tap) {
    await tap.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Clicar em 'Jugar como invitado' para logar sem senha
  await page.evaluate(() => {
    const btnGuest = document.getElementById('btn-guest');
    if (btnGuest) btnGuest.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const postLoginInfo = await page.evaluate(() => {
    const scrLogin = document.querySelector('#scr-login');
    const scrMenu = document.querySelector('#scr-menu');
    const introOverlay = document.querySelector('.ic-overlay');
    return {
      loginHidden: scrLogin ? scrLogin.classList.contains('hidden') : null,
      menuVisible: scrMenu ? !scrMenu.classList.contains('hidden') : null,
      introCreationVisible: !!introOverlay,
      trainer: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.trainer : null,
      squad: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.squad : null
    };
  });
  console.log('Post-Login State:', JSON.stringify(postLoginInfo, null, 2));

  // Avançar para a etapa 2 de escolha de Pokémon
  await page.evaluate(() => {
    const btnNext = document.getElementById('btn-step1-next');
    if (btnNext) btnNext.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Clicar em Iniciar Jornada
  await page.evaluate(() => {
    const btnStart = document.getElementById('btn-step2-start');
    if (btnStart) btnStart.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const afterCreationInfo = await page.evaluate(() => {
    const scrMenu = document.querySelector('#scr-menu');
    const introOverlay = document.querySelector('.ic-overlay');
    return {
      menuVisible: scrMenu ? !scrMenu.classList.contains('hidden') : null,
      introCreationClosed: introOverlay === null,
      savedTrainer: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.trainer : null,
      savedSquad: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.squad : null,
      partnerDex: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.partner : null
    };
  });
  console.log('After Creation State:', JSON.stringify(afterCreationInfo, null, 2));

  await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/d8c67403-5144-46bc-8f04-74211dcd31d5/index_post_creation_menu.png' });
  await browser.close();
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
