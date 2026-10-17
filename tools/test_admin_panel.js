// Teste automatizado para o Painel Admin e funções de desbloqueio em db.js
const assert = require('assert');

// 1. Simular ambiente DOM e LocalStorage
class MockClassList {
  constructor() { this.classes = new Set(); }
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
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }
  appendChild(child) { this.children.push(child); }
  insertAdjacentHTML(pos, html) { this.innerHTML += html; }
  focus() { this.focused = true; }
  click() { if (typeof this.onclick === 'function') this.onclick(); }
}

const domStore = {};
global.document = {
  getElementById: id => domStore[id] || null,
  createElement: tag => new MockElement('', tag),
  body: {
    appendChild: el => { if (el.id) domStore[el.id] = el; }
  },
  head: {
    appendChild: el => { if (el.id) domStore[el.id] = el; }
  },
  addEventListener: () => {}
};

const localStore = {};
global.localStorage = {
  getItem: k => localStore[k] || null,
  setItem: (k, v) => { localStore[k] = String(v); },
  removeItem: k => { delete localStore[k]; },
  clear: () => { Object.keys(localStore).forEach(k => delete localStore[k]); }
};

global.window = {
  addEventListener: () => {}
};

// 2. Mock do motor G e Pokédex
global.G = {
  DEX: [
    { dex: 1, name: 'Bulbasaur', types: ['grass', 'poison'], hp: 90, spd: 97, atk: 1.06, gen: 1 },
    { dex: 2, name: 'Ivysaur', types: ['grass', 'poison'], hp: 97, spd: 103, atk: 1.14, gen: 1 },
    { dex: 3, name: 'Venusaur', types: ['grass', 'poison'], hp: 106, spd: 112, atk: 1.25, gen: 1 },
    { dex: 4, name: 'Charmander', types: ['fire'], hp: 88, spd: 105, atk: 1.03, starter: true, gen: 1 },
    { dex: 5, name: 'Charmeleon', types: ['fire'], hp: 96, spd: 112, atk: 1.14, gen: 1 },
    { dex: 6, name: 'Charizard', types: ['fire', 'flying'], hp: 105, spd: 120, atk: 1.3, gen: 1 },
    { dex: 150, name: 'Mewtwo', types: ['psychic'], hp: 116, spd: 130, atk: 1.54, leg: true, gen: 1 }
  ],
  DEX_BY: {}
};

// Carregar pokedex.js
require('../js/data/pokedex.js');
// Carregar evolutions.js
require('../js/data/evolutions.js');
// Carregar db.js
const db = require('../js/core/db.js');
// Carregar admin_panel.js
const AdminPanel = require('../js/ui/admin_panel.js');

console.log('--- TESTE 1: POKEDEX MAPPING GLOBAL ---');
assert.ok(global.POKEDEX, 'POKEDEX global deve existir');
assert.strictEqual(global.POKEDEX['charizard'].dex, 6, 'POKEDEX["charizard"] deve mapear para dex 6');
assert.strictEqual(global.POKEDEX[6].name, 'Charizard', 'POKEDEX[6] deve mapear para Charizard');
assert.strictEqual(global.POKEDEX['150'].name, 'Mewtwo', 'POKEDEX["150"] deve mapear para Mewtwo');
console.log('✅ TESTE 1 PASSOU: POKEDEX mapeada por nome e dex com sucesso!');

console.log('\n--- TESTE 2: DESBLOQUEIO INDIVIDUAL (Charizard Normal) ---');
// Inicializa save simulado no db
db.playAsGuest();
const okUnlock = db.adminUnlock('charizard', false);
assert.strictEqual(okUnlock, true, 'adminUnlock deve retornar true');

const captured = db.getCapturedPokemon();
assert.ok(captured.includes('charizard'), 'Captured deve conter charizard');
assert.ok(captured.includes('6'), 'Captured deve conter 6');

const playable = db.getUnlockedPlayable();
assert.ok(playable.includes('charmander'), 'Playable deve conter o ancestral base charmander');

const rawLocalCaptured = JSON.parse(localStore['pokesurvivor_captured'] || '[]');
assert.ok(rawLocalCaptured.includes('charizard'), 'localStorage pokesurvivor_captured deve conter charizard');

