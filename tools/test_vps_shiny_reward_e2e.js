const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const path = require('path');

const brainDir = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

async function run() {
  console.log('🚀 Iniciando Teste E2E na VPS ao vivo...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navegando para VPS:', VPS_URL);
  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Remove tap-start e clica em Convidado
  await page.evaluate(() => {
    const tap = document.getElementById('tap-start');
    if (tap) tap.classList.add('hidden');
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convidado'));
    if (guestBtn) guestBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Responde quiz inicial
  for (let q = 0; q < 8; q++) {
    await page.evaluate(() => {
      const btn = document.querySelector('#test-a .answer, .answer');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 800));

  // 3. Clica em "Vamos juntos!"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.innerText.includes('Vamos juntos') || b.innerText.includes('Escolher'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Autentica como Admin
  const adminOk = await page.evaluate(() => {
    if (typeof window.adminLogin === 'function') {
      return window.adminLogin('04052001Erica+');
    }
    return false;
  });
  console.log('Admin autenticado:', adminOk);

  // 5. Inicia a partida
  await page.evaluate(() => {
    if (window.game && typeof window.game.startRun === 'function') {
      window.game.startRun();
    } else {
      const btns = Array.from(document.querySelectorAll('button'));
      const playBtn = btns.find(b => b.innerText.includes('Jogar') || b.innerText.includes('Jogar Solo') || b.innerText.includes('Partida'));
      if (playBtn) playBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // 6. Inspeciona e executa o teste
  const testResults = await page.evaluate(() => {
    const g = window.game;
    const db = window.db || (g && g.DB);
    const pl = g && g.player;

    if (!g || !db || !db.save || !pl) {
      return {
        ok: false,
        error: 'Elementos não encontrados',
        hasGame: !!g,
        hasDb: !!db,
        hasPlayer: !!pl
      };
    }

    const initialTickets = (db.save.tickets && db.save.tickets.t1) || 0;

    // 1. Simula abate de Shiny no mapa (Pikachu Shiny dex 25)
    // No jogo, inimigo shiny ao morrer chama G.onShinyCaught (ou onShinyKilled)
    // Vamos verificar se window.G ou g.onShinyCaught existe
    const shinyKillFn = (window.G && window.G.onShinyCaught) || (g && g.onShinyCaught);
    let killExecuted = false;
    if (typeof shinyKillFn === 'function') {
      shinyKillFn({ dex: 25, name: 'Pikachu', shiny: true, x: pl.x, y: pl.y });
      killExecuted = true;
    } else if (window.G && window.G.Combat) {
      // Cria um inimigo shiny e executa die()
      // Fallback direto
    }

    const postKillTickets = (db.save.tickets && db.save.tickets.t1) || 0;
    const ticketGain = postKillTickets - initialTickets;
    const shinyGranted = !!(db.save.shiny && db.save.shiny[25]);

    // 2. Tenta capturar Shiny via startCaptureSequence
    const capSys = (window.G && window.G.Capture) || window.captureSystem || window.CaptureSystem;
    let captureReturnedNull = false;
    let captureSuccess = null;
    if (capSys && typeof capSys.startCaptureSequence === 'function') {
      const res = capSys.startCaptureSequence({
        speciesId: 'charizard',
        dex: 6,
        isShiny: true,
        onComplete: (succ) => { captureSuccess = succ; }
      });
      captureReturnedNull = (res === null);
    }

    const postCaptureTickets = (db.save.tickets && db.save.tickets.t1) || 0;
    const charizardShinyGranted = !!(db.save.shiny && db.save.shiny[6]);

    return {
      ok: true,
      hasGame: true,
      hasPlayer: true,
      killExecuted,
      initialTickets,
      postKillTickets,
      ticketGain,
      shinyGranted,
      captureReturnedNull,
      captureSuccess,
      postCaptureTickets,
      charizardShinyGranted
    };
  });

  console.log('Resultados do Teste na VPS:', testResults);

  // 7. Screenshot da tela de combate
  await new Promise(r => setTimeout(r, 600));
  const scrPath = path.join(brainDir, 'vps_shiny_tickets_5000_live.png');
  await page.screenshot({ path: scrPath });
  console.log('Screenshot salvo em:', scrPath);

  await browser.close();

  if (testResults.ok && testResults.ticketGain === 5000 && !testResults.shinyGranted && !testResults.charizardShinyGranted && testResults.captureReturnedNull && testResults.captureSuccess === false) {
    console.log('🎉 TODOS OS CRITÉRIOS DE TESTE AO VIVO NA VPS FORAM CUMPRIDOS COM SUCESSO!');
    process.exit(0);
  } else {
    console.error('❌ Falha na validação de critérios:', testResults);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
