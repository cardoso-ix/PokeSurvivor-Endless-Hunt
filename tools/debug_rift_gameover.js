const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message, err.stack));

  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Upgrades && window.G.Gacha && window.G.Game && window.G.DB, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    window._capturedErrors = [];
    window.addEventListener('error', e => {
      console.log('🚨 STACK TRACE DETALHADA:', e.error ? e.error.stack : e.message);
    });
    // Intercepta console.error para pegar o stack
    const origError = console.error;
    console.error = function(...args) {
      origError.apply(console, args);
      for (const a of args) {
        if (a && a.stack) console.log('🚨 ERROR STACK:', a.stack);
      }
    };
    document.querySelector('.tapstart')?.remove();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 1;
    window.G.DB.save.starter = 1;
    window.G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Iniciando Rift ---');
  await page.evaluate(() => {
    window.G.Rift.start(null, null, false, 15);
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Derrotando o Guardião ---');
  const bossKilled = await page.evaluate(() => {
    const arena = window.G.Rift.arena;
    if (!arena) return false;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    if (!boss) return false;
    boss.hp = 0;
    boss.dead = true;
    return true;
  });
  console.log('Boss morto:', bossKilled);

  // Monitora por 15 segundos
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const pl = window.G.Game.player;
      const arena = window.G.Rift.arena;
      return {
        hasPlayer: !!pl,
        playerDead: pl ? pl.dead : null,
        playerHp: pl ? pl.hp : null,
        playerMaxHp: pl ? pl.maxHp : null,
        playerPos: pl ? { x: Math.round(pl.x), y: Math.round(pl.y) } : null,
        inArena: window.G.Rift.inArena,
        arenaPhase: arena ? arena.phase : null,
        arenaEndT: arena ? arena.endT : null,
        overVisible: !document.querySelector('#scr-over').classList.contains('hidden'),
        menuVisible: !document.querySelector('#scr-menu').classList.contains('hidden')
      };
    });
    console.log(`[Segundo ${i + 1}] Status:`, status);
    if (status.overVisible || status.menuVisible) {
      console.log('🚨 GAME OVER OU MENU DETECTADO NO SEGUNDO', i + 1);
      break;
    }
  }

  await browser.close();
})();
