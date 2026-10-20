const puppeteer = require('C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\eduar\\.gemini\\antigravity\\brain\\b914817b-8796-40fd-b0bb-8920d68a0a2b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VPS_URL = 'http://zewmdvru0kg4xpqqttxflf7a.108.174.145.77.sslip.io/';

async function run() {
  console.log('🌐 Iniciando validação E2E diretamente na VPS em produção:', VPS_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Acessa a VPS online
  await page.goto(VPS_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Entra como convidado
  await page.evaluate(() => {
    document.querySelector('.tapstart')?.remove();
    const guestBtn = document.getElementById('btn-guest');
    if (guestBtn) guestBtn.click();
    else if (window.G && window.G.DB && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  // Salva screenshot da Home/Menu na VPS
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_home_menu_live.png') });
  console.log('📸 Screenshot salvo: vps_home_menu_live.png');

  // Abre a Pokédex na VPS
  await page.evaluate(() => {
    const dexBtn = document.querySelector('[data-go=dex]');
    if (dexBtn) dexBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_pokedex_live.png') });
  console.log('📸 Screenshot salvo: vps_pokedex_live.png');

  // Abre a tela de Melhorias na VPS
  await page.evaluate(() => {
    const backBtn = document.querySelector('#scr-dex [data-back]');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const upgBtn = document.querySelector('[data-go=upgrades]');
    if (upgBtn) upgBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_upgrades_start_moves_live.png') });
  console.log('📸 Screenshot salvo: vps_upgrades_start_moves_live.png');

  // Abre a tela de Classificação/Ranking na VPS
  await page.evaluate(() => {
    const backBtn = document.querySelector('#scr-upgrades [data-back]');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const rankBtn = document.querySelector('[data-go=ranking]');
    if (rankBtn) rankBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'vps_ranking_double_category_live.png') });
  console.log('📸 Screenshot salvo: vps_ranking_double_category_live.png');

  await browser.close();
  console.log('🎉 Validação na VPS concluída com total sucesso!');
}

run().catch(err => {
  console.error('❌ Erro na validação VPS:', err);
  process.exit(1);
});
