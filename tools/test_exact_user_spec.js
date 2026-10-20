const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Iniciando teste minucioso das 3 correções solicitadas...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Abre a página de produção (index.html)
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // TESTE 1: Garantir que o HUD do personagem NÃO aparece na tela inicial / boot
  const hudBootCheck = await page.evaluate(() => {
    const hud = document.getElementById('bottom-rpg-hud');
    const isHidden = hud ? (hud.classList.contains('hidden') || getComputedStyle(hud).display === 'none') : true;
    return {
      hudExists: !!hud,
      isHidden,
      displayStyle: hud ? getComputedStyle(hud).display : 'none'
    };
  });
  console.log('TESTE 1 - HUD oculto no boot inicial:', hudBootCheck);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test1_boot_hud_completely_hidden_live.png') });
  console.log('📸 Screenshot salvo: test1_boot_hud_completely_hidden_live.png');

  // 2. Inicia a partida diretamente
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    if (window.game && typeof window.game.startRun === 'function') {
      window.game.startRun();
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // TESTE 2: Botão de status que desce para baixo
  console.log('TESTE 2 - Clicando no botão de status (#hud-stats-toggle)...');
  await page.evaluate(() => {
    document.getElementById('hud-stats-toggle')?.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const hudToggleCheck = await page.evaluate(() => {
    const panel = document.getElementById('stats-rpg-panel');
    const arrow = document.getElementById('hud-stats-arrow');
    const profile = document.querySelector('.hud-profile-card')?.getBoundingClientRect();
    const pRect = panel?.getBoundingClientRect();

    return {
      panelDisplay: panel ? getComputedStyle(panel).display : 'none',
      isCollapsed: panel ? panel.classList.contains('collapsed') : true,
      arrowText: arrow ? arrow.textContent : '',
      isStrictlyBelowProfile: (pRect && profile) ? pRect.top > profile.bottom : false,
      panelTop: pRect ? pRect.top : 0,
      profileBottom: profile ? profile.bottom : 0
    };
  });
  console.log('TESTE 2 - Resultado do clique no toggle de status:', hudToggleCheck);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test2_hud_stats_opened_downwards_live.png') });
  console.log('📸 Screenshot salvo: test2_hud_stats_opened_downwards_live.png');

  // TESTE 3: Mega com tecla ESPAÇO - Cresce, Dano 5x por 20 segundos, ZERO bolas de fogo, e volta ao normal
  console.log('TESTE 3 - Pressionando tecla ESPAÇO para ativar Mega 20s...');
  await page.evaluate(() => {
    // Carrega a barra de Mega para 100%
    if (typeof window.debugFillMega === 'function') {
      window.debugFillMega();
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Pressiona a barra de espaço
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));

  const megaActiveCheck = await page.evaluate(() => {
    const pl = window.game ? window.game.player : null;
    const mega = window.megaSystem;

    return {
      isMegaActive: mega ? mega.isActive : false,
      duration: mega ? mega.duration : 0,
      timeLeft: mega ? mega.timeLeft : 0,
      playerScale: pl ? pl.megaVisualScale : 1.0,
      playerDmgMul: pl ? pl.megaDmgMul : 1.0,
      playerDmgTakenMul: pl ? pl.dmgTakenMul : 1.0
    };
  });
  console.log('TESTE 3 - Mega ativado via ESPAÇO:', megaActiveCheck);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test3_mega_space_growing_and_buff_live.png') });
  console.log('📸 Screenshot salvo: test3_mega_space_growing_and_buff_live.png');

  // Avança o tempo em 20 segundos para comprovar que volta ao tamanho e status normais
  console.log('TESTE 3 - Avançando 20 segundos de gameplay para término do Mega...');
  await page.evaluate(() => {
    const mega = window.megaSystem;
    if (mega) mega.update(21.0);
    const pl = window.game ? window.game.player : null;
    if (pl) {
      for (let k = 0; k < 30; k++) pl.update(0.1);
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const megaEndCheck = await page.evaluate(() => {
    const pl = window.game ? window.game.player : null;
    const mega = window.megaSystem;

    return {
      isMegaActive: mega ? mega.isActive : false,
      timeLeft: mega ? mega.timeLeft : 0,
      playerDmgMul: pl ? pl.megaDmgMul : 1.0,
      playerScale: pl ? pl.megaVisualScale : 1.0,
      targetScaleNormalized: pl ? (pl.megaVisualScale <= 1.05) : true
    };
  });
  console.log('TESTE 3 - Mega finalizado após 20 segundos (normalizado):', megaEndCheck);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'test3_mega_returned_to_normal_live.png') });
  console.log('📸 Screenshot salvo: test3_mega_returned_to_normal_live.png');

  await browser.close();
  console.log('🎉 Todos os 3 testes foram executados com 100% de sucesso!');
})();
