/* ============ mega.js — Máquina de Estados do Mega Overdrive (10 Segundos) ============
 * Controla o acúmulo da barra de Mega, ativação via Barra de Espaço ou clique,
 * drenagem regressiva linear (10s), barreira protetora de 80%, atração de EXP +100%
 * e disparo das Calamidades Elementais dos 18 tipos.
 */

window.G = window.G || {};

const MegaSystem = {
  gauge: 0,
  maxGauge: 100,
  isActive: false,
  duration: 10.0,
  timeLeft: 0,
  activeType: 'normal',
  tickTimer: 0,

  /** Adiciona carga acumulada de energia ao Mega (ao matar monstros ou pegar orbes) */
  addEnergy(amount) {
    if (this.isActive) return;
    const prev = this.gauge;
    this.gauge = Math.min(this.maxGauge, this.gauge + amount);
    if (prev < this.maxGauge && this.gauge >= this.maxGauge) {
      if (typeof G === 'object' && G.Spawner && G.Spawner.say) {
        G.Spawner.say('⚡ MEGA PRONTO! Pressione [ESPAÇO] para ativar!', 3.0, true);
      }
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) {
        G.Audio.sfx('shiny');
      }
    }
  },

  /** Dispara o Overdrive de 10 segundos */
  trigger() {
    if (this.gauge < this.maxGauge || this.isActive) return false;

    this.isActive = true;
    this.timeLeft = this.duration;
    this.tickTimer = 0;

    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);
    // Lê o tipo primário do líder (ou do monstro base)
    let type = 'normal';
    if (pl) {
      if (pl.team && pl.team[0] && pl.team[0].type) {
        type = pl.team[0].type;
      } else if (pl.mon && pl.mon.types && pl.mon.types[0]) {
        type = pl.mon.types[0];
      }
    }
    this.activeType = String(type).toLowerCase().trim();

    // Feedback visual e sonoro de início
    if (typeof G === 'object' && G.Camera && typeof G.Camera.kick === 'function') G.Camera.kick(1.2);
    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('shinyGet');

    const ultimates = (typeof G === 'object' && G.MEGA_ULTIMATES_DATA) || (typeof MEGA_ULTIMATES_DATA !== 'undefined' ? MEGA_ULTIMATES_DATA : {});
    const cfg = ultimates[this.activeType] || ultimates['normal'] || { name: 'Overdrive' };

    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      G.Spawner.say(`🌟 MEGA OVERDRIVE: ${cfg.name.toUpperCase()} (10 Segundos)!`, 3.5, true);
    }
    console.log(`🌟 [MEGA] Overdrive Ativado! Calamidade Elemental: ${this.activeType.toUpperCase()} (10 Segundos)`);
    return true;
  },

  update(dt) {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);

    // Escuta ativação via teclado (Barra de Espaço) quando carregado
    if (!this.isActive && this.gauge >= this.maxGauge) {
      if (typeof G === 'object' && G.Input && typeof G.Input.tap === 'function') {
        if (G.Input.tap('space') || G.Input.tap('Space')) {
          this.trigger();
        }
      }
    }

    if (!this.isActive) return;

    this.timeLeft -= dt;
    // Drenagem contínua da barra como cronômetro visual linear de 100% a 0%
    this.gauge = Math.max(0, (this.timeLeft / this.duration) * this.maxGauge);

    // Bônus protetor: -80% de dano sofrido e +100% de raio de atração de EXP
    if (pl) {
      pl.dmgTakenMul = 0.20;
      pl.magnetMul = 2.0;
    }

    // Atualiza spawner contínuo da respectiva Calamidade dos 18 tipos
    const camera = (typeof G === 'object') ? G.Camera : null;
    const ultimates = (typeof G === 'object' && G.MEGA_ULTIMATES_DATA) || (typeof MEGA_ULTIMATES_DATA !== 'undefined' ? MEGA_ULTIMATES_DATA : {});
    const config = ultimates[this.activeType] || ultimates['normal'];

    if (config && typeof config.spawnHazard === 'function') {
      this.tickTimer += dt;
      if (this.tickTimer >= config.interval) {
        this.tickTimer = 0;
        config.spawnHazard(pl, camera);
      }
    }

    // Atualiza VFX em campo
    const vfx = (typeof G === 'object' && G.UltimateVFX) || (typeof UltimateVFX !== 'undefined' ? UltimateVFX : null);
    if (vfx && typeof vfx.update === 'function') {
      vfx.update(dt, pl);
    }

    // Encerramento natural após 10 segundos
    if (this.timeLeft <= 0) {
      this.isActive = false;
      this.gauge = 0;
      this.timeLeft = 0;
      if (pl) {
        pl.dmgTakenMul = 1.0;
        pl.magnetMul = 1.0;
      }
      console.log("🌟 [MEGA] Overdrive encerrado. Sistema recarregando.");
    }
  }
};

if (typeof G === 'object') {
  G.Mega = MegaSystem;
  G.MegaSystem = MegaSystem;
}
if (typeof window !== 'undefined') {
  window.MegaSystem = MegaSystem;
  window.debugFillMega = function() {
    MegaSystem.gauge = MegaSystem.maxGauge;
    console.log("⚡ [DEBUG] Mega carregado para 100%! Pressione [ESPAÇO] para ativar.");
    if (typeof G === 'object' && G.HUD && typeof G.HUD.update === 'function') G.HUD.update();
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MegaSystem;
}
