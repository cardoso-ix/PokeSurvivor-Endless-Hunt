const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Iniciando Teste E2E de Login e Vínculo por E-mail ---');
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
          console.error('[Browser Error]', text);
          errors.push(text);
        }
      }
    });

    // 1. Abrir dev.html
    console.log('1. Navegando para dev.html...');
    await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Verificar elementos na tela de login
    const loginChecks = await page.evaluate(() => {
      const inputUser = document.getElementById('f-user');
      const lblUser = document.getElementById('lbl-user');
      const btnReset = document.getElementById('btn-reset-pass');
      const recForm = document.getElementById('rec-form');
      const recEmail = document.getElementById('rec-email');
      const recPass = document.getElementById('rec-pass');
      const recEmailBtn = document.getElementById('rec-email-btn');

      return {
        userMaxLen: inputUser ? inputUser.getAttribute('maxlength') : null,
        userPlaceholder: inputUser ? inputUser.getAttribute('placeholder') : null,
        lblText: lblUser ? lblUser.textContent : null,
        hasBtnReset: !!btnReset,
        hasRecForm: !!recForm,
        recEmailMaxLen: recEmail ? recEmail.getAttribute('maxlength') : null,
        hasRecPass: !!recPass,
        hasRecEmailBtn: !!recEmailBtn,
        isEmailValid: window.G && window.G.DB && window.G.DB.isEmail ? window.G.DB.isEmail('treinador@pokesurvivor.com') : null,
        isEmailInvalid: window.G && window.G.DB && window.G.DB.isEmail ? window.G.DB.isEmail('treinador_apenas') : null,
        hasLinkEmailFn: !!(window.G && window.G.DB && typeof window.G.DB.linkEmail === 'function'),
        hasSendResetFn: !!(window.G && window.G.DB && typeof window.G.DB.sendPasswordReset === 'function')
      };
    });

    console.log('Resultados dos checks de UI e DB:', JSON.stringify(loginChecks, null, 2));

    if (loginChecks.userMaxLen !== '64') {
      throw new Error(`f-user maxlength esperado '64', obtido: ${loginChecks.userMaxLen}`);
    }
    if (!loginChecks.isEmailValid || loginChecks.isEmailInvalid) {
      throw new Error(`isEmail falhou no teste de validação`);
    }
    if (!loginChecks.hasLinkEmailFn) {
      throw new Error(`G.DB.linkEmail não está disponível na API pública`);
    }

    // 3. Testar a tela de recuperação / vínculo
    console.log('2. Testando exibição da tela scr-recover...');
    await page.evaluate(() => {
      document.getElementById('scr-recover').classList.remove('hidden');
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_modal_recover_email.png' });
    console.log('Screenshot do modal de vínculo salvo com sucesso.');

    // 4. Testar login como convidado e verificar a aba de Configurações > Conta
    console.log('3. Testando entrada e menu de configurações...');
    await page.evaluate(() => {
      document.getElementById('scr-recover').classList.add('hidden');
      document.getElementById('btn-guest').click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Se estiver no starter ou game, checar G.SettingsUI
    const settingsAccCheck = await page.evaluate(async () => {
      if (window.G && window.G.SettingsUI) {
        window.G.SettingsUI.open();
        // Clicar na aba Conta
        const accTab = document.querySelector('#set-tabs [data-t="acc"]');
        if (accTab) accTab.click();
        const setBody = document.getElementById('set-body');
        return {
          isOpen: window.G.SettingsUI.isOpen,
          bodyHtml: setBody ? setBody.innerHTML.slice(0, 300) : ''
        };
      }
      return null;
    });
    console.log('Settings Account Check:', settingsAccCheck);
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_settings_account_tab.png' });

    // 5. Testar index.html (build compilado de produção)
    console.log('4. Navegando para index.html (produção)...');
    await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const prodCheck = await page.evaluate(() => {
      const inputUser = document.getElementById('f-user');
      const recForm = document.getElementById('rec-form');
      return {
        userMaxLen: inputUser ? inputUser.getAttribute('maxlength') : null,
        hasRecForm: !!recForm
      };
    });
    console.log('Produção index.html Check:', prodCheck);
    if (prodCheck.userMaxLen !== '64' || !prodCheck.hasRecForm) {
      throw new Error(`index.html não reflete os novos campos de e-mail`);
    }

    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_index_prod_login.png' });

    console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
  } catch (err) {
    console.error('Falha no teste:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
