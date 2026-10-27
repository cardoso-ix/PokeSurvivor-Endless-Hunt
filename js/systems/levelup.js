/* ============ levelup.js — las tres cartas de subida de nivel ============
 * Tipos de carta:
 *   new   aprender un movimiento nuevo (sólo si quedan huecos de los 4; un vínculo libera huecos)
 *   up    mejorar un movimiento que ya tienes
 *   stat  mejora permanente de la run
 */
G.LevelUp = (() => {

  const STATS = [
    { id: 'hp',   icon: 'heart', title: 'Vigor',        desc: '+20 de PV máximo (e recupera vida).',
      apply: pl => pl.addMaxHp(20) },
    { id: 'atk',  icon: 'fist',  title: 'Potência',     desc: '+10% de dano em todos os ataques.',
      apply: pl => (typeof pl.addAtkBonus === 'function' ? pl.addAtkBonus(0.10) : (pl.atkMul += 0.10)) },
    { id: 'spd',  icon: 'boot',  title: 'Agilidade',    desc: '+7% de velocidade de movimento.',
      apply: pl => pl.spdMul *= 1.07, max: 8 },
    { id: 'cd',   icon: 'clock', title: 'Reflexos',     desc: '-8% de tempo de recarga em todos os ataques.',
      apply: pl => pl.cdMul *= 0.92, max: 10 },
    { id: 'def',  icon: 'shield', title: 'Carapaça',    desc: '+6% de redução de dano recebido.',
      apply: pl => pl.dmgReduce = Math.min(0.7, pl.dmgReduce + 0.06), max: 12 },
    { id: 'rgn',  icon: 'sprout', title: 'Síntese',     desc: '+0,9 de PV regenerado por segundo.',
      apply: pl => pl.regenFlat += 0.9 },
    { id: 'mag',  icon: 'magnet', title: 'Ímã',         desc: '+30% de raio de coleta de experiência.',
      apply: pl => pl.magnet *= 1.30, max: 6 },
    { id: 'xp',   icon: 'book',  title: 'Sabedoria',    desc: '+12% de experiência obtida.',
      apply: pl => pl.xpMul *= 1.12, max: 8 },
    { id: 'heal', icon: 'berry', title: 'Fruta Sitrus', desc: 'Recupera 45% da sua vida imediatamente.',
      apply: pl => pl.heal(pl.maxHp * 0.45) }
  ];

  /** Construye el conjunto de cartas candidatas, con pesos. */
  function candidates(pl) {
    const out = [];

    // --- movimentos novos ---
    // Não oferece mais ataques novos quando os 4 slots já estão preenchidos.
    if (pl.slots.length < pl.maxMoves) {
      // Con 2 potenciadores ya no se ofrecen más: los buff no hacen daño y
      // llenar los 4 huecos con ellos deja la run sin salida.
      const buffs = pl.moves.filter(m => m.kind === 'buff').length;
      const pool = G.Moves.poolFor(pl.mon).filter(id =>
        !pl.hasMove(id) && !(pl.banned && pl.banned.has(id)) && !(buffs >= 2 && G.Moves.BY_ID[id].kind === 'buff'));
      for (const id of G.U.pickN(pool, 6)) {
        const d = G.Moves.BY_ID[id];
        out.push({
          w: 10, type: 'new', key: 'new:' + id,
          icon: 'move:' + id, color: G.U.TYPE_COLOR[d.type],
          tag: G.U.TYPE_NAME[d.type],
          title: d.name, desc: d.desc,
          apply: p => p.addMove(id)
        });
      }
    }

    // A evolução de ESPÉCIE é AUTOMÁTICA (marcos dos Níveis 5, 12 e 21) e não é
    // oferecida como carta: os cards de Level Up ficam dedicados a ataques,
    // fusões de golpes e melhorias de atributos (README.md).
    // O tipo 'EVOLUTION' continua suportado pela UI e pelo modo admin, mas não é
    // sorteado aqui — a evolução acontece sozinha em player.checkEvolutionMilestones().

    // --- Melhorias e Evolução Individual dos 3 Pokémon do Esquadrão ---
    if (Array.isArray(pl.team) && pl.team.length > 0) {
      pl.team.forEach((mem, idx) => {
        // 1. Melhoria de dano e cadência do membro
        if ((mem.upgrades || 0) < 5) {
          out.push({
            w: 12,
            type: 'squad_up',
            key: `squad_up:${mem.name}:${idx}`,
            icon: 'type:' + mem.type,
            color: G.U && G.U.TYPE_COLOR ? (G.U.TYPE_COLOR[mem.type] || '#38bdf8') : '#38bdf8',
            tag: `EQUIPE [Nv.${(mem.upgrades || 0) + 1}]`,
            title: `Reforço: ${mem.name}`,
            desc: `Melhora o ataque de ${mem.name}: +25% de Dano e -10% de Recarga.`,
            apply: p => p.upgradeSquadMember(idx)
          });
        }

        // 2. Evolução de espécie do membro da equipe
        const evoRaw = typeof getEvolutionData === 'function' ? getEvolutionData(mem.id || mem.name) : null;
        if (evoRaw) {
          const evoList = Array.isArray(evoRaw) ? evoRaw : [evoRaw];
          for (const evo of evoList) {
            const reqLvl = (mem.stage || 1) === 1 ? (evo.level || 16) : (evo.level || 32);
            if (pl.level >= reqLvl) {
              const nextName = evo.next.charAt(0).toUpperCase() + evo.next.slice(1);
              out.push({
                w: 85,
                type: 'squad_evo',
                key: `squad_evo:${mem.name}:${evo.next}`,
                icon: 'type:' + mem.type,
                color: '#facc15',
                tag: 'EVOLUÇÃO EQUIPE',
                title: `${mem.name} ➔ ${nextName}`,
                desc: `Evolua ${mem.name} para ${nextName}! +35% de Dano e ataques avançados.`,
                apply: p => p.evolveSquadMember(idx, evo.next)
              });
            }
          }
        }
      });
    }

    // --- evoluciones: movimiento al máximo + su condición cumplida ---
    const waiting = {};                   // stat -> movimiento que la espera para evolucionar
    for (const m of pl.moves) {
      const ev = G.Moves.evoInfo(m, pl.statsTaken);
      if (!ev) continue;
      if (!ev.ready) { waiting[ev.needs] = m; continue; }
      out.push({
        w: 40, type: 'evo', key: 'evo:' + m.id,
        icon: 'move:' + m.id, color: '#ffd23f', tag: 'EVOLUÇÃO',
        title: m.name + ' → ' + ev.name, desc: ev.text,
        apply: p => {
          G.Moves.evolve(m);
          G.FX.ring(p.x, p.y, 8, 120, '#ffd23f', 0.8, 6);
          G.FX.burst(p.x, p.y - p.bodyH * 0.5, '#ffe14d', 40, 240);
          G.Audio.sfx('legend');
          G.Progress.event('evolve', { move: m.id });
        }
      });
    }

    // --- melhorias de ataques que você já tem ---
    for (const m of pl.moves) {
      const txt = G.Moves.nextUpText(m);
      if (!txt) continue;
      out.push({
        w: 8, type: 'up', key: 'up:' + m.id,
        icon: 'move:' + m.id, color: G.U.TYPE_COLOR[m.type],
        tag: 'Nv.' + m.lvl + ' > ' + (m.lvl + 1),
        title: m.name, desc: txt,
        apply: () => G.Moves.levelUp(m)
      });
    }

    // --- atributos (stats) ---
    const room = s => !s.max || (pl.statsTaken[s.id] || 0) < s.max;
    const pickStats = G.U.pickN(STATS.filter(s => !waiting[s.id] && room(s)), 5).concat(STATS.filter(s => waiting[s.id]));
    for (const s of pickStats) {
      const evoFor = waiting[s.id];
      out.push({
        w: evoFor ? 14 : pl.slots.length < pl.maxMoves ? 4 : 7,
        type: 'stat', key: 'stat:' + s.id,
        icon: s.icon, color: evoFor ? '#ffd23f' : '#8fa3c4', tag: evoFor ? 'Evolui ' + evoFor.name : 'Melhoria',
        title: s.title, desc: s.desc,
        apply: p => { s.apply(p); p.statsTaken[s.id] = (p.statsTaken[s.id] || 0) + 1; }
      });
    }

    return out;
  }

  /** Devuelve 3 cartas distintas, elegidas por peso. */
  function offer(pl, n = 3) {
    const pool = candidates(pl);
    const picked = [];
    const used = new Set();

    // Prioridade máxima: evolução de Pokémon ('EVOLUTION') no topo das opções
    const evos = pool.filter(c => c.type === 'EVOLUTION');
    if (evos.length) {
      pl._lastEvoOfferLevel = pl.level;
      for (const c of evos) {
        const idx = pool.indexOf(c);
        if (idx >= 0) pool.splice(idx, 1);
        used.add(c.key);
        picked.push(c);
      }
    }

    // Si hay una evolución de movimiento lista, su carta dorada sale siempre.
    const evo = pool.findIndex(c => c.type === 'evo');
    if (evo >= 0 && picked.length < n) {
      const c = pool.splice(evo, 1)[0];
      used.add(c.key);
      picked.push(c);
    }

    // Fallback infinito: se o pool esgotou opções limitadas, alimenta com passivas infinitas (Vigor, Potência, Síntese, Cura)
    if (pool.length === 0 && picked.length < n) {
      const infiniteStats = STATS.filter(s => ['hp', 'atk', 'rgn', 'heal'].includes(s.id));
      for (const s of infiniteStats) {
        pool.push({
          w: 10,
          type: 'stat',
          key: 'stat:' + s.id + ':' + Math.random(),
          icon: s.icon,
          color: '#8fa3c4',
          tag: 'Passiva',
          title: s.title,
          desc: s.desc,
          apply: p => { s.apply(p); p.statsTaken[s.id] = (p.statsTaken[s.id] || 0) + 1; }
        });
      }
    }

    while (picked.length < n && pool.length) {
      const total = pool.reduce((a, c) => a + c.w, 0);
      let r = Math.random() * total, idx = 0;
      for (let i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { idx = i; break; } }
      const c = pool.splice(idx, 1)[0];
      if (used.has(c.key)) continue;
      used.add(c.key);
      picked.push(c);
    }
    return picked;
  }

  return { offer, candidates, STATS };
})();
