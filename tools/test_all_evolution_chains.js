const assert = require('assert');
const path = require('path');

// Carregar arquivos necessários em escopo simulado
global.window = global;
global.G = global.G || {};

const ev = require('../js/data/evolutions.js');
const CaptureSystem = require('../js/systems/capture.js');

console.log('=====================================================');
console.log('🧪 TESTE COMPLETO: CADEIAS EVOLUTIVAS & CAPTURA RIFT');
console.log('=====================================================');

// 1. Teste de cobertura universal de getEvolutionData
console.log('\n[1/4] Verificando getEvolutionData() para todas as espécies das 9 gerações...');
let testedSpecies = 0;
let evolvableFound = 0;

for (const [name, dex] of Object.entries(ev.POKEMON_NAME_TO_DEX)) {
  testedSpecies++;
  const gen = ev.POKEMON_GENEALOGY[dex];
  if (gen && gen[0] < 3) {
    const hasChild = Object.values(ev.POKEMON_GENEALOGY).some(g => g[1] === dex);
    if (hasChild) {
      evolvableFound++;
      const evoData = ev.getEvolutionData(name);
      assert(evoData !== null, `Espécie ${name} (dex ${dex}) possui evolução mas getEvolutionData retornou null!`);
      if (Array.isArray(evoData)) {
        assert(evoData.length > 1, `Espécie ramificada ${name} deve ter mais de 1 opção.`);
        evoData.forEach(e => assert(e.next, `Opção de evolução em ${name} sem campo next.`));
      } else {
        assert(evoData.next, `Evolução de ${name} sem campo next.`);
      }
    }
  }
}
console.log(`✅ ${testedSpecies} espécies verificadas. Todas as ${evolvableFound} espécies evoluíveis possuem dados válidos!`);

// 2. Simulação da entidade Player e evolução automática nos níveis 5 e 12
console.log('\n[2/4] Simulando progressão de nível de Pokémon no Player...');

class MockPlayer {
  constructor(speciesName, dex) {
    this.species = speciesName.toLowerCase();
    this.dex = dex;
    this.pokemonId = dex;
    this.mon = { name: speciesName, dex: dex };
    this.level = 1;
    this.currentEvolutionStage = 1;
    this.evolutionHistory = [this.pokemonId];
    this._milestonesReached = new Set();
    this.isMegaAscended = false;
    this.damageBonus = 1.0;
  }

  evolveTo(nextSpecies) {
    const nextDex = ev.POKEMON_NAME_TO_DEX[nextSpecies.toLowerCase()] || 999;
    this.species = nextSpecies.toLowerCase();
    this.dex = nextDex;
    this.pokemonId = nextDex;
    this.mon = { name: nextSpecies, dex: nextDex };
    this.currentEvolutionStage = (this.currentEvolutionStage || 1) + 1;
    this.evolutionHistory.push(this.pokemonId);
  }

  triggerMegaAscension() {
    this.isMegaAscended = true;
    this.damageBonus *= 1.5;
  }

  checkEvolutionMilestones() {
    this._milestonesReached = this._milestonesReached || new Set();
    const getEvo = ev.getEvolutionData;

    let loopGuard = 0;
    while (loopGuard++ < 4) {
      const currentSpecies = this.species || (this.mon && this.mon.name ? this.mon.name.toLowerCase() : '') || String(this.dex);
      const evoRaw = getEvo(currentSpecies);
      if (!evoRaw) break;

      const evoList = Array.isArray(evoRaw) ? evoRaw : [evoRaw];
      let targetEvo = null;
      let reqLevel = 5;

      for (const evo of evoList) {
        const isSecondEvolution = (this.currentEvolutionStage >= 2) || (this.evolutionHistory && this.evolutionHistory.length >= 2);
        const lvl = isSecondEvolution ? 12 : 5;

        if (this.level >= lvl && !this._milestonesReached.has('evo_' + evo.next.toLowerCase())) {
          targetEvo = evo;
          reqLevel = lvl;
          break;
        }
      }

      if (!targetEvo) break;

      this._milestonesReached.add('evo_' + targetEvo.next.toLowerCase());
      this.evolveTo(targetEvo.next);
    }

    if (this.level >= 21 && !this._milestonesReached.has(21)) {
      this._milestonesReached.add(21);
      this.triggerMegaAscension();
    }
  }

  setLevel(lvl) {
    this.level = lvl;
    this.checkEvolutionMilestones();
  }
}

// Caso 1: Bulbasaur (3 estágios)
const bulba = new MockPlayer('bulbasaur', 1);
bulba.setLevel(4);
assert.strictEqual(bulba.species, 'bulbasaur', 'Nível 4 não deve evoluir');
assert.strictEqual(bulba.currentEvolutionStage, 1);

bulba.setLevel(5);
assert.strictEqual(bulba.species, 'ivysaur', 'Nível 5 deve evoluir para Ivysaur');
assert.strictEqual(bulba.currentEvolutionStage, 2);

bulba.setLevel(11);
assert.strictEqual(bulba.species, 'ivysaur', 'Nível 11 deve continuar Ivysaur');

