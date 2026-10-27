/* ============ test_index_flow.js — Fluxo Login -> Criação -> Menu ============
 * Verifica no navegador real que um jogador novo (convidado) passa pela tela de
 * criação de personagem e chega ao menu com o trio inicial salvo.
 *
 * Requer o servidor estático rodando em 127.0.0.1:8080:
 *   node tools/serve.js
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

function loadPuppeteer() {
  const candidates = [
    process.env.PUPPETEER_PATH,
    'C:/Users/eduar/AppData/Roaming/npm/node_modules/md-to-pdf/node_modules/puppeteer',
    'puppeteer'
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch (_) { /* tenta o próximo */ }
  }
  throw new Error('Puppeteer não encontrado. Defina PUPPETEER_PATH ou instale o pacote.');
}

const puppeteer = loadPuppeteer();

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

const SHOT_DIR = path.join(__dirname, '..', 'shots');

function test(name, fn) {
  try { fn(); console.log(`  ✅ [PASSOU] ${name}`); }
  catch (e) { console.error(`  ❌ [FALHOU] ${name}: ${e.message}`); process.exitCode = 1; }
}

(async () => {
  console.log('🌐 Teste de navegador — Fluxo de Login e Criação de Personagem');

  let executablePath = null;
  for (const p of CHROME_PATHS) { if (fs.existsSync(p)) { executablePath = p; break; } }
  if (!executablePath) { console.error('Chrome/Edge não encontrado. Defina CHROME_PATH.'); process.exit(1); }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const tap = await page.$('.tapstart');
  if (tap) {
    await tap.click();
    await new Promise(r => setTimeout(r, 900));
  }

  // Entra como convidado (sem senha) para pular a criação de conta
  const guestClicked = await page.evaluate(() => {
    const b = document.getElementById('btn-guest');
    if (b) { b.click(); return true; }
    return false;
  });
  test('Botão de entrar como convidado existe', () => assert.ok(guestClicked));
  await new Promise(r => setTimeout(r, 1500));

  const postLogin = await page.evaluate(() => ({
    loginHidden: document.querySelector('#scr-login') ? document.querySelector('#scr-login').classList.contains('hidden') : null,
    menuVisible: document.querySelector('#scr-menu') ? !document.querySelector('#scr-menu').classList.contains('hidden') : false,
    introVisible: !!document.querySelector('.ic-overlay'),
    hasStep1: !!document.getElementById('btn-step1-next')
  }));
  test('Após o login, a tela de criação de personagem é apresentada', () => {
    assert.ok(postLogin.loginHidden, 'a tela de login deve estar oculta');
    assert.ok(postLogin.introVisible, 'a criação de personagem (.ic-overlay) deve estar visível');
    assert.ok(postLogin.hasStep1, 'a etapa 1 da criação deve estar montada');
  });

  // Avança para a etapa 2 e confirma a criação com o trio padrão
  await page.evaluate(() => { const b = document.getElementById('btn-step1-next'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { const b = document.getElementById('btn-step2-start'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 1000));

  const after = await page.evaluate(() => ({
    menuVisible: document.querySelector('#scr-menu') ? !document.querySelector('#scr-menu').classList.contains('hidden') : false,
    introClosed: document.querySelector('.ic-overlay') === null,
    trainer: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.trainer : null,
    squad: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.squad : null,
    partner: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.partner : null
  }));
  test('Criação concluída: menu visível e trio salvo no save', () => {
    assert.ok(after.introClosed, 'a criação deve estar fechada');
    assert.ok(after.menuVisible, 'o menu deve estar visível');
    assert.ok(after.trainer, `trainer deve estar salvo (obtido: ${after.trainer})`);
    assert.ok(Array.isArray(after.squad) && after.squad.length === 3, `squad deve ter 3 membros (obtido: ${JSON.stringify(after.squad)})`);
    assert.strictEqual(after.partner, after.squad[0], 'partner deve ser a vanguarda do trio');
  });

  // A entrada de menu "Equipe e Treinador" deve existir e reabrir a criação
  const teamButton = await page.evaluate(() => {
    const b = document.querySelector('#scr-menu [data-go="team"]');
    return { exists: !!b, label: b ? b.textContent.trim() : null };
  });
  test('Menu tem a entrada "Equipe e Treinador"', () => {
    assert.ok(teamButton.exists, 'botão [data-go="team"] deve existir no menu');
    assert.ok(teamButton.label && teamButton.label.length > 0, 'o botão deve ter rótulo');
  });

  await page.evaluate(() => { const b = document.querySelector('#scr-menu [data-go="team"]'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 600));
  const reopened = await page.evaluate(() => !!document.querySelector('.ic-overlay'));
  test('A entrada de menu reabre a tela de criação', () => assert.ok(reopened));

  try {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(SHOT_DIR, 'index_flow_team.png') });
    console.log(`  📸 Screenshot: ${path.join(SHOT_DIR, 'index_flow_team.png')}`);
  } catch (e) { console.log(`  ⚠️  Screenshot não salvo: ${e.message}`); }

  await browser.close();
  console.log(process.exitCode ? '❌ Teste de fluxo falhou.' : '🎉 Teste de fluxo concluído com sucesso!');
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
