/* ============ music.js — partituras de los temas del juego ============
 * Compuestas para el juego (no son temas de Nintendo). Las toca el
 * sintetizador de core/audio.js.
 *
 * melody: compases como "A4:4 C5:2 -:2" — nota:duración en semicorcheas
 *         (16 por compás), "-" = silencio.
 * parts:  generadas desde `chords` con un patrón de 16 caracteres por compás:
 *           R raíz (bajo del acorde con useBass) · F quinta · O octava · T tercera
 *           0-5 notas del acorde (0 raíz, 1 tercera, 2 quinta, 3 octava...)
 *           C acorde entero · "-" alarga la nota anterior · "." silencio
 * drums:  X fuerte · x medio · o suave · . nada
 */
G.MUSIC = {
  // ---------------- Menú: Pokémon Theme (Piano Instrumental Suave) ----------------
  village: {
    bpm: 82, swing: 0,
    chords: ['Gm', 'F', 'Gm', 'Dm', 'Eb', 'F', 'Cm', 'D',
             'Gm', 'Eb', 'F', 'Bb', 'Gm', 'Eb', 'F', 'D',
             'Gm', 'Eb', 'F', 'Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Gm'],
    melody: [{ inst: 'piano', vel: 0.95, bars: [
      // Verso 1: "I wanna be the very best, like no one ever was"
      'D4:2 G4:2 G4:2 Bb4:2 C5:2 D5:4 C5:1 Bb4:1', 'F5:4 D5:2 Bb4:2 C5:4 D5:4',
      // "To catch them is my real test, to train them is my cause"
      'D4:2 G4:2 G4:2 Bb4:2 C5:2 D5:4 C5:1 Bb4:1', 'F5:4 D5:2 Bb4:2 G4:6 -:2',
      // "I will travel across the land, searching far and wide"
      'Bb4:2 Bb4:2 Bb4:1 C5:1 D5:2 F5:2 D5:2 C5:2 Bb4:2', 'C5:4 D5:2 C5:2 Bb4:4 G4:4',
      // "Teach Pokémon to understand the power that's inside"
      'Bb4:2 Bb4:2 C5:2 D5:2 F5:2 D5:2 C5:2 Bb4:2', 'C5:2 D5:2 Eb5:4 D5:4 A4:4',
      // Refrão: "Pokémon! (Gotta catch 'em all!) It's you and me"
      'G5:6 D5:2 -:2 Bb4:2 C5:2 D5:2', 'Bb4:4 C5:2 D5:2 Eb5:4 D5:2 C5:2',
      // "I know it's my destiny! Pokémon!"
      'C5:2 D5:2 C5:2 Bb4:2 A4:4 G4:2 A4:2', 'Bb4:8 D5:4 F5:4',
      // "Pokémon! Oh, you're my best friend"
      'G5:6 D5:2 -:2 Bb4:2 C5:2 D5:2', 'D5:4 F5:2 D5:2 C5:2 Bb4:2 C5:4',
      // "In a world we must defend! Pokémon!"
      'C5:2 D5:2 Eb5:2 D5:2 C5:2 Bb4:2 A4:4', 'A4:6 Bb4:2 C5:4 D5:4',
      // "Pokémon! Gotta catch 'em all! A heart so true"
      'G5:6 D5:2 -:2 Bb4:2 C5:2 D5:2', 'Bb4:4 C5:2 D5:2 Eb5:4 D5:2 C5:2',
      // "Our courage will pull us through"
      'C5:2 D5:2 C5:2 Bb4:2 A4:4 G4:2 A4:2', 'Bb4:8 -:4 F4:4',
      // "You teach me and I'll teach you... Pokémon!"
      'G4:2 Bb4:2 C5:4 D5:2 C5:2 Bb4:2 C5:2', 'D5:4 F5:4 G5:6 -:2',
      // "Gotta catch 'em all! Gotta catch 'em all!"
      'G5:4 D5:2 C5:2 Bb4:4 C5:4', 'D5:4 C5:4 Bb4:4 A4:4',
      // "Pokémon!" e resolução serena de piano solo
      'G4:8 Bb4:4 D5:4', 'G5:4 D5:4 Bb4:4 G4:4'
    ]}],
    parts: [
      { inst: 'piano', octave: 2, useBass: true, vel: 0.65, pattern: 'R-------F-------' },
      { inst: 'piano', octave: 3, vel: 0.5, pattern: '..0.1.2...1.2.1.' },
      { inst: 'pad', octave: 3, vel: 0.2, pattern: 'C---------------' }
    ],
    drums: {}
  },

  // ---------------- Run: Bosque Umbrío ----------------
  forest: {
    bpm: 122,
    chords: ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A',
             'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
    melody: [{ inst: 'flute', vel: 1, bars: [
      'D5:3 E5:1 F5:4 A5:4 G5:2 F5:2', 'E5:6 D5:2 C5:4 E5:4', 'F5:4 D5:4 Bb4:4 D5:4', 'C#5:8 E5:4 A4:4',
      'D5:2 F5:2 A5:4 D6:4 C6:2 A5:2', 'G5:4 E5:4 C5:4 E5:4', 'F5:3 G5:1 F5:4 D5:4 Bb4:4', 'A4:4 C#5:4 E5:4 A5:4',
      'D5:8 F5:8', 'E5:8 G5:8', 'A5:12 F5:4', 'D5:16',
      'F5:4 E5:4 D5:4 C5:4', 'E5:4 D5:4 C5:4 G4:4', 'A4:8 C#5:8', 'E5:16'] }],
    parts: [
      { inst: 'bass', octave: 2, vel: 0.9, pattern: 'R.R.R.R.F.F.O.F.' },
      { inst: 'pluck', octave: 4, vel: 0.6, pattern: '0.2.1.2.3.2.1.2.' },
      { inst: 'pad', octave: 3, vel: 0.6, pattern: 'C-------C-------' }
    ],
    drums: { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.o.x.o.x.o.x.o.' }
  },

  // ---------------- Run: Cueva Cristal ----------------
  cave: {
    bpm: 92, swing: 0.1,
    chords: ['Am', 'F', 'G', 'Em', 'Am', 'F', 'Dm', 'E',
             'F', 'G', 'Em', 'Am', 'Dm', 'Em', 'F', 'E'],
    melody: [{ inst: 'flute', vel: 0.85, bars: [
      'E5:6 A5:2 G5:4 E5:4', 'F5:8 C5:4 A4:4', 'D5:6 G5:2 F5:4 D5:4', 'E5:12 -:4',
      'C6:4 B5:2 A5:2 E5:4 C5:4', 'A5:6 G5:2 F5:4 C5:4', 'D5:4 F5:4 A5:4 G5:2 F5:2', 'E5:4 G#5:4 B5:8',
      'A5:4 C6:4 A5:4 F5:4', 'B5:4 D6:4 B5:4 G5:4', 'G5:6 E5:2 B4:8', 'C5:4 E5:4 A5:8',
      'F5:4 A5:4 D6:4 C6:4', 'B5:6 G5:2 E5:8', 'A5:4 G5:4 F5:4 E5:4', 'E5:8 -:8'] }],
    parts: [
      { inst: 'bell', octave: 4, vel: 0.5, pattern: '0.2.4.2.3.2.4.2.' },
      { inst: 'bass', octave: 2, vel: 0.8, pattern: 'R-------F-------' },
      { inst: 'pad', octave: 3, vel: 1, pattern: 'C---------------' }
    ],
    drums: { kick: 'o.......o.......', hat: '..o...o...o...o.' }
  },

  // ---------------- Run: Volcán Ceniza ----------------
  volcano: {
    bpm: 132,
    chords: ['Em', 'F', 'Em', 'D', 'Em', 'F', 'G', 'F'],
    melody: [{ inst: 'lead', vel: 0.9, bars: [
      'E5:2 -:2 E5:2 F5:2 G5:4 F5:2 E5:2', 'F5:2 -:2 F5:2 G5:2 A5:4 G5:2 F5:2',
      'G5:4 B5:4 A5:2 G5:2 F5:2 E5:2', 'D5:8 F#5:4 A5:4',
      'B5:4 A5:2 G5:2 E5:4 G5:4', 'C6:4 B5:2 A5:2 F5:4 A5:4',
      'B5:2 D6:2 B5:2 G5:2 D5:4 G5:4', 'A5:4 G5:4 F5:4 E5:4'] }],
    parts: [
      { inst: 'bass', octave: 2, vel: 1, pattern: 'R.R.R.R.R.R.F.O.' },
      { inst: 'pluck', octave: 3, vel: 0.5, pattern: '0.0.1.0.2.0.1.0.' },
      { inst: 'pad', octave: 3, vel: 0.5, pattern: 'C-------C-------' }
    ],
    drums: { kick: 'X..x..X.X..x..X.', snare: '....X.......X..x', hat: 'xoxoxoxoxoxoxoxo' }
  },

  // ---------------- Combate contra jefe ----------------
  boss: {
    bpm: 150,
    chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'D', 'B'],
    melody: [{ inst: 'lead', vel: 1, bars: [
      'E5:2 E5:2 G5:2 E5:2 B5:4 A5:2 G5:2', 'E5:2 E5:2 G5:2 E5:2 C6:4 B5:2 A5:2',
      'F#5:4 A5:4 D6:4 C6:2 B5:2', 'D#5:8 F#5:4 B5:4',
      'G5:2 F#5:2 E5:2 F#5:2 G5:4 B5:4', 'A5:2 G5:2 E5:2 G5:2 A5:4 C6:4',
      'B5:4 A5:4 F#5:4 D5:4', 'D#5:4 F#5:4 A5:4 B5:4'] }],
    parts: [
      { inst: 'bass', octave: 2, vel: 1, pattern: 'R.RR.RR.R.RR.RF.' },
      { inst: 'pluck', octave: 4, vel: 0.5, pattern: '0.1.2.1.0.1.2.3.' }
    ],
    drums: { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X.X.', hat: 'oooooooooooooooo' }
  }
};

// Se añade fuera del objeto para no tocar los demás temas.
/* ---------------- Grieta: duelo contra el legendario ----------------
 * Más rápido y más tenso que el de jefe: La menor, bajo galopando y la
 * melodía subiendo a la octava alta en la segunda mitad. */
G.MUSIC.rift = {
  bpm: 164,
  chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E',
           'F', 'G', 'Am', 'Am', 'Dm', 'E', 'Am', 'E'],
  melody: [{ inst: 'lead', vel: 1, bars: [
    'A5:2 C6:2 E6:4 D6:2 C6:2 B5:4', 'A5:2 F5:2 A5:4 C6:4 F6:4',
    'G5:2 B5:2 D6:4 C6:2 B5:2 G5:4', 'G#5:8 B5:4 E6:4',
    'A5:2 A5:2 C6:2 A5:2 E6:4 D6:2 C6:2', 'F6:4 E6:2 D6:2 C6:4 A5:4',
    'D6:4 C6:2 A5:2 F5:4 A5:4', 'G#5:4 B5:4 D6:4 E6:4',
    'F6:2 E6:2 C6:4 A5:4 C6:4', 'G6:2 F6:2 D6:4 B5:4 D6:4',
    'E6:4 C6:2 A5:2 E6:4 A6:4', 'A6:12 -:4',
    'F6:4 D6:2 A5:2 F6:4 E6:2 D6:2', 'E6:2 G#6:2 B6:4 G#6:4 E6:4',
    'A6:4 E6:2 C6:2 A5:4 C6:4', 'B5:4 G#5:4 E5:4 -:4'] }],
  parts: [
    { inst: 'bass', octave: 2, vel: 1, pattern: 'R.RRR.RRF.FFO.OF' },
    { inst: 'pluck', octave: 4, vel: 0.5, pattern: '0.2.3.2.1.2.3.4.' },
    { inst: 'pad', octave: 3, vel: 0.55, pattern: 'C-------C-------' }
  ],
  drums: { kick: 'X.x.X.x.X.x.X.xx', snare: '....X.......X..X', hat: 'xoxoxoxoxoxoxoxo' }
};

