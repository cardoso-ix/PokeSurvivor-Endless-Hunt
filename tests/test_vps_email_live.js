const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Validando VPS ao Vivo: Login e Vínculo de E-mail ---');
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

    // Capturar screenshot da tela de login na VPS
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_login_email.png' });

    const checks = await page.evaluate(() => {
      const inputUser = document.getElementById('f-user');
      const recForm = document.getElementById('rec-form');
      const recEmail = document.getElementById('rec-email');
      const recEmailBtn = document.getElementById('rec-email-btn');
      const btnReset = document.getElementById('btn-reset-pass');
      return {
        userMaxLen: inputUser ? inputUser.getAttribute('maxlength') : null,
        userPlaceholder: inputUser ? inputUser.getAttribute('placeholder') : null,
        hasRecForm: !!recForm,
        recEmailMaxLen: recEmail ? recEmail.getAttribute('maxlength') : null,
        hasRecEmailBtn: !!recEmailBtn,
        hasBtnReset: !!btnReset
      };
    });

    console.log('Checagens da VPS:', JSON.stringify(checks, null, 2));

    // Abrir o modal de vincular para registrar screenshot
    await page.evaluate(() => {
      document.getElementById('scr-recover').classList.remove('hidden');
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_recover_modal.png' });

    if (checks.userMaxLen === '64' && checks.hasRecForm) {
      console.log('>>> DEPLOY VALIDADO COM SUCESSO NA VPS! <<<');
    } else {
      console.log('>>> O deploy ainda pode estar em andamento no Coolify <<<');
      process.exit(2);
    }
  } catch (err) {
    console.error('Erro ao validar VPS:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
