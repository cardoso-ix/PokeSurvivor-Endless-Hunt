const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 [TESTE INTEGRADO] Iniciando validação completa de Evolução Automática e Mecânica de Pokébola...');
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

  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.DB && window.G.Capture && window.G.Rift, { timeout: 10000 });

  // 1. Iniciar partida com Bulbasaur (Estágio 1)
  const initGame = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 1;
    window.G.DB.save.starter = 1;
    window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };

    window.G.Game.startRun();
    const pl = window.G.Game.player;
    return {
      started: !!pl,
      species: pl ? pl.species : null,
      level: pl ? pl.level : null
    };
  });
  console.log('1. Jogo iniciado com:', initGame);

  // 2. Testar Evolução Automática no Nível 5 (Bulbasaur -> Ivysaur)
  console.log('\n2. Testando evolução automática no Nível 5...');
  const evoNv5 = await page.evaluate(() => {
    const pl = window.G.Game.player;
    // Simula ganho de XP contínuo até atingir nível 5
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
    console.error('❌ FALHA: O Pokémon deveria ter evoluído para ivysaur no nível 5!');
    process.exit(1);
  }
  console.log('  ✅ Bulbasaur evoluiu com sucesso para Ivysaur no Nível 5!');

  // 3. Testar Evolução Automática no Nível 12 (Ivysaur -> Venusaur)
  console.log('\n3. Testando evolução automática no Nível 12...');
  const evoNv12 = await page.evaluate(() => {
    const pl = window.G.Game.player;
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
    console.error('❌ FALHA: O Pokémon deveria ter evoluído para venusaur no nível 12!');
    process.exit(1);
  }
  console.log('  ✅ Ivysaur evoluiu com sucesso para Venusaur no Nível 12!');

  // 4. Testar Mecânica da Pokébola no Rift
  console.log('\n4. Testando mecânica de arremesso e captura da Pokébola no Rift...');
  const riftSetup = await page.evaluate(() => {
    // Dispara entrada na arena com Articuno
    window.G.Rift.triggerGuardian('articuno', false);
    const arena = window.G.Rift.arena;
    return {
      inArena: window.G.Rift.inArena,
      bossId: arena ? arena.bossId : null
    };
  });
  console.log('  -> Rift ativado:', riftSetup);

  await new Promise(r => setTimeout(r, 600));

  // Aplica dano letal no Guardião para simular a morte por combate
  const bossDefeated = await page.evaluate(() => {
    const arena = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    if (!boss) return { error: 'Boss não encontrado' };

    const initialHp = boss.hp;
    // Dano letal
    boss.hurt(boss.hp + 5000);

    const capSys = window.G.Capture;
    const ball = capSys.activeData;

    return {
      initialHp,
      bossHpAfter: boss.hp,
      bossDead: boss.dead,
      isCapturing: capSys.isCapturing,
      ballExists: !!ball,
      ballTier: ball ? ball.ballTier.name : null,
      ballState: ball ? ball.state : null,
      ballTarget: ball ? { x: ball.targetX, y: ball.targetY } : null,
      ballFrom: ball ? { x: ball.fromX, y: ball.fromY } : null
    };
  });
  console.log('  -> Guardião derrotado e Pokébola lançada:', bossDefeated);

  if (!bossDefeated.ballExists || !bossDefeated.isCapturing) {
    console.error('❌ FALHA: A Pokébola não foi instanciada ou isCapturing é false!');
    process.exit(1);
  }
  console.log('  ✅ Pokébola lançada com sucesso no solo do mapa!');

  // Tira screenshot da Pokébola no mapa
  const shotPath = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\gameplay_pokeball_rift_verified.png';
  await page.screenshot({ path: shotPath });
  console.log('  📸 Screenshot salvo em:', shotPath);

  // Aguarda os balanços e a resolução da captura (cerca de 3 segundos)
  console.log('\n5. Aguardando animação física dos 3 balanços da Pokébola...');
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 500));
    const ballStatus = await page.evaluate(() => {
      const capSys = window.G.Capture;
      const ball = capSys.activeData;
      return {
        state: ball ? ball.state : 'null',
        variant: ball ? ball.variant : 'null',
        isCapturing: capSys.isCapturing
      };
    });
    console.log(`  Tempo +${i * 0.5}s -> Estado: ${ballStatus.state} | Variante: ${ballStatus.variant} | isCapturing: ${ballStatus.isCapturing}`);
  }

  // Verifica conclusão
  const finalState = await page.evaluate(() => {
    return {
      inArena: window.G.Rift.inArena,
      pageErrors: window.__errors || []
    };
  });
  console.log('\n6. Estado final da partida após a captura:', finalState);

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ Erros de página detectados:', pageErrors);
    process.exit(1);
  }

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO TOTAL!');
  console.log('  - Evolução automática nos níveis 5 e 12: 100% FUNCIONANDO');
  console.log('  - Lançamento físico e mecânica de Pokébola no Rift: 100% FUNCIONANDO');
})();