/* ---------------- La Sentencia de Arceus (minuto 30) ----------------
 * Solemne y sin salida: Re menor con un Mi bemol (frigio) que oscurece,
 * campanas graves en cada compás y la melodía subiendo hasta el final. */
G.MUSIC.judgment = {
  bpm: 140,
  chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Eb', 'C', 'A',
           'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'A'],
  melody: [{ inst: 'lead', vel: 1, bars: [
    'D5:4 F5:4 A5:6 G5:2', 'F5:4 D5:4 Bb4:8',
    'G5:4 Bb5:4 D6:4 C6:2 Bb5:2', 'A5:8 C#6:4 E6:4',
    'D6:6 C6:2 A5:4 F5:4', 'G5:4 Eb5:4 G5:4 Bb5:4',
    'C6:4 E5:2 G5:2 C6:4 E6:4', 'C#6:12 -:4',
    'D6:2 D6:2 F6:4 D6:4 Bb5:4', 'C6:2 C6:2 E6:4 C6:4 G5:4',
    'A5:4 D6:4 F6:4 E6:2 D6:2', 'D6:12 -:4',
    'Bb5:4 D6:4 G6:4 F6:2 D6:2', 'E6:4 C#6:4 A5:4 E6:4',
    'F6:4 E6:2 D6:2 A5:4 F5:4', 'E5:4 A5:4 C#6:4 E6:4'] }],
  parts: [
    { inst: 'bass', octave: 2, vel: 1, pattern: 'R.RRR.RRR.RRF.OF' },
    { inst: 'bell', octave: 4, vel: 0.6, pattern: '0.......2.......' },
    { inst: 'pad', octave: 3, vel: 0.8, pattern: 'C---------------' }
  ],
  drums: { kick: 'X..xX..xX..xX.xx', snare: '....X.......X..X', hat: 'x.x.x.x.x.x.x.x.' }
};

/** Tema de cada bioma durante la run. */
G.BIOME_MUSIC = ['forest', 'cave', 'volcano'];
