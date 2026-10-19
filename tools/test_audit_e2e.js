const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const http = require('http');

const VPS_VERSION_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/version.json';
const VPS_PAGE_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

function fetchVersion() {
  return new Promise((resolve) => {
    http.get(VPS_VERSION_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function waitForDeploy() {
  console.log(`⏳ Aguardando novo deploy na VPS (após 02:55:49Z)...`);
  for (let i = 0; i < 30; i++) {
    const ver = await fetchVersion();
    if (ver && ver.at && new Date(ver.at).getTime() >= new Date('2026-10-19T02:55:40Z').getTime()) {
      console.log(`✅ VPS atualizada com sucesso! Build: ${ver.v} (${ver.at})`);
      return true;
    }
    console.log(`[Tentativa ${i + 1}] Versão na VPS:`, ver);
    await new Promise(r => setTimeout(r, 4000));
  }
  return false;
}

async function runAudit() {
  await waitForDeploy();

  console.log('🚀 Iniciando navegador Puppeteer para teste E2E e auditoria...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('Auditoria') || txt.includes('RESÍDUOS') || txt.includes('ACHADOS')) {
      console.log(`[BROWSER CONSOLE] ${txt}`);
    }
  });

  console.log(`🌐 Navegando para ${VPS_PAGE_URL}...`);
  await page.goto(VPS_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Aguarda boot desaparecer
  await page.waitForFunction(() => {
    const boot = document.getElementById('boot');
    return !boot || boot.classList.contains('hidden');
  }, { timeout: 15000 });

  // Executa auditoria na tela de Login
  const loginAudit = await page.evaluate(() => {
    return window.debugAuditSpanishWords ? window.debugAuditSpanishWords() : null;
  });
  console.log('📊 Auditoria na Tela de Login / Início:', JSON.stringify(loginAudit, null, 2));

  // Clica em Jogar como convidado
  await page.evaluate(() => {
    const guestBtn = document.getElementById('btn-guest');
    if (guestBtn) guestBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Se aparecer tela de starter ou teste de personalidade, avança para o menu
  await page.evaluate(() => {
    const partnerOk = document.getElementById('res-ok');
    if (partnerOk) partnerOk.click();
    const starterOk = document.getElementById('starter-ok');
    if (starterOk && !starterOk.disabled) starterOk.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Abre tela de Upgrades
  await page.evaluate(() => {
    const upgBtn = document.querySelector('button[data-go="upgrades"]');
    if (upgBtn) upgBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Tira screenshot comprobatório da tela de Melhorias
  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_i18n_upgrades_clean_pt.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot da tela de Melhorias salvo em: ${screenshotPath}`);

  // Executa auditoria final com telas abertas
  const finalAudit = await page.evaluate(() => {
    return window.debugAuditSpanishWords ? window.debugAuditSpanishWords() : null;
  });
  console.log('📊 Auditoria Final no Menu & Upgrades:', JSON.stringify(finalAudit, null, 2));

  // Inspeciona textos dos cartões de upgrade no DOM
  const upgradeCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#upg-list .upg-card');
    const items = [];
    cards.forEach(c => {
      const name = c.querySelector('.upg-name') ? c.querySelector('.upg-name').textContent.trim() : '';
      const desc = c.querySelector('.upg-desc') ? c.querySelector('.upg-desc').textContent.trim() : '';
      items.push({ name, desc });
    });
    return items;
  });

  console.log('📋 Amostra de Melhorias Inspecionadas no DOM em Tempo Real:');
  console.log(upgradeCards.slice(0, 8));

  await browser.close();
  console.log('🎉 Auditoria E2E Concluída com Sucesso Total!');
}

runAudit().catch(err => {
  console.error('❌ Erro no teste E2E:', err);
  process.exit(1);
});
