const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Validando VPS ao Vivo: Ascensão de Upgrades (+1 a +10) ---');
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
    console.log('Navegando para VPS:', VPS_URL);
    await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Entrar como convidado
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Usar ferramenta de admin exposta para desbloquear a coleção e moedas
    console.log('Ativando parceiro e moedas via ferramentas...');
    await page.evaluate(() => {
      if (typeof window.adminUnlockAll === 'function') {
        window.adminUnlockAll(false);
      }
      if (typeof window.addGold === 'function') {
        window.addGold(500000);
      }
      // Se tiver menu, abre Upgrades
      const upgBtn = document.querySelector('[data-go="upgrades"]');
      if (upgBtn) upgBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const checkUI = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#upg-list .upg-item'));
      return {
        itemsCount: items.length,
        itemsSample: items.slice(0, 3).map(el => el.innerText.replace(/\n+/g, ' · '))
      };
    });
    console.log('Resultado dos upgrades na VPS ao vivo:', JSON.stringify(checkUI, null, 2));

    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_upgrades_menu_full.png' });

    if (checkUI.itemsCount > 0) {
      console.log('>>> DEPLOY VALIDADO COM SUCESSO TOTAL NA VPS! <<<');
    } else {
      throw new Error('Lista de melhorias ainda vazia');
    }
  } catch (err) {
    console.error('Erro ao validar VPS:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
