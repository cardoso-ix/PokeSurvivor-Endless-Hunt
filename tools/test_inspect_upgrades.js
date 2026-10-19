const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });

  await page.evaluate(async () => {
    document.querySelector('.tapstart')?.remove();
    document.getElementById('tap-start')?.remove();
    document.getElementById('boot')?.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.coins = 99999;
      window.G.DB.save.partner = 6; // Charizard (Estagio 3)
      window.G.DB.save.starter = 6;
      window.G.DB.save.owned[6] = { at: Date.now(), from: 'evolution' };
      window.G.DB.save.pupg[6] = { hp: 10, atk: 10, spd: 8, cd: 8 }; // múltiplos maxed
    }

    const upgBtn = document.querySelector('button[data-go="upgrades"]');
    if (upgBtn) upgBtn.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  const shotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/upgrades_stage3_screen.png';
  await page.screenshot({ path: shotPath });
  console.log('Salvo stage 3 em:', shotPath);

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#upg-list .upg-item')).map(el => {
      const b = el.querySelector('b')?.textContent;
      const sub = el.querySelector('span')?.textContent;
      const btns = el.querySelector('.upg-btns')?.innerText.replace(/\n/g, ' ');
      return { b, sub, btns };
    });
  });
  console.log('Itens encontrados:', items);

  await browser.close();
})();
