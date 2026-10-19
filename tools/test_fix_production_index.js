const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 [TESTE PRODUÇÃO index.html] Iniciando validação no bundle minificado...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  let pageErrors = [];
  page.on('pageerror', err => {
    console.error('  [PAGE ERROR]', err.message);
    pageErrors.push(err.message);
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EVOLUÇÃO') || text.includes('[ASCENSÃO') || text.includes('[WorldCaptureBall]') || text.includes('Guardião')) {
      console.log('  [CONSOLE]', text);
    }
  });

  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.db && window.CaptureSystem, { timeout: 10000 });

  // Iniciar partida com Bulbasaur no index.html
  const initGame = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.db.ready();
    window.db.playAsGuest();
    window.db.save.partner = 1;
    window.db.save.starter = 1;
    window.db.save.owned[1] = { at: Date.now(), from: 'starter' };

    // Inicia a run via game ou G se exposto
    if (window.game && typeof window.game.startRun === 'function') {
      window.game.startRun();
    } else if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = (window.game && window.game.player) || (window.G && window.G.Game && window.G.Game.player);
    return {
      started: !!pl,
      species: pl ? pl.species : null,
      level: pl ? pl.level : null
    };
  });
  console.log('1. Jogo iniciado em index.html:', initGame);

  if (!initGame.started) {
    console.error('❌ Não conseguiu iniciar player em index.html');
    process.exit(1);
  }

  // Testar Evolução Automática no Nível 5
  console.log('\n2. Testando evolução automática no Nível 5 no bundle minificado...');
  const evoNv5 = await page.evaluate(() => {
    const pl = (window.game && window.game.player) || (window.G && window.G.Game && window.G.Game.player);
    while (pl.level < 5) {
      const xpNeeded = pl.xpNext - pl.xp + 1;
      pl.gainXp(xpNeeded);
    }
    return {
      level: pl.level,
      species: pl.species,
      monName: pl.mon.name,
      dex: pl.dex
    };
  });
  console.log('  -> Resultado Nível 5:', evoNv5);
  if (evoNv5.species !== 'ivysaur') {
    console.error('❌ FALHA: O Pokémon deveria ter evoluído para ivysaur no nível 5 em index.html!');
    process.exit(1);
  }
  console.log('  ✅ Bulbasaur evoluiu com sucesso para Ivysaur no Nível 5 em PRODUÇÃO!');

  // Testar Evolução Automática no Nível 12
  console.log('\n3. Testando evolução automática no Nível 12 no bundle minificado...');
  const evoNv12 = await page.evaluate(() => {
    const pl = (window.game && window.game.player) || (window.G && window.G.Game && window.G.Game.player);
    while (pl.level < 12) {
      const xpNeeded = pl.xpNext - pl.xp + 1;
      pl.gainXp(xpNeeded);
    }
    return {
      level: pl.level,
      species: pl.species,
      monName: pl.mon.name,
      dex: pl.dex
    };
  });
  console.log('  -> Resultado Nível 12:', evoNv12);
  if (evoNv12.species !== 'venusaur') {
    console.error('❌ FALHA: O Pokémon deveria ter evoluído para venusaur no nível 12 em index.html!');
    process.exit(1);
  }
  console.log('  ✅ Ivysaur evoluiu com sucesso para Venusaur no Nível 12 em PRODUÇÃO!');

  // Testar Pokébola no Rift em index.html
  console.log('\n4. Testando mecânica de arremesso da Pokébola no Rift em PRODUÇÃO...');
  const riftTest = await page.evaluate(() => {
    // Usa triggerGuardian via debugTriggerRift ou similar
    if (typeof window.debugTriggerRift === 'function') {
      window.debugTriggerRift('articuno', false);
    } else if (window.G && window.G.Rift) {
      window.G.Rift.triggerGuardian('articuno', false);
    }

    const capSys = window.CaptureSystem || (window.G && window.G.Capture);
    // Dispara a derrota do guardião
    if (typeof window.onGuardianDefeated === 'function') {
      window.onGuardianDefeated({ x: 200, y: 200, hp: 0, dead: true });
    }

    const ball = capSys ? capSys.activeData : null;
    return {
      isCapturing: capSys ? capSys.isCapturing : false,
      ballExists: !!ball,
      ballState: ball ? ball.state : null,
      ballTier: ball ? ball.ballTier.name : null
    };
  });
  console.log('  -> Resultado do teste de Pokébola em index.html:', riftTest);

  if (!riftTest.ballExists || !riftTest.isCapturing) {
    console.error('❌ FALHA: Pokébola não instanciada em index.html!');
    process.exit(1);
  }
  console.log('  ✅ Pokébola lançada e ativa em PRODUÇÃO!');

  // Tira screenshot de validação do index.html
  const shotProd = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_live_fix_verified.png';
  await page.screenshot({ path: shotProd });
  console.log('  📸 Screenshot de produção salvo em:', shotProd);

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ Erros detectados:', pageErrors);
    process.exit(1);
  }

  console.log('\n🎉 SUCESSO TOTAL EM PRODUÇÃO!');
})();
