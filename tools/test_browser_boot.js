// Simula a carga completa do app no navegador
const fs = require('fs');

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    };
    this.style = {};
    this.children = [];
    this.dataset = {};
  }
  appendChild(c) { this.children.push(c); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
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
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = () => {};
global.AudioContext = class { createGain() { return { connect() {} }; } };
global.CanvasRenderingContext2D = class {
  fillText() {}
  strokeText() {}
  measureText() { return { width: 10 }; }
};
global.MutationObserver = class {
  observe() {}
};
global.confirm = () => true;
global.alert = () => {};
global.Image = class {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.addEventListener = () => {};
global.removeEventListener = () => {};

try {
  console.log('Loading app.js...');
  require('./cache/app.js');
  console.log('app.js loaded successfully!');
  console.log('G is:', typeof G);
  if (typeof G === 'object') {
    console.log('G keys:', Object.keys(G));
    console.log('Calling Flow.boot()...');
    G.Flow.boot();
    console.log('Flow.boot() called successfully!');
  }
} catch (err) {
  console.error('CRASH ON BOOT:', err);
}
