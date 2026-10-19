const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🚀 Iniciando Teste Completo do Botão Mega e Poder Supremo...');
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
    if (msg.text().includes('MEGA') || msg.text().includes('TOAST') || msg.text().includes('DEBUG')) {
      console.log('  [CONSOLE]', msg.text());
    }
  });

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Mega, { timeout: 10000 });

  // 1. Inicia jogo com Charmander (Fogo)
  const initResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.DB) {
      await window.G.DB.ready();
      window.G.DB.playAsGuest();
      window.G.DB.save.partner = 4; // Charmander
      window.G.DB.save.starter = 4;
      window.G.DB.save.owned[4] = { at: Date.now(), from: 'starter' };
    }

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    }

    return {
      started: true
    };
  });
  console.log('  -> Jogo iniciado:', initResult);

  await new Promise(r => setTimeout(r, 1000));

  // 2. Verifica a existência e texto inicial do Botão Mega (Carregando 0%)
  const btnInitial = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const track = document.querySelector('.mega-track');
    return {
      btnExists: !!btn,
      txtContent: txt ? txt.textContent : null,
      trackExists: !!track,
      isReady: btn ? btn.classList.contains('ready') : false,
      isActive: btn ? btn.classList.contains('active') : false
    };
  });
  console.log('  -> Estado inicial do Botão Mega:', btnInitial);
  if (!btnInitial.btnExists) {
    console.error('❌ ERRO: Botão #hud-mega-btn não encontrado no DOM!');
    process.exit(1);
  }

  // Tira screenshot do botão carregando (0%)
  const screenshotCharging = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/mega_btn_charging.png';
  await page.screenshot({ path: screenshotCharging });
  console.log(`  📸 Screenshot do botão carregando salvo em: ${screenshotCharging}`);

  // 3. Testa clicar no botão enquanto carrega (deve disparar toast amigável sem ativar)
  console.log('  -> Clicando no botão Mega enquanto ainda está carregando...');
  const toastResult = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
    return {
      megaActive: window.G.Mega.isActive,
      toast: document.querySelector('.toast') ? document.querySelector('.toast').textContent : null
    };
  });
  console.log('  -> Resposta ao clique prematuro:', toastResult);
  if (toastResult.megaActive) {
    console.error('❌ ERRO: Mega ativou com carga incompleta!');
    process.exit(1);
  }

  // 4. Carrega a barra para 100% com debugFillMega()
  console.log('  -> Enchendo a barra de Mega para 100%...');
  await page.evaluate(() => {
    window.debugFillMega();
  });
  await new Promise(r => setTimeout(r, 300));

  // Verifica se o botão entrou em estado .ready (dourado pulsante)
  const btnReady = await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const bar = document.getElementById('hud-mega-bar');
    return {
      isReady: btn ? btn.classList.contains('ready') : false,
      btnTxt: txt ? txt.textContent : null,
      barReady: bar ? bar.classList.contains('ready') : false
    };
  });
  console.log('  -> Estado do Botão Mega a 100%:', btnReady);
  if (!btnReady.isReady) {
    console.error('❌ ERRO: Botão Mega não recebeu a classe .ready!');
    process.exit(1);
  }

  // Tira screenshot do botão pronto para acionar
  const screenshotReady = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/mega_btn_ready.png';
  await page.screenshot({ path: screenshotReady });
  console.log(`  📸 Screenshot do botão pronto salvo em: ${screenshotReady}`);

  // 5. Clica no Botão Mega para ATIVAR O PODER SUPREMO!
  console.log('  -> Clicando no Botão #hud-mega-btn para ativar o Mega Supremo...');
  await page.evaluate(() => {
    const btn = document.getElementById('hud-mega-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verifica ativação do Mega e do Poder Supremo
  const megaExecution = await page.evaluate(() => {
    const mega = window.G.Mega;
    const pl = window.G.Game.player;
    const btn = document.getElementById('hud-mega-btn');
    const txt = document.getElementById('hud-mega-btn-txt');
    const vfx = window.G.UltimateVFX;

    return {
      megaActive: mega.isActive,
      currentElement: mega.currentElement,
      timeLeft: mega.timeLeft,
      plMegaActive: pl.megaMode.active,
      auraElement: pl.megaAuraElement,
      btnActive: btn ? btn.classList.contains('active') : false,
      btnTxt: txt ? txt.textContent : null,
      hazardCount: vfx ? vfx.count : 0
    };
  });
  console.log('  -> Estado do Mega em Execução:', megaExecution);

  if (!megaExecution.megaActive) {
    console.error('❌ ERRO: Mega Supremo não ativou após o clique no botão!');
    process.exit(1);
  }
  if (megaExecution.currentElement !== 'fire') {
    console.error(`❌ ERRO: Elemento incorreto: esperado 'fire', obtido: '${megaExecution.currentElement}'`);
    process.exit(1);
  }
  if (!megaExecution.btnActive) {
    console.error('❌ ERRO: Botão Mega não recebeu a classe .active durante a execução!');
    process.exit(1);
  }

  // Aguarda 1.8 segundos para visualização das chuvas de meteoros e poças de fogo
  await new Promise(r => setTimeout(r, 1800));

  // Tira screenshot do Mega em ação com o botão ativo exibindo contagem regressiva
  const screenshotActive = 'C:/Users/eduar/.gemini/antigravity/brain/b914817b-8796-40fd-b0bb-8920d68a0a2b/mega_btn_active_ultimate.png';
  await page.screenshot({ path: screenshotActive });
  console.log(`  📸 Screenshot do Mega em ação salvo em: ${screenshotActive}`);

  console.log('✅ TESTE CONCLUÍDO COM SUCESSO ABSOLUTO!');
  await browser.close();
})();
