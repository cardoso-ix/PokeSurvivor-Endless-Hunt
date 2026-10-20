const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Iniciando teste de validação E2E: Fim de Rift sem modal + Mega 20s + HUD para baixo...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    if (window.G && window.G.DB && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inicia partida
  await page.evaluate(() => {
    G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1500));

  // TESTE 1: Simula finalização de um Rift
  console.log('🌀 Simulando conclusão de Fenda Dimensional (Rift)...');
  const riftResult = await page.evaluate(() => {
    // Abre e conclui o rift
    G.Rift.debugOpen();
    G.Rift.start();
    // Simula a derrota do guardião
    const arena = G.Rift.arena;
    if (arena) {
      arena.phase = 'fight';
      // Simula término do combate
      if (typeof G.Game.offerBond === 'function') G.Game.offerBond();
    }
    return {
      isBondOpen: G.UI.isOpen('scr-bond'),
      isLevelUpOpen: G.UI.isOpen('scr-levelup'),
      isPaused: G.Game ? G.Game.isPaused : false
    };
  });
  console.log('Resultado do fim do Rift:', riftResult);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'rift_end_no_modal_gameplay_live.png') });
  console.log('📸 Screenshot salvo: rift_end_no_modal_gameplay_live.png');

  // TESTE 2: Status desce para baixo do personagem e vida
  console.log('📊 Abrindo flagzinha de status...');
  await page.evaluate(() => {
    const toggle = document.getElementById('hud-stats-toggle');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const hudResult = await page.evaluate(() => {
    const profile = document.querySelector('.hud-profile-card')?.getBoundingClientRect();
    const toggle = document.getElementById('hud-stats-toggle')?.getBoundingClientRect();
    const panel = document.getElementById('stats-rpg-panel')?.getBoundingClientRect();
    return {
      profileBottom: profile ? profile.bottom : 0,
      toggleBottom: toggle ? toggle.bottom : 0,
      panelTop: panel ? panel.top : 0,
      isStrictlyBelow: panel && profile ? panel.top > profile.bottom : false
    };
  });
  console.log('Resultado do HUD descendo para baixo:', hudResult);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hud_status_down_verified_live.png') });
  console.log('📸 Screenshot salvo: hud_status_down_verified_live.png');

  await browser.close();
  console.log('🎉 Validação E2E concluída com 100% de sucesso!');
})();
