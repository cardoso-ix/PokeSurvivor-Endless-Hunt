// Teste de validação para o botão de confirmação de região em stage_select.js
const assert = require('assert');

// Mock do ambiente DOM
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.style = {};
    this.classList = new MockClassList();
    this.onclick = null;
    this.children = [];
    this.focused = false;
  }
  focus() {
    this.focused = true;
  }
  click() {
    if (typeof this.onclick === 'function') this.onclick();
  }
  querySelector(sel) {
    if (sel.includes('close-btn') || sel.includes('[data-back]')) {
      return this.children.find(c => c.id === 'stage-close' || c.dataset?.back !== undefined) || null;
    }
    return null;
  }
}

const domElements = {};
global.document = {
  getElementById: (id) => domElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#scr-stages' || sel === '#region-select-modal' || sel === '.region-modal-container') {
      return domElements['scr-stages'] || null;
    }
    if (sel === '#gameCanvas' || sel === '#game' || sel === 'canvas') {
      return domElements['game'] || null;
    }
    if (sel.includes('stage-close')) {
      return domElements['stage-close'] || null;
    }
    return null;
  },
  createElement: (tag) => new MockElement('', tag)
};

domElements['scr-stages'] = new MockElement('scr-stages', 'section');
domElements['stage-close'] = new MockElement('stage-close', 'button');
domElements['stage-cards'] = new MockElement('stage-cards', 'div');
domElements['game'] = new MockElement('game', 'canvas');

// Mock do objeto G
let spawnerRegionSet = null;
let unpausedCalled = false;
let startRunCalledWith = null;
let uiHideCalledWith = null;

global.G = {
  REGIONS_CONFIG: {
    kanto: { id: 'kanto', name: 'Kanto', gen: 1, dexRange: [1, 151], themeColor: '#e63946' },
    johto: { id: 'johto', name: 'Johto', gen: 2, dexRange: [152, 251], themeColor: '#ffd166' }
  },
  Game: {
    state: 'playing',
    isPaused: true,
    currentRegion: 'kanto',
    unpause: () => {
      unpausedCalled = true;
      global.G.Game.isPaused = false;
    },
    startRun: (coop, reg) => {
      startRunCalledWith = reg;
    }
  },
  Spawner: {
    setRegion: (r) => {
      spawnerRegionSet = r;
    }
  },
  UI: {
    hide: (id) => {
      uiHideCalledWith = id;
    },
    chrome: () => {},
    show: () => {}
  },
  Audio: {
    sfx: () => {}
  }
};

global.window = {
  game: global.G.Game,
  spawner: global.G.Spawner,
  REGIONS_CONFIG: global.G.REGIONS_CONFIG
};

global.localStorage = {
  _store: {},
  setItem(k, v) { this._store[k] = String(v); },
  getItem(k) { return this._store[k] || null; }
};

// Carregar stage_select.js
const StageSelectUI = require('../js/ui/stage_select.js');

console.log('--- Teste 1: Confirmação com normalização de "kanta" para "kanto" ---');
domElements['scr-stages'].classList.remove('hidden');
domElements['scr-stages'].style.display = 'block';
domElements['game'].focused = false;
global.G.Game.isPaused = true;
unpausedCalled = false;
spawnerRegionSet = null;
uiHideCalledWith = null;

StageSelectUI.onConfirmRegion('kanta');

assert.strictEqual(global.G.Game.currentRegion, 'kanto', 'Região deve ser normalizada para kanto');
assert.strictEqual(global.window.game.currentRegion, 'kanto', 'window.game.currentRegion deve ser kanto');
assert.strictEqual(spawnerRegionSet, 'kanto', 'spawner.setRegion deve ter recebido kanto');
assert.strictEqual(domElements['scr-stages'].style.display, 'none', 'Modal display deve ser none');
assert.ok(domElements['scr-stages'].classList.contains('hidden'), 'Modal deve ter a classe hidden');
assert.strictEqual(uiHideCalledWith, 'scr-stages', 'G.UI.hide deve ser chamado com scr-stages');
assert.strictEqual(global.G.Game.isPaused, false, 'game.isPaused deve ser falso');
assert.strictEqual(unpausedCalled, true, 'unpause() deve ser chamado');
assert.strictEqual(domElements['game'].focused, true, 'Canvas do jogo deve receber foco');
console.log('✅ Teste 1 passou com sucesso!');

console.log('--- Teste 2: Confirmação de outra região ("johto") ---');
domElements['scr-stages'].classList.remove('hidden');
domElements['scr-stages'].style.display = 'block';
domElements['game'].focused = false;
global.G.Game.isPaused = true;
unpausedCalled = false;
spawnerRegionSet = null;

StageSelectUI.onConfirmRegion('johto');

assert.strictEqual(global.G.Game.currentRegion, 'johto', 'Região deve ser johto');
assert.strictEqual(spawnerRegionSet, 'johto', 'spawner.setRegion deve ser johto');
assert.strictEqual(domElements['scr-stages'].style.display, 'none', 'Modal display deve ser none');
assert.ok(domElements['scr-stages'].classList.contains('hidden'), 'Modal deve ter a classe hidden');
assert.strictEqual(global.G.Game.isPaused, false, 'game.isPaused deve ser falso');
assert.strictEqual(domElements['game'].focused, true, 'Canvas do jogo deve receber foco');
console.log('✅ Teste 2 passou com sucesso!');

console.log('--- Teste 3: Botão Voltar durante partida despausa e fecha modal ---');
domElements['scr-stages'].classList.remove('hidden');
domElements['scr-stages'].style.display = 'block';
domElements['game'].focused = false;
global.G.Game.isPaused = true;
unpausedCalled = false;

StageSelectUI.close();

assert.strictEqual(domElements['scr-stages'].style.display, 'none', 'Modal display deve ser none após close');
assert.ok(domElements['scr-stages'].classList.contains('hidden'), 'Modal deve conter classe hidden');
assert.strictEqual(global.G.Game.isPaused, false, 'Jogo deve ser despausado ao fechar modal no meio da partida');
assert.strictEqual(unpausedCalled, true, 'unpause() deve ser chamado');
assert.strictEqual(domElements['game'].focused, true, 'Canvas deve receber foco');
console.log('✅ Teste 3 passou com sucesso!');

console.log('--- Teste 4: Botão Voltar fora de partida retorna ao Menu ---');
global.G.Game.state = 'ui';
let menuOpened = false;
global.G.MenuUI = {
  open: () => { menuOpened = true; }
};
domElements['scr-stages'].classList.remove('hidden');
domElements['scr-stages'].style.display = 'block';

StageSelectUI.close();

assert.strictEqual(domElements['scr-stages'].style.display, 'none', 'Modal display deve ser none');
assert.ok(domElements['scr-stages'].classList.contains('hidden'), 'Modal deve conter classe hidden');
assert.strictEqual(menuOpened, true, 'MenuUI.open() deve ser chamado');
console.log('✅ Teste 4 passou com sucesso!');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
