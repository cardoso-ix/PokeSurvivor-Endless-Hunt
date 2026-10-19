const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🌐 Validando Mega Supremo Elemental Dinâmico na VPS (dev.html e index.html)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    let pageErrors = [];
    page.on('pageerror', err => {
      console.error('  [VPS PAGE ERROR]', err.message);
      pageErrors.push(err.message);
    });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('fallo en un fotograma') || text.includes('ReferenceError') || text.includes('TypeError')) {
        console.error('  [VPS CONSOLE FATAL]:', text);
        pageErrors.push(text);
      }
    });

    console.log('  -> Acessando http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html...');
    await page.goto('http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/dev.html', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.G.Mega, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // Inicializa a partida com Bulbasaur (Grama) na VPS
    const startRes = await page.evaluate(async () => {
      const tap = document.querySelector('.tapstart');
      if (tap) tap.remove();

      if (window.G && window.G.DB) {
        await window.G.DB.ready();
        window.G.DB.playAsGuest();
        window.G.DB.save.partner = 1; // Bulbasaur (Grass/Poison)
        window.G.DB.save.starter = 1;
        window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
      }

      if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
        window.G.Game.startRun();
      }

      const pl = window.G && window.G.Game && window.G.Game.player;
      if (!pl) return { error: 'Jogador não encontrado' };

      // Carrega barra de Mega a 100%
      if (typeof window.debugFillMega === 'function') {
        window.debugFillMega();
      } else {
        window.G.Mega.gauge = 100;
        window.G.Mega.isReady = true;
      }

      return {
        success: true,
        species: pl.species || (pl.mon && pl.mon.name),
        megaGauge: window.G.Mega.gauge
      };
    });

    console.log('  -> Jogo inicializado com sucesso na VPS:', startRes);
    await new Promise(r => setTimeout(r, 1000));

    // Dispara a tecla [Espaço]
    console.log('  -> Pressionando [Espaço] para ativar o Mega Supremo na VPS...');
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    });
    await new Promise(r => setTimeout(r, 500));

    // Captura estado do Mega e VFX
    const megaState = await page.evaluate(() => {
      const mega = window.G.Mega;
      const pl = window.G.Game.player;
      const vfx = window.G.UltimateVFX;

      return {
        isActive: mega.isActive,
        currentElement: mega.currentElement,
        timeLeft: mega.timeLeft || mega.timer,
        gauge: mega.gauge,
        auraElement: pl.megaAuraElement,
        hazardCount: vfx ? vfx.count : 0
      };
    });

    console.log('  -> Estado verificado na VPS durante o Mega Supremo:', megaState);

    // Salva screenshot
    const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/vps_live_mega_elemental.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`  📸 Screenshot salvo em: ${screenshotPath}`);

    // Aguarda mais 2.5s para verificar drenagem do timer e geração contínua de perigos
    await new Promise(r => setTimeout(r, 2500));

    const postState = await page.evaluate(() => {
      const mega = window.G.Mega;
      const vfx = window.G.UltimateVFX;
      return {
        isActive: mega.isActive,
        timeLeft: mega.timeLeft || mega.timer,
        gauge: mega.gauge,
        vfxCount: vfx ? vfx.count : 0
      };
    });

    console.log('  -> Estado após 3s de execução contínua na VPS:', postState);

    if (pageErrors.length > 0) {
      console.error('❌ Erros detectados no console da VPS:', pageErrors);
      process.exit(1);
    }

    if (!megaState.isActive || megaState.currentElement !== 'grass') {
      console.error('❌ Mega não ativou corretamente ou elemento não é grass:', megaState);
      process.exit(1);
    }

    if (postState.gauge >= megaState.gauge) {
      console.error('❌ Drenagem linear da barra falhou:', postState);
      process.exit(1);
    }

    console.log('🎉 SUCESSO TOTAL NA VPS: Mega Supremo Dinâmico por Tipo Elemental validado e 100% operacional em produção!');
  } catch (err) {
    console.error('Erro no teste VPS:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
