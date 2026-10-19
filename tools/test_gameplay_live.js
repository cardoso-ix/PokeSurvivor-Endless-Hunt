const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const tap = await page.$('.tapstart');
  if (tap) await tap.click();
  await new Promise(r => setTimeout(r, 500));

  const guestBtn = await page.$('#btn-guest');
  if (guestBtn) {
    console.log('Clicando em Jogar como Convidado...');
    await guestBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Clica em Jogar no menu principal
  const playBtn = await page.$('[data-go="play"]');
  if (playBtn) {
    console.log('Clicando em Jogar no menu...');
    await playBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Clica no estágio ou confirmar
  const startBtn = await page.$('#stage-confirm-btn, #btn-stage-start, [data-action="start-stage"], .stage-play-btn, #btn-play');
  if (startBtn) {
    console.log('Iniciando estágio via botão de confirmação...');
    await startBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  } else {
    // Tenta clicar no primeiro card de estágio
    const stageCard = await page.$('.stage-card');
    if (stageCard) {
      console.log('Clicando no card de estágio...');
      await stageCard.click();
      await new Promise(r => setTimeout(r, 500));
      const confirm = await page.$('#stage-confirm-btn, .btn-confirm-stage');
      if (confirm) await confirm.click();
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const runInfo = await page.evaluate(() => {
    // Inspeciona window.game
    const g = window.game;
    const pl = g ? g.player : null;
    return {
      hasGame: !!g,
      isPaused: g ? g.isPaused : null,
      playerSpecies: pl ? pl.species : null,
      playerLevel: pl ? pl.level : null
    };
  });
  console.log('Run info:', runInfo);

  await browser.close();
})();
