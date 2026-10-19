const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/', { waitUntil: 'networkidle2' });

  // Remove tapstart e boot
  await page.evaluate(() => {
    const boot = document.getElementById('boot');
    if (boot) boot.remove();
    const tap = document.getElementById('tap-start');
    if (tap) tap.remove();
    const tap2 = document.querySelector('.tapstart');
    if (tap2) tap2.remove();

    if (window.G && window.G.DB) {
      window.G.DB.playAsGuest();
      window.G.DB.save.coins = 99999;
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
    }

    // Abre a tela de melhorias diretamente
    if (window.G && window.G.Menu && typeof window.G.Menu.openUpgrades === 'function') {
      window.G.Menu.openUpgrades();
    } else {
      const upgBtn = document.querySelector('button[data-go="upgrades"]');
      if (upgBtn) upgBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 1500));

  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_i18n_upgrades_cards_pt.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot da grade de melhorias salvo em: ${screenshotPath}`);

  const cardList = await page.evaluate(() => {
    const cards = document.querySelectorAll('#upg-list .upg-card');
    const items = [];
    cards.forEach(c => {
      const name = c.querySelector('.upg-name') ? c.querySelector('.upg-name').textContent.trim() : '';
      const desc = c.querySelector('.upg-desc') ? c.querySelector('.upg-desc').textContent.trim() : '';
      const buy = c.querySelector('.upg-buy') ? c.querySelector('.upg-buy').textContent.trim() : '';
      items.push({ name, desc, buy });
    });
    return items;
  });

  console.log('📋 Primeiros cartões de melhoria renderizados:');
  console.log(cardList.slice(0, 6));

  await browser.close();
})();
