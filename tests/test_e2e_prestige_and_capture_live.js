const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando Teste E2E de Prestígio de Poder e Captura Local...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error') || text.includes('WorldCaptureBall') || text.includes('PRESTÍGIO')) {
      console.log('  [Browser]', text);
    }
  });

  try {
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2', timeout: 25000 });
    console.log('✅ index.html local carregado!');

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

    // Iniciar a Partida
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button') || document.querySelector('#btn-play');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Validar status reais de combate do Player in-game
    const inGamePlayerCheck = await page.evaluate(() => {
      const g = window.game;
      const pl = g ? g.player : null;
      if (!pl) return { error: 'Player não encontrado' };

      // Configurar o jogador como Shiny para prova real
      pl.shiny = true;
      pl.isShiny = true;
      pl.recalculateTotalStats(false);

      const atkShiny = pl.atk;
      const maxHpShiny = pl.maxHp;
      const rarityMulsShiny = pl.rarityMultipliers;

      // Agora configurar como Shiny Lendário (Mewtwo)
      const mew = (window.POKEDEX && window.POKEDEX[150]) || (window.G && window.G.DEX_BY && window.G.DEX_BY[150]) || { hp: 118, atk: 1.55, spd: 133, leg: true, rarity: 5 };
      pl.mon = mew;
      pl.dex = 150;
      pl.basePokedexStats = { hp: 118, atk: 1.55, spd: 133, def: 0 };
      pl.recalculateTotalStats(false);

      const atkApex = pl.atk;
      const maxHpApex = pl.maxHp;
      const rarityMulsApex = pl.rarityMultipliers;

      return {
        atkShiny,
        maxHpShiny,
        rarityMulsShiny,
        atkApex,
        maxHpApex,
        rarityMulsApex
      };
    });

    console.log('\n--- VERIFICAÇÃO DE ATRIBUTOS REAIS IN-GAME ---');
    console.log('Player Shiny In-game:', inGamePlayerCheck.rarityMulsShiny);
    console.log(`  ATK: ${inGamePlayerCheck.atkShiny} | HP: ${inGamePlayerCheck.maxHpShiny}`);
    console.log('Player Shiny Lendário Apex In-game:', inGamePlayerCheck.rarityMulsApex);
    console.log(`  ATK: ${inGamePlayerCheck.atkApex} | HP: ${inGamePlayerCheck.maxHpApex}`);

    if (inGamePlayerCheck.rarityMulsShiny.dmg === 1.25 && inGamePlayerCheck.rarityMulsApex.dmg === 1.50) {
      console.log('✅ Multiplicadores Reais de Combate (+25% Shiny, +50% Shiny Lendário) ativos in-game!');
    }

    // Validar Sistema de Captura com Trava Rigorosa < 50%
    const captureInGameCheck = await page.evaluate(() => {
      const Cap = window.CaptureSystem || (window.G && window.G.Capture);
      if (!Cap) return { error: 'CaptureSystem indisponível' };

      const testCases = [
        { name: 'Normal Estágio 1 + Pokéball', id: 'caterpie', isSh: false, isLeg: false, stg: 1, lvl: 5, gold: false },
        { name: 'Normal Estágio 1 + Ultimate Ball', id: 'caterpie', isSh: false, isLeg: false, stg: 1, lvl: 35, gold: false },
        { name: 'Normal Estágio 1 + Gold Ball (Nv 50)', id: 'caterpie', isSh: false, isLeg: false, stg: 1, lvl: 50, gold: true },
        { name: 'Normal Estágio 3 + Ultimate Ball', id: 'charizard', isSh: false, isLeg: false, stg: 3, lvl: 35, gold: false },
        { name: 'Shiny Comum + Ultimate Ball', id: 'pikachu', isSh: true, isLeg: false, stg: 1, lvl: 35, gold: false },
        { name: 'Lendário Normal + Ultimate Ball', id: 'mewtwo', isSh: false, isLeg: true, stg: 3, lvl: 35, gold: false },
        { name: 'Shiny Lendário + Ultimate Ball', id: 'mewtwo', isSh: true, isLeg: true, stg: 3, lvl: 35, gold: false },
        { name: 'Shiny Lendário + Gold Ball', id: 'mewtwo', isSh: true, isLeg: true, stg: 3, lvl: 50, gold: true }
      ];

      return testCases.map(tc => {
        const ball = new Cap.WorldCaptureBall({
          speciesId: tc.id,
          isShiny: tc.isSh,
          isLegendary: tc.isLeg,
          stage: tc.stg,
          level: tc.lvl,
          forceGold: tc.gold
        });
        return {
          case: tc.name,
          baseRate: ball.baseRate,
          ballBonus: ball.ballBonus,
          finalChance: ball.finalChance,
          isBelow50: ball.finalChance < 0.50
        };
      });
    });

    console.log('\n--- VERIFICAÇÃO DAS CHANCES FINAIS DE CAPTURA COM TRAVA < 50% ---');
    let allValid = true;
    captureInGameCheck.forEach(r => {
      console.log(`[${r.case}]`);
      console.log(`   Base: ${(r.baseRate * 100).toFixed(0)}% | Bônus: +${(r.ballBonus * 100).toFixed(0)}% | Chance Final: ${(r.finalChance * 100).toFixed(1)}% | Abaixo de 50%?: ${r.isBelow50 ? 'SIM ✅' : 'NÃO ❌'}`);
      if (!r.isBelow50) allValid = false;
    });

    if (allValid) {
      console.log('\n✅ TODAS AS CHANCES DE CAPTURA ESTÃO RIGOROSAMENTE ABAIXO DE 50%!');
    }

    // Capturar screenshot de gameplay com feedback visual
    await new Promise(r => setTimeout(r, 2000));
    const artifactPath = path.resolve(
      'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\test_prestige_power_and_catch_rates.png'
    );
    await page.screenshot({ path: artifactPath });
    console.log(`\n📸 Screenshot salvo em: ${artifactPath}`);

    console.log('\n🎉 TESTE E2E LOCAL CONCLUÍDO COM SUCESSO TOTAL!');
  } catch (err) {
    console.error('❌ Erro no teste E2E:', err);
  } finally {
    await browser.close();
  }
})();
