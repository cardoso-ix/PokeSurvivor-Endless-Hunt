/**
 * Validação de Continuidade de Jogo Pós-Rift na VPS Coolify Online
 * Testa diretamente na URL de produção: http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b';
const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html';

(async () => {
  console.log('🚀 Iniciando verificação de Continuidade Pós-Rift na VPS Coolify...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('  ❌ [VPS BROWSER ERROR]', text);
    } else if (text.includes('Rift') || text.includes('Guardião') || text.includes('capturado') || text.includes('WorldCaptureBall')) {
      console.log('  ℹ️ [VPS LOG]', text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('  💥 [VPS PAGE ERROR]', err.message);
  });

  console.log(`🌐 Acessando VPS em ${VPS_URL}...`);
  await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 35000 });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.Rift && window.G.DB, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('🎮 Iniciando partida na VPS online...');
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 1;
    window.G.DB.save.starter = 1;
    window.G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1200));

  console.log('🌌 Acionando primeiro Rift dimensional (Nível 15, Estágio 1)...');
  await page.evaluate(() => {
    window.G.Rift.start(null, null, false, 15);
  });
  await new Promise(r => setTimeout(r, 1000));

  const arenaInit = await page.evaluate(() => {
    const a = window.G.Rift.arena;
    return a ? { inArena: true, dex: a.dex, stage: a.stage, phase: a.phase } : null;
  });
  console.log('Arena ativa na VPS:', arenaInit);
  assert(arenaInit && arenaInit.inArena, 'Arena deve estar ativa na VPS');

  const shotArena = path.join(ARTIFACT_DIR, 'vps_rift_arena_battle_live.png');
  await page.screenshot({ path: shotArena });
  console.log(`📸 Screenshot da Arena do Rift na VPS salvo em: ${shotArena}`);

  console.log('⚔️ Derrotando o Guardião do Rift na VPS...');
  await page.evaluate(() => {
    const a = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(a.bossId);
    if (boss) {
      boss.hp = 0;
      boss.dead = true;
    }
  });

  console.log('⏳ Acompanhando animação de captura e retorno para o mapa normal...');
  for (let s = 1; s <= 9; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const pl = window.G.Game.player;
      const arena = window.G.Rift.arena;
      const overEl = document.querySelector('#scr-over');
      const menuEl = document.querySelector('#scr-menu');
      return {
        hasPlayer: !!pl,
        playerDead: pl ? pl.dead : null,
        playerHp: pl ? pl.hp : null,
        playerPos: pl ? { x: Math.round(pl.x), y: Math.round(pl.y) } : null,
        inArena: window.G.Rift.inArena,
        arenaPhase: arena ? arena.phase : null,
        overVisible: overEl ? !overEl.classList.contains('hidden') : false,
        menuVisible: menuEl ? !menuEl.classList.contains('hidden') : false
      };
    });
    console.log(`  [t = ${s}s VPS]`, status);

    // Validação estrita: não pode dar Game Over nem voltar ao menu
    assert(!status.overVisible, `ERRO: Game Over disparado na VPS no segundo ${s}!`);
    assert(!status.menuVisible, `ERRO: Jogo voltou ao Menu Principal na VPS no segundo ${s}!`);
  }

  // Validação final de continuidade na VPS
  const finalCheck = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const overEl = document.querySelector('#scr-over');
    const menuEl = document.querySelector('#scr-menu');
    return {
      alive: pl && !pl.dead && pl.hp > 0,
      inArena: window.G.Rift.inArena,
      noGameOver: overEl ? overEl.classList.contains('hidden') : true,
      noMenu: menuEl ? menuEl.classList.contains('hidden') : true,
      gameState: window.G.Game.state
    };
  });

  console.log('\n📊 Verificação Final de Continuidade na VPS Online:', finalCheck);
  assert(finalCheck.alive, 'Jogador deve permanecer vivo na VPS!');
  assert(!finalCheck.inArena, 'Jogador deve ter retornado da arena com sucesso!');
  assert(finalCheck.noGameOver, 'Nenhum Game Over na VPS!');
  assert(finalCheck.noMenu, 'Nenhum retorno involuntário ao menu na VPS!');
  assert.strictEqual(finalCheck.gameState, 'playing', 'Jogo deve continuar no estado playing!');

  const shotContinue = path.join(ARTIFACT_DIR, 'vps_rift_continue_live.png');
  await page.screenshot({ path: shotContinue });
  console.log(`📸 Screenshot de Continuidade Pós-Rift na VPS salvo em: ${shotContinue}`);

  console.log('\n🌟 VPS VALIDADA COM 100% DE SUCESSO! A FENDA RETORNA AO JOGO NORMALMENTE.');
  await browser.close();
  process.exit(0);
})();