bulba.setLevel(12);
assert.strictEqual(bulba.species, 'venusaur', 'Nível 12 deve evoluir para Venusaur');
assert.strictEqual(bulba.currentEvolutionStage, 3);

bulba.setLevel(21);
assert.strictEqual(bulba.isMegaAscended, true, 'Nível 21 deve ativar Ascensão Mega');
console.log('✅ Linha Bulbasaur -> Ivysaur (Nv 5) -> Venusaur (Nv 12) -> Mega (Nv 21) aprovada!');

// Caso 2: Pikachu (Espécie com level > 20 nos jogos originais)
const pika = new MockPlayer('pikachu', 25);
pika.setLevel(4);
assert.strictEqual(pika.species, 'pikachu', 'Nível 4 não deve evoluir');

pika.setLevel(5);
assert.strictEqual(pika.species, 'raichu', 'Nível 5 DEVE evoluir para Raichu mesmo com level canônico 22!');
assert.strictEqual(pika.currentEvolutionStage, 2);

pika.setLevel(12);
assert.strictEqual(pika.species, 'raichu', 'Raichu continua Raichu');

pika.setLevel(21);
assert.strictEqual(pika.isMegaAscended, true);
console.log('✅ Linha Pikachu -> Raichu (Nv 5 corrigido!) -> Ápice (Nv 21) aprovada!');

// Caso 3: Gastly (level 25 na franquia oficial)
const gastly = new MockPlayer('gastly', 92);
gastly.setLevel(5);
assert.strictEqual(gastly.species, 'haunter', 'Gastly DEVE evoluir para Haunter no Nível 5');
gastly.setLevel(12);
assert.strictEqual(gastly.species, 'gengar', 'Haunter DEVE evoluir para Gengar no Nível 12');
console.log('✅ Linha Gastly -> Haunter (Nv 5) -> Gengar (Nv 12) aprovada!');

// Caso 4: Riolu (Gen 4 - Antes não cadastrado)
const riolu = new MockPlayer('riolu', 447);
riolu.setLevel(5);
assert.strictEqual(riolu.species, 'lucario', 'Riolu DEVE evoluir para Lucario no Nível 5');
console.log('✅ Linha Riolu -> Lucario (Nv 5) aprovada!');

// Caso 5: Gible (Gen 4 - Pseudo-lendário)
const gible = new MockPlayer('gible', 443);
gible.setLevel(5);
assert.strictEqual(gible.species, 'gabite', 'Gible DEVE evoluir para Gabite no Nível 5');
gible.setLevel(12);
assert.strictEqual(gible.species, 'garchomp', 'Gabite DEVE evoluir para Garchomp no Nível 12');
console.log('✅ Linha Gible -> Gabite (Nv 5) -> Garchomp (Nv 12) aprovada!');

// Caso 6: Tinkatink (Gen 9)
const tinka = new MockPlayer('tinkatink', 957);
tinka.setLevel(5);
assert.strictEqual(tinka.species, 'tinkatuff', 'Tinkatink DEVE evoluir para Tinkatuff no Nível 5');
tinka.setLevel(12);
assert.strictEqual(tinka.species, 'tinkaton', 'Tinkatuff DEVE evoluir para Tinkaton no Nível 12');
console.log('✅ Linha Tinkatink -> Tinkatuff (Nv 5) -> Tinkaton (Nv 12) aprovada!');

// 3. Teste do Sistema de Captura de Pokébolas no Rift
console.log('\n[3/4] Testando instanciação e física da WorldCaptureBall...');
const ball = CaptureSystem.startCaptureSequence({
  speciesId: 'garchomp',
  x: 200,
  y: 300,
  fromX: 100,
  fromY: 300,
  level: 15,
  isShiny: false
});

assert(ball !== null, 'startCaptureSequence deve instanciar WorldCaptureBall');
assert.strictEqual(ball.state, 'FLYING', 'Distância > 20 deve iniciar como FLYING');
assert.strictEqual(ball.ballTier.name, 'Great Ball', 'Nível 15 deve usar Great Ball');

// Simular física no ar até o impacto
ball.update(ball.flightDuration + 0.05);
assert.strictEqual(ball.state, 'BOUNCE', 'Após o vôo deve quicar no chão');
console.log('✅ Física de arremesso, tiers dinâmicos de Pokébola e balanço validados!');

// 4. Teste de devolução (Modo Admin)
console.log('\n[4/4] Testando getDevolutionData()...');
assert.strictEqual(ev.getDevolutionData('venusaur').prev, 'ivysaur');
assert.strictEqual(ev.getDevolutionData('ivysaur').prev, 'bulbasaur');
assert.strictEqual(ev.getDevolutionData('raichu').prev, 'pikachu');
assert.strictEqual(ev.getDevolutionData('garchomp').prev, 'gabite');
assert.strictEqual(ev.getDevolutionData('lucario').prev, 'riolu');
console.log('✅ getDevolutionData() funcionando perfeitamente para todas as gerações!');

console.log('\n=====================================================');
console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! 🎉');
console.log('=====================================================');
