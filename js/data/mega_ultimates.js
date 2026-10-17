/* ============ mega_ultimates.js — Catálogo dos 18 Tipos Elementais de Overdrive (10s) ============
 * Mapeia estritamente os 18 tipos elementais de Pokémon com seus geradores de calamidades climáticas.
 */

window.G = window.G || {};

const MEGA_ULTIMATES_DATA = {
  // 1. FOGO — Chuva de Meteoros
  fire: {
    id: 'fire',
    name: 'Chuva de Meteoros',
    interval: 0.25,
    color: '#f97316',
    accent: '#ef4444',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const targetX = player.x + (Math.random() - 0.5) * 480;
      const targetY = player.y + (Math.random() - 0.5) * 360;

      // Meteoro caindo na diagonal
      vfx.addHazard({
        type: 'meteor',
        x: targetX,
        y: targetY,
        radius: 85,
        life: 0.35,
        dmg: 45,
        color: 'rgba(239, 68, 68, 0.45)',
        accent: '#f97316',
        onExpire(h) {
          // Deixa poça de lava ardente por 1.5s
          vfx.addHazard({
            type: 'lava_pool',
            x: h.x,
            y: h.y,
            radius: 50,
            life: 1.5,
            dmg: 18,
            color: 'rgba(249, 115, 22, 0.4)',
            accent: '#ea580c'
          });
          if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('hit', { kind: 'fire' });
        }
      });
    }
  },

  // 2. ÁGUA — Maelstrom & Gêiseres
  water: {
    id: 'water',
    name: 'Maelstrom & Gêiseres',
    interval: 0.30,
    color: '#0ea5e9',
    accent: '#0284c7',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Desacelera inimigos próximos em 40%
      if (typeof G === 'object' && G.EnemyMgr && typeof G.EnemyMgr.all === 'function') {
        const enemies = G.EnemyMgr.all();
        for (const e of enemies) {
          if (e && !e.dead) e.slowT = Math.max(e.slowT || 0, 0.6);
        }
      }

      // 2 Gêiseres brotam do chão
      for (let i = 0; i < 2; i++) {
        const gx = player.x + (Math.random() - 0.5) * 400;
        const gy = player.y + (Math.random() - 0.5) * 320;
        vfx.addHazard({
          type: 'geyser',
          x: gx,
          y: gy,
          radius: 65,
          life: 0.6,
          dmg: 38,
          color: 'rgba(14, 165, 233, 0.5)',
          accent: '#38bdf8'
        });
      }
    }
  },

  // 3. PLANTA — Fúria da Natureza
  grass: {
    id: 'grass',
    name: 'Fúria da Natureza',
    interval: 0.30,
    color: '#22c55e',
    accent: '#16a34a',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const enemies = (typeof G === 'object' && G.EnemyMgr) ? G.EnemyMgr.all().filter(e => !e.dead) : [];
      const target = enemies.length ? enemies[Math.floor(Math.random() * enemies.length)] : null;
      const tx = target ? target.x : player.x + (Math.random() - 0.5) * 200;
      const ty = target ? target.y : player.y + (Math.random() - 0.5) * 200;

      vfx.addHazard({
        type: 'thorn_vines',
        x: tx,
        y: ty,
        radius: 70,
        life: 0.7,
        dmg: 35,
        color: 'rgba(34, 197, 94, 0.45)',
        accent: '#15803d',
        onTick(h, dt, pl) {
          // Converte 15% do dano em cura direta de HP para o Treinador
          if (pl && typeof pl.heal === 'function') {
            pl.heal(h.dmg * 0.15 * dt * 2);
          }
        }
      });
    }
  },

  // 4. ELÉTRICO — Tempestade de Trovões
  electric: {
    id: 'electric',
    name: 'Tempestade de Trovões',
    interval: 0.25,
    color: '#eab308',
    accent: '#facc15',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const enemies = (typeof G === 'object' && G.EnemyMgr) ? G.EnemyMgr.all().filter(e => !e.dead) : [];
      const target = enemies.length ? enemies[Math.floor(Math.random() * enemies.length)] : null;
      const lx = target ? target.x : player.x + (Math.random() - 0.5) * 350;
      const ly = target ? target.y : player.y + (Math.random() - 0.5) * 250;

      vfx.addHazard({
        type: 'lightning_strike',
        x: lx,
        y: ly,
        radius: 55,
        life: 0.35,
        dmg: 48,
        color: 'rgba(250, 204, 21, 0.55)',
        accent: '#60a5fa',
        onTick(h) {
          if (target && !target.dead) target.stunT = Math.max(target.stunT || 0, 0.6);
        }
      });
    }
  },

  // 5. GELO — Nevasca Zero Absoluto
  ice: {
    id: 'ice',
    name: 'Nevasca Zero Absoluto',
    interval: 0.25,
    color: '#38bdf8',
    accent: '#7dd3fc',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const ix = player.x + (Math.random() - 0.5) * 440;
      const iy = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'icicle_spear',
        x: ix,
        y: iy,
        radius: 60,
        life: 1.0,
        dmg: 40,
        color: 'rgba(56, 189, 248, 0.5)',
        accent: '#e0f2fe',
        onTick(h) {
          // Congela inimigos por 1.5s
          if (typeof G === 'object' && G.EnemyMgr) {
            const rad2 = h.radius * h.radius;
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && (e.x - h.x) ** 2 + (e.y - h.y) ** 2 <= rad2) {
                e.frozenT = 1.5;
              }
            }
          }
        }
      });
    }
  },

  // 6. LUTADOR — Impacto Sísmico de Punhos
  fighting: {
    id: 'fighting',
    name: 'Impacto Sísmico de Punhos',
    interval: 0.30,
    color: '#b91c1c',
    accent: '#ef4444',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      vfx.addHazard({
        type: 'sonic_fist',
        x: player.x + (Math.random() - 0.5) * 160,
        y: player.y + (Math.random() - 0.5) * 160,
        radius: 110,
        life: 0.45,
        dmg: 52, // Dano físico puro
        color: 'rgba(185, 28, 28, 0.45)',
        accent: '#fca5a5',
        onTick(h) {
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) <= h.radius) {
                // Empurra violentamente
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(angle) * 35;
                e.y += Math.sin(angle) * 35;
              }
            }
          }
        }
      });
    }
  },

  // 7. VENENO — Chuva de Miasma Ácido
  poison: {
    id: 'poison',
    name: 'Chuva de Miasma Ácido',
    interval: 0.28,
    color: '#a855f7',
    accent: '#9333ea',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const px = player.x + (Math.random() - 0.5) * 450;
      const py = player.y + (Math.random() - 0.5) * 340;

      vfx.addHazard({
        type: 'acid_puddle',
        x: px,
        y: py,
        radius: 65,
        life: 1.8,
        dmg: 22,
        color: 'rgba(147, 51, 234, 0.4)',
        accent: '#c084fc'
      });
    }
  },

  // 8. TERRESTRE — Fissura Tectônica
  ground: {
    id: 'ground',
    name: 'Fissura Tectônica',
    interval: 0.30,
    color: '#d97706',
    accent: '#b45309',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const fx = player.x + (Math.random() - 0.5) * 300;
      const fy = player.y + (Math.random() - 0.5) * 260;

      vfx.addHazard({
        type: 'fissure',
        x: fx,
        y: fy,
        radius: 95,
        life: 0.8,
        dmg: 48,
        color: 'rgba(180, 83, 9, 0.5)',
        accent: '#fde68a'
      });
    }
  },

  // 9. VOADOR — Tufão Tempestuoso
  flying: {
    id: 'flying',
    name: 'Tufão Tempestuoso',
    interval: 0.30,
    color: '#818cf8',
    accent: '#6366f1',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const t = performance.now() / 350;
      const tx = player.x + Math.cos(t) * 90;
      const ty = player.y + Math.sin(t) * 90;

      vfx.addHazard({
        type: 'tornado',
        x: tx,
        y: ty,
        radius: 65,
        life: 0.5,
        dmg: 36,
        color: 'rgba(99, 102, 241, 0.45)',
        accent: '#c7d2fe'
      });
    }
  },

  // 10. PSÍQUICO — Fenda Dimensional
  psychic: {
    id: 'psychic',
    name: 'Fenda Dimensional',
    interval: 0.30,
    color: '#ec4899',
    accent: '#d946ef',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const rx = player.x + (Math.random() - 0.5) * 360;
      const ry = player.y + (Math.random() - 0.5) * 280;

      vfx.addHazard({
        type: 'gravity_rift',
        x: rx,
        y: ry,
        radius: 120,
        life: 0.8,
        dmg: 50,
        color: 'rgba(217, 70, 239, 0.4)',
        accent: '#f472b6',
        onTick(h) {
          // Atrai monstros próximos com gravidade irresistível
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) <= h.radius) {
                e.x += (h.x - e.x) * 0.08;
                e.y += (h.y - e.y) * 0.08;
              }
            }
          }
        }
      });
    }
  },

  // 11. INSETO — Enxame Predatório Voraz
  bug: {
    id: 'bug',
    name: 'Enxame Predatório Voraz',
    interval: 0.25,
    color: '#84cc16',
    accent: '#65a30d',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const t = performance.now() / 200;
      const bx = player.x + Math.cos(t) * 110;
      const by = player.y + Math.sin(t) * 110;

      vfx.addHazard({
        type: 'swarm',
        x: bx,
        y: by,
        radius: 50,
        life: 0.4,
        dmg: 28,
        color: 'rgba(132, 204, 22, 0.5)',
        accent: '#bef264'
      });
    }
  },

  // 12. PEDRA — Desabamento Colossal
  rock: {
    id: 'rock',
    name: 'Desabamento Colossal',
    interval: 0.35,
    color: '#78716c',
    accent: '#57534e',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const rx = player.x + (Math.random() - 0.5) * 420;
      const ry = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'megalith',
        x: rx,
        y: ry,
        radius: 80,
        life: 0.5,
        dmg: 55, // 100% Crítico
        color: 'rgba(87, 83, 78, 0.6)',
        accent: '#d6d3d1'
      });
    }
  },

  // 13. FANTASMA — Procissão Abissal de Almas
  ghost: {
    id: 'ghost',
    name: 'Procissão Abissal de Almas',
    interval: 0.30,
    color: '#7c3aed',
    accent: '#6d28d9',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const gx = player.x + (Math.random() - 0.5) * 380;
      const gy = player.y + (Math.random() - 0.5) * 300;

      vfx.addHazard({
        type: 'soul_grasp',
        x: gx,
        y: gy,
        radius: 75,
        life: 0.9,
        dmg: 36,
        color: 'rgba(109, 40, 217, 0.45)',
        accent: '#ddd6fe',
        onTick(h) {
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) <= h.radius) {
                // Pânico: foge na direção oposta
                const angle = Math.atan2(e.y - h.y, e.x - h.x);
                e.x += Math.cos(angle) * 15;
                e.y += Math.sin(angle) * 15;
              }
            }
          }
        }
      });
    }
  },

  // 14. DRAGÃO — Julgamento Dracônico
  dragon: {
    id: 'dragon',
    name: 'Julgamento Dracônico',
    interval: 0.30,
    color: '#4338ca',
    accent: '#6366f1',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Feixe celeste gigante transversal que corta a tela
      const angle = (Math.random() - 0.5) * Math.PI;
      for (let d = -300; d <= 300; d += 60) {
        vfx.addHazard({
          type: 'dragon_beam',
          x: player.x + Math.cos(angle) * d,
          y: player.y + Math.sin(angle) * d,
          radius: 65,
          life: 0.5,
          dmg: 65, // Maior multiplicador
          color: 'rgba(67, 56, 202, 0.55)',
          accent: '#e0e7ff'
        });
      }
    }
  },

  // 15. AÇO — Cocheira de Lâminas
  steel: {
    id: 'steel',
    name: 'Cocheira de Lâminas',
    interval: 0.25,
    color: '#94a3b8',
    accent: '#cbd5e1',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const sx = player.x + (Math.random() - 0.5) * 440;
      const sy = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'steel_blade',
        x: sx,
        y: sy,
        radius: 50,
        life: 0.6,
        dmg: 42,
        color: 'rgba(148, 163, 184, 0.55)',
        accent: '#f8fafc'
      });
    }
  },

  // 16. SOMBRIO — Eclipse Voraz
  dark: {
    id: 'dark',
    name: 'Eclipse Voraz',
    interval: 0.35,
    color: '#1e293b',
    accent: '#0f172a',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Executa monstros com < 35% de vida
      if (typeof G === 'object' && G.EnemyMgr) {
        for (const e of G.EnemyMgr.all()) {
          if (e && !e.dead && !e.boss && !e.legend) {
            const pct = (e.hp || 0) / (e.maxHp || 100);
            if (pct < 0.35 && Math.hypot(e.x - player.x, e.y - player.y) < 320) {
              if (typeof e.hit === 'function') e.hit(9999);
            }
          }
        }
      }

      vfx.addHazard({
        type: 'shadow_slash',
        x: player.x + (Math.random() - 0.5) * 350,
        y: player.y + (Math.random() - 0.5) * 260,
        radius: 85,
        life: 0.4,
        dmg: 46,
        color: 'rgba(15, 23, 42, 0.6)',
        accent: '#475569'
      });
    }
  },

  // 17. FADA — Supernova Prismática
  fairy: {
    id: 'fairy',
    name: 'Supernova Prismática',
    interval: 0.30,
    color: '#f472b6',
    accent: '#fbcfe8',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Cura o Treinador periodicamente
      if (typeof player.heal === 'function') {
        player.heal(player.maxHp * 0.025);
      }

      const fx = player.x + (Math.random() - 0.5) * 400;
      const fy = player.y + (Math.random() - 0.5) * 300;

      vfx.addHazard({
        type: 'prismatic_star',
        x: fx,
        y: fy,
        radius: 70,
        life: 0.6,
        dmg: 38,
        color: 'rgba(244, 114, 182, 0.5)',
        accent: '#fdf2f8'
      });
    }
  },

  // 18. NORMAL — Pulso Hipercinético
  normal: {
    id: 'normal',
    name: 'Pulso Hipercinético',
    interval: 0.30,
    color: '#e2e8f0',
    accent: '#ffffff',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Onda de 360 graus que se expande
      vfx.addHazard({
        type: 'hyper_pulse',
        x: player.x,
        y: player.y,
        radius: 140,
        life: 0.55,
        dmg: 50, // Dano verdadeiro universal
        color: 'rgba(241, 245, 249, 0.45)',
        accent: '#ffffff'
      });
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('hit');
    }
  }
};

if (typeof G === 'object') {
  G.MEGA_ULTIMATES_DATA = MEGA_ULTIMATES_DATA;
}
if (typeof window !== 'undefined') {
  window.MEGA_ULTIMATES_DATA = MEGA_ULTIMATES_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MEGA_ULTIMATES_DATA;
}
