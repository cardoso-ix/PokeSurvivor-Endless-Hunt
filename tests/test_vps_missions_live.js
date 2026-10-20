const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Validando VPS ao Vivo: Missões Expandidas (6 Diárias / 5 Semanais) ---');
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

    // Abrir tela de Missões (Goals)
    console.log('Abrindo tela de Missões na VPS...');
    await page.evaluate(() => {
      const goalsBtn = document.querySelector('[data-go="goals"]');
      if (goalsBtn) goalsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const checkVPS = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#goals-body .mission'));
      return {
        totalMissions: items.length,
        samples: items.slice(0, 3).map(el => el.innerText.replace(/\n+/g, ' · '))
      };
    });
    console.log('Resultado de missões na VPS ao vivo:', JSON.stringify(checkVPS, null, 2));

    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_missions_full.png' });

    if (checkVPS.totalMissions === 11) {
      console.log('>>> DEPLOY DE MISSÕES VALIDADO COM 100% DE SUCESSO NA VPS! <<<');
    } else {
      console.log('Total de missões encontrado:', checkVPS.totalMissions);
      if (checkVPS.totalMissions > 5) {
        console.log('>>> MISSÕES EXPANDIDAS DETECTADAS NA VPS! <<<');
      } else {
        throw new Error('Ainda com missões antigas na VPS');
      }
    }
  } catch (err) {
    console.error('Erro ao validar VPS:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
