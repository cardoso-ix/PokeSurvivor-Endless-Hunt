/* ============ mega_ultimates.js — Catálogo dos 18 Poderes Supremos Elementais ============
 * Mapeia estritamente os 18 tipos elementais de Pokémon com seus geradores de
 * calamidades visuais e perigos contínuos no Canvas (0.2s - 0.35s).
 */

if (typeof window !== 'undefined') {
  window.G = window.G || {};
}

const ELEMENT_PALETTES = {
  fire:     { color: '#f97316', accent: '#ef4444', aura: '#ea580c', particle: '#ffedd5', glow: 'rgba(249, 115, 22, 0.4)' },
  water:    { color: '#0ea5e9', accent: '#0284c7', aura: '#38bdf8', particle: '#e0f2fe', glow: 'rgba(14, 165, 233, 0.4)' },
  grass:    { color: '#22c55e', accent: '#16a34a', aura: '#4ade80', particle: '#dcfce7', glow: 'rgba(34, 197, 94, 0.4)' },
  electric: { color: '#eab308', accent: '#facc15', aura: '#fde047', particle: '#fef9c3', glow: 'rgba(234, 179, 8, 0.45)' },
  ice:      { color: '#38bdf8', accent: '#a5f3fc', aura: '#7dd3fc', particle: '#f0fdfa', glow: 'rgba(56, 189, 248, 0.4)' },
  fighting: { color: '#dc2626', accent: '#b91c1c', aura: '#f87171', particle: '#fee2e2', glow: 'rgba(220, 38, 38, 0.45)' },
  poison:   { color: '#a855f7', accent: '#9333ea', aura: '#c084fc', particle: '#f3e8ff', glow: 'rgba(168, 85, 247, 0.4)' },
  ground:   { color: '#d97706', accent: '#b45309', aura: '#fbbf24', particle: '#fef3c7', glow: 'rgba(217, 119, 6, 0.45)' },
  rock:     { color: '#b45309', accent: '#78350f', aura: '#d97706', particle: '#ffedd5', glow: 'rgba(180, 83, 9, 0.45)' },
  flying:   { color: '#60a5fa', accent: '#3b82f6', aura: '#93c5fd', particle: '#eff6ff', glow: 'rgba(96, 165, 250, 0.4)' },
  psychic:  { color: '#ec4899', accent: '#db2777', aura: '#f472b6', particle: '#fdf2f8', glow: 'rgba(236, 72, 153, 0.45)' },
  ghost:    { color: '#7c3aed', accent: '#6d28d9', aura: '#8b5cf6', particle: '#ede9fe', glow: 'rgba(124, 58, 237, 0.45)' },
  bug:      { color: '#84cc16', accent: '#65a30d', aura: '#a3e635', particle: '#ecfccb', glow: 'rgba(132, 204, 22, 0.4)' },
  dragon:   { color: '#6366f1', accent: '#4f46e5', aura: '#818cf8', particle: '#e0e7ff', glow: 'rgba(99, 102, 241, 0.45)' },
  steel:    { color: '#94a3b8', accent: '#64748b', aura: '#cbd5e1', particle: '#f8fafc', glow: 'rgba(148, 163, 184, 0.45)' },
  dark:     { color: '#1e293b', accent: '#0f172a', aura: '#475569', particle: '#334155', glow: 'rgba(15, 23, 42, 0.55)' },
  fairy:    { color: '#f472b6', accent: '#ec4899', aura: '#fbcfe8', particle: '#fff1f2', glow: 'rgba(244, 114, 182, 0.45)' },
  normal:   { color: '#e2e8f0', accent: '#94a3b8', aura: '#ffffff', particle: '#ffffff', glow: 'rgba(226, 232, 240, 0.45)' }
};

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

      const targetX = player.x + (Math.random() - 0.5) * 500;
      const targetY = player.y + (Math.random() - 0.5) * 380;

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
            radius: 52,
            life: 1.5,
            dmg: 18,
            color: 'rgba(249, 115, 22, 0.4)',
            accent: '#ea580c'
          });
          if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('hit', { kind: 'fire' });
          if (typeof G === 'object' && G.FX && G.FX.burst) G.FX.burst(h.x, h.y, '#f97316', 14, 90);
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 2. ÁGUA — Gêiseres & Maelstrom
  water: {
    id: 'water',
    name: 'Gêiseres & Maelstrom',
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

      // Gêiseres brotam do solo em posições aleatórias
      for (let i = 0; i < 2; i++) {
        const gx = player.x + (Math.random() - 0.5) * 440;
        const gy = player.y + (Math.random() - 0.5) * 340;
        vfx.addHazard({
          type: 'geyser',
          x: gx,
          y: gy,
          radius: 65,
          life: 0.6,
          dmg: 38,
          color: 'rgba(14, 165, 233, 0.5)',
          accent: '#38bdf8',
          onTick(h) {
            // Arremessa monstros próximos para o ar
            if (typeof G === 'object' && G.EnemyMgr) {
              for (const e of G.EnemyMgr.all()) {
                if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                  e.y -= 1.8;
                }
              }
            }
          }
        });
      }
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 3. PLANTA — Fúria da Natureza (Raízes & Vinhas)
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
      const tx = target ? target.x : player.x + (Math.random() - 0.5) * 260;
      const ty = target ? target.y : player.y + (Math.random() - 0.5) * 260;

      vfx.addHazard({
        type: 'thorn_vines',
        x: tx,
        y: ty,
        radius: 72,
        life: 0.7,
        dmg: 36,
        color: 'rgba(34, 197, 94, 0.45)',
        accent: '#15803d',
        onTick(h, dt, pl) {
          // Converte dano em cura direta para o Treinador
          if (pl && typeof pl.heal === 'function') {
            pl.heal(h.dmg * 0.15 * dt * 2);
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
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
      const lx = target ? target.x : player.x + (Math.random() - 0.5) * 380;
      const ly = target ? target.y : player.y + (Math.random() - 0.5) * 280;

      vfx.addHazard({
        type: 'lightning_strike',
        x: lx,
        y: ly,
        radius: 60,
        life: 0.35,
        dmg: 50,
        color: 'rgba(250, 204, 21, 0.55)',
        accent: '#60a5fa',
        onExpire(h) {
          // Ricochete em arco para inimigos próximos
          if (typeof G === 'object' && G.EnemyMgr) {
            const nearby = G.EnemyMgr.all().filter(e => !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < 130);
            for (let i = 0; i < Math.min(3, nearby.length); i++) {
              nearby[i].hit && nearby[i].hit(25);
            }
          }
          if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('judge');
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 5. GELO — Nevasca Glacial & Estalactites
  ice: {
    id: 'ice',
    name: 'Nevasca Glacial',
    interval: 0.30,
    color: '#38bdf8',
    accent: '#a5f3fc',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const targetX = player.x + (Math.random() - 0.5) * 440;
      const targetY = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'blizzard_shard',
        x: targetX,
        y: targetY,
        radius: 65,
        life: 0.5,
        dmg: 34,
        color: 'rgba(56, 189, 248, 0.45)',
        accent: '#e0f2fe',
        onExpire(h) {
          // Congela inimigos no impacto
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.freezeT = Math.max(e.freezeT || 0, 1.2);
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 6. LUTADOR — Impacto Sônico Titânico
  fighting: {
    id: 'fighting',
    name: 'Impacto Sônico Titânico',
    interval: 0.30,
    color: '#dc2626',
    accent: '#b91c1c',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 120;
      const sx = player.x + Math.cos(angle) * dist;
      const sy = player.y + Math.sin(angle) * dist;

      vfx.addHazard({
        type: 'sonic_fist',
        x: sx,
        y: sy,
        radius: 80,
        life: 0.4,
        dmg: 46,
        color: 'rgba(220, 38, 38, 0.5)',
        accent: '#f87171',
        onTick(h) {
          // Knockback massivo para afastar monstros do Treinador
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead) {
                const d = Math.hypot(e.x - h.x, e.y - h.y);
                if (d < h.radius && d > 0) {
                  e.x += ((e.x - h.x) / d) * 35;
                  e.y += ((e.y - h.y) / d) * 35;
                }
              }
            }
          }
        }
      });
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('hit', { kind: 'melee' });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 7. VENENO — Dilúvio Tóxico (Chuva Ácida)
  poison: {
    id: 'poison',
    name: 'Dilúvio Tóxico',
    interval: 0.25,
    color: '#a855f7',
    accent: '#9333ea',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const px = player.x + (Math.random() - 0.5) * 450;
      const py = player.y + (Math.random() - 0.5) * 350;

      vfx.addHazard({
        type: 'toxic_pool',
        x: px,
        y: py,
        radius: 65,
        life: 1.8,
        dmg: 20,
        color: 'rgba(168, 85, 247, 0.45)',
        accent: '#c084fc',
        onTick(h) {
          // Derrete defesas e envenena alvos na poça
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.poisonT = Math.max(e.poisonT || 0, 1.4);
                e.defDebuff = 0.5; // -50% defesa
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 8. TERRA — Fissura Tectônica
  ground: {
    id: 'ground',
    name: 'Fissura Tectônica',
    interval: 0.35,
    color: '#d97706',
    accent: '#b45309',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const fx = player.x + (Math.random() - 0.5) * 350;
      const fy = player.y + (Math.random() - 0.5) * 260;

      vfx.addHazard({
        type: 'tectonic_fissure',
        x: fx,
        y: fy,
        radius: 95,
        life: 0.8,
        dmg: 48,
        color: 'rgba(217, 119, 6, 0.5)',
        accent: '#fbbf24',
        onTick(h) {
          // Engole e esmaga alvos terrestres
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && !e.flying && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.slowT = Math.max(e.slowT || 0, 0.7);
                if (typeof e.hit === 'function') e.hit(8);
              }
            }
          }
        }
      });
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('quake');
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 9. PEDRA — Avalanche de Megálitos
  rock: {
    id: 'rock',
    name: 'Avalanche de Megálitos',
    interval: 0.30,
    color: '#b45309',
    accent: '#78350f',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const rx = player.x + (Math.random() - 0.5) * 420;
      const ry = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'falling_megalith',
        x: rx,
        y: ry,
        radius: 75,
        life: 0.45,
        dmg: 52,
        color: 'rgba(180, 83, 9, 0.55)',
        accent: '#d97706',
        onExpire(h) {
          // Atordoa monstros no raio
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.stunT = Math.max(e.stunT || 0, 0.9);
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 10. VOADOR — Ciclone Tempestuoso (Vórtices & Tufões)
  flying: {
    id: 'flying',
    name: 'Ciclone Tempestuoso',
    interval: 0.25,
    color: '#60a5fa',
    accent: '#3b82f6',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const vx = player.x + (Math.random() - 0.5) * 360;
      const vy = player.y + (Math.random() - 0.5) * 260;

      vfx.addHazard({
        type: 'typhoon_vortex',
        x: vx,
        y: vy,
        radius: 80,
        life: 1.0,
        dmg: 30,
        color: 'rgba(96, 165, 250, 0.45)',
        accent: '#bfdbfe',
        onTick(h) {
          // Vórtice atrai monstros para o centro e desfere lâminas de vento
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead) {
                const d = Math.hypot(e.x - h.x, e.y - h.y);
                if (d < h.radius && d > 4) {
                  e.x -= ((e.x - h.x) / d) * 12;
                  e.y -= ((e.y - h.y) / d) * 12;
                }
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 11. PSÍQUICO — Fenda Gravitacional & Pulsos Mentais
  psychic: {
    id: 'psychic',
    name: 'Fenda Gravitacional',
    interval: 0.30,
    color: '#ec4899',
    accent: '#db2777',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const px = player.x + (Math.random() - 0.5) * 400;
      const py = player.y + (Math.random() - 0.5) * 300;

      vfx.addHazard({
        type: 'gravity_rift',
        x: px,
        y: py,
        radius: 90,
        life: 0.7,
        dmg: 42,
        color: 'rgba(236, 72, 153, 0.5)',
        accent: '#f472b6',
        onTick(h) {
          // Atrai inimigos para o centro da fenda
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead) {
                const d = Math.hypot(e.x - h.x, e.y - h.y);
                if (d < h.radius && d > 4) {
                  e.x -= ((e.x - h.x) / d) * 14;
                  e.y -= ((e.y - h.y) / d) * 14;
                }
              }
            }
          }
        },
        onExpire(h) {
          // Detona em pulso mental no colapso
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius * 1.2) {
                e.hit && e.hit(30);
              }
            }
          }
          if (typeof G === 'object' && G.FX && G.FX.burst) G.FX.burst(h.x, h.y, '#ec4899', 18, 110);
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 12. FANTASMA — Julgamento Espectral (Mãos do Submundo)
  ghost: {
    id: 'ghost',
    name: 'Julgamento Espectral',
    interval: 0.30,
    color: '#7c3aed',
    accent: '#6d28d9',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const gx = player.x + (Math.random() - 0.5) * 420;
      const gy = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'spectral_hand',
        x: gx,
        y: gy,
        radius: 70,
        life: 0.65,
        dmg: 36,
        color: 'rgba(124, 58, 237, 0.45)',
        accent: '#a78bfa',
        onTick(h) {
          // Causa pânico e drena 3% da vida máxima dos monstros
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.panicT = Math.max(e.panicT || 0, 0.8);
                const pctDmg = (e.maxHp || 100) * 0.03;
                if (typeof e.hit === 'function') e.hit(pctDmg);
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 13. INSETO — Enxame Predatório Luminoso
  bug: {
    id: 'bug',
    name: 'Enxame Predatório',
    interval: 0.20,
    color: '#84cc16',
    accent: '#65a30d',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const angle = (performance.now() / 180) + Math.random() * 0.5;
      const dist = 50 + Math.random() * 90;
      const bx = player.x + Math.cos(angle) * dist;
      const gy = player.y + Math.sin(angle) * dist;

      vfx.addHazard({
        type: 'predatory_swarm',
        x: bx,
        y: gy,
        radius: 48,
        life: 0.45,
        dmg: 28,
        color: 'rgba(132, 204, 22, 0.5)',
        accent: '#d9f99d'
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 14. DRAGÃO — Cataclismo Dracônico (Feixes Celestiais)
  dragon: {
    id: 'dragon',
    name: 'Cataclismo Dracônico',
    interval: 0.35,
    color: '#6366f1',
    accent: '#4f46e5',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const angle = (Math.random() < 0.5 ? 0.785 : -0.785) + (Math.random() - 0.5) * 0.2;
      const dist = 180;
      const bx = player.x + (Math.random() - 0.5) * 200;
      const by = player.y + (Math.random() - 0.5) * 200;

      vfx.addHazard({
        type: 'dragon_beam',
        x: bx,
        y: by,
        radius: 90,
        life: 0.5,
        dmg: 65, // Alto multiplicador de dano dracônico
        color: 'rgba(99, 102, 241, 0.6)',
        accent: '#a5b4fc',
        extra: { angle }
      });
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('surge');
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 15. AÇO — Bastilha de Aço (Chuva de Lâminas)
  steel: {
    id: 'steel',
    name: 'Bastilha de Aço',
    interval: 0.25,
    color: '#94a3b8',
    accent: '#64748b',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      const sx = player.x + (Math.random() - 0.5) * 440;
      const sy = player.y + (Math.random() - 0.5) * 340;

      vfx.addHazard({
        type: 'steel_blade',
        x: sx,
        y: sy,
        radius: 55,
        life: 0.6,
        dmg: 44,
        color: 'rgba(148, 163, 184, 0.55)',
        accent: '#f8fafc'
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
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

      // Executa monstros enfraquecidos com < 35% de vida
      if (typeof G === 'object' && G.EnemyMgr) {
        for (const e of G.EnemyMgr.all()) {
          if (e && !e.dead && !e.boss && !e.legend) {
            const pct = (e.hp || 0) / (e.maxHp || 100);
            if (pct < 0.35 && Math.hypot(e.x - player.x, e.y - player.y) < 340) {
              if (typeof e.hit === 'function') e.hit(9999);
            }
          }
        }
      }

      vfx.addHazard({
        type: 'shadow_slash',
        x: player.x + (Math.random() - 0.5) * 360,
        y: player.y + (Math.random() - 0.5) * 270,
        radius: 85,
        life: 0.4,
        dmg: 48,
        color: 'rgba(15, 23, 42, 0.65)',
        accent: '#475569'
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  },

  // 17. FADA — Supernova Prismática
  fairy: {
    id: 'fairy',
    name: 'Supernova Prismática',
    interval: 0.30,
    color: '#f472b6',
    accent: '#ec4899',
    spawnHazard(player, camera) {
      if (!player) return;
      const vfx = window.UltimateVFX || (typeof G === 'object' && G.UltimateVFX);
      if (!vfx) return;

      // Regenera vida da equipe
      if (typeof player.heal === 'function') {
        player.heal(player.maxHp * 0.025);
      }

      const fx = player.x + (Math.random() - 0.5) * 440;
      const fy = player.y + (Math.random() - 0.5) * 320;

      vfx.addHazard({
        type: 'prismatic_star',
        x: fx,
        y: fy,
        radius: 72,
        life: 0.6,
        dmg: 40,
        color: 'rgba(244, 114, 182, 0.5)',
        accent: '#fdf2f8',
        onTick(h) {
          // Desorienta a horda próxima
          if (typeof G === 'object' && G.EnemyMgr) {
            for (const e of G.EnemyMgr.all()) {
              if (e && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.radius) {
                e.confuseT = Math.max(e.confuseT || 0, 0.8);
              }
            }
          }
        }
      });
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
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

      // Pulsos hipercinéticos concêntricos em 360° varrendo a tela com dano verdadeiro
      vfx.addHazard({
        type: 'hyper_pulse',
        x: player.x,
        y: player.y,
        radius: 145,
        life: 0.55,
        dmg: 54, // Dano universal
        color: 'rgba(241, 245, 249, 0.45)',
        accent: '#ffffff'
      });
      if (typeof G === 'object' && G.Audio && G.Audio.sfx) G.Audio.sfx('hit');
    },
    executeHazard(player, camera) { this.spawnHazard(player, camera); }
  }
};

// Aliases e Exportações
if (typeof G === 'object') {
  G.MEGA_ULTIMATES_DATA = MEGA_ULTIMATES_DATA;
  G.MEGA_ULTIMATES = MEGA_ULTIMATES_DATA;
  G.ELEMENT_PALETTES = ELEMENT_PALETTES;
}
if (typeof window !== 'undefined') {
  window.MEGA_ULTIMATES_DATA = MEGA_ULTIMATES_DATA;
  window.MEGA_ULTIMATES = MEGA_ULTIMATES_DATA;
  window.ELEMENT_PALETTES = ELEMENT_PALETTES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MEGA_ULTIMATES_DATA,
    MEGA_ULTIMATES: MEGA_ULTIMATES_DATA,
    ELEMENT_PALETTES
  };
}
