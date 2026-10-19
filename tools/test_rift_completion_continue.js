/**
 * Teste Automatizado de Conclusão de Rift & Continuidade da Partida
 * Valida que o término da fenda dimensional NÃO dá Game Over e continua o jogo perfeitamente.
 */

const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const assert = require('assert');

(async () => {
  console.log('🚀 Iniciando teste de Conclusão do Rift & Continuidade da Partida...');
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
      console.log('  ❌ [BROWSER ERROR]', text);
    } else if (text.includes('Rift') || text.includes('Guardião') || text.includes('batalha') || text.includes('capturado') || text.includes('WorldCaptureBall')) {
      console.log('  ℹ️ [BROWSER LOG]', text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('  💥 [PAGE ERROR]', err.message);
  });

  console.log('🌐 Navegando para http://localhost:8080/dev.html...');
  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.Rift && window.G.DB, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));

  console.log('🎮 Iniciando partida local...');
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 1;
    window.G.DB.save.starter = 1;
    window.G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('🌌 Abrindo Fenda Dimensional do Rift (Nível 15)...');
  await page.evaluate(() => {
    window.G.Rift.start(null, null, false, 15);
  });
  await new Promise(r => setTimeout(r, 1000));

  const arenaInit = await page.evaluate(() => {
    const a = window.G.Rift.arena;
    return a ? { inArena: true, dex: a.dex, stage: a.stage, phase: a.phase } : null;
  });
  console.log('Arena ativa:', arenaInit);
  assert(arenaInit && arenaInit.inArena, 'Arena deve estar ativa');

  console.log('⚔️ Derrotando o Guardião do Rift...');
  await page.evaluate(() => {
    const a = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(a.bossId);
    if (boss) {
      boss.hp = 0;
      boss.dead = true;
    }
  });

  console.log('⏳ Aguardando sequência de captura diegética e transição de volta ao mapa (8 segundos)...');
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
    console.log(`  [t = ${s}s]`, status);

    // Validação estrita: não pode dar Game Over nem voltar ao menu
    assert(!status.overVisible, `Erro: Tela de Game Over apareceu no segundo ${s}!`);
    assert(!status.menuVisible, `Erro: Jogo voltou ao Menu Principal no segundo ${s}!`);
  }

  // Validação final após retorno ao mapa principal
  const finalCheck = await page.evaluate(() => {
    const pl = window.G.Game.player;
    const overEl = document.querySelector('#scr-over');
    const menuEl = document.querySelector('#scr-menu');
    return {
      alive: pl && !pl.dead && pl.hp > 0,
      inArena: window.G.Rift.inArena,
      noGameOver: overEl ? overEl.classList.contains('hidden') : true,
      noMenu: menuEl ? menuEl.classList.contains('hidden') : true
    };
  });

  console.log('\n📊 Verificação Final de Continuidade:', finalCheck);
  assert(finalCheck.alive, 'Jogador deve permanecer VIVO!');
  assert(!finalCheck.inArena, 'Jogador deve ter SAÍDO da arena de volta ao mapa normal!');
  assert(finalCheck.noGameOver, 'Tela de Game Over NÃO deve estar visível!');
  assert(finalCheck.noMenu, 'Menu Principal NÃO deve estar visível!');

  console.log('✅ Nenhum erro fatal detectado durante e após a fenda!');
  console.log('\n🎉 TESTE DE CONTINUIDADE APROVADO COM SUCESSO TOTAL!');

  await browser.close();
  process.exit(0);
})();
