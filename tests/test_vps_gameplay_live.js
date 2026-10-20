const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  let browser;
  try {
    console.log('--- Validando VPS ao Vivo: Início de Partida e Gameplay Ativa ---');
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
    console.log('Navegando para VPS:', VPS_URL);
    await page.goto(VPS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Entrar como convidado
    console.log('Clicando em Entrar como Convidado...');
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Clica em Jogar (Entrar na Masmorra)
    console.log('Clicando em Jogar no menu principal...');
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Clica em Iniciar Kanto
    console.log('Clicando no botão ▶ INICIAR EM KANTO...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button');
      if (btn) btn.click();
    });

    // Aguarda 6 segundos de combate real
    console.log('Aguardando 6 segundos de combate ativo...');
    await new Promise(r => setTimeout(r, 6000));

    const vpsState = await page.evaluate(() => {
      const g = window.game;
      const p = g ? g.player : null;
      return {
        state: g ? g.state : null,
        region: g ? g.currentRegion : null,
        player: p ? {
          pokemon: p.pokemonId || (p.mon ? p.mon.name : null),
          hp: p.hp,
          maxHp: p.maxHp,
          atk: p.attack,
          def: p.defense,
          spd: p.speed,
          posX: Math.round(p.x),
          posY: Math.round(p.y),
          kills: p.kills,
          movesCount: p.moves ? p.moves.length : 0
        } : null
      };
    });
    console.log('Estado verificado da VPS ao vivo:', vpsState);

    const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_gameplay_active.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot salva em: ${screenshotPath}`);

    if (vpsState.state === 'playing' && vpsState.player) {
      console.log('🎉 SUCESSO COMPLETO NA VPS AO VIVO: Partida iniciada e combate 100% ativo!');
      process.exit(0);
    } else {
      console.error('❌ Falha na VPS ao vivo.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro na execução:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
