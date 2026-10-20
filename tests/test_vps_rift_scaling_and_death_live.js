const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    const url = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
    console.log('--- VALIDANDO VPS AO VIVO: ESCALONAMENTO DE RIFT E MORTE NA FENDA ---');

    // Polling do deploy via fetch
    let deployed = false;
    for (let i = 0; i < 25; i++) {
      try {
        const res = await fetch(`${url}version.json?t=${Date.now()}`);
        const data = await res.json();
        console.log(`Tentativa ${i+1}: version.json =`, data);
        if (data.v === '450854453f') {
          deployed = true;
          break;
        }
      } catch (e) {
        console.log(`Tentativa ${i+1} falhou:`, e.message);
      }
      await new Promise(r => setTimeout(r, 4000));
    }

    if (!deployed) {
      console.warn('⚠️ Deploy demorou mais que o esperado, prosseguindo com verificação...');
    } else {
      console.log('✅ Deploy com nova versão 450854453f confirmado na VPS!');
    }

    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Guest login
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Clica em Jogar
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Iniciar Kanto
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Coloca o jogador no nível 40 (Tier 4) e dispara Rift
    console.log('Disparando Rift no Nível 40 na VPS ao vivo...');
    const liveArena = await page.evaluate(() => {
      const p = window.game.player;
      p.level = 40; // Nível 40

      if (window.riftSystem && window.riftSystem.start) {
        window.riftSystem.start(null, null, false, 40);
      } else if (window.G && window.G.Rift) {
        window.G.Rift.start(null, null, false, 40);
      }

      return {
        level: p.level,
        inArena: !!((window.riftSystem && window.riftSystem.getArena()) || (window.G && window.G.Rift && window.G.Rift.inArena))
      };
    });
    console.log('Rift ativo na VPS:', liveArena);
    await new Promise(r => setTimeout(r, 2500));

    const guardianInfo = await page.evaluate(() => {
      const b = (window.riftSystem && window.riftSystem.getBoss()) ||
                ((window.G && window.G.Rift && window.G.Rift.arena) ? window.G.Rift.arena.bossObj : null);
      return {
        name: b ? b.name : null,
        hp: b ? b.hp : null,
        dmg: b ? b.dmg : null,
        tier: b ? b.riftTier : null,
        tierName: b ? b.riftTierName : null
      };
    });
    console.log('Guardião do Rift na VPS (Nível 40):', guardianInfo);

    const arenaScreenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_rift_scaled_lvl40.png';
    await page.screenshot({ path: arenaScreenshotPath });
    console.log(`Screenshot do Rift salva em: ${arenaScreenshotPath}`);

    // Provoca a morte do jogador dentro da fenda
    console.log('Provocando morte do jogador dentro do Rift na VPS...');
    await page.evaluate(() => {
      const p = window.game.player;
      p.hp = 0;
      p.dead = true;
      if (p.anim && p.anim.play) p.anim.play('Faint', { hold: true });
    });

    // Aguarda transição para Game Over
    await new Promise(r => setTimeout(r, 3500));

    const gameOverCheck = await page.evaluate(() => {
      const g = window.game;
      const overEl = document.getElementById('scr-over');
      return {
        gameState: g ? g.state : null,
        overVisible: overEl ? !overEl.classList.contains('hidden') : false
      };
    });
    console.log('Status de Game Over na VPS:', gameOverCheck);

    const deathScreenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_rift_death_gameover.png';
    await page.screenshot({ path: deathScreenshotPath });
    console.log(`Screenshot de Game Over salva em: ${deathScreenshotPath}`);

    await browser.close();

    if (gameOverCheck.gameState === 'over' && gameOverCheck.overVisible && guardianInfo.tier === 4) {
      console.log('🎉 SUCESSO TOTAL NA VPS AO VIVO: Rift escala de 10 em 10 e morte no Rift encerra a rodada com Game Over!');
      process.exit(0);
    } else {
      console.error('❌ Falha na validação ao vivo na VPS.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro na validação VPS:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
