const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🔍 Diagnosticando por que o Pokémon pode não estar evoluindo...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  page.on('console', m => console.log('LOG:', m.text()));
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));

  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    window.game.startRun();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inspeciona o jogador inicial
  const pInit = await page.evaluate(() => {
    const pl = window.game ? window.game.player : null;
    return {
      species: pl ? pl.species : null,
      dex: pl ? pl.dex : null,
      level: pl ? pl.level : null,
      currentEvolutionStage: pl ? pl.currentEvolutionStage : null,
      evolutionHistory: pl ? pl.evolutionHistory : null
    };
  });
  console.log('Jogador inicial:', pInit);

  // Simula coleta de XP até o nível 16 passando por cada nível e checando LevelUp UI
  for (let l = 2; l <= 16; l++) {
    const lvlResult = await page.evaluate(() => {
      const pl = window.game.player;
      pl.gainXp(pl.xpNext - pl.xp);
      return {
        level: pl.level,
        species: pl.species,
        dex: pl.dex,
        milestones: Array.from(pl._milestonesReached || []),
        isLevelUpOpen: (typeof G === 'object' && G.UI) ? G.UI.isOpen('scr-levelup') : false
      };
    });
    console.log(`Nível ${l}:`, lvlResult);
  }

  await browser.close();
})();
