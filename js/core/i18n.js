/* ============ i18n.js — Sistema Completo de Internacionalização (i18n) ============
 * PokéSurvivor:
 * - Idiomas Oficiais: Português do Brasil ('pt-BR', padrão) e Inglês ('en-US').
 * - Troca Instantânea no DOM e Canvas sem recarregar a página.
 * - Suporte a Chaves Aninhadas com Interpolação: i18n.t('hud.hp'), i18n.t('capture.throwing', { ball: 'Poké Ball' }).
 * - Compatibilidade Total com o sistema legado (G.I18n.t, G.T, add, MutationObserver, Canvas hook).
 * - Persistência em localStorage ('pokesurvivor_lang' e 'ps.lang').
 * - Atributo DOM 'data-i18n' com suporte a re-renderização imediata e atributos (data-i18n-attr).
 */

(function () {
  const STORAGE_KEY = 'pokesurvivor_lang';
  const LEGACY_STORAGE_KEY = 'ps.lang';

  // 1. Dicionários Oficiais Estruturados com 100% de Cobertura
  const TRANSLATIONS = {
    'pt-BR': {
      common: {
        confirm: "Confirmar",
        cancel: "Cancelar",
        back: "Voltar",
        play: "Jogar",
        level: "Nível",
        stage: "Estágio",
        seconds: "segundos",
        gold: "PokéMoedas",
        close: "Fechar",
        save: "Salvar",
        retry: "Tentar Novamente",
        active: "Ativado",
        disabled: "Desativado",
        loading: "Carregando…"
      },
      settings: {
        title: "Configurações",
        language: "Idioma / Language",
        languageNotice: "A interface é atualizada imediatamente sem reiniciar.",
        musicVolume: "Volume da Música",
        sfxVolume: "Volume dos Efeitos",
        cameraZoom: "Escala da Câmera",
        screenShake: "Tremor de Tela",
        cameraSmooth: "Seguimento Suave",
        quality: "Qualidade",
        auto: "Automático",
        high: "Alta",
        mid: "Média",
        low: "Baixa",
        fps: "Mostrar FPS",
        showRadar: "Exibir Radar / Mini-mapa",
        showBuffTable: "Exibir Tabela de Atributos",
        close: "Salvar e Fechar",
        fullScreen: "Tela Cheia",
        fullScreenExit: "Sair",
        fullScreenOn: "Ativar",
        zoomOut: "Diminuir Zoom (-)",
        zoomIn: "Aumentar Zoom (+)",
        tabs: {
          sound: "Som",
          gfx: "Gráficos",
          ctl: "Controles",
          acc: "Conta",
          about: "Sobre"
        }
      },
      intro: {
        trainerPrompt: "QUAL O SEU NOME, TREINADOR?",
        defaultName: "Red",
        chooseGender: "Selecione o Gênero",
        chooseStarters: "ESCOLHA SEUS 3 POKÉMON INICIAIS",
        selectedCount: "Selecionados: {current} / 3",
        startJourney: "INICIAR JORNADA ▶",
        male: "Masculino",
        female: "Feminino",
        welcome: "Bem-vindo ao PokéSurvivor!"
      },
      hud: {
        hp: "PV",
        hpText: "PV {current} / {max}",
        megaReady: "MEGA PRONTO! [ESPAÇO]",
        megaCharging: "CARREGANDO MEGA: {pct}%",
        megaActive: "MEGA: {time}s",
        paused: "JOGO PAUSADO",
        resume: "Continuar Partida",
        restart: "Reiniciar",
        quit: "Sair para o Menu",
        quitRun: "Abandonar Partida",
        defeat: "Você foi derrotado…",
        victory: "Vitória Épica!",
        gameOver: "Fim de Jogo",
        time: "Tempo Sobrevivido",
        score: "Pontuação",
        kills: "Inimigos Derrotados",
        backToMenu: "Voltar ao Menu Principal"
      },
      upgrades: {
        title: "Melhorias",
        subtitle: "Cada Pokémon possui suas próprias melhorias: elas só contam quando você joga com ele.",
        pokemon: "Pokémon",
        // Chaves diretas pelos IDs oficiais do jogo
        hp: "Vitalidade",
        hpDesc: "+8 PV Máximo",
        atk: "Força",
        atkDesc: "+4% de dano",
        spd: "Agilidade",
        spdDesc: "+3% de velocidade de movimento",
        cd: "Recarga",
        cdDesc: "-3% de tempo de recarga das habilidades",
        def: "Armadura",
        defDesc: "+2% de defesa (redução de dano)",
        regen: "Síntese",
        regenDesc: "+0,2 PV por segundo",
        magnet: "Ímã",
        magnetDesc: "+12% de raio de coleta de itens e EXP",
        xp: "Sabedoria",
        xpDesc: "+5% de experiência obtida",
        coins: "Fortuna",
        coinsDesc: "+8% de PokéMoedas recebidas",
        moves: "Repertório",
        movesDesc: "Comece a partida com 2 ataques ativos",
        crit: "Acerto Crítico",
        critDesc: "+3% de chance de acerto crítico (dano x1,5)",
        reroll: "Trocar Cartas",
        rerollDesc: "+1 troca de cartas ao subir de nível",
        ban: "Banir",
        banDesc: "Bane 1 ataque da seleção: ele não voltará a aparecer nesta partida",
        // Aliases para compatibilidade
        vitality: "Vitalidade",
        vitalityDesc: "+8 PV Máximo",
        strength: "Força",
        strengthDesc: "+4% de dano",
        agility: "Agilidade",
        agilityDesc: "+3% de velocidade de movimento",
        cooldown: "Recarga",
        cooldownDesc: "-3% de tempo de recarga das habilidades",
        defense: "Armadura",
        defenseDesc: "+2% de defesa (redução de dano)",
        synthesis: "Síntese",
        synthesisDesc: "+0,2 PV por segundo",
        wisdom: "Sabedoria",
        wisdomDesc: "+5% de experiência obtida",
        fortune: "Fortuna",
        fortuneDesc: "+8% de PokéMoedas recebidas",
        repertoire: "Repertório",
        repertoireDesc: "Comece a partida com 2 ataques ativos",
        critical: "Acerto Crítico",
        criticalDesc: "+3% de chance de acerto crítico (dano x1,5)",
        buy: "Comprar",
        maxLevel: "Máximo",
        choose: "Escolher"
      },
      capture: {
        title: "🎯 GUARDIÃO DO RIFT DERROTADO!",
        goldTitle: "⭐ EVENTO RARO: GOLD BALL! ⭐",
        prepare: "Prepare-se para capturar!",
        throwing: "Lançando {ball}...",
        shake1: "1... (A Pokébola balança!)",
        shake2: "2... (Tensão aumenta!)",
        shake3: "3... Quase lá!",
        success: "✨ {species} FOI CAPTURADO COM SUCESSO! ✨",
        escape: "💨 {species} escapou da Pokébola!",
        goldBonusNotice: "⭐ BÔNUS RESGATADO: +1.000 POKÉMOEDAS DE OURO!",
        goldGuaranteedNotice: "⭐ 100% CAPTURA GARANTIDA! ⭐",
        goldGuaranteedSub: "BÔNUS ESPECIAL: +1.000 POKÉMOEDAS!",
        pokedexNotice: "Registrado na Pokédex! Forma base desbloqueada como jogável.",
        btnThrow: "[ LANÇAR POKÉBOLA ]",
        btnContinue: "[ CONTINUAR JORNADA ▶ ]",
        shinyBadge: "✨ SHINY",
        legendBadge: "👑 LENDÁRIO",
        rateFormat: "{ball}: {total}% ({base}% Base + {bonus}% Bola)",
        rateBallBonus: "Bola",
        balls: {
          poke_ball: "Poké Ball",
          great_ball: "Great Ball",
          ultra_ball: "Ultra Ball",
          ultimate_ball: "Ultimate Ball",
          gold_ball: "Gold Ball"
        }
      },
      weather: {
        clear: "Céu Limpo",
        clearHint: "Clima neutro e estável. Tipos Normal e Planta ganham +10% de velocidade.",
        harsh_sun: "Sol Escaldante",
        harsh_sunHint: "Fogo ganha +40% dano e chamas no chão; Planta ganha +25% velocidade e regeneração; Água perde 20% dano.",
        rain: "Chuva Torrencial",
        rainHint: "Água ganha +40% dano e +30% área; Elétrico ganha arcos voltaicos em cadeia; Fogo perde 25% dano.",
        sandstorm: "Tempestade de Areia",
        sandstormHint: "Pedra, Terra e Aço ganham +40% Defesa e Repulsão extra; Inimigos sofrem desgaste contínuo de 1% HP/s.",
        snow: "Nevasca / Granizo",
        snowHint: "Gelo ganha +35% de dano e chance de congelamento; Inimigos sem tipo Gelo são desacelerados em 20%.",
        thunderstorm: "Tempestade de Raios",
        thunderstormHint: "Elétrico ganha +50% dano e recarga rápida; Raios aleatórios atingem o campo.",
        fog: "Neblina Densa",
        fogHint: "Fantasma e Psíquico ganham esquiva +30%; Inimigos erram ataques frequentemente."
      },
      menu: {
        play: "Jogar",
        playSub: "Entrar na masmorra",
        pokemon: "Pokémon",
        pokemonSub: "Sua coleção",
        upgrades: "Melhorias",
        upgradesSub: "Fique mais forte a cada partida",
        missions: "Missões",
        missionsSub: "Missões, conquistas e perfil",
        friends: "Amigos",
        friendsSub: "Jogue em grupo, até 4 jogadores",
        ranking: "Classificação",
        rankingSub: "Quem sobrevive mais tempo",
        settings: "Configurações",
        settingsSub: "Som, gráficos, controles e conta",
        logout: "Sair",
        rifts: "Fendas Concluídas",
        partner: "Companheiro",
        stagesTitle: "Escolha a Região",
        stagesSub: "Fase da Partida",
        stagesDesc: "Os monstros e os Guardiões de Rift pertencerão exclusivamente à região selecionada.",
        gacha: "Roleta Gacha",
        gachaSub: "Gire por 5.000 tickets · Lendários e Shinies"
      }
    },
    'en-US': {
      common: {
        confirm: "Confirm",
        cancel: "Cancel",
        back: "Back",
        play: "Play",
        level: "Level",
        stage: "Stage",
        seconds: "seconds",
        gold: "PokéCoins",
        close: "Close",
        save: "Save",
        retry: "Try Again",
        active: "Enabled",
        disabled: "Disabled",
        loading: "Loading…"
      },
      settings: {
        title: "Settings",
        language: "Language / Idioma",
        languageNotice: "The interface updates instantly without restarting.",
        musicVolume: "Music Volume",
        sfxVolume: "SFX Volume",
        cameraZoom: "Camera Zoom",
        screenShake: "Screen Shake",
        cameraSmooth: "Smooth Follow",
        quality: "Quality",
        auto: "Auto",
        high: "High",
        mid: "Medium",
        low: "Low",
        fps: "Show FPS",
        showRadar: "Show Radar / Mini-map",
        showBuffTable: "Show Attributes Table",
        close: "Save and Close",
        fullScreen: "Fullscreen",
        fullScreenExit: "Exit",
        fullScreenOn: "Enable",
        zoomOut: "Zoom Out (-)",
        zoomIn: "Zoom In (+)",
        tabs: {
          sound: "Sound",
          gfx: "Graphics",
          ctl: "Controls",
          acc: "Account",
          about: "About"
        }
      },
      intro: {
        trainerPrompt: "WHAT IS YOUR NAME, TRAINER?",
        defaultName: "Red",
        chooseGender: "Select Gender",
        chooseStarters: "CHOOSE YOUR 3 STARTER POKÉMON",
        selectedCount: "Selected: {current} / 3",
        startJourney: "START JOURNEY ▶",
        male: "Male",
        female: "Female",
        welcome: "Welcome to PokéSurvivor!"
      },
      hud: {
        hp: "HP",
        hpText: "HP {current} / {max}",
        megaReady: "MEGA READY! [SPACE]",
        megaCharging: "CHARGING MEGA: {pct}%",
        megaActive: "MEGA: {time}s",
        paused: "GAME PAUSED",
        resume: "Resume Game",
        restart: "Restart",
        quit: "Quit to Menu",
        quitRun: "Abandon Run",
        defeat: "You were defeated…",
        victory: "Epic Victory!",
        gameOver: "Game Over",
        time: "Survival Time",
        score: "Score",
        kills: "Enemies Defeated",
        backToMenu: "Back to Main Menu"
      },
      upgrades: {
        title: "Upgrades",
        subtitle: "Each Pokémon has its own upgrades: they only count when you play with it.",
        pokemon: "Pokémon",
        // Direct keys by game ID
        hp: "Vitality",
        hpDesc: "+8 Max HP",
        atk: "Attack Power",
        atkDesc: "+4% damage for all attacks",
        spd: "Agility",
        spdDesc: "+3% movement speed",
        cd: "Cooldown",
        cdDesc: "-3% skill cooldown time",
        def: "Armor",
        defDesc: "+2% damage reduction",
        regen: "Synthesis",
        regenDesc: "+0.2 HP per second",
        magnet: "Magnet",
        magnetDesc: "+12% pickup radius for items & EXP",
        xp: "Wisdom",
        xpDesc: "+5% EXP gained",
        coins: "Fortune",
        coinsDesc: "+8% PokéCoins earned",
        moves: "Repertoire",
        movesDesc: "Start runs with 2 active attacks",
        crit: "Critical",
        critDesc: "+3% critical hit chance (x1.5 damage)",
        reroll: "Reroll",
        rerollDesc: "+1 level-up card reroll per run",
        ban: "Banish",
        banDesc: "Block 1 move from appearing in card draws",
        // Aliases for compatibility
        vitality: "Vitality",
        vitalityDesc: "+8 Max HP",
        strength: "Attack Power",
        strengthDesc: "+4% damage for all attacks",
        agility: "Agility",
        agilityDesc: "+3% movement speed",
        cooldown: "Rapid Cooldown",
        cooldownDesc: "-3% skill cooldown time",
        defense: "Armor",
        defenseDesc: "+2% damage reduction",
        synthesis: "Regeneration",
        synthesisDesc: "+0.2 HP per second",
        wisdom: "Wisdom",
        wisdomDesc: "+5% EXP gained",
        fortune: "Fortune",
        fortuneDesc: "+8% PokéCoins earned",
        repertoire: "Starter Arsenal",
        repertoireDesc: "Start runs with 2 active attacks",
        critical: "Critical Strike",
        criticalDesc: "+3% critical hit chance (x1.5 damage)",
        buy: "Buy",
        maxLevel: "Max Level",
        choose: "Choose"
      },
      capture: {
        title: "🎯 RIFT GUARDIAN DEFEATED!",
        goldTitle: "⭐ RARE EVENT: GOLD BALL! ⭐",
        prepare: "Get ready to capture!",
        throwing: "Throwing {ball}...",
        shake1: "1... (The Pokéball wobbles!)",
        shake2: "2... (Tension builds!)",
        shake3: "3... Almost there!",
        success: "✨ {species} WAS SUCCESSFULLY CAPTURED! ✨",
        escape: "💨 {species} broke free from the Pokéball!",
        goldBonusNotice: "⭐ BONUS CLAIMED: +1,000 GOLD POKÉCOINS!",
        goldGuaranteedNotice: "⭐ 100% GUARANTEED CAPTURE! ⭐",
        goldGuaranteedSub: "SPECIAL BONUS: +1,000 POKÉCOINS!",
        pokedexNotice: "Registered to Pokédex! Base form unlocked as playable.",
        btnThrow: "[ THROW POKÉBALL ]",
        btnContinue: "[ CONTINUE JOURNEY ▶ ]",
        shinyBadge: "✨ SHINY",
        legendBadge: "👑 LEGENDARY",
        rateFormat: "{ball}: {total}% ({base}% Base + {bonus}% Ball)",
        rateBallBonus: "Ball",
        balls: {
          poke_ball: "Poké Ball",
          great_ball: "Great Ball",
          ultra_ball: "Ultra Ball",
          ultimate_ball: "Ultimate Ball",
          gold_ball: "Gold Ball"
        }
      },
      weather: {
        clear: "Clear Skies",
        clearHint: "Neutral, stable weather. Normal and Grass types gain +10% speed.",
        harsh_sun: "Harsh Sunlight",
        harsh_sunHint: "Fire gains +40% damage & fiery ground; Grass gains +25% speed & regen; Water loses 20% damage.",
        rain: "Heavy Rain",
        rainHint: "Water gains +40% damage & +30% area; Electric gains chaining arcs; Fire loses 25% damage.",
        sandstorm: "Sandstorm",
        sandstormHint: "Rock, Ground, and Steel gain +40% Defense & knockback; Enemies suffer 1% HP/s chip damage.",
        snow: "Blizzard / Hail",
        snowHint: "Ice gains +35% damage & freeze chance; Non-Ice enemies slowed by 20%.",
        thunderstorm: "Thunderstorm",
        thunderstormHint: "Electric gains +50% damage & rapid cooldown; Lightning strikes the battlefield.",
        fog: "Thick Fog",
        fogHint: "Ghost and Psychic gain +30% dodge chance; Enemies miss attacks often."
      },
      menu: {
        play: "Play",
        playSub: "Enter the dungeon",
        pokemon: "Pokémon",
        pokemonSub: "Your collection",
        upgrades: "Upgrades",
        upgradesSub: "Grow stronger every run",
        missions: "Missions",
        missionsSub: "Missions, achievements and profile",
        friends: "Friends",
        friendsSub: "Play with up to 4 friends",
        ranking: "Leaderboard",
        rankingSub: "Who survives the longest",
        settings: "Settings",
        settingsSub: "Audio, graphics, controls and account",
        logout: "Log Out",
        rifts: "Cleared Rifts",
        partner: "Partner",
        stagesTitle: "Choose Region",
        stagesSub: "Run Stage",
        stagesDesc: "Monsters and Rift Guardians will belong exclusively to the selected region.",
        gacha: "Gacha Roulette",
        gachaSub: "Spin for 5,000 tickets · Legendaries and Shinies"
      }
    }
  };

  // 2. Dicionários de Tradução Direta de Frases Legadas (Espanhol -> PT-BR / EN-US)
  const PHRASES_PT = {
    'Jugar': 'Jogar',
    'Mejoras': 'Melhorias',
    'Ajustes': 'Configurações',
    'Sonido': 'Som',
    'Gráficos': 'Gráficos',
    'Controles': 'Controles',
    'Cuenta': 'Conta',
    'Acerca de': 'Sobre',
    'Volver': 'Voltar',
    'Cerrar': 'Fechar',
    'Pausa': 'Pausa',
    'Continuar': 'Continuar',
    'Abandonar run': 'Abandonar Partida',
    'Has caído…': 'Você foi derrotado…',
    'Volver al menú': 'Voltar ao Menu Principal',
    'Entrar': 'Entrar',
    'Crear cuenta': 'Criar Conta',
    'Jugar como invitado': 'Jogar como Convidado',
    'Nombre': 'Nome',
    'Contraseña': 'Senha',
    'Guardar apodo': 'Salvar Apelido',
    'Elige a tu compañero': 'Escolha seu Companheiro',
    'Misiones': 'Missões',
    'Logros': 'Conquistas',
    'Perfil': 'Perfil',
    'Amigos': 'Amigos',
    'Ranking': 'Classificação',
    'Colección': 'Coleção',
    'Partida': 'Partida',
    'Pantalla completa': 'Tela Cheia',
    'Calidad': 'Qualidade',
    'Nivel': 'Nível',
    'Nv.': 'Nv.',
    'Invitado': 'Convidado',
    'Elegir': 'Escolher',
    '¡Vamos juntos!': 'Vamos juntos!',
    'Elegir otro': 'Escolher outro',
    '¡Nivel {x}!': '¡Nível {x}!',
    'Elige una recompensa': 'Escolha uma recompensa',
    'Cambiar opciones': 'Trocar opções',
    'Ativado': 'Ativado',
    'Desativado': 'Desativado',
    'Sí': 'Sim',
    'No': 'Não',
    'Auto': 'Automático',
    'Alta': 'Alta',
    'Media': 'Média',
    'Baja': 'Baixa',
    'Apodo': 'Apelido',
    'Tipo de cuenta': 'Tipo de Conta',
    'Cerrar sesión': 'Sair da Conta',
    'Borrar cuenta': 'Excluir Conta',
    'Sala': 'Sala de Espera',
    'Salir de la sala': 'Sair da Sala',
    'Empezar partida': 'Começar Partida',
    'Invitar amigos': 'Convidar Amigos',
    'Añadir amigo': 'Adicionar Amigo',
    'Ir a la sala': 'Ir para a Sala',
    'Acero': 'Aço', 'Agua': 'Água', 'Bicho': 'Inseto', 'Dragón': 'Dragão',
    'Eléctrico': 'Elétrico', 'Fantasma': 'Fantasma', 'Fuego': 'Fogo', 'Hada': 'Fada',
    'Hielo': 'Gelo', 'Lucha': 'Lutador', 'Planta': 'Planta', 'Psíquico': 'Psíquico',
    'Roca': 'Pedra', 'Siniestro': 'Sombrio', 'Tierra': 'Terrestre', 'Veneno': 'Venenoso',
    'Volador': 'Voador',
    'tiempo de recarga': 'tempo de recarga',
    'daño': 'dano',
    'daño crítico': 'dano crítico',
    'movimiento': 'ataque',
    'movimientos': 'ataques',
    'monedas': 'PokéMoedas',
    'pantalla': 'tela',
    'volver': 'voltar',
    'ronda': 'partida',
    'escoger': 'escolher',
    'elegir': 'selecionar',
    'bloqueado': 'bloqueado',
    'desbloqueado': 'desbloqueado',
    'mejora': 'melhoria',
    'mejoras': 'melhorias',
    'velocidad': 'velocidade',
    'experiencia': 'experiência',
    'comenzar': 'jogar',
    'enemigo': 'inimigo',
    'enemigos': 'inimigos',
    'compañero': 'companheiro',
    'compañeros': 'companheiros',
    'objetos': 'itens',
    'recompensa': 'recompensa',
    'haz más fuerte cada run': 'fique mais forte a cada partida',
    'entra en la mazmorra': 'entrar na masmorra',
    'tu colección': 'sua coleção',
    'quién aguanta más': 'quem sobrevive mais tempo',
    'juega en grupo, hasta 4': 'jogue em grupo, até 4 jogadores',
    'sonido, gráficos, controles y cuenta': 'som, gráficos, controles e conta',
    'misiones, logros y perfil': 'missões, conquistas e perfil'
  };

  const PHRASES_EN = {
    'Jugar': 'Play',
    'Mejoras': 'Upgrades',
    'Ajustes': 'Settings',
    'Sonido': 'Sound',
    'Gráficos': 'Graphics',
    'Controles': 'Controls',
    'Cuenta': 'Account',
    'Acerca de': 'About',
    'Volver': 'Back',
    'Cerrar': 'Close',
    'Pausa': 'Pause',
    'Continuar': 'Continue',
    'Abandonar run': 'Abandon Run',
    'Has caído…': 'You have fallen…',
    'Volver al menú': 'Return to Menu',
    'Entrar': 'Sign In',
    'Crear cuenta': 'Create Account',
    'Jugar como invitado': 'Play as Guest',
    'Nombre': 'Name',
    'Contraseña': 'Password',
    'Guardar apodo': 'Save Nickname',
    'Elige a tu compañero': 'Choose your partner',
    'Misiones': 'Missions',
    'Logros': 'Achievements',
    'Perfil': 'Profile',
    'Amigos': 'Friends',
    'Ranking': 'Leaderboard',
    'Colección': 'Collection',
    'Partida': 'Game',
    'Pantalla completa': 'Fullscreen',
    'Calidad': 'Quality',
    'Nivel': 'Level',
    'Nv.': 'Lv.',
    'Invitado': 'Guest',
    'Elegir': 'Choose',
    '¡Vamos juntos!': 'Let\'s go!',
    'Elegir otro': 'Choose another',
    '¡Nivel {x}!': 'Level {x}!',
    'Elige una recompensa': 'Choose a reward',
    'Cambiar opciones': 'Reroll options',
    'Ativado': 'Enabled',
    'Desativado': 'Disabled',
    'Sí': 'Yes',
    'No': 'No',
    'Auto': 'Auto',
    'Alta': 'High',
    'Media': 'Medium',
    'Baja': 'Low',
    'Apodo': 'Nickname',
    'Tipo de cuenta': 'Account Type',
    'Cerrar sesión': 'Log Out',
    'Borrar cuenta': 'Delete Account',
    'Sala': 'Lobby',
    'Salir de la sala': 'Leave Lobby',
    'Empezar partida': 'Start Game',
    'Invitar amigos': 'Invite Friends',
    'Añadir amigo': 'Add Friend',
    'Ir a la sala': 'Go to Lobby'
  };

  // Mapas de lookup rápido
  const exactMaps = {
    'pt-BR': new Map(Object.entries(PHRASES_PT)),
    'en-US': new Map(Object.entries(PHRASES_EN))
  };

  const patterns = {
    'pt-BR': [],
    'en-US': []
  };

  const cache = new Map();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function normalizeLang(lang) {
    if (!lang || typeof lang !== 'string') return 'pt-BR';
    const l = lang.toLowerCase().trim();
    if (l.startsWith('en')) return 'en-US';
    return 'pt-BR';
  }

  // Resolução inicial de idioma
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch (e) {
    /* nada */
  }
  const byPath = (typeof location !== 'undefined' && location.pathname && /\/en(\/|$)/.test(location.pathname)) ? 'en-US' : null;
  const nav = (typeof navigator !== 'undefined' && ((navigator.languages && navigator.languages[0]) || navigator.language || 'pt') || 'pt').toLowerCase();
  let currentLang = saved ? normalizeLang(saved) : byPath || (nav.startsWith('en') ? 'en-US' : 'pt-BR');

  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLang;
  }

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function interpolate(template, vars) {
    if (typeof template !== 'string') return template;
    if (!vars) return template;
    if (typeof vars === 'object' && !Array.isArray(vars)) {
      return template.replace(/\{(\w+)\}/g, (match, key) => {
        return (key in vars && vars[key] !== undefined) ? vars[key] : match;
      });
    }
    if (Array.isArray(vars)) {
      let idx = 0;
      return template.replace(/\{(\w+)\}/g, (match, key) => {
        if (key === 'x' || !isNaN(key)) {
          return idx < vars.length ? vars[idx++] : match;
        }
        return match;
      });
    }
    return template.replace(/\{(\w+)\}/g, () => vars);
  }

  function keepCase(src, dest) {
    if (!src || !dest || typeof src !== 'string' || typeof dest !== 'string') return dest;
    if (src === src.toUpperCase() && /\p{L}/u.test(src)) return dest.toUpperCase();
    return dest;
  }

  /**
   * Adiciona traduções adicionais ao dicionário (usado por lang-en.js e expansões).
   */
  function add(dict, targetLang = 'en-US') {
    const langKey = normalizeLang(targetLang);
    const map = exactMaps[langKey] || (exactMaps[langKey] = new Map());
    const pat = patterns[langKey] || (patterns[langKey] = []);

    for (const [src, trans] of Object.entries(dict)) {
      if (!trans || src === trans) continue;
      if (src.includes('{x}')) {
        const parts = src.split('{x}').map(reEsc);
        pat.push({
          re: new RegExp('^' + parts.join('(.+?)') + '$', 'u'),
          reI: new RegExp('^' + parts.join('(.+?)') + '$', 'iu'),
          trans
        });
      } else {
        map.set(src, trans);
      }
    }
    cache.clear();
  }

  /**
   * Função principal de tradução:
   * i18n.t('hud.hp')
   * i18n.t('capture.throwing', { ball: 'Poké Ball' })
   * i18n.t('Jugar')
   */
  function t(keyOrText, vars, fallback) {
    if (keyOrText == null) return '';
    if (typeof keyOrText !== 'string') return String(keyOrText);

    // 1. Tenta buscar como chave hierárquica no dicionário estruturado
    const structuredVal = getNested(TRANSLATIONS[currentLang], keyOrText);
    if (structuredVal !== undefined && typeof structuredVal === 'string') {
      return interpolate(structuredVal, vars);
    }

    // Fallback estruturado no outro idioma se faltar na atual
    const fallbackLang = currentLang === 'pt-BR' ? 'en-US' : 'pt-BR';
    const altVal = getNested(TRANSLATIONS[fallbackLang], keyOrText);
    if (altVal !== undefined && typeof altVal === 'string') {
      return interpolate(altVal, vars);
    }

    // 2. Busca no cache de textos literais
    const cacheKey = currentLang + ':' + keyOrText;
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return interpolate(cached, vars);
    }

    // 3. Tradução literal de texto (frases exatas ou padrões)
    let res = translateText(keyOrText, currentLang);
    if (res === keyOrText && fallback !== undefined) {
      res = fallback;
    }

    if (cache.size > 5000) cache.clear();
    cache.set(cacheKey, res);

    return interpolate(res, vars);
  }

  function translateText(s, langKey) {
    if (!s || typeof s !== 'string' || !/\p{L}/u.test(s)) return s;

    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    if (!m) return s;
    const lead = m[1], tail = m[3], body = m[2].replace(/\s+/g, ' ');
    if (!body) return s;

    const map = exactMaps[langKey];
    if (map && map.has(body)) {
      return lead + map.get(body) + tail;
    }

    // Case-insensitive fallback
    if (map) {
      const lower = body.toLowerCase();
      for (const [k, v] of map.entries()) {
        if (k.toLowerCase() === lower) {
          return lead + keepCase(body, v) + tail;
        }
      }
    }

    // Padrões dinâmicos
    const patList = patterns[langKey] || [];
    for (const p of patList) {
      const mm = p.re.exec(body) || p.reI.exec(body);
      if (!mm) continue;
      let i = 1;
      const replaced = p.trans.replace(/\{x\}/g, () => {
        const g = mm[i++];
        return g === undefined ? '' : translateText(g, langKey);
      });
      return lead + keepCase(body, replaced) + tail;
    }

    return s;
  }

  /**
   * Atalho para formatação com {x}: i18n.f('Nivel {x}', 5)
   */
  function f(str, ...vals) {
    return t(str, vals);
  }

  /**
   * Altera o idioma ativo do jogo instantaneamente sem recarregar.
   */
  function setLanguage(lang) {
    const nextLang = normalizeLang(lang);
    if (nextLang === currentLang) return;

    currentLang = nextLang;
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
      localStorage.setItem(LEGACY_STORAGE_KEY, nextLang === 'en-US' ? 'en' : 'es');
    } catch (e) {
      /* nada */
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
      updateDOM(document.body);
    }

    cache.clear();

    // Dispara evento global
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: nextLang } }));
    }

    // Se a interface de configurações estiver aberta, re-renderiza imediatamente
    if (typeof G === 'object' && G.SettingsUI && typeof G.SettingsUI.isOpen === 'function' && G.SettingsUI.isOpen()) {
      try {
        if (typeof G.SettingsUI.render === 'function') G.SettingsUI.render();
      } catch (err) {}
    }
  }

  // ---------------- Higienização & Atualização do DOM ----------------
  const ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  const skipEl = el => !!(el && el.closest && el.closest('[translate="no"]:not([data-i18n]), script, style, code'));

  function doTextNode(node) {
    const p = node.parentElement;
    if (!p || skipEl(p)) return;

    // Se o elemento pai tem data-i18n, o pai trata o texto
    if (p.hasAttribute && p.hasAttribute('data-i18n')) return;

    if (!node.__orig) node.__orig = node.nodeValue;
    const translated = t(node.__orig);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  function doElementNode(el) {
    if (!el || skipEl(el)) return;

    // 1. Trata data-i18n explícito
    if (el.hasAttribute && el.hasAttribute('data-i18n')) {
      const key = el.getAttribute('data-i18n');
      let vars = null;
      if (el.hasAttribute('data-i18n-vars')) {
        try {
          vars = JSON.parse(el.getAttribute('data-i18n-vars'));
        } catch (e) {}
      }
      const val = t(key, vars);
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, val);
      } else {
        el.textContent = val;
      }
    }

    // 2. Trata atributos comuns
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) {
        if (!el['__orig_' + a]) el['__orig_' + a] = v;
        const translated = t(el['__orig_' + a]);
        if (v !== translated) el.setAttribute(a, translated);
      }
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      doTextNode(root);
      return;
    }
    if (root.nodeType !== 1 || skipEl(root)) return;

    doElementNode(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doTextNode(n);
      else doElementNode(n);
    }
  }

  function updateDOM(root = document.body) {
    if (typeof document === 'undefined' || !root) return;
    if (root.querySelectorAll) {
      const elements = root.querySelectorAll('[data-i18n]');
      for (let i = 0; i < elements.length; i++) {
        doElementNode(elements[i]);
      }
    }
    walk(root);
    document.title = t(document.title);
  }

  function startDom() {
    if (typeof document === 'undefined' || !document.body) return;
    updateDOM(document.body);

    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(ms => {
        for (const m of ms) {
          if (m.type === 'characterData') doTextNode(m.target);
          else if (m.type === 'attributes') doElementNode(m.target);
          else m.addedNodes.forEach(walk);
        }
      }).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS
      });
    }
  }

  // ---------------- Interceptação do Canvas ----------------
  if (typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
    const P = CanvasRenderingContext2D.prototype;
    for (const k of ['fillText', 'strokeText', 'measureText']) {
      const orig = P[k];
      P[k] = function (s, ...a) {
        return orig.call(this, typeof s === 'string' ? t(s) : s, ...a);
      };
    }
    const oc = window.confirm, oa = window.alert;
    window.confirm = s => oc.call(window, t(s));
    window.alert = s => oa.call(window, t(s));
  }

  /**
   * Ferramenta de verificação de consistência e sincronização de dicionários
   */
  function testTranslations() {
    const missingInEN = [];
    const missingInPT = [];

    function checkLeafs(objPT, objEN, path = '') {
      for (const k of Object.keys(objPT)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof objPT[k] === 'object' && objPT[k] !== null && !Array.isArray(objPT[k])) {
          if (!objEN || typeof objEN[k] !== 'object') {
            missingInEN.push(fullPath);
          } else {
            checkLeafs(objPT[k], objEN[k], fullPath);
          }
        } else {
          if (!objEN || objEN[k] === undefined) {
            missingInEN.push(fullPath);
          }
        }
      }
    }

    function checkReverse(objEN, objPT, path = '') {
      for (const k of Object.keys(objEN)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof objEN[k] === 'object' && objEN[k] !== null && !Array.isArray(objEN[k])) {
          if (!objPT || typeof objPT[k] !== 'object') {
            missingInPT.push(fullPath);
          } else {
            checkReverse(objEN[k], objPT[k], fullPath);
          }
        } else {
          if (!objPT || objPT[k] === undefined) {
            missingInPT.push(fullPath);
          }
        }
      }
    }

    checkLeafs(TRANSLATIONS['pt-BR'], TRANSLATIONS['en-US']);
    checkReverse(TRANSLATIONS['en-US'], TRANSLATIONS['pt-BR']);

    const isSynced = missingInEN.length === 0 && missingInPT.length === 0;
    console.group(`🌐 [i18n] Relatório de Teste de Dicionários (${isSynced ? '100% OK' : 'INCONSISTÊNCIAS ENCONTRADAS'})`);
    console.log(`Idioma Ativo: ${currentLang}`);
    if (isSynced) {
      console.log('✅ Todos os textos e chaves estão 100% sincronizados entre pt-BR e en-US!');
    } else {
      if (missingInEN.length > 0) console.warn('⚠️ Chaves ausentes em en-US:', missingInEN);
      if (missingInPT.length > 0) console.warn('⚠️ Chaves ausentes em pt-BR:', missingInPT);
    }
    console.groupEnd();

    return {
      ok: isSynced,
      currentLang,
      missingInEN,
      missingInPT
    };
  }

  /**
   * Auditoria de resíduos em Espanhol / Portunhol no dicionário pt-BR e nas interfaces ativas.
   */
  function auditSpanishWords() {
    const SUSPICIOUS = [
      'tiempo', 'daño', 'daños', 'movimiento', 'movimientos', 'monedas', 'pantalla', 
      'volver', 'ronda', 'elegir', 'escoger', 'comenzar', 'jugar', 'velocidad', 
      'experiencia', 'enemigo', 'enemigos', 'partida actual', 'reiniciar partida', 
      'cada pokemon tiene', 'compañero', 'compañeros', 'objetos', 'subir de nivel'
    ];

    const findings = [];

    // 1. Varredura recursiva no dicionário PT-BR
    function scanObj(obj, prefix = '') {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'string') {
          SUSPICIOUS.forEach(term => {
            const re = new RegExp(`\\b${term}\\b`, 'i');
            if (re.test(val)) {
              findings.push({ source: 'dict[pt-BR]', key: fullKey, text: val, detected: term });
            }
          });
        } else if (typeof val === 'object') {
          scanObj(val, fullKey);
        }
      }
    }
    scanObj(TRANSLATIONS['pt-BR']);

    // 2. Varredura no DOM visível (se no browser)
    if (typeof document !== 'undefined' && document.body) {
      const elements = document.querySelectorAll('[data-i18n], h1, h2, h3, button, p, span, small, label');
      elements.forEach(el => {
        const text = el.innerText || el.textContent;
        if (!text || text.length > 150) return;
        SUSPICIOUS.forEach(term => {
          const re = new RegExp(`\\b${term}\\b`, 'i');
          if (re.test(text)) {
            if (!findings.some(f => f.source === 'DOM' && f.text === text.trim())) {
              findings.push({ source: 'DOM', tag: el.tagName.toLowerCase(), text: text.trim(), detected: term });
            }
          }
        });
      });
    }

    const clean = findings.length === 0;
    console.group(`🔍 [i18n] Auditoria de Português / Espanhol (${clean ? '0 RESÍDUOS - 100% PT-BR' : `${findings.length} ACHADOS`})`);
    if (clean) {
      console.log('✅ Nenhum resíduo de Espanhol/Portunhol detectado no dicionário pt-BR ou nas interfaces ativas!');
    } else {
      console.warn('⚠️ Foram encontrados termos suspeitos:', findings);
    }
    console.groupEnd();

    return {
      clean,
      count: findings.length,
      findings
    };
  }

  // 3. Montagem da Instância Oficial do Singleton
  const i18nInstance = {
    get currentLang() { return currentLang; },
    get lang() { return currentLang.startsWith('en') ? 'en' : 'pt'; },
    get TRANSLATIONS() { return TRANSLATIONS; },
    t,
    f,
    add,
    setLanguage,
    set: setLanguage,
    updateDOM,
    startDom,
    walk,
    testTranslations,
    auditSpanishWords
  };

  // Exportação Global Universal
  if (typeof window !== 'undefined') {
    window.i18n = i18nInstance;
    window.I18n = i18nInstance;
    window.debugSetLangPT = () => i18nInstance.setLanguage('pt-BR');
    window.debugSetLangEN = () => i18nInstance.setLanguage('en-US');
    window.debugTestTranslations = () => i18nInstance.testTranslations();
    window.debugAuditSpanishWords = () => i18nInstance.auditSpanishWords();
  }

  if (typeof window !== 'undefined' && typeof window.G === 'object') {
    window.G.I18n = i18nInstance;
    window.G.T = i18nInstance.t;
  } else if (typeof G === 'object') {
    G.I18n = i18nInstance;
    G.T = i18nInstance.t;
  }

  // Inicialização do DOM após carregamento da página
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startDom();
      });
    } else {
      startDom();
    }
  }
})();
