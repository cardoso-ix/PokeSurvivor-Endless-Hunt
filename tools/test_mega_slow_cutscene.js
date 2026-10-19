/**
 * Teste Automatizado: Cutscene Mega Prolongada (2.8s), Entrada Lenta (Slow-Motion)
 * e Preservação dos 10 Segundos Úteis de Ultimate.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Iniciando teste automatizado da Cutscene Mega Estendida e Lenta...');

// Mock do ambiente
global.window = global;
global.G = {
  Audio: { sfx: () => {} },
  Camera: { kick: () => {} },
  Spawner: { say: () => {} }
};

const megaCode = fs.readFileSync(path.join(__dirname, '../js/systems/mega.js'), 'utf8');
eval(megaCode);

const MegaCutscene = global.MegaCutscene;
const MegaSystem = global.MegaSystem;

assert(MegaCutscene, 'MegaCutscene deve existir');
assert(MegaSystem, 'MegaSystem deve existir');

// Validação 1: Duração da Cutscene estendida para 2.8s
console.log('\n--- 1. Validação da Duração Estendida ---');
assert.strictEqual(MegaCutscene.duration, 2.8, 'Duração da cutscene deve ser exatamente 2.8s');
console.log('✅ Duração configurada para 2.8s com sucesso!');

// Validação 2: Inicialização da Cutscene
console.log('\n--- 2. Disparo da Cutscene e Transição Lenta de Entrada ---');
const mockPlayer = {
  name: 'Charizard',
  mon: { name: 'Charizard' },
  dex: 6,
  types: ['fire'],
  anim: {
    play: (anim) => { mockPlayer.currentAnim = anim; },
    loop: (anim) => { mockPlayer.currentAnim = anim; }
  }
};

MegaCutscene.start(mockPlayer, 'fire', 'Fúria Dracônica');
assert.strictEqual(MegaCutscene.active, true, 'Cutscene deve iniciar ativa');
assert.strictEqual(MegaCutscene.duration, 2.8, 'Duração deve ser 2.8s');
assert.strictEqual(mockPlayer.currentAnim, 'Attack', 'Animação deve travar em pose de Attack');

// Simula t = 0.3s (dentro da fase de entrada suave 0.0s a 0.65s)
MegaCutscene.update(0.3);
assert.strictEqual(MegaCutscene.active, true, 'Ainda ativa em 0.3s');
assert(MegaCutscene.timer > 0.29 && MegaCutscene.timer < 0.31, 'Timer deve avançar para 0.3s');

// Validação 3: Sustentação Heroica em Slow-Motion (t = 1.5s)
console.log('\n--- 3. Sustentação Prolongada para Contemplação (t = 1.5s) ---');
MegaCutscene.update(1.2); // total 1.5s
assert.strictEqual(MegaCutscene.active, true, 'Deve permanecer ativa em 1.5s (sustentação)');
assert(MegaCutscene.timer >= 1.5, 'Timer deve marcar 1.5s');
console.log('✅ Cutscene sustentada com presença total aos 1.5s!');

// Validação 4: Saída Fluida e Encerramento aos 2.8s
console.log('\n--- 4. Encerramento Natural aos 2.8s ---');
MegaCutscene.update(1.0); // total 2.5s (fase de saída suave)
assert.strictEqual(MegaCutscene.active, true, 'Ainda ativa aos 2.5s (fade out)');

MegaCutscene.update(0.35); // total 2.85s (ultrapassou 2.8s)
assert.strictEqual(MegaCutscene.active, false, 'Cutscene deve encerrar após 2.8s');
assert.strictEqual(mockPlayer.currentAnim, 'Idle', 'Player deve retornar à animação Idle');
console.log('✅ Encerramento perfeito após 2.8s!');

// Validação 5: Preservação dos 10 Segundos de Calamidade no MegaSystem
console.log('\n--- 5. Preservação dos 10 Segundos durante a Cutscene ---');
MegaSystem.reset();
MegaSystem.gauge = 100;
global.G.Game = { player: mockPlayer };

MegaSystem.trigger();
assert.strictEqual(MegaSystem.isActive, true, 'Mega deve estar ativo');
assert.strictEqual(MegaCutscene.active, true, 'Cutscene deve ter iniciado');
assert.strictEqual(MegaSystem.timeLeft, 10.0, 'Tempo inicial deve ser 10.0s');

// Atualiza o MegaSystem por 1.0s enquanto a cutscene estiver ativa
MegaSystem.update(1.0);
assert.strictEqual(MegaCutscene.active, true, 'Cutscene ainda ativa após 1.0s');
assert.strictEqual(MegaSystem.timeLeft, 10.0, 'Tempo do Mega NÃO pode diminuir durante a cutscene (continua 10.0s)!');
assert.strictEqual(MegaSystem.gauge, 100, 'Barra do Mega permanece cheia durante a cutscene');

// Avança até o término da cutscene (+1.85s)
MegaSystem.update(1.85);
assert.strictEqual(MegaCutscene.active, false, 'Cutscene encerrou');
assert.strictEqual(MegaSystem.timeLeft, 10.0, 'Tempo do Mega ainda está em 10.0s no momento em que a cutscene termina!');

// Agora a cutscene terminou: o Mega deve drenar os 10s no gameplay
MegaSystem.update(2.0);
assert(MegaSystem.timeLeft < 10.0, 'Agora o tempo do Mega deve drenar');
assert.strictEqual(Math.round(MegaSystem.timeLeft), 8, 'Tempo do Mega agora deve ser ~8s');
console.log('✅ Preservação comprovada: o jogador tem 2.8s de cutscene lenta e DEPOIS 10s inteiros de jogo!');

console.log('\n🎉 TODOS OS TESTES DA CUTSCENE MEGA LENTA E PROLONGADA PASSARAM COM SUCESSO 100%!');
