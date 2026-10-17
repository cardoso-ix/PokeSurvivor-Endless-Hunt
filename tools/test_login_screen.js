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

  // Se houver overlay de clique para iniciar (.tapstart)
  const tap = await page.$('.tapstart');
  if (tap) {
    console.log('Clicando em .tapstart...');
    await tap.click();
    await new Promise(r => setTimeout(r, 800));
  }

  const info = await page.evaluate(() => {
    const scr = document.querySelector('#scr-login');
    const box = document.querySelector('#scr-login .box');
    const logoT1 = document.querySelector('#scr-login .logo .t1');
    const logoT2 = document.querySelector('#scr-login .logo .t2');
    return {
      scrHidden: scr ? scr.classList.contains('hidden') : null,
      boxClientWidth: box ? box.clientWidth : null,
      boxScrollWidth: box ? box.scrollWidth : null,
      hasHScroll: box ? box.scrollWidth > box.clientWidth : false,
      logoT1Text: logoT1 ? logoT1.textContent.trim() : null,
      logoT2Text: logoT2 ? logoT2.textContent.trim() : null
    };
  });
  console.log('Status da Tela de Login:', JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'login_fixed_opened.png' });
  await browser.close();
  console.log('Screenshot salva com sucesso em login_fixed_opened.png');
})().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
