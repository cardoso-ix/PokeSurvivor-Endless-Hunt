const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Remove tapstart se existir
  const tap = await page.$('.tapstart');
  if (tap) {
    await tap.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Entra como guest para acessar o menu
  const guest = await page.$('#btn-guest');
  if (guest) {
    await guest.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // Clica no botão de novidades #btn-news
  console.log('Clicando em #btn-news...');
  await page.evaluate(() => {
    const b = document.getElementById('btn-news');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const info = await page.evaluate(() => {
    const scr = document.getElementById('scr-news');
    const body = document.getElementById('news-body');
    return {
      isOpen: scr ? !scr.classList.contains('hidden') : false,
      bodyText: body ? body.innerText.trim() : null
    };
  });
  console.log('Resultado Modal Novidades:', JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'news_modal_preview.png' });
  console.log('Screenshot salva em news_modal_preview.png');
  await browser.close();
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
