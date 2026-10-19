const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log(`🌐 Conectando à VPS Online para validar Melhorias: ${VPS_URL}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto(VPS_URL + '?v=' + Date.now(), { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.db && (window.game || (window.G && window.G.Game)), { timeout: 15000 });

  // 1. Prepara dados e abre tela de melhorias na VPS
  const testData = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart') || document.getElementById('tap-start');
    if (tap) tap.remove();
    const boot = document.getElementById('boot');
    if (boot) boot.remove();

    if (window.db) {
      await window.db.ready();
      window.db.playAsGuest();
      window.db.save.coins = 99999;
      window.db.save.partner = 5; // Charmeleon (Estágio 2)
      window.db.save.starter = 5;
      window.db.save.owned[5] = { at: Date.now(), from: 'evolution' };
      window.db.save.pupg[5] = { hp: 10, atk: 10 }; // para ver o botão Máximo
    }

    const upgBtn = document.querySelector('button[data-go="upgrades"]');
    if (upgBtn) upgBtn.click();

    return { clicked: !!upgBtn };
  });
  console.log('  -> Abriu tela de melhorias na VPS:', testData);
  await new Promise(r => setTimeout(r, 1500));

  // 2. Extrai dados dos cartões renderizados na VPS
  const vpsItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#upg-list .upg-item')).map(el => {
      const b = el.querySelector('b')?.textContent.trim();
      const sub = el.querySelector('span')?.textContent.trim();
      const btns = el.querySelector('.upg-btns')?.innerText.replace(/\n/g, ' ').trim();
      return { b, sub, btns };
    });
  });
  console.log('  -> Itens na tela de melhorias da VPS:');
  console.log(vpsItems);

  // 3. Verifica se tem algum resquício de upgrades. ou badges de estágio 2
  const hasUpgradePrefix = vpsItems.some(i => i.b.includes('upgrades.') || i.sub.includes('upgrades.'));
  const hasStageBadge = vpsItems.some(i => i.btns.includes('Estágio 2') || i.btns.includes('x2 Ouro'));

  console.log('  -> Algum nome contém "upgrades."?:', hasUpgradePrefix);
  console.log('  -> Algum botão contém badge de estágio 2?:', hasStageBadge);

  // 4. Salva screenshot ao vivo da VPS
  const shotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_upgrades_fixed_live.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot ao vivo da VPS salva em: ${shotPath}`);

  await browser.close();

  if (hasUpgradePrefix || hasStageBadge) {
    console.error('❌ Falha na validação dos upgrades na VPS!');
    process.exit(1);
  }

  console.log('🎉 Validação dos upgrades na VPS CONCLUÍDA COM 100% DE SUCESSO!');
})();
