const fs = require('fs');
const path = require('path');

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) { this._set.delete(c); return false; }
          else { this._set.add(c); return true; }
        } else if (force) { this._set.add(c); return true; }
        else { this._set.delete(c); return false; }
      },
      contains(c) { return this._set.has(c); }
    };
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; },
      getPropertyValue: (k) => this.style[k] || ''
    };
    this.children = [];
    this.dataset = {};
    this.width = 800;
    this.height = 600;
  }
  getContext(type) {
    return {
      canvas: this,
      drawImage() {}, fillRect() {}, clearRect() {}, fill() {}, stroke() {},
      beginPath() {}, arc() {}, arcTo() {}, moveTo() {}, lineTo() {}, closePath() {},
      save() {}, restore() {}, clip() {}, scale() {}, translate() {}, rotate() {},
      setTransform() {}, resetTransform() {},
      fillText() {}, strokeText() {}, measureText() { return { width: 10 }; },
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
      createPattern() { return {}; },
      getImageData() { return { data: new Uint8Array(16) }; },
      putImageData() {}, createImageData() { return { data: new Uint8Array(16) }; },
      ellipse() {}, strokeRect() {}
    };
  }
  toDataURL() { return 'data:image/png;base64,mock'; }
  appendChild(c) { this.children.push(c); }
  querySelector(s) { return null; }
  querySelectorAll(s) { return []; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  focus() {}
  blur() {}
}

const elements = {};
function getEl(id) {
  if (!elements[id]) elements[id] = new MockElement(id);
  return elements[id];
}

const mockDoc = {
  readyState: 'complete',
  getElementById: id => getEl(id),
  querySelector: sel => {
    if (sel.startsWith('#')) return getEl(sel.slice(1));
    return new MockElement('', sel);
  },
  querySelectorAll: () => [],
  createElement: tag => new MockElement('', tag),
  body: new MockElement('body', 'body'),
  head: new MockElement('head', 'head'),
  documentElement: new MockElement('html', 'html'),
  addEventListener: () => {},
  removeEventListener: () => {},
  fonts: { load: () => Promise.resolve() }
};

global.window = global;
global.document = mockDoc;
global.location = { protocol: 'http:', search: '', reload: () => {} };
global.navigator = { language: 'pt-BR', userAgent: 'test' };
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  key(i) { return Object.keys(this._s)[i] || null; },
  get length() { return Object.keys(this._s).length; }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = fn => {};
global.cancelAnimationFrame = () => {};
global.AudioContext = class {
  createGain() {
    const node = {
      connect: (target) => target || node,
      disconnect: () => {},
      gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
    };
    return node;
  }
  createDynamicsCompressor() {
    const node = {
      connect: (target) => target || node,
      disconnect: () => {},
      threshold: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 }
    };
    return node;
  }
  createOscillator() {
    return {
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 440, setValueAtTime: () => {} }
    };
  }
  get destination() { return {}; }
  get currentTime() { return Date.now() / 1000; }
};
global.CanvasRenderingContext2D = class {
  fillText() {} strokeText() {} measureText() { return { width: 10 }; }
};
global.MutationObserver = class { observe() {} };
global.confirm = () => true;
global.alert = () => {};
global.Image = class {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.addEventListener = () => {};
global.removeEventListener = () => {};

const ROOT = path.join(__dirname, '..');
const dev = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
const BEGIN = '<!-- scripts:begin -->', END = '<!-- scripts:end -->';
const i = dev.indexOf(BEGIN), j = dev.indexOf(END);
const block = dev.slice(i, j + END.length);
const files = [...block.matchAll(/<script[^>]*src="(js\/[^"]+\.js)"/g)].map(m => m[1]);

console.log(`Carregando ${files.length} scripts de dev.html...`);
for (const f of files) {
  try {
    require(path.join(ROOT, f));
  } catch (err) {
    console.error(`Erro ao carregar script ${f}:`, err);
  }
}

async function runTest() {
  await G.DB.ready();
  G.DB.playAsGuest();
  G.DB.save.partner = 1; // Bulbasaur
  G.DB.save.starter = 1;
  G.DB.save.owned[1] = { at: Date.now(), from: 'starter' };

  console.log('Iniciando partida com Bulbasaur...');
  G.Game.startRun();
  console.log('Partida iniciada! State:', G.Game.state);

  const pl = G.Game.player;
  console.log('Player ativo:', pl ? pl.mon.name : 'null');
  const ctx = getEl('game').getContext('2d');

  console.log('Testando 300 quadros consecutivos de Gameplay + HUD...');
  let errors = 0;
  for (let frameIdx = 0; frameIdx < 300; frameIdx++) {
    try {
      pl.update(0.016);
      pl.draw(ctx);
      G.HUD.draw(ctx, 800, 600, pl, G.Game.st);
      if (G.HUD.updateBottomRpgHud) {
        G.HUD.updateBottomRpgHud(pl, G.Game.st);
      }
    } catch (err) {
      errors++;
      console.error(`❌ Erro no quadro ${frameIdx}:`, err);
      break;
    }
  }

  if (errors === 0) {
    console.log('🎉 SUCESSO ABSOLUTO: 300/300 quadros executados perfeitamente com ZERO erros!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('\n🚨 EXCEÇÃO DETECTADA NA SIMULAÇÃO:', err);
  process.exit(1);
});
