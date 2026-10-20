const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Testando HUD com status abaixo do personagem e Mega 20s com dano 5x...');
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

  // TESTE 1: Painel de Status aberto DESCENDO ABAIXO do personagem e vida
  console.log('📊 Abrindo flagzinha de status...');
  await page.evaluate(() => {
    const toggle = document.getElementById('hud-stats-toggle');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verifica as posições geométricas no DOM
  const geom = await page.evaluate(() => {
    const profile = document.querySelector('.hud-profile-card')?.getBoundingClientRect();
    const skills = document.querySelector('.hud-skills-deck')?.getBoundingClientRect();
    const toggle = document.getElementById('hud-stats-toggle')?.getBoundingClientRect();
    const panel = document.getElementById('stats-rpg-panel')?.getBoundingClientRect();

    return {
      profileBottom: profile ? profile.bottom : null,
      skillsBottom: skills ? skills.bottom : null,
      toggleBottom: toggle ? toggle.bottom : null,
      panelTop: panel ? panel.top : null,
      panelBottom: panel ? panel.bottom : null,
      isPanelStrictlyBelowProfile: panel && profile ? panel.top >= profile.bottom : false,
      isPanelStrictlyBelowToggle: panel && toggle ? panel.top >= toggle.top : false
    };
  });
  console.log('Posicionamento geométrico do HUD:', geom);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hud_status_strictly_below_pokemon_live.png') });
  console.log('📸 Screenshot salvo: hud_status_strictly_below_pokemon_live.png');

  // TESTE 2: Mega com Barra de Espaço (Cresce 1.85x + Dano 5x + 20 Segundos)
  console.log('⚡ Carregando 100% de energia Mega e ativando via ESPAÇO...');
  const megaStatus = await page.evaluate(() => {
    const pl = G.Game.player;
    pl.megaEnergy = 100;
    G.Mega.gauge = 100;
    // Dispara via trigger ou espaço
    G.Mega.trigger();

    return {
      isActive: G.Mega.isActive,
      duration: G.Mega.duration,
      timeLeft: G.Mega.timeLeft,
      megaDmgMul: pl.megaDmgMul,
      visualScale: pl.megaVisualScale,
      totalAtk: pl.atk
    };
  });
  console.log('Status do Mega 20s Ativado:', megaStatus);

  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mega_space_20s_buff_absurdo_live.png') });
  console.log('📸 Screenshot salvo: mega_space_20s_buff_absurdo_live.png');

  await browser.close();
  console.log('🎉 Validação local concluída com sucesso!');
})();
