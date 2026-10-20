/* ============ mega.js — Máquina de Estados do Mega Supremo (10s) & Cutscene Cinematográfica ============
 * Controla o acúmulo da barra de Mega, ativação via Barra de Espaço ou clique,
 * cutscene cinematográfica de anime no Pokémon líder, multiplicador de 2x de dano,
 * identificação dinâmica do tipo do líder da equipe, drenagem regressiva linear
 * e disparo contínuo do Poder Supremo do elemento correspondente.
 */

window.G = window.G || {};

const MegaCutscene = {
  active: false,
  timer: 0,
  duration: 2.8, // Duração estendida para 2.8s para visualização ampla e contemplação do Pokémon
  pokemonName: 'POKÉMON',
  pokemonDex: 1,
  isShiny: false,
  element: 'normal',
  ultimateName: 'PODER SUPREMO',
  pl: null,
  speedlines: [],

  start(pl, element, ultimateName) {
    this.active = true;
    this.timer = 0;
    this.duration = 2.8;
    this.pl = pl;
    this.pokemonName = (pl && pl.mon && pl.mon.name ? pl.mon.name : (pl && pl.name ? pl.name : 'Pokémon')).toUpperCase();
    this.pokemonDex = (pl && pl.dex) || 1;
    this.isShiny = !!(pl && (pl.isShiny || pl.shiny));
    this.element = (element || 'normal').toLowerCase();
    this.ultimateName = (ultimateName || 'PODER SUPREMO').toUpperCase();

    // Speedlines mais suaves e desaceleradas para atmosfera cinematográfica
    this.speedlines = [];
    for (let i = 0; i < 26; i++) {
      this.speedlines.push({
        yRel: (Math.random() - 0.5) * 130,
        len: 120 + Math.random() * 260,
        speed: 380 + Math.random() * 420, // Velocidade reduzida para slow motion
        x: Math.random() * 1000,
        alpha: 0.30 + Math.random() * 0.55,
        width: 1.5 + Math.random() * 2.5
      });
    }

    if (pl && pl.anim && typeof pl.anim.play === 'function') {
      pl.anim.play('Attack', { hold: true });
    }

    if (typeof G === 'object' && G.Audio && typeof G.Audio.sfx === 'function') {
      G.Audio.sfx('legend');
      G.Audio.sfx('shinyGet');
    }
    if (typeof G === 'object' && G.Camera && typeof G.Camera.kick === 'function') {
      G.Camera.kick(1.8);
    }
  },

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    // Atualiza speedlines em slow motion
    for (const sl of this.speedlines) {
      sl.x -= sl.speed * dt;
      if (sl.x < -sl.len) sl.x = 1000 + Math.random() * 300;
    }
    if (this.timer >= this.duration) {
      this.active = false;
      if (this.pl && this.pl.anim && typeof this.pl.anim.loop === 'function') {
        this.pl.anim.loop('Idle');
      }
    }
  },

  draw(ctx, w, h) {
    if (!this.active) return;
    const centerY = h / 2;
    const bannerH = 142;

    // Fases de tempo da Cutscene Estendida (2.8s no total):
    // 1. Entrada Suave / Slow Ease-in (0.0s - 0.65s)
    // 2. Sustentação Heroica / Full View (0.65s - 2.30s)
    // 3. Saída Fluida / Ease-out (2.30s - 2.80s)
    const tInDur = 0.65;
    const tOutStart = 2.30;
    const tOutDur = 0.50;

    let alpha = 1.0;
    let easeIn = 1.0;

    if (this.timer < tInDur) {
      const t = this.timer / tInDur;
      // Curva cúbica suave (ease-out cubic) para entrada compassada e elegante
      easeIn = 1 - Math.pow(1 - t, 3);
      alpha = easeIn;
    } else if (this.timer > tOutStart) {
      const t = Math.min(1, (this.timer - tOutStart) / tOutDur);
      alpha = Math.max(0, 1 - t);
      easeIn = 1.0;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // 1. Escurecimento dramático de fundo (Focus Dim cinematográfico)
    ctx.fillStyle = 'rgba(6, 10, 22, 0.78)';
    ctx.fillRect(0, 0, w, h);

    // Paletas dos elementos
    const palettes = (typeof ELEMENT_PALETTES !== 'undefined' ? ELEMENT_PALETTES : null) || {};
    const pal = palettes[this.element] || { color: '#f59e0b', accent: '#ef4444', aura: '#fbbf24' };

    // 2. Slash Banner Angular Deslizando Suavemente Cortando a Tela
    const slant = 48;
    const bannerSlide = (1 - easeIn) * -120; // Deslizamento suave na entrada

    ctx.save();
    ctx.translate(bannerSlide, 0);

    ctx.beginPath();
    ctx.moveTo(0, centerY - bannerH / 2 - slant * 0.35);
    ctx.lineTo(w, centerY - bannerH / 2 + slant * 0.35);
    ctx.lineTo(w, centerY + bannerH / 2 + slant * 0.35);
    ctx.lineTo(0, centerY + bannerH / 2 - slant * 0.35);
    ctx.closePath();

    // Gradiente de fundo da faixa
    const grad = ctx.createLinearGradient(0, centerY, w, centerY);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(0.35, pal.color);
    grad.addColorStop(0.70, pal.accent);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Bordas douradas chanfradas da faixa
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 3. Speedlines cinéticas horizontais dentro do banner (Slow Motion)
    ctx.clip(); // Limita as speedlines dentro da faixa angular
    for (const sl of this.speedlines) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = sl.width;
      ctx.globalAlpha = alpha * sl.alpha;
      ctx.beginPath();
      const ly = centerY + sl.yRel;
      ctx.moveTo(sl.x, ly);
      ctx.lineTo(sl.x + sl.len, ly);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Desenho do Sprite do Pokémon Líder Ampliado com Movimento Lento Cinematográfico
    ctx.save();

    // Movimento suave do Pokémon entrando da esquerda e respirando na tela
    const pkBaseX = Math.round(w * 0.28);
    const pkX = Math.round(pkBaseX + (1 - easeIn) * -90);
    const pkY = Math.round(centerY + 34);

    // Escala dinâmica com aproximação suave (câmera lenta de anime)
    let pkScale = 3.8;
    if (this.timer < tInDur) {
      // Zoom-in suave na entrada: de 3.1x até 3.8x
      pkScale = 3.1 + (3.8 - 3.1) * easeIn;
    } else if (this.timer <= tOutStart) {
      // Respiração épica durante a sustentação: sutil oscilação viva
      const breathe = Math.sin((this.timer - tInDur) * 3.0) * 0.08;
      pkScale = 3.8 + breathe;
    } else {
      // Leve aceleração heroica ao sumir
      const tOut = (this.timer - tOutStart) / tOutDur;
      pkScale = 3.8 + tOut * 0.35;
    }

    // Aura elíptica brilhante sob o Pokémon com pulso suave
    const auraPulse = 1 + Math.sin(this.timer * 3.5) * 0.12;
    ctx.fillStyle = pal.aura || '#ffd700';
    ctx.globalAlpha = alpha * 0.68;
    ctx.beginPath();
    ctx.ellipse(pkX, pkY, 78 * auraPulse, 26 * auraPulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Segundo anel externo da aura
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = alpha * 0.40;
    ctx.beginPath();
    ctx.ellipse(pkX, pkY, 92 * auraPulse, 30 * auraPulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Desenha o sprite vivo do Pokémon
    ctx.globalAlpha = alpha;
    if (this.pl && this.pl.anim && typeof this.pl.anim.draw === 'function') {
      ctx.save();
      ctx.translate(pkX, pkY);
      ctx.scale(pkScale, pkScale);
      // Pulso sutil de energia do Pokémon
      const shakeX = (Math.random() - 0.5) * 1.0;
      const shakeY = (Math.random() - 0.5) * 1.0;
      this.pl.anim.draw(ctx, shakeX, shakeY, { alpha: 1 });
      ctx.restore();
    } else if (typeof G === 'object' && G.Sprites && typeof G.Sprites.drawShadow === 'function') {
      G.Sprites.drawShadow(ctx, this.pokemonDex, pkX, pkY, pkScale * 0.65);
    }
    ctx.restore();

    // 5. Tipografia Épica de RPG Retrô com Deslizamento Suave da Direita
    ctx.save();
    const textBaseX = Math.round(w * 0.44);
    const textStartX = Math.round(textBaseX + (1 - easeIn) * 70);

    // Linha 1: Badge Superior
    ctx.font = '800 13px Pixelify, monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('⚡ MEGA OVERDRIVE ATIVADO! ⚡', textStartX, centerY - 28);

    // Linha 2: Nome do Pokémon Líder (Grande e Imponente)
    ctx.font = '900 32px Pixelify, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a0d16';
    ctx.strokeText(this.pokemonName, textStartX, centerY + 8);
    ctx.fillText(this.pokemonName, textStartX, centerY + 8);

    // Linha 3: Nome da Ultimate e DANO 2X em destaque
    ctx.font = '700 14px Pixelify, monospace';
    ctx.fillStyle = '#ffd700';
    const subText = `💥 ${this.ultimateName} • DANO 2X ATIVO! 💥`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(subText, textStartX, centerY + 34);
    ctx.fillText(subText, textStartX, centerY + 34);

    ctx.restore();
    ctx.restore();
  }
};

const MegaSystem = {
  gauge: 0,
  maxGauge: 100,
  isActive: false,
  duration: 10.0, // 10.0 segundos
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
    MegaCutscene.active = false;
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

  /** Dispara o Poder Supremo Dinâmico por 10 segundos com Cutscene e Dano 2x */
  trigger() {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);
    const currentGauge = Math.max(this.gauge, (pl && pl.megaEnergy) || 0);

    // Permite tolerância de arredondamento em ponto flutuante
    if (currentGauge < (this.maxGauge - 0.8) || this.isActive) return false;

    this.isActive = true;
    this.gauge = this.maxGauge;
    if (pl) {
      pl.megaEnergy = this.maxGauge;
      pl.megaDmgMul = 2.0; // Dano 2x garantido durante todo o Mega
    }
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
      pl.dmgTakenMul = 0.15; // Proteção de 85%
      pl.magnetMul = 2.0;    // +100% de raio de coleta
      if (pl.megaMode) {
        pl.megaMode.active = true;
        pl.megaMode.timer = this.duration;
        pl.megaMode.maxTimer = this.duration;
        pl.megaMode.element = this.currentElement;
      }
    }

    const ultimates = (typeof G === 'object' && (G.MEGA_ULTIMATES || G.MEGA_ULTIMATES_DATA))
      || (typeof MEGA_ULTIMATES !== 'undefined' ? MEGA_ULTIMATES : (typeof MEGA_ULTIMATES_DATA !== 'undefined' ? MEGA_ULTIMATES_DATA : {}));
    const config = ultimates[this.currentElement] || ultimates['normal'] || { name: 'Poder Supremo' };

    // 3. Dispara a Cutscene Cinematográfica no Pokémon
    MegaCutscene.start(pl, this.currentElement, config.name);

    // 4. Dispara o primeiro impacto no instante zero
    const camera = (typeof G === 'object') ? G.Camera : null;
    if (typeof config.executeHazard === 'function') {
      config.executeHazard(pl, camera);
    } else if (typeof config.spawnHazard === 'function') {
      config.spawnHazard(pl, camera);
    }

    if (typeof G === 'object' && G.Spawner && typeof G.Spawner.say === 'function') {
      G.Spawner.say(`🌟 MEGA SUPREMO: ${config.name.toUpperCase()} (DANO 2X ATIVO)!`, 3.5, true);
    }
    console.log(`🌟 [MEGA SUPREMO] Ativado elemento: ${this.currentElement.toUpperCase()} por ${this.duration}s com DANO 2X!`);
    return true;
  },

  update(dt) {
    const pl = (typeof G === 'object' && G.Game) ? G.Game.player : (typeof game !== 'undefined' ? game.player : null);

    // Atualiza a Cutscene
    const wasCutsceneActive = MegaCutscene.active;
    MegaCutscene.update(dt);

    // Escuta ativação via teclado (Barra de Espaço) quando carregado
    if (!this.isActive && (this.gauge >= (this.maxGauge - 0.8) || (pl && pl.megaEnergy >= ((pl.megaMaxEnergy || 100) - 0.8)))) {
      if (typeof G === 'object' && G.Input && typeof G.Input.tap === 'function') {
        if (G.Input.tap('space') || G.Input.tap('Space') || G.Input.tap(' ')) {
          this.trigger();
        }
      }
    }

    if (!this.isActive) return;

    // Enquanto a Cutscene Cinematográfica estiver ativa (2.8s) ou finalizando neste frame, preserva os 10.0s inteiros!
    // A drenagem da barra e os 10 segundos de chuva de poderes começam após a cutscene sumir.
    if (wasCutsceneActive || MegaCutscene.active) {
      this.timeLeft = this.duration;
      this.gauge = this.maxGauge;
      if (pl) {
        pl.megaDmgMul = 2.0;
        pl.dmgTakenMul = 0.15;
        pl.magnetMul = 2.0;
        if (pl.megaMode) {
          pl.megaMode.active = true;
          pl.megaMode.timer = this.duration;
          pl.megaMode.element = this.currentElement;
        }
      }
      return;
    }

    this.timeLeft -= dt;
    // Drenagem linear contínua da barra como cronômetro visual de 100% a 0%
    this.gauge = Math.max(0, (this.timeLeft / this.duration) * this.maxGauge);

    // Mantém bônus de dano 2x, defensivo e de ímã durante todo o Overdrive
    if (pl) {
      pl.megaDmgMul = 2.0;
      pl.dmgTakenMul = 0.15;
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
        pl.megaDmgMul = 1.0;
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
  G.MegaCutscene = MegaCutscene;
}
if (typeof window !== 'undefined') {
  window.MegaSystem = MegaSystem;
  window.MegaCutscene = MegaCutscene;
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
  module.exports = { MegaSystem, MegaCutscene };
}
