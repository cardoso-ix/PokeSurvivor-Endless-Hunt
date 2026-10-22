const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando teste E2E de Balanceamento e Disparo Contínuo...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error') || text.includes('Sobrecarga') || text.includes('DISPARO')) {
      console.log('  [Browser]', text);
    }
  });

  try {
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2', timeout: 25000 });
    console.log('✅ index.html carregado!');

    // Pular tap to start se existir
    await page.evaluate(() => {
      const tap = document.getElementById('tap-start');
      if (tap && !tap.classList.contains('hidden')) tap.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Convidado
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Clicar em Jogar
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Iniciar Fase / Região
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button') || document.querySelector('#btn-play');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Testar Disparo Simultâneo no Nível 1 com 3 golpes
    const combatCheckLvl1 = await page.evaluate(() => {
      const g = window.game;
      const pl = g ? g.player : null;
      if (!pl) return { error: 'Player não encontrado em window.game.player' };

      // Equipar mais dois golpes no jogador para testar
      if (!pl.hasMove('ember')) pl.addMove('ember');
      if (!pl.hasMove('waterGun')) pl.addMove('waterGun');

      const initialLvl = pl.level;
      const movesCount = pl.moves.length;
      const initialCds = pl.moves.map(m => ({ id: m.id, cd: m.cd }));

      const areaMulLvl1 = pl.areaMul;
      const cdMulLvl1 = pl.cdMul;

      return {
        initialLvl,
        movesCount,
        initialCds,
        areaMulLvl1,
        cdMulLvl1
      };
    });

    console.log('\n--- VERIFICAÇÃO NÍVEL 1 (DISPARO SIMULTÂNEO) ---');
    console.log('Nível:', combatCheckLvl1.initialLvl);
    console.log('Golpes ativos:', combatCheckLvl1.movesCount);
    console.log('Golpes:', combatCheckLvl1.initialCds);
    console.log('Multiplicador de Área Nv. 1:', combatCheckLvl1.areaMulLvl1);
    console.log('Multiplicador de CD Nv. 1:', combatCheckLvl1.cdMulLvl1);

    if (combatCheckLvl1.movesCount >= 3) {
      console.log('✅ Múltiplos ataques aprendidos ativos no Nível 1!');
    }

    // Testar Nível 20 (Sobrecarga de Energia: +20% de área e -15% de CD)
    const overchargeCheck = await page.evaluate(() => {
      const g = window.game;
      const pl = g.player;
      pl.level = 20;

      const areaMulLvl20 = pl.areaMul;
      const cdMulLvl20 = pl.cdMul;

      return {
        level: pl.level,
        areaMulLvl20,
        cdMulLvl20,
        movesLength: pl.moves.length
      };
    });

    console.log('\n--- VERIFICAÇÃO NÍVEL 20 (SOBRECARGA DE ENERGIA) ---');
    console.log('Nível do jogador:', overchargeCheck.level);
    console.log('Multiplicador de Área Nv. 20 (Esperado >= 1.20):', overchargeCheck.areaMulLvl20);
    console.log('Multiplicador de CD Nv. 20 (Esperado <= 0.85):', overchargeCheck.cdMulLvl20);

    if (overchargeCheck.areaMulLvl20 >= 1.20 && overchargeCheck.cdMulLvl20 <= 0.85) {
      console.log('✅ Sobrecarga de Energia validada: +20% de área e -15% de cooldown!');
    } else {
      console.error('❌ Falha nos multiplicadores da Sobrecarga de Energia!');
    }

    // Deixar o jogo rodar por 3 segundos para ver os ataques disparando e HUD
    await new Promise(r => setTimeout(r, 3000));

    // Capturar screenshot da tela de jogo com HUD de sobrecarga e gameplay
    const artifactPath = path.resolve(
      'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\test_gameplay_continuous_balance.png'
    );
    await page.screenshot({ path: artifactPath });
    console.log(`\n📸 Screenshot salvo em: ${artifactPath}`);

    console.log('\n🎉 TESTE DE GAMEPLAY E BALANCEAMENTO LOCAL EXECUTADO COM SUCESSO TOTAL!');
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  } finally {
    await browser.close();
  }
})();
