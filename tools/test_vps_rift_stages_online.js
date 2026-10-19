/**
 * Teste de Validação na VPS Online:
 * Regra Oficial de Estágios dos Chefes de Rift por Nível e Escalonamento
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando teste Puppeteer dos Chefes de Rift na VPS Online...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`🌐 Navegando para ${VPS_URL}...`);
  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => typeof window.selectRiftGuardian === 'function', { timeout: 20000 });
  console.log('✅ selectRiftGuardian disponível no bundle de produção da VPS.');

  // 1. Validação Estatística de Estágio 1 (Níveis 1 a 20)
  console.log('\n--- [VPS] Validando Níveis 1 a 20 (Estágio 1) ---');
  const stage1Results = await page.evaluate(() => {
    const list = [];
    for (let i = 0; i < 30; i++) {
      const lvl = Math.floor(Math.random() * 20) + 1; // 1 a 20
      const res = window.selectRiftGuardian(lvl);
      list.push({ lvl, name: res.mon.name, dex: res.dex, stage: res.stage });
    }
    return list;
  });
  console.log(`Amostra Estágio 1 (30 testes):`, stage1Results.slice(0, 5));
  stage1Results.forEach(r => {
    assert(r.stage === 1, `Falha no nível ${r.lvl}: ${r.name} é estágio ${r.stage}, esperado 1`);
  });
  console.log('✅ 100% dos Pokémon para Níveis 1 a 20 são Estágio 1.');

  // 2. Validação Estatística de Estágio 2 (Níveis 21 a 41)
  console.log('\n--- [VPS] Validando Níveis 21 a 41 (Estágio 2) ---');
  const stage2Results = await page.evaluate(() => {
    const list = [];
    for (let i = 0; i < 30; i++) {
      const lvl = Math.floor(Math.random() * 21) + 21; // 21 a 41
      const res = window.selectRiftGuardian(lvl);
      list.push({ lvl, name: res.mon.name, dex: res.dex, stage: res.stage });
    }
    return list;
  });
  console.log(`Amostra Estágio 2 (30 testes):`, stage2Results.slice(0, 5));
  stage2Results.forEach(r => {
    assert(r.stage === 2, `Falha no nível ${r.lvl}: ${r.name} é estágio ${r.stage}, esperado 2`);
  });
  console.log('✅ 100% dos Pokémon para Níveis 21 a 41 são Estágio 2.');

  // 3. Validação Estatística de Estágio 3 (Níveis 42+)
  console.log('\n--- [VPS] Validando Níveis 42+ (Estágio 3) ---');
  const stage3Results = await page.evaluate(() => {
    const list = [];
    for (let i = 0; i < 30; i++) {
      const lvl = Math.floor(Math.random() * 40) + 42; // 42 a 81
      const res = window.selectRiftGuardian(lvl);
      list.push({ lvl, name: res.mon.name, dex: res.dex, stage: res.stage });
    }
    return list;
  });
  console.log(`Amostra Estágio 3 (30 testes):`, stage3Results.slice(0, 5));
  stage3Results.forEach(r => {
    assert(r.stage === 3, `Falha no nível ${r.lvl}: ${r.name} é estágio ${r.stage}, esperado 3`);
  });
  console.log('✅ 100% dos Pokémon para Níveis 42+ são Estágio 3.');

  // 4. Teste de Inicialização e Captura Visual na VPS
  console.log('\n--- [VPS] Capturando Screenshot da Tela Online ---');
  await page.evaluate(() => {
    const t = document.querySelector('#tap-start') || document.querySelector('.tapstart');
    if (t) t.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot = path.join(ARTIFACTS_DIR, 'vps_rift_stages_live.png');
  await page.screenshot({ path: shot, fullPage: false });
  console.log('📸 Screenshot VPS salvo:', shot);

  console.log('\n🎉 TODOS OS TESTES NA VPS ONLINE FORAM HOMOLOGADOS COM 100% DE SUCESSO!');
  await browser.close();
  process.exit(0);
})();
