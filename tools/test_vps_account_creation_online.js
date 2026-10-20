const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log('🧪 Testando criação de conta em tempo real na VPS:', VPS_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const logs = [];
  const errors = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => errors.push('[PAGE_ERROR] ' + (err.stack || err.message)));

  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Toca para começar
  await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Muda para a aba "Criar conta"
  await page.evaluate(() => {
    const tabRegister = document.querySelector('#scr-login [data-tab="register"]');
    if (tabRegister) tabRegister.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Preenche dados da conta
  const testUser = 'Eduardo' + Math.floor(Math.random() * 8999 + 1000);
  const testPass = 'senhaForte123!';

  console.log('Tentando cadastrar usuário na VPS:', testUser);
  await page.evaluate((u, p) => {
    const userField = document.getElementById('f-user');
    const passField = document.getElementById('f-pass');
    if (userField) userField.value = u;
    if (passField) passField.value = p;
  }, testUser, testPass);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_before_create_account.png') });
  console.log('📸 Screenshot salvo: vps_before_create_account.png');

  // Submete o formulário de cadastro
  await page.evaluate(() => {
    const form = document.getElementById('login-form');
    if (form) form.requestSubmit();
  });

  // Aguarda resposta da rede
  await new Promise(r => setTimeout(r, 4000));

  const result = await page.evaluate(() => {
    const errEl = document.getElementById('login-err');
    const menuEl = document.getElementById('scr-menu');
    const isMenuOpen = menuEl && !menuEl.classList.contains('hidden');
    const isLoginOpen = !document.getElementById('scr-login').classList.contains('hidden');
    return {
      errorText: errEl ? errEl.textContent : '',
      isMenuOpen,
      isLoginOpen,
      userName: (window.G && window.G.DB && window.G.DB.save) ? window.G.DB.save.name : null,
      isCloud: (window.G && window.G.DB) ? window.G.DB.mode : null
    };
  });

  console.log('Resultado do cadastro na VPS:', result);
  console.log('Logs recentes do navegador:', logs.slice(-5));
  if (errors.length) console.log('Erros do navegador:', errors);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_after_create_account_result.png') });
  console.log('📸 Screenshot salvo: vps_after_create_account_result.png');

  await browser.close();
  console.log('✨ Teste de criação de conta concluído.');
})();
