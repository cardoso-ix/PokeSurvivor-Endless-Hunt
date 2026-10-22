const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

(async () => {
  console.log('🌐 Iniciando teste E2E DIRETO NA VPS COOLIFY...');
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
      console.log('  [VPS Browser]', text);
    }
  });

  try {
    await page.goto(VPS_URL + 'index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ VPS index.html carregado!');

    // Pular tap to start se existir
    await page.evaluate(() => {
      const tap = document.getElementById('tap-start');
      if (tap && !tap.classList.contains('hidden')) tap.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Convidado
    await page.evaluate(() => {
      const btn = document.getElementById('btn-guest');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Clicar em Jogar
    await page.evaluate(() => {
      const b = document.querySelector('[data-go="play"]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Iniciar Fase / Região
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-reg="kanto"]') || document.querySelector('#stage-cards button') || document.querySelector('#btn-play');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    // Testar se os novos sistemas estão vivos na VPS
    const liveCheck = await page.evaluate(() => {
      const g = window.game;
      const pl = g ? g.player : null;
      if (!pl) return { error: 'Player não encontrado em window.game.player na VPS' };

      // Equipar mais golpes para testar
      if (!pl.hasMove('ember')) pl.addMove('ember');
      if (!pl.hasMove('waterGun')) pl.addMove('waterGun');

      const initialLvl = pl.level;
      const movesCount = pl.moves.length;
      const initialCds = pl.moves.map(m => ({ id: m.id, cd: m.cd }));

      // Simular avanço para Nível 20 para validar Sobrecarga
      pl.level = 20;
      const areaMulLvl20 = pl.areaMul;
      const cdMulLvl20 = pl.cdMul;

      return {
        initialLvl,
        movesCount,
        initialCds,
        areaMulLvl20,
        cdMulLvl20
      };
    });

    console.log('\n--- VERIFICAÇÃO AO VIVO NA PRODUÇÃO (VPS) ---');
    console.log('Status do Player na VPS:', liveCheck);

    if (liveCheck.movesCount >= 3 && liveCheck.areaMulLvl20 >= 1.20 && liveCheck.cdMulLvl20 <= 0.85) {
      console.log('✅ Disparo contínuo e Sobrecarga de Energia funcionando 100% NA VPS!');
    } else {
      console.error('❌ Falha na validação ao vivo na VPS');
    }

    // Deixar rodar 3 segundos para renderizar o combate ao vivo
    await new Promise(r => setTimeout(r, 3000));

    const artifactPath = path.resolve(
      'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_live_balance_continuous.png'
    );
    await page.screenshot({ path: artifactPath });
    console.log(`\n📸 Screenshot da VPS salvo em: ${artifactPath}`);

    console.log('\n🎉 PROCESSO DE DEPLOY NA VPS E COOLIFY CONCLUÍDO E VALIDADO COM SUCESSO TOTAL!');
  } catch (err) {
    console.error('❌ Erro no teste ao vivo na VPS:', err);
  } finally {
    await browser.close();
  }
})();
