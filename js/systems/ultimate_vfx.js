/* ============ ultimate_vfx.js — Gerenciador de Efeitos Visuais & Partículas do Mega (60 FPS) ============
 * Implementa pooling de efeitos e partículas para as 18 Calamidades Elementais de Overdrive.
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
      radius: h.radius || 30,
      maxRadius: h.maxRadius || h.radius || 30,
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

    // 2. Atualiza perigos/calamidades em campo
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.life -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.tickCd -= dt;

      if (typeof h.onTick === 'function') {
        h.onTick(h, dt, pl);
      }

      // Aplica dano em área contra inimigos
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
    const cx = (camera && camera.x) ? camera.x : 0;
    const cy = (camera && camera.y) ? camera.y : 0;

    // Renderiza Hazards
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      const alpha = Math.max(0, Math.min(1, h.life / (h.maxLife * 0.3)));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (typeof h.customDraw === 'function') {
        h.customDraw(ctx, h, cx, cy);
      } else {
        // Render padrão de impacto circular
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fillStyle = h.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = h.accent;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Renderiza Partículas
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
    get count() { return hazards.length; }
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