const rawLocalPlayable = JSON.parse(localStore['pokesurvivor_playable'] || '[]');
assert.ok(rawLocalPlayable.includes('charmander'), 'localStorage pokesurvivor_playable deve conter charmander');

assert.strictEqual(db.isPokemonShinyCaptured('charizard'), false, 'Charizard não deve ser shiny ainda');
console.log('✅ TESTE 2 PASSOU: Charizard normal desbloqueado e Charmander liberado como jogável!');

console.log('\n--- TESTE 3: DESBLOQUEIO DE SHINY (Mewtwo Shiny) ---');
const okShiny = db.adminUnlock('mewtwo', true);
assert.strictEqual(okShiny, true, 'adminUnlock shiny deve retornar true');

const shinies = db.getCapturedShinies();
assert.ok(shinies.includes('mewtwo'), 'Shinies deve conter mewtwo');
assert.ok(shinies.includes('150'), 'Shinies deve conter 150');

const rawLocalShinies = JSON.parse(localStore['pokesurvivor_shinies'] || '[]');
assert.ok(rawLocalShinies.includes('mewtwo'), 'localStorage pokesurvivor_shinies deve conter mewtwo');

assert.strictEqual(db.isPokemonShinyCaptured('mewtwo'), true, 'Mewtwo deve estar registrado como shiny');
console.log('✅ TESTE 3 PASSOU: Mewtwo Shiny registrado com sucesso na coleção!');

console.log('\n--- TESTE 4: AÇÕES EM MASSA (adminUnlockAll) ---');
const totalUnlocked = db.adminUnlockAll(true);
assert.ok(totalUnlocked >= 7, 'Deve ter desbloqueado todas as espécies do mock');
assert.strictEqual(db.isPokemonCaptured('bulbasaur'), true, 'Bulbasaur deve estar capturado');
assert.strictEqual(db.isPokemonShinyCaptured('bulbasaur'), true, 'Bulbasaur deve ser shiny');
assert.strictEqual(db.isPokemonCaptured('venusaur'), true, 'Venusaur deve estar capturado');
assert.strictEqual(db.isPokemonShinyCaptured('venusaur'), true, 'Venusaur deve ser shiny');
console.log('✅ TESTE 4 PASSOU: Todas as espécies foram desbloqueadas como shiny com sucesso!');

console.log('\n--- TESTE 5: RESET DE PROGRESSO (adminResetDex) ---');
db.adminResetDex();
const capturedAfterReset = db.getCapturedPokemon();
const shiniesAfterReset = db.getCapturedShinies();
assert.ok(!capturedAfterReset.includes('mewtwo'), 'Mewtwo não deve mais constar após reset');
assert.strictEqual(shiniesAfterReset.length, 0, 'Lista de shinies deve estar vazia após reset');
console.log('✅ TESTE 5 PASSOU: Reset de progresso executado e validado com sucesso!');

console.log('\n--- TESTE 6: MÓDULO ADMINPANEL (UI & ATALHOS) ---');
AdminPanel.initDOM();
assert.ok(domStore['admin-debug-panel'], 'Elemento #admin-debug-panel deve ser criado no DOM');
assert.ok(domStore['admin-float-pill'], 'Elemento #admin-float-pill deve ser criado no DOM');

// Toggle open / close
AdminPanel.open();
assert.strictEqual(domStore['admin-debug-panel'].style.display, 'block', 'Painel deve estar aberto');
AdminPanel.close();
assert.strictEqual(domStore['admin-debug-panel'].style.display, 'none', 'Painel deve estar fechado');
AdminPanel.toggle();
assert.strictEqual(domStore['admin-debug-panel'].style.display, 'block', 'Toggle deve abrir painel');

// Atalhos globais no window
assert.ok(typeof global.window.adminUnlock === 'function', 'window.adminUnlock deve estar definido');
assert.ok(typeof global.window.adminUnlockAll === 'function', 'window.adminUnlockAll deve estar definido');
assert.ok(typeof global.window.adminResetDex === 'function', 'window.adminResetDex deve estar definido');
assert.ok(typeof global.window.admin === 'object', 'window.admin deve estar definido');
console.log('✅ TESTE 6 PASSOU: AdminPanel UI, métodos e atalhos de console verificados!');

console.log('\n🎉 TODOS OS 6 TESTES DO PAINEL ADMIN PASSARAM COM 100% DE SUCESSO!');
