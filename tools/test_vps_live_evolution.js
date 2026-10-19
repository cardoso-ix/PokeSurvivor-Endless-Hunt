const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

(async () => {
  console.log('🌐 Conectando à VPS com sessão autenticada: http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EVOLUÇÃO') || text.includes('[ASCENSÃO') || text.includes('Error')) {
      console.log('  [VPS BROWSER CONSOLE]', text);
    }
  });

  // Prepara sessão local para abrir diretamente no menu
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ps.session', JSON.stringify('tester'));
    localStorage.setItem('ps.accounts', JSON.stringify({
      tester: { name: 'Tester', created: Date.now() }
    }));
    localStorage.setItem('ps.save.tester', JSON.stringify({
      version: 3,
      name: 'Tester',
      partner: 1, // Bulbasaur
      starter: 1,
      coins: 1000,
      owned: { 1: { at: Date.now(), from: 'starter' } },
      playableStarters: ['bulbasaur']
    }));
  });

  await page.goto('http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Inicia partida via Flow.play() ou Game.startRun()
  const vpsResults = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    if (window.G && window.G.Game && typeof window.G.Game.startRun === 'function') {
      window.G.Game.startRun();
    } else if (window.G && window.G.Flow && typeof window.G.Flow.play === 'function') {
      window.G.Flow.play();
    }

    const pl = window.G && window.G.Game && window.G.Game.player;
    if (!pl) return { error: 'Player não inicializado na VPS', gKeys: Object.keys(window.G || {}) };

    // Sobe para Nível 5
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(5);
    } else {
      pl.level = 5;
      pl.checkEvolutionMilestones();
    }
    const lv5Species = pl.species;
    const cardsLv5 = window.G.LevelUp ? window.G.LevelUp.candidates(pl) : [];
    const evoCardsLv5 = cardsLv5.filter(c => c.type === 'EVOLUTION' || (c.key && c.key.startsWith('evo_mon:'))).length;

    // Sobe para Nível 12
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(12);
    } else {
      pl.level = 12;
      pl.checkEvolutionMilestones();
    }
    const lv12Species = pl.species;
    const cardsLv12 = window.G.LevelUp ? window.G.LevelUp.candidates(pl) : [];
    const evoCardsLv12 = cardsLv12.filter(c => c.type === 'EVOLUTION' || (c.key && c.key.startsWith('evo_mon:'))).length;

    // Sobe para Nível 21
    if (typeof window.debugSetLevel === 'function') {
      window.debugSetLevel(21);
    } else {
      pl.level = 21;
      pl.checkEvolutionMilestones();
    }

    return {
      lv5Species,
      evoCardsLv5,
      lv12Species,
      evoCardsLv12,
      lv21Mega: pl.isMegaAscended,
      atkMul: pl.atkMul,
      hudTitle: pl.ascensionTitle || pl.mon.name
    };
  });

  console.log('Resultados dos testes na VPS em produção:', vpsResults);

  const shotPath = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_live_auto_evolution.png';
  await page.screenshot({ path: shotPath });
  console.log(`📸 Screenshot da VPS salvo em: ${shotPath}`);

  await browser.close();

  if (vpsResults.lv5Species !== 'ivysaur') throw new Error(`Falha: Nv 5 na VPS gerou ${vpsResults.lv5Species}`);
  if (vpsResults.evoCardsLv5 !== 0) throw new Error(`Falha: Cartas de evolução encontradas no Nv 5 na VPS`);
  if (vpsResults.lv12Species !== 'venusaur') throw new Error(`Falha: Nv 12 na VPS gerou ${vpsResults.lv12Species}`);
  if (vpsResults.evoCardsLv12 !== 0) throw new Error(`Falha: Cartas de evolução encontradas no Nv 12 na VPS`);
  if (!vpsResults.lv21Mega) throw new Error(`Falha: Mega Ascensão não ativou no Nv 21 na VPS`);

  console.log('\n🎉 SUCESSO TOTAL: VPS 100% VALIDADA E OPERACIONAL EM PRODUÇÃO!');
})().catch(err => {
  console.error('❌ Falha ao testar VPS:', err);
  process.exit(1);
});
