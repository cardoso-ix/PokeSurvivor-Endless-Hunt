/* ============ mega.js — Mega Overdrive (20 Segundos: Pokémon Gigante + Super Buff) ============
 * Acionado via Barra de Espaço ou clique no botão do HUD:
 * - O Pokémon cresce de tamanho (fica gigante com escala ampliada)
 * - Ganha um super buff absurdo em todos os atributos por 20 segundos (Dano 5x, Defesa, Velocidade, Crítico e Recarga rápida)
 * - ZERO bolas de fogo e ZERO hazards no mapa
 * - Ao término dos 20 segundos, o Pokémon retorna suavemente ao tamanho e status normais.
 */

window.G = window.G || {};

const MegaSystem = {
  gauge: 0,
  maxGauge: 100,
  isActive: false,
  duration: 10.0, // 10 segundos exatos (janela tática)
  timeLeft: 0,
  pending: false, // cutscene de ativação em andamento
  hitStop: 0, // congelamento curto do mundo ao ativar (segundos)
  vignetteT: 0,

  /** Reseta o estado do Mega ao reiniciar ou iniciar partida */
  reset() {
    this.isActive = false;
    this.gauge = 0;
    this.timeLeft = 0;
    this.hitStop = 0;
    this.pending = false;
    if (typeof G === 'object' && G.MegaScene) G.MegaScene.stop();
    this.activeType = null;
    this.currentElement = null;
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : null;
    if (pl) {
      pl.megaDmgMul = 1.0;
      pl.dmgTakenMul = 1.0;
      pl.magnetMul = 1.0;
      pl.megaAuraElement = null;
      if (pl.megaMode) pl.megaMode.active = false;
    }
  },

  /** Adiciona carga acumulada de energia ao Mega (ao derrotar monstros ou coletar orbes) */
  addEnergy(amount) {
    if (this.isActive) return;
    const prev = this.gauge;
    this.gauge = Math.min(this.maxGauge, this.gauge + amount);
    if (prev < this.maxGauge && this.gauge >= this.maxGauge) {
      if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say('⚡ MEGA PRONTO! Pressione [ESPAÇO] para ativar!', 3.0, true);
      }
      if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
        G.Audio.sfx('select');
      }
    }
  },

  /** Dispara a transformação Mega por 20 segundos com Pokémon Gigante e Super Buff */
  trigger() {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);
    const currentGauge = Math.max(this.gauge, (pl && pl.megaEnergy) || 0);

    // Permite tolerância de arredondamento em ponto flutuante
    if (currentGauge < (this.maxGauge - 0.8) || this.isActive || this.pending) return false;

    // Cutscene com o Pokémon no centro; a ativação real ocorre quando ela termina
    const scene = (typeof G === 'object') ? G.MegaScene : null;
    if (pl && scene && scene.canPlay()) {
      const t0 = (pl.mon && pl.mon.types && pl.mon.types[0]) ? pl.mon.types[0] : (pl.types && pl.types[0] ? pl.types[0] : 'normal');
      const vfx = (typeof MegaSkillVFXManager !== 'undefined') ? MegaSkillVFXManager : null;
      const typeKey = String(t0).toLowerCase();
      this.pending = true;
      scene.start(vfx && vfx.getTypeConfig ? ((vfx.getTypeConfig(typeKey) || {}).id || typeKey) : typeKey, pl, () => {
        this.pending = false;
        this._activate(pl);
      });
      return true;
    }
    return this._activate(pl);
  },

  /** Ativação efetiva (buffs, crescimento, dano e VFX) */
  _activate(pl) {
    this.isActive = true;
    this.gauge = this.maxGauge;
    this.duration = 10.0;
    this.timeLeft = 10.0;
    this.hitStop = 0.15;

    // Super Buff Absurdo em TUDO no Pokémon durante os 20 segundos:
    if (pl) {
      pl.megaEnergy = this.maxGauge;
      pl.megaDmgMul = 2.5; // Dano 2.5x calibrado para burst hardcore!
      pl.dmgTakenMul = 0.20; // Super Sobrevivência: recebe 20% do dano (redução de 80%)
      pl.magnetMul = 2.0; // Raio de coleta 2x
      if (pl.megaMode) {
        pl.megaMode.active = true;
        pl.megaMode.timer = 10.0;
        pl.megaMode.maxTimer = 10.0;
      }

      // Dispara a Mega Skill Elemental Procedural correspondente ao tipo do Pokémon
      const pType = (pl.mon && pl.mon.types && pl.mon.types[0]) ? pl.mon.types[0] : (pl.types && pl.types[0] ? pl.types[0] : 'normal');
      // Expõe o tipo ativo para que a aura do jogador (player.js) use a paleta elemental correta
      this.activeType = pType;
      this.currentElement = pType;
      if (pl) pl.megaAuraElement = pType;
      const vfx = (typeof MegaSkillVFXManager !== 'undefined') ? MegaSkillVFXManager : ((typeof G === 'object') ? (G.MegaSkillVFXManager || G.UltimateVFX) : null);
      if (vfx && typeof vfx.trigger === 'function') {
        vfx.trigger(pType, pl);
      }
    }

    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      const pName = (pl && pl.mon && pl.mon.name) || (pl && pl.species) || 'POKÉMON';
      G.Spawner.say(`🔥 MEGA ATIVADO! ${pName.toUpperCase()} GIGANTE COM SUPER BUFF (10s)!`, 3.0, true);
    }
    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
      G.Audio.sfx('mega');
    }
    console.log('🌟 [MEGA] Ativado por 10 segundos: Pokémon cresceu e ganhou Super Buff de Dano 2.5x!');
    return true;
  },

  update(dt) {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);

    // Escuta ativação via teclado (Barra de Espaço) quando carregado
    if (!this.isActive && (this.gauge >= (this.maxGauge - 0.8) || (pl && pl.megaEnergy >= ((pl.megaMaxEnergy || 100) - 0.8)))) {
      if (typeof G === 'object' && G.Input && typeof G.Input.tap === 'function') {
        if (G.Input.tap('space') || G.Input.tap('Space') || G.Input.tap(' ')) {
          this.trigger();
        }
      }
    }

    if (!this.isActive) return;

    this.timeLeft -= dt;
    // Drenagem linear contínua da barra como cronômetro visual de 100% a 0%
    this.gauge = Math.max(0, (this.timeLeft / this.duration) * this.maxGauge);

    // Mantém o super buff e o crescimento ativos durante todos os 20 segundos
    if (pl) {
      pl.megaDmgMul = 2.5;
      pl.dmgTakenMul = 0.20;
      pl.magnetMul = 2.0;
      if (pl.megaMode) {
        pl.megaMode.active = true;
        pl.megaMode.timer = this.timeLeft;
      }
    }

    // Ao terminar os 20 segundos, encerra e retorna o Pokémon ao tamanho e atributos normais!
    if (this.timeLeft <= 0) {
      this.isActive = false;
      this.gauge = 0;
      this.timeLeft = 0;
      this.activeType = null;
      this.currentElement = null;
      if (pl) {
        pl.megaDmgMul = 1.0;
        pl.dmgTakenMul = 1.0;
        pl.magnetMul = 1.0;
        pl.megaAuraElement = null;
        if (pl.megaMode) pl.megaMode.active = false;
        if (typeof pl.deactivateMega === 'function') pl.deactivateMega();
      }
      if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
        G.Spawner.say('🌟 Mega finalizado: Pokémon retornou ao tamanho normal.', 2.5, true);
      }
      console.log('🌟 [MEGA] 10 segundos concluídos. Pokémon retornou ao tamanho normal e status originais.');
    }
  }
};

