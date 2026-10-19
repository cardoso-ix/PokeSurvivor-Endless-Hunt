/* ============ mega.js — Máquina de Estados do Mega Supremo (8.5s a 10s) ============
 * Controla o acúmulo da barra de Mega, ativação via Barra de Espaço ou clique,
 * identificação dinâmica do tipo do líder da equipe, drenagem regressiva linear
 * e disparo contínuo do Poder Supremo do elemento correspondente.
 */

window.G = window.G || {};

const MegaSystem = {
  gauge: 0,
  maxGauge: 100,
  isActive: false,
  duration: 10.0, // 8.0 a 10.0 segundos
  timeLeft: 0,
  hazardTimer: 0,
  tickTimer: 0,
  currentElement: 'normal',
  activeType: 'normal',

  /** Reseta o estado do Mega e limpa efeitos ao reiniciar partida */
  reset() {
    this.isActive = false;
    this.gauge = 0;
    this.timeLeft = 0;
    this.hazardTimer = 0;
    this.tickTimer = 0;
    this.currentElement = 'normal';
    this.activeType = 'normal';
    const vfx = (typeof G === 'object' && G.UltimateVFX) || (typeof UltimateVFX !== 'undefined' ? UltimateVFX : null);
    if (vfx && typeof vfx.clear === 'function') {
      vfx.clear();
    }
  },

  /** Adiciona carga acumulada de energia ao Mega (ao derrotar monstros ou coletar orbes) */
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

  /** Dispara o Poder Supremo Dinâmico por 8.5 a 10 segundos */
  trigger() {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);
    const currentGauge = Math.max(this.gauge, (pl && pl.megaEnergy) || 0);

    // Permite tolerância de arredondamento em ponto flutuante
    if (currentGauge < (this.maxGauge - 0.8) || this.isActive) return false;

    this.isActive = true;
    this.gauge = this.maxGauge;
    if (pl) pl.megaEnergy = this.maxGauge;
    this.timeLeft = this.duration;
    this.hazardTimer = 0;
    this.tickTimer = 0;

    // 1. Identificação Dinâmica do Elemento do Pokémon Líder da Equipe
    let leaderType = 'normal';
    if (pl) {
      if (Array.isArray(pl.types) && pl.types.length > 0) {
        leaderType = String(pl.types[0]).toLowerCase();
      } else if (pl.mon) {
        if (Array.isArray(pl.mon.types) && pl.mon.types.length > 0) {
          leaderType = String(pl.mon.types[0]).toLowerCase();
        } else if (pl.mon.type) {
          leaderType = String(pl.mon.type).toLowerCase();
        }
      } else if (pl.species) {
        leaderType = String(pl.species).toLowerCase();
      }
    }

    this.currentElement = leaderType.trim();
    this.activeType = this.currentElement;

    // 2. Configura a aura e modo no Treinador
    if (pl) {
      pl.megaAuraElement = this.currentElement;
      pl.dmgTakenMul = 0.20; // Proteção de 80%
      pl.magnetMul = 2.0;    // +100% de raio de coleta
      if (pl.megaMode) {
        pl.megaMode.active = true;
        pl.megaMode.timer = this.duration;
        pl.megaMode.maxTimer = this.duration;
        pl.megaMode.element = this.currentElement;
      }
    }

    // Feedback audiovisual
    if (typeof G === 'object' && G.Camera && typeof G.Camera.kick === 'function') G.Camera.kick(1.2);
    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') G.Audio.sfx('shinyGet');

    const ultimates = (typeof G === 'object' && (G.MEGA_ULTIMATES || G.MEGA_ULTIMATES_DATA))
      || (typeof MEGA_ULTIMATES !== 'undefined' ? MEGA_ULTIMATES : (typeof MEGA_ULTIMATES_DATA !== 'undefined' ? MEGA_ULTIMATES_DATA : {}));
    const config = ultimates[this.currentElement] || ultimates['normal'] || { name: 'Poder Supremo' };

    // Dispara o primeiro impacto no instante zero
    const camera = (typeof G === 'object') ? G.Camera : null;
    if (typeof config.executeHazard === 'function') {
      config.executeHazard(pl, camera);
    } else if (typeof config.spawnHazard === 'function') {
      config.spawnHazard(pl, camera);
    }

    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      G.Spawner.say(`🌟 MEGA SUPREMO: ${config.name.toUpperCase()} (${this.duration}s)!`, 3.5, true);
    }
    console.log(`🌟 [MEGA SUPREMO] Ativado elemento: ${this.currentElement.toUpperCase()} por ${this.duration}s!`);
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
    // Drenagem linear contínua da barra como cronômetro visual de 100% a 0%
    this.gauge = Math.max(0, (this.timeLeft / this.duration) * this.maxGauge);

    // Mantém bônus defensivo e de ímã durante todo o Overdrive
    if (pl) {
      pl.dmgTakenMul = 0.20;
      pl.magnetMul = 2.0;
      if (pl.megaMode) {
        pl.megaMode.active = true;
        pl.megaMode.timer = this.timeLeft;
        pl.megaMode.element = this.currentElement;
      }
    }

    // Dispara a Calamidade contínua do elemento (a cada 0.20s - 0.35s)
    const camera = (typeof G === 'object') ? G.Camera : null;
    const ultimates = (typeof G === 'object' && (G.MEGA_ULTIMATES || G.MEGA_ULTIMATES_DATA))
      || (typeof MEGA_ULTIMATES !== 'undefined' ? MEGA_ULTIMATES : (typeof MEGA_ULTIMATES_DATA !== 'undefined' ? MEGA_ULTIMATES_DATA : {}));
    const config = ultimates[this.currentElement] || ultimates['normal'];

    if (config) {
      this.hazardTimer += dt;
      this.tickTimer = this.hazardTimer;
      const interval = config.interval || 0.25;
      if (this.hazardTimer >= interval) {
        this.hazardTimer = 0;
        this.tickTimer = 0;
        if (typeof config.executeHazard === 'function') {
          config.executeHazard(pl, camera);
        } else if (typeof config.spawnHazard === 'function') {
          config.spawnHazard(pl, camera);
        }
      }
    }

    // Atualiza VFX e entidades no campo
    const vfx = (typeof G === 'object' && G.UltimateVFX) || (typeof UltimateVFX !== 'undefined' ? UltimateVFX : null);
    if (vfx && typeof vfx.update === 'function') {
      vfx.update(dt, pl);
    }

    // Encerramento natural após término do tempo
    if (this.timeLeft <= 0) {
      this.isActive = false;
      this.gauge = 0;
      this.timeLeft = 0;
      if (pl) {
        pl.dmgTakenMul = 1.0;
        pl.magnetMul = 1.0;
        if (typeof pl.deactivateMega === 'function') pl.deactivateMega();
      }
      console.log("🌟 [MEGA SUPREMO] Encerrado.");
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
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : null;
    if (pl) {
      pl.megaEnergy = pl.megaMaxEnergy || MegaSystem.maxGauge;
    }
    console.log("⚡ [DEBUG] Barra de Mega carregada para 100%! Pressione [ESPAÇO] para ativar.");
    if (typeof G === 'object' && G.HUD && typeof G.HUD.update === 'function') G.HUD.update();
  };

  // Escuta redundante global para tecla [Espaço]
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        // Ignora se o usuário estiver digitando em campo de input
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const g = (typeof G === 'object' && G.Game) ? G.Game : (typeof game !== 'undefined' ? game : null);
        if (g && g.state === 'playing') {
          const pl = g.player;
          const current = Math.max(MegaSystem.gauge, (pl && pl.megaEnergy) || 0);
          if (current >= (MegaSystem.maxGauge - 0.8) && !MegaSystem.isActive) {
            e.preventDefault();
            MegaSystem.trigger();
          }
        }
      }
    });
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MegaSystem;
}
