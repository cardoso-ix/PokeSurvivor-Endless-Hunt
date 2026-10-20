const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Iniciando teste de Nível 20+ (Passivas/Status normais, sem ataques novos) + Cartas de Evolução...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  page.on('console', m => console.log('LOG:', m.text()));

  await page.goto('http://localhost:8080/dev.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    G.Game.startRun();
  });
  await new Promise(r => setTimeout(r, 1000));

  // TESTE 1: No Nível 5, verificar se a carta de EVOLUÇÃO aparece nas opções de LevelUp
  console.log('--- TESTE 1: Carta de Evolução no Nível 5 ---');
  const evoOffer = await page.evaluate(() => {
    const pl = G.Game.player;
    pl.level = 5;
    const cards = G.LevelUp.offer(pl);
    return cards.map(c => ({
      type: c.type,
      title: c.title,
      tag: c.tag,
      desc: c.desc,
      targetSpeciesId: c.targetSpeciesId
    }));
  });
  console.log('Cartas oferecidas no Nível 5:', evoOffer);

  // Aplica a carta de evolução
  const evoApply = await page.evaluate(() => {
    const pl = G.Game.player;
    const cards = G.LevelUp.offer(pl);
    const evoCard = cards.find(c => c.type === 'EVOLUTION');
    if (evoCard) {
      evoCard.apply(pl);
    }
    return {
      hasEvoCard: !!evoCard,
      speciesAfter: pl.species,
      dexAfter: pl.dex,
      monNameAfter: pl.mon.name
    };
  });
  console.log('Resultado da aplicação da carta de evolução:', evoApply);

  // TESTE 2: Nível 20, 21, 22, 25 - LevelUp contínuo com Passivas e ZERO ataques novos
  console.log('--- TESTE 2: LevelUp no Nível 20+ ---');
  const lvl20PlusTests = await page.evaluate(() => {
    const pl = G.Game.player;
    const results = [];

    // Preenche ataques válidos no jogador caso tenha menos de 4
    const validMoves = ['vine-whip', 'razor-leaf', 'sludge', 'tackle'];
    for (const mId of validMoves) {
      if (pl.moves.length < 4 && !pl.hasMove(mId)) {
        pl.addMove(mId);
      }
    }

    const testLevels = [20, 21, 22, 25, 30];
    for (const lvl of testLevels) {
      pl.level = lvl;
      const cards = G.LevelUp.offer(pl);
      const hasNewMoves = cards.some(c => c.type === 'new');
      const passives = cards.filter(c => c.type === 'stat');
      const moveUpgrades = cards.filter(c => c.type === 'up');

      results.push({
        level: lvl,
        cardCount: cards.length,
        hasNewMoves,
        passivesCount: passives.length,
        moveUpgradesCount: moveUpgrades.length,
        cardTitles: cards.map(c => c.title)
      });
    }

    return results;
  });
  console.log('Resultados de LevelUp no Nível 20+:', lvl20PlusTests);

  await browser.close();
  console.log('🎉 Teste finalizado com sucesso!');
})();