if (typeof G === 'object') {
  G.Mega = MegaSystem;
  G.MegaSystem = MegaSystem;
}

if (typeof window !== 'undefined') {
  window.MegaSystem = MegaSystem;
  window.megaSystem = MegaSystem;

  // Listener global infalível na fase de captura para ativação via Barra de Espaço
  // Em Node (testes) não existe addEventListener no global: registra só no navegador.
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        const g = (typeof G === 'object') ? G : null;
        const mega = (g && g.Mega) ? g.Mega : (window.megaSystem || MegaSystem);
        const pl = (g && g.Game) ? g.Game.player : ((window.game) ? window.game.player : null);
        if (mega && pl) {
          const isReady = (mega.gauge >= (mega.maxGauge - 0.8)) || (pl.megaEnergy >= ((pl.megaMaxEnergy || 100) - 0.8));
          if (isReady && !mega.isActive) {
            e.preventDefault();
            mega.trigger();
          }
        }
      }
    }, true);
  }

  // Listener global para ativação via clique ou touch no botão #hud-mega-btn
  function handleMegaBtnGlobal(e) {
    const btn = e.target && e.target.closest('#hud-mega-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const g = (typeof G === 'object') ? G : null;
    const mega = (g && g.Mega) ? g.Mega : (window.megaSystem || MegaSystem);
    if (mega && typeof mega.trigger === 'function') {
      mega.trigger();
    }
  }
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('click', handleMegaBtnGlobal, true);
    document.addEventListener('touchend', handleMegaBtnGlobal, true);
  }
}
