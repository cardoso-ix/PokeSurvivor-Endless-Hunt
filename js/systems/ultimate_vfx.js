/* ============ ultimate_vfx.js — Gerenciador de Efeitos Visuais & Partículas do Mega (60 FPS) ============
 * Implementa renderizadores dedicados a 60 FPS para os 18 Poderes Supremos Elementais.
 */

window.G = window.G || {};

const UltimateVFX = (() => {
  const hazards = [];
  const particles = [];
  const MAX_HAZARDS = 120;
  const MAX_PARTICLES = 250;

  function clear() {
    hazards.length = 0;
    particles.length = 0;
  }

  function addHazard(h) {
    if (hazards.length >= MAX_HAZARDS) hazards.shift();
    hazards.push({
      type: h.type || 'generic',
      x: h.x || 0,
      y: h.y || 0,
      vx: h.vx || 0,
      vy: h.vy || 0,
      radius: h.radius || 35,
      maxRadius: h.maxRadius || h.radius || 35,
      life: h.life || 1.0,
      maxLife: h.life || 1.0,
      dmg: h.dmg || 20,
      color: h.color || '#ffffff',
      accent: h.accent || '#ffd700',
      tickCd: 0,
      onTick: h.onTick || null,
      onExpire: h.onExpire || null,
      customDraw: h.customDraw || null,
      extra: h.extra || {}
    });
  }

  function addParticle(p) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push({
      x: p.x || 0,
      y: p.y || 0,
      vx: p.vx || 0,
      vy: p.vy || 0,
      size: p.size || 3,
      life: p.life || 0.6,
      maxLife: p.life || 0.6,
      color: p.color || '#ffffff',
      shape: p.shape || 'circle'
    });
  }

  function update(dt, pl) {
    // 1. Atualiza partículas rápidas
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // 2. Atualiza calamidades e perigos em campo
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.life -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.tickCd -= dt;

      if (typeof h.onTick === 'function') {
        h.onTick(h, dt, pl);
      }

      // Aplica dano contínuo em área
      if (h.dmg > 0 && h.tickCd <= 0 && typeof G === 'object' && G.EnemyMgr && typeof G.EnemyMgr.all === 'function') {
        h.tickCd = 0.15; // Intervalo de dano
        const rad2 = h.radius * h.radius;
        const enemies = G.EnemyMgr.all();
        for (const e of enemies) {
          if (!e || e.dead) continue;
          const dx = e.x - h.x;
          const dy = e.y - h.y;
          if (dx * dx + dy * dy <= rad2) {
            if (typeof e.hit === 'function') {
              e.hit(h.dmg);
            } else if (typeof e.takeDamage === 'function') {
              e.takeDamage(h.dmg);
            }
            if (typeof G.FX === 'object' && G.FX.dmgText) {
              G.FX.dmgText(e.x, e.y - 12, Math.round(h.dmg), h.color, false);
            }
          }
        }
      }

      if (h.life <= 0) {
        if (typeof h.onExpire === 'function') h.onExpire(h);
        hazards.splice(i, 1);
      }
    }
  }

  function draw(ctx, camera) {
    if (!ctx) return;
    const now = performance.now();

    // 1. Renderiza Hazards com efeitos temáticos especializados
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      const prog = Math.max(0, Math.min(1, h.life / h.maxLife));
      const alpha = Math.max(0, Math.min(1, h.life / (h.maxLife * 0.35)));

      ctx.save();
      ctx.globalAlpha = alpha;

      if (typeof h.customDraw === 'function') {
        h.customDraw(ctx, h, camera);
      } else {
        switch (h.type) {
          case 'meteor': {
            // Rastro diagonal de fogo
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(h.x - 70, h.y - 110);
            ctx.lineTo(h.x, h.y);
            ctx.stroke();
            // Núcleo do meteoro
            ctx.fillStyle = '#ffedd5';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 14, 0, Math.PI * 2);
            ctx.fill();
            // Aura de impacto no solo
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y + 4, h.radius * (1 - prog * 0.4), h.radius * 0.5 * (1 - prog * 0.4), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'lava_pool': {
            ctx.save();
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, h.radius, h.radius * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Bolhas de lava
            const bubbleAng = (now / 200);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(h.x + Math.cos(bubbleAng) * (h.radius * 0.5), h.y + Math.sin(bubbleAng) * (h.radius * 0.25), 4, 4);
            ctx.restore();
            break;
          }

          case 'geyser': {
            ctx.save();
            // Coluna de água ascendente
            const hHeight = 80 * (1 - prog * 0.3);
            ctx.fillStyle = h.color;
            ctx.fillRect(h.x - 12, h.y - hHeight, 24, hHeight);
            // Espuma superior
            ctx.fillStyle = h.accent;
            ctx.beginPath();
            ctx.arc(h.x, h.y - hHeight, 18, 0, Math.PI * 2);
            ctx.fill();
            // Base concêntrica
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, h.radius * 0.8, h.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'thorn_vines': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            // Espinhos que brotam do solo
            const spikes = 6;
            for (let s = 0; s < spikes; s++) {
              const a = (s / spikes) * Math.PI * 2 + (now / 300);
              const rx = Math.cos(a) * h.radius;
              const ry = Math.sin(a) * (h.radius * 0.6);
              ctx.fillStyle = h.color;
              ctx.fillRect(h.x + rx - 2, h.y + ry - 2, 5, 5);
            }
            ctx.restore();
            break;
          }

          case 'lightning_strike': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(h.x + (Math.sin(now / 50) * 12), h.y - 160);
            ctx.lineTo(h.x - 8, h.y - 80);
            ctx.lineTo(h.x + 8, h.y - 40);
            ctx.lineTo(h.x, h.y);
            ctx.stroke();
            // Ponto de impacto no solo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'blizzard_shard': {
            ctx.save();
            ctx.fillStyle = h.accent;
            // Estalactite pontiaguda caindo
            ctx.beginPath();
            ctx.moveTo(h.x, h.y + 4);
            ctx.lineTo(h.x - 8, h.y - 32);
            ctx.lineTo(h.x + 8, h.y - 32);
            ctx.closePath();
            ctx.fill();
            // Anel gélido
            ctx.strokeStyle = h.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y + 2, h.radius * 0.7, h.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'sonic_fist': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3;
            const rCur = h.radius * (1 - prog * 0.5);
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, rCur, rCur * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.arc(h.x, h.y - 8, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'toxic_pool': {
            ctx.save();
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, h.radius, h.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Bolhas tóxicas
            ctx.fillStyle = '#d8b4fe';
            ctx.fillRect(h.x - 6, h.y - 4, 4, 4);
            ctx.fillRect(h.x + 8, h.y + 2, 3, 3);
            ctx.restore();
            break;
          }

          case 'tectonic_fissure': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(h.x - h.radius * 0.8, h.y - 6);
            ctx.lineTo(h.x - 20, h.y + 10);
            ctx.lineTo(h.x + 10, h.y - 8);
            ctx.lineTo(h.x + h.radius * 0.8, h.y + 4);
            ctx.stroke();
            ctx.fillStyle = h.color;
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'falling_megalith': {
            ctx.save();
            ctx.fillStyle = h.accent;
            // Rocha angular
            ctx.beginPath();
            ctx.moveTo(h.x, h.y);
            ctx.lineTo(h.x - 16, h.y - 28);
            ctx.lineTo(h.x + 14, h.y - 32);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#451a03';
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'typhoon_vortex': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 2.5;
            const vAng = (now / 120);
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * 0.8, vAng, vAng + 3.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * 0.45, vAng + Math.PI, vAng + Math.PI + 3.2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'gravity_rift': {
            ctx.save();
            ctx.fillStyle = h.accent;
            ctx.beginPath();
            ctx.arc(h.x, h.y, 14 + Math.sin(now / 90) * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = h.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, h.radius * 0.9, h.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'spectral_hand': {
            ctx.save();
            ctx.fillStyle = h.accent;
            // Três dedos espectrais
            ctx.fillRect(h.x - 8, h.y - 24, 4, 22);
            ctx.fillRect(h.x - 1, h.y - 30, 4, 28);
            ctx.fillRect(h.x + 6, h.y - 22, 4, 20);
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, h.radius * 0.6, h.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'predatory_swarm': {
            ctx.save();
            ctx.fillStyle = h.accent;
            for (let b = 0; b < 4; b++) {
              const a = (b / 4) * Math.PI * 2 + (now / 140);
              const bx = h.x + Math.cos(a) * (h.radius * 0.6);
              const by = h.y + Math.sin(a) * (h.radius * 0.6);
              ctx.fillRect(bx - 2, by - 2, 4, 4);
            }
            ctx.restore();
            break;
          }

          case 'dragon_beam': {
            ctx.save();
            const bAngle = (h.extra && h.extra.angle) ? h.extra.angle : 0.785;
            ctx.translate(h.x, h.y);
            ctx.rotate(bAngle);
            ctx.fillStyle = h.color;
            ctx.fillRect(-180, -18, 360, 36);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-180, -6, 360, 12);
            ctx.restore();
            break;
          }

          case 'steel_blade': {
            ctx.save();
            ctx.fillStyle = h.accent;
            // Espada fincada
            ctx.fillRect(h.x - 3, h.y - 36, 6, 32);
            ctx.fillStyle = '#475569';
            ctx.fillRect(h.x - 9, h.y - 36, 18, 4);
            ctx.restore();
            break;
          }

          case 'shadow_slash': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * 0.75, 0.4, 2.6);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'prismatic_star': {
            ctx.save();
            ctx.fillStyle = h.accent;
            const pSize = 10;
            ctx.fillRect(h.x - pSize / 2, h.y - pSize / 2, pSize, pSize);
            ctx.fillRect(h.x - pSize, h.y - 1, pSize * 2, 2);
            ctx.fillRect(h.x - 1, h.y - pSize, 2, pSize * 2);
            ctx.strokeStyle = h.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'hyper_pulse': {
            ctx.save();
            ctx.strokeStyle = h.accent;
            ctx.lineWidth = 3;
            const r1 = h.radius * (1 - prog * 0.3);
            ctx.beginPath();
            ctx.arc(h.x, h.y, r1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = h.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(h.x, h.y, r1 * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          default: {
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.fillStyle = h.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = h.accent;
            ctx.stroke();
            break;
          }
        }
      }

      ctx.restore();
    }

    // 2. Renderiza Partículas soltas
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
      ctx.restore();
    }
  }

  return {
    clear,
    addHazard,
    addParticle,
    update,
    draw,
    get count() { return hazards.length; },
    get hazards() { return hazards; },
    get particles() { return particles; }
  };
})();

if (typeof G === 'object') {
  G.UltimateVFX = UltimateVFX;
}
if (typeof window !== 'undefined') {
  window.UltimateVFX = UltimateVFX;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UltimateVFX;
}
