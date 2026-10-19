/**
 * Teste Visual e Automatizado via Puppeteer:
 * Validação dos 3 Estágios de Chefes de Rift no Navegador
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';

(async () => {
  console.log('🚀 Iniciando teste Puppeteer dos Chefes de Rift por Estágio...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Rift') || text.includes('Guardião') || text.includes('Estágio') || text.includes('ESTÁGIO')) {
      console.log('  [BROWSER LOG]', text);
    }
  });

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inicializa o jogo
  await page.evaluate(() => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      if (typeof window.G.DB.ready === 'function') window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1;
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }
  });

  await new Promise(r => setTimeout(r, 800));

  // -------------------------------------------------------------
  // CENÁRIO 1: Nível 15 (Estágio 1)
  // -------------------------------------------------------------
  console.log('\n--- Testando Rift no Nível 15 (Estágio 1) ---');
  const resStage1 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return null;
    pl.level = 15;

    // Reseta e abre arena do Rift para o nível 15
    if (window.G.Rift.arena) window.G.Rift.reset();
    window.G.Rift.start(null, null, false, 15);

    const arena = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    return {
      monName: boss ? boss.name : null,
      dex: arena.dex,
      stage: arena.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : 0
    };
  });

  console.log('Resultado Estágio 1:', resStage1);
  assert(resStage1.stage === 1, 'Arena deve ser Estágio 1');
  assert(resStage1.bossStage === 1, 'Boss deve ser Estágio 1');
  await new Promise(r => setTimeout(r, 600));

  const shot1 = path.join(ARTIFACTS_DIR, 'rift_boss_stage1_live.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('📸 Screenshot Estágio 1 salvo:', shot1);

  // -------------------------------------------------------------
  // CENÁRIO 2: Nível 30 (Estágio 2)
  // -------------------------------------------------------------
  console.log('\n--- Testando Rift no Nível 30 (Estágio 2) ---');
  const resStage2 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return null;
    pl.level = 30;

    if (window.G.Rift.arena) window.G.Rift.reset();
    window.G.Rift.start(null, null, false, 30);

    const arena = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    return {
      monName: boss ? boss.name : null,
      dex: arena.dex,
      stage: arena.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : 0
    };
  });

  console.log('Resultado Estágio 2:', resStage2);
  assert(resStage2.stage === 2, 'Arena deve ser Estágio 2');
  assert(resStage2.bossStage === 2, 'Boss deve ser Estágio 2');
  assert(resStage2.bossHp > resStage1.bossHp, 'HP Estágio 2 deve ser maior que Estágio 1');
  assert(resStage2.bossDmg > resStage1.bossDmg, 'Dano Estágio 2 deve ser maior que Estágio 1');
  assert(resStage2.bossSpd > resStage1.bossSpd, 'Velocidade Estágio 2 deve ser maior que Estágio 1');
  await new Promise(r => setTimeout(r, 600));

  const shot2 = path.join(ARTIFACTS_DIR, 'rift_boss_stage2_live.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('📸 Screenshot Estágio 2 salvo:', shot2);

  // -------------------------------------------------------------
  // CENÁRIO 3: Nível 50 (Estágio 3)
  // -------------------------------------------------------------
  console.log('\n--- Testando Rift no Nível 50 (Estágio 3) ---');
  const resStage3 = await page.evaluate(() => {
    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return null;
    pl.level = 50;

    if (window.G.Rift.arena) window.G.Rift.reset();
    window.G.Rift.start(null, null, false, 50);

    const arena = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    return {
      monName: boss ? boss.name : null,
      dex: arena.dex,
      stage: arena.stage,
      bossHp: boss ? boss.hp : 0,
      bossDmg: boss ? boss.dmg : 0,
      bossSpd: boss ? boss.spd : 0,
      bossStage: boss ? boss.stage : 0
    };
  });

  console.log('Resultado Estágio 3:', resStage3);
  assert(resStage3.stage === 3, 'Arena deve ser Estágio 3');
  assert(resStage3.bossStage === 3, 'Boss deve ser Estágio 3');
  assert(resStage3.bossHp > resStage2.bossHp, 'HP Estágio 3 deve ser maior que Estágio 2');
  assert(resStage3.bossDmg > resStage2.bossDmg, 'Dano Estágio 3 deve ser maior que Estágio 2');
  assert(resStage3.bossSpd > resStage2.bossSpd, 'Velocidade Estágio 3 deve ser maior que Estágio 2');
  await new Promise(r => setTimeout(r, 600));

  const shot3 = path.join(ARTIFACTS_DIR, 'rift_boss_stage3_live.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('📸 Screenshot Estágio 3 salvo:', shot3);

  console.log('\n🎉 TODOS OS TESTES NO NAVEGADOR FORAM APROVADOS!');
  await browser.close();
  process.exit(0);
})();
