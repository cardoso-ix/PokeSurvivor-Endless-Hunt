const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- TESTE E2E: RIFT SCALING E GAME OVER AO MORRER NO RIFT ---');
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });

    // Login Convidado
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Entrar na Masmorra
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Iniciar Kanto
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Configurar nível do jogador para 30 (Tier 3) e disparar Rift
    console.log('Definindo nível do jogador para 30 e disparando Rift...');
    const riftInfo = await page.evaluate(() => {
      const g = window.game;
      const p = g.player;
      p.level = 30; // Nível 30

      // Força entrada no Rift
      if (window.riftSystem && window.riftSystem.start) {
        window.riftSystem.start(null, null, false, 30);
      } else if (window.G && window.G.Rift) {
        window.G.Rift.start(null, null, false, 30);
      }

      return {
        level: p.level,
        inArena: (window.G && window.G.Rift) ? window.G.Rift.inArena : !!(window.riftSystem && window.riftSystem.getArena())
      };
    });
    console.log('Rift disparado:', riftInfo);
    await new Promise(r => setTimeout(r, 1500));

    // Capturar informações do boss e minions na arena
    const arenaDetails = await page.evaluate(() => {
      const boss = (window.riftSystem && window.riftSystem.getBoss()) ||
                   ((window.G && window.G.Rift && window.G.Rift.arena) ? window.G.Rift.arena.bossObj : null);
      const allEnemies = (window.G && window.G.EnemyMgr) ? window.G.EnemyMgr.all() : [];
      const minions = allEnemies.filter(e => e.isRiftMinion && !e.dead);

      return {
        bossName: boss ? boss.name : null,
        bossHp: boss ? boss.hp : null,
        bossDmg: boss ? boss.dmg : null,
        bossTier: boss ? boss.riftTier : null,
        bossTierName: boss ? boss.riftTierName : null,
        minionsCount: minions.length
      };
    });
    console.log('Detalhes da Arena no Nível 30:', arenaDetails);
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_rift_lvl30_arena.png' });

    // 2. Agora testar a morte dentro do Rift!
    console.log('Provocando dano fatal no jogador dentro do Rift...');
    await page.evaluate(() => {
      const p = window.game.player;
      p.hp = 0;
      p.dead = true;
      if (p.anim && p.anim.play) p.anim.play('Faint', { hold: true });
    });

    // Aguarda 3 segundos para a transição de morte (deathT > 1.3s -> endRun(true))
    await new Promise(r => setTimeout(r, 3000));

    const deathResult = await page.evaluate(() => {
      const g = window.game;
      const p = g ? g.player : null;
      const overScreen = document.getElementById('scr-over');
      return {
        gameState: g ? g.state : null,
        isDead: p ? p.dead : null,
        playerHp: p ? p.hp : null,
        overScreenVisible: overScreen ? !overScreen.classList.contains('hidden') : false
      };
    });
    console.log('Resultado após morte no Rift:', deathResult);
    await page.screenshot({ path: 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/test_rift_death_gameover.png' });

    await browser.close();

    if (deathResult.gameState === 'over' && deathResult.overScreenVisible && arenaDetails.bossTier === 3) {
      console.log('🎉 SUCESSO COMPLETO: Rift escalonado pelo nível e Game Over comprovado ao morrer no Rift!');
      process.exit(0);
    } else {
      console.error('❌ Falha na validação de Rift ou Game Over.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro no teste E2E:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
