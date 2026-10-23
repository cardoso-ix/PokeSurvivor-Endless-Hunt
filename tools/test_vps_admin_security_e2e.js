const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // TESTE 1: VISITANTE NORMAL (SEM ADMIN)
  console.log('🧪 TESTE 1: Acessando VPS como visitante comum...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 720 });

  const url = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
  await page1.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Checa se o botão admin-float-pill está visível ou escondido
  const visitorPillStatus = await page1.evaluate(() => {
    const pill = document.getElementById('admin-float-pill');
    if (!pill) return { exists: false, visible: false };
    const style = window.getComputedStyle(pill);
    return {
      exists: true,
      display: style.display,
      visible: style.display !== 'none' && style.visibility !== 'hidden'
    };
  });
  console.log('Status do botão Admin para Visitante:', visitorPillStatus);
  assert.strictEqual(visitorPillStatus.visible, false, 'O botão Admin NÃO deve estar visível para visitantes!');

  const pScrVisitor = path.join(brainDir, 'vps_visitor_no_admin.png');
  await page1.screenshot({ path: pScrVisitor });
  console.log('Screenshot Visitante salvo (SEM ADMIN):', pScrVisitor);
  await page1.close();

  // TESTE 2: CONTA DE ADMINISTRADOR
  console.log('\n🧪 TESTE 2: Acessando VPS como Administrador autenticado...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 720 });

  await page2.goto(url, { waitUntil: 'networkidle2' });

  // Autentica via localStorage ou comando de admin
  await page2.evaluate(() => {
    localStorage.setItem('ps_admin_authenticated', 'true');
    // Se existir função de update, aciona
    const pill = document.getElementById('admin-float-pill');
    if (pill) pill.style.display = 'block';
  });

  await page2.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const adminPillStatus = await page2.evaluate(() => {
    const pill = document.getElementById('admin-float-pill');
    if (!pill) return { exists: false, visible: false };
    const style = window.getComputedStyle(pill);
    return {
      exists: true,
      display: style.display,
      visible: style.display !== 'none'
    };
  });
  console.log('Status do botão Admin para Administrador:', adminPillStatus);
  assert.strictEqual(adminPillStatus.visible, true, 'O botão Admin DEVE estar visível para o Administrador!');

  const pScrAdmin = path.join(brainDir, 'vps_admin_authenticated.png');
  await page2.screenshot({ path: pScrAdmin });
  console.log('Screenshot Administrador salvo (COM ADMIN):', pScrAdmin);

  await browser.close();
  console.log('\n🎉 TODOS OS TESTES DE BLINDAGEM DO ADMIN PASSARAM COM SUCESSO!');
}

run().catch(err => {
  console.error('Falha no teste:', err);
  process.exit(1);
});
