/**
 * Teste de Validação na VPS Online:
 * Regra de Estágios de Chefes do Rift por Nível e Escalonamento de Atributos
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

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Rift') || text.includes('Guardião') || text.includes('Estágio') || text.includes('ESTÁGIO') || text.includes('TESTE RIFT')) {
      console.log('  [VPS BROWSER LOG]', text);
    }
  });

  console.log(`🌐 Navegando para ${VPS_URL}...`);
  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => typeof window.selectRiftGuardian === 'function' && typeof window.riftSystem === 'object', { timeout: 20000 });
  console.log('✅ selectRiftGuardian e riftSystem disponíveis no navegador da VPS.');

  // 1. Testar Estágio 1 (Nível 15)
  console.log('\n--- [VPS] Testando Nível 15 (Estágio 1) ---');
  const res1 = await page.evaluate(() => {
    if (window.riftSystem && window.riftSystem.reset) window.riftSystem.reset();
    window.riftSystem.start(null, null, false, 15);
    const arena = window.riftSystem.getArena();
    const boss = window.riftSystem.getBoss();
    const selection = window.selectRiftGuardian(15);
    return {
      monName: boss ? boss.name : (selection.mon ? selection.mon.name : null),
      dex: arena ? arena.dex : selection.dex,
      stage: arena ? arena.stage : selection.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : selection.stage
    };
  });
  console.log('[VPS] Resultado Estágio 1:', res1);
  assert(res1 && res1.stage === 1, 'Arena deve ser Estágio 1 na VPS');
  assert(res1.bossStage === 1, 'Boss deve ser Estágio 1 na VPS');

  // 2. Testar Estágio 2 (Nível 30)
  console.log('\n--- [VPS] Testando Nível 30 (Estágio 2) ---');
  const res2 = await page.evaluate(() => {
    if (window.riftSystem && window.riftSystem.reset) window.riftSystem.reset();
    window.riftSystem.start(null, null, false, 30);
    const arena = window.riftSystem.getArena();
    const boss = window.riftSystem.getBoss();
    const selection = window.selectRiftGuardian(30);
    return {
      monName: boss ? boss.name : (selection.mon ? selection.mon.name : null),
      dex: arena ? arena.dex : selection.dex,
      stage: arena ? arena.stage : selection.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : selection.stage
    };
  });
  console.log('[VPS] Resultado Estágio 2:', res2);
  assert(res2 && res2.stage === 2, 'Arena deve ser Estágio 2 na VPS');
  assert(res2.bossStage === 2, 'Boss deve ser Estágio 2 na VPS');
  if (res2.bossHp > 0 && res1.bossHp > 0) {
    assert(res2.bossHp > res1.bossHp, 'HP Estágio 2 deve superar Estágio 1 na VPS');
    assert(res2.bossDmg > res1.bossDmg, 'Dano Estágio 2 deve superar Estágio 1 na VPS');
  }

  // 3. Testar Estágio 3 (Nível 50)
  console.log('\n--- [VPS] Testando Nível 50 (Estágio 3) ---');
  const res3 = await page.evaluate(() => {
    if (window.riftSystem && window.riftSystem.reset) window.riftSystem.reset();
    window.riftSystem.start(null, null, false, 50);
    const arena = window.riftSystem.getArena();
    const boss = window.riftSystem.getBoss();
    const selection = window.selectRiftGuardian(50);
    return {
      monName: boss ? boss.name : (selection.mon ? selection.mon.name : null),
      dex: arena ? arena.dex : selection.dex,
      stage: arena ? arena.stage : selection.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : selection.stage
    };
  });
  console.log('[VPS] Resultado Estágio 3:', res3);
  assert(res3 && res3.stage === 3, 'Arena deve ser Estágio 3 na VPS');
  assert(res3.bossStage === 3, 'Boss deve ser Estágio 3 na VPS');
  if (res3.bossHp > 0 && res2.bossHp > 0) {
    assert(res3.bossHp > res2.bossHp, 'HP Estágio 3 deve superar Estágio 2 na VPS');
    assert(res3.bossDmg > res2.bossDmg, 'Dano Estágio 3 deve superar Estágio 2 na VPS');
  }

  await new Promise(r => setTimeout(r, 800));

  const shot = path.join(ARTIFACTS_DIR, 'vps_rift_stages_live.png');
  await page.screenshot({ path: shot, fullPage: false });
  console.log('📸 Screenshot VPS salvo:', shot);

  console.log('\n🎉 SUCESSO COMPLETO NA VPS ONLINE!');
  await browser.close();
  process.exit(0);
})();
