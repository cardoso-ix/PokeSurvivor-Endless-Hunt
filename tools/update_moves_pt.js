const fs = require('fs');

const file = 'js/data/moves.js';
let content = fs.readFileSync(file, 'utf8');

const translations = {
  // RAW moves translations
  "'Placaje'": "'Investida'",
  "'Embiste en arco a todo lo que tengas delante.'": "'Investe em arco contra tudo à sua frente.'",

  "'Ataque Rápido'": "'Ataque Rápido'",
  "'Cruzas como un rayo hacia el enemigo y golpeas todo el camino.'": "'Avança velozmente como um raio até o inimigo, atingindo tudo pelo caminho.'",

  "'Danza Espada'": "'Dança das Espadas'",
  "'No hace daño: acumula ATAQUE mientras esté activo.'": "'Não causa dano: acumula PODER DE ATAQUE enquanto ativo.'",

  "'Agilidad'": "'Agilidade'",
  "'No hace daño: acumula VELOCIDAD mientras esté activo.'": "'Não causa dano: acumula VELOCIDADE enquanto ativo.'",

  "'Fortaleza'": "'Endurecer'",
  "'No hace daño: acumula DEFENSA mientras esté activo.'": "'Não causa dano: acumula DEFESA enquanto ativo.'",

  "'Ascuas'": "'Brasas'",
  "'Bola de fuego al enemigo más cercano.'": "'Dispara uma esfera de fogo no inimigo mais próximo.'",

  "'Lanzallamas'": "'Lança-Chamas'",
  "'Chorro de llamas en abanico corto que quema.'": "'Chama contínua em leque curto que incendeia inimigos.'",

  "'Giro Fuego'": "'Giro de Fogo'",
  "'Llamas que giran a tu alrededor. Defensa constante.'": "'Labaredas giratórias ao seu redor. Proteção constante.'",

  "'Onda Ígnea'": "'Onda de Calor'",
  "'Explota en llamas en todas las direcciones.'": "'Explosão ardente de chamas em todas as direções.'",

  "'Pistola Agua'": "'Jato d\\'Água'",
  "'Chorro perforante. Fiable a cualquier distancia.'": "'Disparo perfurante de água em alta pressão. Confiável a qualquer distância.'",

  "'Burbuja'": "'Bolhas'",
  "'Burbujas en abanico que ralentizan a quien tocan.'": "'Dispara bolhas em leque que desaceleram os alvos atingidos.'",

  "'Hidrobomba'": "'Hidro Bomba'",
  "'Cañonazo de agua lento pero devastador.'": "'Canhão devastador de água de altíssimo impacto.'",

  "'Acua Aro'": "'Anel d\\'Água'",
  "'No hace daño: acumula REGENERACIÓN de vida.'": "'Não causa dano: regenera PV continuamente enquanto ativo.'",

  "'Látigo Cepa'": "'Chicote de Vinha'",
  "'Látigos de largo alcance en arco amplio.'": "'Chicotes de cipó de longo alcance em arco amplo.'",

  "'Hoja Afilada'": "'Folha Navalha'",
  "'Dos hojas que van y vuelven cortando a la ida y a la vuelta.'": "'Duas folhas que vão e voltam como bumerangues cortantes.'",

  "'Tormenta Floral'": "'Tempestade de Folhas'",
  "'Un ciclón de hojas gira amplio a tu alrededor.'": "'Um ciclone de folhas cortantes em órbita contínua ao seu redor.'",

  "'Hierba Lazo'": "'Mega Dreno'",
  "'Raíces que atrapan y machacan todo lo que tienes cerca.'": "'Raízes que prendem e esmagam tudo o que estiver próximo.'",

  "'Impactrueno'": "'Choque do Trovão'",
  "'Descarga rapidísima que atraviesa varios enemigos.'": "'Descarga elétrica veloz que perfura múltiplos inimigos.'",

  "'Chispazo'": "'Descarga Elétrica'",
  "'Campo eléctrico permanente alrededor de ti.'": "'Campo elétrico pulsante permanente ao seu redor.'",

  "'Rayo'": "'Raio'",
  "'Un rayo que salta de un enemigo a otro.'": "'Relâmpago que ricocheteia saltando entre inimigos.'",

  "'Confusión'": "'Confusão'",
  "'Onda que persigue sola a su objetivo.'": "'Onda psíquica telecinética que persegue o alvo.'",

  "'Psicorrayo'": "'Raio Psíquico'",
  "'Rayo psíquico ancho y contundente.'": "'Feixe psíquico concentrado, largo e perfurante.'",

  "'Psíquico'": "'Psíquico'",
  "'Estallido mental radial que busca enemigos.'": "'Explosão mental expansiva em busca de inimigos.'",

  "'Residuos'": "'Bomba de Lodo'",
  "'Lodo tóxico que envenena al impactar.'": "'Lodo tóxico ácido que envenena ao impacto.'",

  "'Disparo Lodo'": "'Tiro de Lama'",
  "'Salpica lodo alrededor y ralentiza.'": "'Dispara rajadas de lama que desaceleram os alvos.'",

  "'Tornado'": "'Lufada de Vento'",
  "'Remolinos de viento que te escoltan.'": "'Redemoinhos de vento em órbita que empurram os alvos.'",

  "'Ataque Ala'": "'Ataque de Asa'",
  "'Barrido de alas amplio que empuja.'": "'Golpe vigoroso com as asas que afasta os inimigos.'",

  "'Golpe Cuerpo'": "'Pancada Corporal'",
  "'Placaje con todo el peso: lento, corto y brutal.'": "'Investida com todo o peso: curto, devastador e com recuo brutal.'",

  "'Vozarrón'": "'Voz Hiper sônica'",
  "'Onda sonora que sale en todas direcciones.'": "'Onda sonora que se propaga em todas as direções.'",

  "'Picotazo Veneno'": "'Ferrão Venenoso'",
  "'Aguijón rápido que envenena.'": "'Ferrão veloz que envenena o alvo.'",

  "'Tóxico'": "'Tóxico'",
  "'Vas dejando charcos de veneno que intoxican a quien los pisa.'": "'Deixa poças de veneno que intoxicam quem pisar sobre elas.'",

  "'Terratemblor'": "'Pisão Sísmico'",
  "'Sacude el suelo: daña y frena a lo cercano.'": "'Sacode o solo: causa dano e desacelera inimigos próximos.'",

  "'Picadura'": "'Mordida de Inseto'",
  "'Mordisco rápido en arco corto.'": "'Mordida veloz em arco curto.'",

  "'Disparo Demora'": "'Tiro de Teia'",
  "'Deja telarañas en el suelo que atrapan y frenan mucho al que las pisa.'": "'Lança teias no chão que prendem e desaceleram quem passar.'",

  "'Zumbido'": "'Zumbido'",
  "'Vibración constante que machaca lo cercano.'": "'Vibração estridente contínua que atinge alvos próximos.'",

  "'Lanzarrocas'": "'Lançamento de Rocha'",
  "'Pedrusco pesado que empuja al enemigo.'": "'Rocha pesada que empurra os inimigos ao impacto.'",

  "'Avalancha'": "'Deslizamento de Rochas'",
  "'Caen rocas del cielo sobre los enemigos cercanos.'": "'Rochas pontiagudas caem do céu sobre os inimigos próximos.'",

  "'Rayo Hielo'": "'Raio de Gelo'",
  "'Rayo helado que congela casi del todo.'": "'Feixe congelante que quase paralisa os alvos.'",

  "'Nieve Polvo'": "'Pó de Neve'",
  "'Ventisca a tu alrededor que ralentiza.'": "'Nevasca contínua ao redor que desacelera os inimigos.'",

  "'Golpe Kárate'": "'Golpe de Caratê'",
  "'Golpe seco y potente al frente.'": "'Golpe seco e poderoso desferido à frente.'",

  "'Esfera Aural'": "'Esfera de Aura'",
  "'Esfera de energía que nunca falla.'": "'Esfera de energia pura que nunca erra o alvo.'",

  "'Lengüetazo'": "'Lambida'",
  "'Lametazo espectral que paraliza un poco.'": "'Lambida fantasmagórica que paralisa temporariamente.'",

  "'Bola Sombra'": "'Bola Sombria'",
  "'Esfera oscura que atraviesa a varios.'": "'Esfera de matéria escura que perfura múltiplos alvos.'",

  "'Furia Dragón'": "'Fúria do Dragão'",
  "'Llamarada dracónica en línea recta.'": "'Rajada dracônica linear contínua e devastadora.'",

  "'Danza Dragón'": "'Dança do Dragão'",
  "'No hace daño: acumula ATAQUE más rápido que Danza Espada.'": "'Não causa dano: acumula PODER DE ATAQUE velozmente.'",

  "'Viento Feérico'": "'Vento de Fada'",
  "'Brisa mágica en todas direcciones.'": "'Brisa mágica que se espalha em todas as direções.'",

  "'Brillo Mágico'": "'Brilho Mágico'",
  "'Destello a tu alrededor.'": "'Clarão radiante intenso ao seu redor.'",

  "'Garra Metal'": "'Garra de Metal'",
  "'Zarpazo de acero en arco.'": "'Golpe com garras de aço em arco amplo.'",

  "'Foco Resplandor'": "'Canhão de Luz'",
  "'Rayo de luz metálica que perfora.'": "'Raio de energia metálica pura que perfura formações.'",

  "'Mordisco'": "'Mordida'",
  "'Dentellada rápida que hace retroceder.'": "'Dentada violenta que causa recuo no inimigo.'",

  "'Pulso Umbrío'": "'Pulso Sombrio'",
  "'Onda de energía oscura en todas direcciones.'": "'Onda radial de energia escura em todas as direções.'",

  "'Tinieblas'": "'Sombra Noturna'",
  "'Una sombra te rodea y consume lo cercano.'": "'Aura sombria ao redor que consome quem estiver próximo.'",

  "'Huesomerang'": "'Ossomerangue'",
  "'Un hueso que va y vuelve golpeando fuerte.'": "'Um osso que vai e volta causando dano massivo.'",

  "'Psicocorte'": "'Corte Psíquico'",
  "'Cuchillas psíquicas que vuelven a ti.'": "'Lâminas psíquicas cortantes que retornam como bumerangues.'",

  "'Púas'": "'Espinhos'",
  "'Siembra púas que estallan al pisarlas.'": "'Planta armadilhas de espinhos no solo que explodem ao serem pisadas.'",

  "'Púas Tóxicas'": "'Espinhos Tóxicos'",
  "'Púas venenosas que envenenan mucho al estallar.'": "'Espinhos venenosos que liberam toxinas pesadas ao explodir.'",

  "'Granizo'": "'Granizo'",
  "'Bolas de hielo caen sobre los enemigos y los frenan.'": "'Pedras de gelo despencam do céu congelando e desacelerando inimigos.'",

  "'Puño Meteoro'": "'Meteoro de Metal'",
  "'Dos meteoros de acero que aplastan donde caen.'": "'Projéteis meteóricos de aço que esmagam onde caem.'",

  "'Fuego Fatuo'": "'Fogo Fátuo'",
  "'Deja una llama flotante que dispara sola y quema.'": "'Invoca uma chama etérea flutuante que atira sozinha e incendeia inimigos.'",

  "'Sustituto'": "'Substituto'",
  "'Un muñeco que se queda disparando por ti.'": "'Um boneco chamariz que atira continuamente ao seu lado.'",

  "'Golpe Aéreo'": "'Ás dos Ares'",
  "'Te lanzas en picado y cortas todo lo que cruzas.'": "'Mergulho cortante veloz em linha reta sem sofrer dano.'",

  "'Rueda Fuego'": "'Roda de Fogo'",
  "'Corres envuelto en fuego y dejas un rastro de llamas.'": "'Corre envolto em chamas incandescentes deixando um rastro de brasas.'",

  "'Rayo Burbuja'": "'Jato de Bolhas'",
  "'Chorro de burbujas en abanico corto que frena.'": "'Torrente de bolhas em leque curto que desacelera inimigos.'",

  "'Infortunio'": "'Feitiço'",
  "'Maldición que salta entre enemigos. Mucho más daño si están quemados, envenenados o frenados.'": "'Maldição encadeada que salta entre inimigos. Causa dano massivo a quem estiver com queimadura, veneno ou lentidão.'",

  // EVO names
  "'Derribo'": "'Derrubada'",
  "'Velocidad Extrema'": "'Velocidade Extrema'",
  "'Gigaimpacto'": "'Giga Impacto'",
  "'Alboroto'": "'Algazarra'",
  "'Llamarada'": "'Labareda'",
  "'Sofoco'": "'Superaquecimento'",
  "'Fuego Sagrado'": "'Fogo Sagrado'",
  "'Erupción'": "'Erupção'",
  "'Escaldar'": "'Escaldar'",
  "'Surf'": "'Surfar'",
  "'Hidrocañón'": "'Hidro Canhão'",
  "'Latigazo'": "'Chicote Poderoso'",
  "'Lluevehojas'": "'Tempestade Floral'",
  "'Danza Pétalo'": "'Dança das Pétalas'",
  "'Planta Feroz'": "'Planta Feroz'",
  "'Trueno'": "'Trovão'",
  "'Campo Eléctrico'": "'Campo Elétrico'",
  "'Electrocañón'": "'Eletrocanhão'",
  "'Psicocarga'": "'Carga Psíquica'",
  "'Premonición'": "'Premonição'",
  "'Vasta Fuerza'": "'Vasta Força'",
  "'Bomba Lodo'": "'Bomba de Lodo'",
  "'Puya Nociva'": "'Golpe Venenoso'",
  "'Gas Venenoso'": "'Gás Venenoso'",
  "'Tierra Viva'": "'Poder da Terra'",
  "'Terremoto'": "'Terremoto'",
  "'Vendaval'": "'Vendaval'",
  "'Pájaro Osado'": "'Pássaro Bravo'",
  "'Tijera X'": "'Tesoura X'",
  "'Red Viscosa'": "'Teia Pegajosa'",
  "'Enjambre'": "'Enxame'",
  "'Roca Afilada'": "'Gume de Pedra'",
  "'Trampa Rocas'": "'Pedras Furtivas'",
  "'Ventisca'": "'Nevasca'",
  "'Viento Hielo'": "'Vento Congelante'",
  "'A Bocajarro'": "'Combate Próximo'",
  "'Onda Certera'": "'Explosão Focalizada'",
  "'Puño Sombra'": "'Punho Sombrio'",
  "'Golpe Fantasma'": "'Força Fantasma'",
  "'Cometa Draco'": "'Meteoro do Dragão'",
  "'Fuerza Lunar'": "'Poder Lunar'",
  "'Campo de Niebla'": "'Campo de Névoa'",
  "'Cabeza de Hierro'": "'Cabeça de Ferro'",
  "'Rayo Metálico'": "'Raio Metálico'",
  "'Triturar'": "'Triturar'",
  "'Alarido'": "'Rosnado'",
  "'Pesadilla'": "'Pesadelo'",
  "'Ataque Óseo'": "'Ossomerangue'",
  "'Psicocolmillo'": "'Presas Psíquicas'",
  "'Fisura'": "'Fissura'",
  "'Lanza Mugre'": "'Arremesso Tóxico'",
  "'Alud'": "'Avalanche'",
  "'Bomba Imán'": "'Bomba Magnética'",
  "'Infierno'": "'Inferno'",
  "'Doble Equipo'": "'Equipe Dupla'",
  "'Acróbata'": "'Acrobata'",
  "'Envite Ígneo'": "'Carga de Chamas'",
  "'Acua Cola'": "'Cauda d\\'Água'",
  "'Poltergeist'": "'Poltergeist'"
};

let count = 0;
for (const [from, to] of Object.entries(translations)) {
  if (content.includes(from)) {
    content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    count++;
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Substituições efetuadas em ' + file + ': ' + count);
