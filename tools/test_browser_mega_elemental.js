const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Iniciando teste no navegador: Mega Supremo Dinâmico por Tipo Elemental...');
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

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.FX && window.G.Game && window.G.DB && window.G.Mega, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Inicia partida com Bulbasaur (Planta) e enche a barra de Mega
  const setupResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 1;
      window.G.DB.save.starter = 1;
      window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { error: 'Jogador não encontrado' };

    // Carrega a barra de Mega para 100%
    window.debugFillMega();

    return {
      success: true,
      gauge: window.G.Mega.gauge,
      starterName: pl.species || pl.mon.name
    };
  });

  console.log('  -> Jogo iniciado e Mega 100% carregado:', setupResult);

  // Dispara o pressionamento da Barra de Espaço
  console.log('  -> Pressionando tecla [Espaço] para ativar o Mega Supremo...');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
  });

  // Aguarda 2 frames para o loop do jogo processar o input
  await new Promise(r => setTimeout(r, 200));

  // Verifica ativação do elemento correspondente (grass para Bulbasaur)
  const activeResult = await page.evaluate(() => {
    const mega = window.G.Mega;
    const pl = window.G.Game.player;
    const vfx = window.G.UltimateVFX;

    return {
      isActive: mega.isActive,
      currentElement: mega.currentElement,
      timeLeft: mega.timeLeft,
      gauge: mega.gauge,
      auraElement: pl ? pl.megaAuraElement : null,
      hazardCount: vfx ? vfx.count : 0
    };
  });

  console.log('  -> Estado do Mega após [Espaço]:', activeResult);

  if (!activeResult.isActive) {
    console.error('❌ ERRO: Mega não ativou após pressionar Espaço!');
    process.exit(1);
  }
  if (activeResult.currentElement !== 'grass') {
    console.error(`❌ ERRO: Elemento esperado 'grass' para Bulbasaur, obtido: '${activeResult.currentElement}'`);
    process.exit(1);
  }

  // Deixa o Mega rodar por 2.5 segundos gerando calamidades de vinhas e raízes
  await new Promise(r => setTimeout(r, 2500));

  // Tira screenshot da aura elemental e dos efeitos visuais da Ultimate no mapa
  const screenshotPath = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/gameplay_mega_elemental.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`  📸 Screenshot salvo em: ${screenshotPath}`);

  // Verifica se a barra drenou suavemente
  const midResult = await page.evaluate(() => {
    return {
      gauge: window.G.Mega.gauge,
      timeLeft: window.G.Mega.timeLeft,
      vfxCount: window.G.UltimateVFX.count
    };
  });

  console.log('  -> Drenagem progressiva do Mega:', midResult);
  if (midResult.gauge >= 100 || midResult.gauge <= 0) {
    console.error(`❌ ERRO: Barra de Mega deveria estar em transição (obtido: ${midResult.gauge})`);
    process.exit(1);
  }

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ Erros de página detectados:', pageErrors);
    process.exit(1);
  }

  console.log('🎉 TESTE NO NAVEGADOR DO MEGA SUPREMO CONCLUÍDO COM 100% DE SUCESSO!');
})().catch(err => {
  console.error('❌ Erro no teste do navegador:', err);
  process.exit(1);
});
