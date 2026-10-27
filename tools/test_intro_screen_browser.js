/* ============ test_intro_screen_browser.js — Tela de Criação de Personagem ============
 * Verifica no navegador real o fluxo de criação de personagem:
 *   Etapa 1 (Treinador) -> Etapa 2 (Draft dos 3 Iniciais) -> Persistência do save.
 *
 * Requer o servidor estático rodando em 127.0.0.1:8080:
 *   node tools/serve.js
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Puppeteer: usa a cópia instalada globalmente; permite override via env.
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
  console.log('🌐 Teste de navegador — Tela de Criação de Personagem');

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
  await page.goto('http://127.0.0.1:8080/dev.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Garante uma sessão ativa: sem save o fluxo de criação não tem onde gravar.
  const sessionReady = await page.evaluate(() => {
    if (window.G && window.G.DB && !window.G.DB.save && typeof window.G.DB.playAsGuest === 'function') {
      window.G.DB.playAsGuest();
    }
    return !!(window.G && window.G.DB && window.G.DB.save);
  });
  test('Sessão ativa (save disponível) para persistir a criação', () => assert.ok(sessionReady));

  // Abre a UI de criação
  const opened = await page.evaluate(() => {
    if (window.G && window.G.IntroCreationUI) { window.G.IntroCreationUI.open(); return true; }
    return false;
  });
  test('G.IntroCreationUI existe e abre a tela', () => assert.ok(opened));
  await new Promise(r => setTimeout(r, 500));

  const step1 = await page.evaluate(() => ({
    overlay: !!document.querySelector('.ic-overlay'),
    tabs: document.querySelectorAll('.ic-tab-btn').length,
    trainers: document.querySelectorAll('.ic-trainer-card').length,
    nextBtn: !!document.getElementById('btn-step1-next')
  }));
  test('Etapa 1 mostra overlay com 2 abas e 4 treinadores', () => {
    assert.ok(step1.overlay, 'overlay .ic-overlay deve existir');
    assert.strictEqual(step1.tabs, 2, 'devem existir 2 abas (Menino/Menina)');
    assert.strictEqual(step1.trainers, 4, 'devem existir 4 treinadores na aba ativa');
    assert.ok(step1.nextBtn, 'botão #btn-step1-next deve existir');
  });

  // Aba Menina
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.ic-tab-btn');
    if (tabs.length > 1) tabs[1].click();
  });
  await new Promise(r => setTimeout(r, 400));
  const femaleTab = await page.evaluate(() => ({
    active: document.querySelector('.ic-tab-btn.active') ? document.querySelector('.ic-tab-btn.active').textContent.trim() : null,
    trainers: document.querySelectorAll('.ic-trainer-card').length
  }));
  test('Aba Menina ativa mostra 4 treinadoras', () => {
    assert.strictEqual(femaleTab.trainers, 4);
    assert.ok(femaleTab.active && femaleTab.active.includes('Menina'), `aba ativa = ${femaleTab.active}`);
  });

  // Avança para a etapa 2
  await page.evaluate(() => { const b = document.getElementById('btn-step1-next'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 500));

  const step2 = await page.evaluate(() => ({
    slots: document.querySelectorAll('.ic-slot-box').length,
    filters: document.querySelectorAll('.ic-filter-btn').length,
    cards: document.querySelectorAll('.ic-starter-card').length,
    badge: document.querySelector('.ic-count-badge') ? document.querySelector('.ic-count-badge').textContent.trim() : null,
    startBtn: !!document.getElementById('btn-step2-start')
  }));
  test('Etapa 2 mostra 3 slots, 10 filtros e 27 iniciais', () => {
    assert.strictEqual(step2.slots, 3, 'devem existir 3 slots de seleção');
    assert.strictEqual(step2.filters, 10, 'devem existir 10 filtros (Todas + 9 gerações)');
    assert.strictEqual(step2.cards, 27, 'devem existir 27 iniciais das 9 gerações');
    assert.ok(step2.startBtn, 'botão #btn-step2-start deve existir');
    assert.ok(/3\s*\/\s*3/.test(step2.badge || ''), `badge = ${step2.badge}`);
  });

  // Limpa a seleção e monta o trio de Hoenn
  await page.evaluate(() => {
    const current = [...window.G.IntroCreationUI.selectedSquad];
    current.forEach(dex => {
      const card = document.querySelector(`.ic-starter-card[data-dex="${dex}"]`);
      if (card) card.click();
    });
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => { const b = document.querySelector('.ic-filter-btn[data-gen="3"]'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 300));

  const gen3Count = await page.evaluate(() => document.querySelectorAll('.ic-starter-card').length);
  test('Filtro de Geração 3 mostra os 3 iniciais de Hoenn', () => assert.strictEqual(gen3Count, 3));

  for (const dex of [252, 255, 258]) {
    await page.evaluate(d => { const c = document.querySelector(`.ic-starter-card[data-dex="${d}"]`); if (c) c.click(); }, dex);
    await new Promise(r => setTimeout(r, 150));
  }

  const selection = await page.evaluate(() => ({
    squad: window.G.IntroCreationUI.selectedSquad,
    badge: document.querySelector('.ic-count-badge') ? document.querySelector('.ic-count-badge').textContent.trim() : null,
    slotNames: Array.from(document.querySelectorAll('.ic-slot-name')).map(e => e.textContent.trim()),
    disabled: document.getElementById('btn-step2-start') ? document.getElementById('btn-step2-start').disabled : null
  }));
  test('Trio de Hoenn selecionado e botão de iniciar habilitado', () => {
    assert.deepStrictEqual(selection.squad, [252, 255, 258], `squad = ${JSON.stringify(selection.squad)}`);
    assert.deepStrictEqual(selection.slotNames, ['Treecko', 'Torchic', 'Mudkip'], `slots = ${JSON.stringify(selection.slotNames)}`);
    assert.strictEqual(selection.disabled, false, 'botão iniciar deve estar habilitado');
  });

  try {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(SHOT_DIR, 'intro_creation_trio.png') });
    console.log(`  📸 Screenshot: ${path.join(SHOT_DIR, 'intro_creation_trio.png')}`);
  } catch (e) { console.log(`  ⚠️  Screenshot não salvo: ${e.message}`); }

  // Finaliza a criação
  await page.evaluate(() => { const b = document.getElementById('btn-step2-start'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 800));

  const final = await page.evaluate(() => ({
    overlayClosed: document.querySelector('.ic-overlay') === null,
    trainer: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.trainer : null,
    squad: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.squad : null,
    partner: window.G && window.G.DB && window.G.DB.save ? window.G.DB.save.partner : null
  }));
  test('Criação fecha o overlay e persiste trainer/squad/partner', () => {
    assert.ok(final.overlayClosed, 'overlay deve ser removido');
    assert.ok(final.trainer, `trainer deve estar salvo (obtido: ${final.trainer})`);
    assert.deepStrictEqual(final.squad, [252, 255, 258], `squad salvo = ${JSON.stringify(final.squad)}`);
    assert.strictEqual(final.partner, 252, 'partner deve ser a vanguarda (1º membro)');
  });

  await browser.close();
  console.log(process.exitCode ? '❌ Teste de navegador falhou.' : '🎉 Teste de navegador concluído com sucesso!');
})().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
