const http = require('http');
const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');

const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';
const TARGET_VERSION = '45fa9ea263';

function checkVersion() {
  return new Promise((resolve) => {
    http.get(VPS_URL + 'version.json?t=' + Date.now(), res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  console.log(`⏳ Monitorando deploy da VPS Coolify para versão ${TARGET_VERSION}...`);
  let deployed = false;
  for (let attempt = 1; attempt <= 30; attempt++) {
    const ver = await checkVersion();
    console.log(`[Tentativa ${attempt}/30] Versão na VPS:`, ver);
    if (ver && ver.v === TARGET_VERSION) {
      console.log(`🎉 Deploy detectado na VPS com sucesso! Versão: ${ver.v} (${ver.at})`);
      deployed = true;
      break;
    }
    await new Promise(r => setTimeout(r, 4000));
  }

  if (!deployed) {
    console.log('⚠️ O deploy automático da VPS pode demorar um pouco mais ou requer acionamento manual no painel.');
  }

  console.log('\n🌐 Abrindo navegador contra a VPS para validação...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('[EVOLUÇÃO') || t.includes('Guardião') || t.includes('[WorldCaptureBall]')) {
      console.log('  [VPS BROWSER CONSOLE]', t);
    }
  });

  await page.goto(VPS_URL + 'dev.html', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.G && window.G.Game && window.G.Capture, { timeout: 15000 });

  // Iniciar jogo e testar evolução e pokébola na VPS
  const testResult = await page.evaluate(async () => {
    const tap = document.querySelector('.tapstart');
    if (tap) tap.remove();

    await window.G.DB.ready();
    window.G.DB.playAsGuest();
    window.G.DB.save.partner = 1;
    window.G.DB.save.starter = 1;
    window.G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };

    window.G.Game.startRun();
    const pl = window.G.Game.player;

    // Sobe para nível 5
    while (pl.level < 5) {
      pl.gainXp(pl.xpNext - pl.xp + 1);
    }
    const evoAt5 = pl.species;

    // Dispara guardião do Rift e derrota
    window.G.Rift.triggerGuardian('articuno', false);
    const arena = window.G.Rift.arena;
    const boss = window.G.EnemyMgr.get(arena.bossId);
    if (boss) {
      boss.hurt(boss.hp + 5000);
    }

    const capSys = window.G.Capture;
    const ball = capSys.activeData;

    return {
      playerLevel: pl.level,
      evoAt5: evoAt5,
      isIvysaur: evoAt5 === 'ivysaur',
      isCapturing: capSys.isCapturing,
      ballExists: !!ball,
      ballTier: ball ? ball.ballTier.name : null,
      ballState: ball ? ball.state : null
    };
  });

  console.log('Resultados dos testes na VPS:', testResult);

  const shotVPS = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b\\vps_live_fix_verified.png';
  await page.screenshot({ path: shotVPS });
  console.log('📸 Screenshot da VPS salvo em:', shotVPS);

  await browser.close();

  if (testResult.isIvysaur && testResult.ballExists && testResult.isCapturing) {
    console.log('🎉 SUCESSO TOTAL: Validação na VPS confirmou que a evolução no nível 5 e a Pokébola no Rift estão 100% operacionais!');
  } else {
    console.log('⚠️ Resultado inesperado:', testResult);
  }
})();
