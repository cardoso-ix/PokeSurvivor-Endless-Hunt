// Teste unitário e de integração para as opções de Câmera e Configurações
const assert = require('assert');

// Mock básico de ambiente de navegador
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};
global.matchMedia = () => ({ matches: false });
global.document = {
  documentElement: { lang: 'es' },
  addEventListener() {},
  removeEventListener() {}
};

global.G = {
  U: {
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    damp: (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt)),
    rand: (min, max) => min + Math.random() * (max - min)
  },
  UI: {
    toast: (msg) => { /* console.log('[Toast]', msg); */ }
  }
};

console.log('Carregando js/core/settings.js...');
require('../js/core/settings.js');
console.log('Carregando js/core/camera.js...');
require('../js/core/camera.js');

console.log('\n--- TESTE 1: Configurações Padrão de Câmera e HUD ---');
assert.strictEqual(G.Settings.get('cameraZoom'), 1.25, 'Zoom padrão deve ser 1.25');
assert.strictEqual(G.Settings.get('cameraShake'), true, 'Trepidação padrão deve ser true');
assert.strictEqual(G.Settings.get('cameraSmooth'), true, 'Seguimento suave padrão deve ser true');
assert.strictEqual(G.Settings.get('showRadar'), true, 'ShowRadar padrão deve ser true');
assert.strictEqual(G.Settings.get('showBuffTable'), true, 'ShowBuffTable padrão deve ser true');
console.log('✅ PASS: Configurações padrão validadas com sucesso.');

console.log('\n--- TESTE 2: Alteração e Persistência de Zoom da Câmera ---');
G.Settings.set('cameraZoom', 1.5);
assert.strictEqual(G.Settings.get('cameraZoom'), 1.5, 'cameraZoom deve ser 1.5');
assert.strictEqual(localStorage.getItem('poke_camera_zoom'), '1.5', 'Deve persistir no localStorage');
assert.strictEqual(window.userSettings.cameraZoom, 1.5, 'userSettings.cameraZoom deve refletir 1.5');
assert.strictEqual(G.Camera.zoom, 1.5, 'G.Camera.zoom deve ser atualizado para 1.5');
console.log('✅ PASS: Persistência e sincronização de Zoom validadas.');

console.log('\n--- TESTE 3: G.Camera.setZoom e adjustZoom ---');
G.Camera.setZoom(0.85);
assert.strictEqual(G.Camera.zoom, 0.85, 'G.Camera.zoom deve ser 0.85');
assert.strictEqual(G.Settings.get('cameraZoom'), 0.85, 'G.Settings deve acompanhar o zoom');

G.Camera.adjustZoom(0.15); // 0.85 + 0.15 = 1.00
assert.strictEqual(G.Camera.zoom, 1.0, 'G.Camera.adjustZoom(+0.15) deve resultar em 1.0');

G.Camera.adjustZoom(-0.10); // 1.00 - 0.10 = 0.90
assert.strictEqual(G.Camera.zoom, 0.9, 'G.Camera.adjustZoom(-0.10) deve resultar em 0.9');

// Teste de clamp (limites 0.70x a 2.50x)
G.Camera.setZoom(5.0);
assert.strictEqual(G.Camera.zoom, 2.5, 'G.Camera deve travar no máximo 2.50x');
G.Camera.setZoom(0.1);
assert.strictEqual(G.Camera.zoom, 0.7, 'G.Camera deve travar no mínimo 0.70x');
console.log('✅ PASS: Controles de zoom, delta e clamp validados.');

console.log('\n--- TESTE 4: Ativação e Desativação de Trepidação (Camera Shake) ---');
G.Settings.set('cameraShake', false);
G.Camera.shake = 0;
G.Camera.kick(1.0);
assert.strictEqual(G.Camera.shake, 0, 'Com cameraShake desativado, shake deve permanecer 0');

G.Settings.set('cameraShake', true);
G.Camera.kick(0.8);
assert(G.Camera.shake > 0, 'Com cameraShake ativado, shake deve ser maior que 0');
console.log('✅ PASS: Ativação/Desativação de trepidação validada.');

console.log('\n--- TESTE 5: Seguimento Suave vs Travado (Camera Smooth) ---');
G.Settings.set('cameraSmooth', false);
G.Camera.x = 0; G.Camera.y = 0;
G.Camera.follow(500, 300, 0.016);
assert.strictEqual(G.Camera.x, 500, 'Sem smooth, câmera salta direto para o alvo');
assert.strictEqual(G.Camera.y, 300, 'Sem smooth, câmera salta direto para o alvo');

G.Settings.set('cameraSmooth', true);
G.Camera.x = 0; G.Camera.y = 0;
G.Camera.follow(500, 300, 0.016);
assert(G.Camera.x > 0 && G.Camera.x < 500, 'Com smooth, interpolação suave deve ser aplicada');
console.log('✅ PASS: Seguimento suave e direto validados.');

console.log('\n🎉 TODOS OS TESTES DE CÂMERA E CONFIGURAÇÕES PASSARAM COM 100% DE SUCESSO!\n');
