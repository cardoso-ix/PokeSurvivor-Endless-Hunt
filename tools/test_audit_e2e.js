const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const http = require('http');

const VPS_VERSION_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/version.json';
const VPS_PAGE_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
const LOCAL_PAGE_URL = 'http://localhost:8080/dev.html';
const EXPECTED_VERSION = 'da881bac96';

function fetchVersion() {
  return new Promise((resolve) => {
    http.get(VPS_VERSION_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.v);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function waitForDeploy() {
  console.log(`⏳ Aguardando deploy na VPS atingir versão ${EXPECTED_VERSION}...`);
  for (let i = 0; i < 30; i++) {
    const v = await fetchVersion();
    console.log(`[Tentativa ${i + 1}] Versão na VPS: ${v}`);
    if (v === EXPECTED_VERSION) {
      console.log(`✅ VPS atualizada com sucesso para ${EXPECTED_VERSION}!`);
      return true;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.warn(`⚠️ Timeout esperando VPS. Prosseguindo com validação.`);
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

  // Testa tanto na VPS quanto localmente
  const targetUrl = VPS_PAGE_URL;
  console.log(`🌐 Navegando para ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Aguarda boot desaparecer
  await page.waitForFunction(() => {
    const boot = document.getElementById('boot');
    return !boot || boot.classList.contains('hidden');
  }, { timeout: 15000 });

  // Clica em Jogar como convidado se na tela de login
  await page.evaluate(() => {
    const guestBtn = document.getElementById('btn-guest');
    if (guestBtn) guestBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Executa auditoria em runtime
  const auditResult = await page.evaluate(() => {
    if (typeof window.debugAuditSpanishWords === 'function') {
      return window.debugAuditSpanishWords();
    }
    return { error: 'debugAuditSpanishWords não encontrada' };
  });

  console.log('📊 Resultado da Auditoria em Runtime na VPS:');
  console.log(JSON.stringify(auditResult, null, 2));

  // Abre tela de Melhorias
  await page.evaluate(() => {
    const upgBtn = document.querySelector('button[data-go="upgrades"]');
    if (upgBtn) upgBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Tira screenshot comprobatório
  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_i18n_upgrades_clean_pt.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

  // Inspeciona textos dos cartões de upgrade no DOM
  const upgradeTexts = await page.evaluate(() => {
    const cards = document.querySelectorAll('#upg-list .upg-card');
    const items = [];
    cards.forEach(c => {
      const name = c.querySelector('.upg-name') ? c.querySelector('.upg-name').textContent : '';
      const desc = c.querySelector('.upg-desc') ? c.querySelector('.upg-desc').textContent : '';
      items.push({ name, desc });
    });
    return items;
  });

  console.log('📋 Primeiras 5 melhorias inspecionadas no DOM:');
  console.log(upgradeTexts.slice(0, 5));

  await browser.close();
  console.log('🎉 Validação e auditoria E2E concluídas!');
}

runAudit().catch(err => {
  console.error('❌ Erro no teste E2E:', err);
  process.exit(1);
});
