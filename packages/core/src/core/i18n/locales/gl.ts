import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reproducir',
    pause: 'Pausa',
    replay: 'Repetir',
    mute: 'Silenciar',
    unmute: 'Activar o son',
  },
  seek: {
    forward: 'Avanzar {seconds} segundos',
    backward: 'Retroceder {seconds} segundos',
  },
  fullscreen: {
    enter: 'Pantalla completa',
    exit: 'Saír da pantalla completa',
  },
  captions: {
    enable: 'Activar subtítulos',
    disable: 'Desactivar subtítulos',
  },
  pip: {
    enter: 'Imaxe en imaxe',
    exit: 'Saír de imaxe en imaxe',
  },
  live: {
    playing: 'Reproducindo en directo',
    seekToEdge: 'Ir ao directo',
    badge: 'En directo',
  },
  cast: {
    start: 'Iniciar emisión',
    stop: 'Deter emisión',
    connecting: 'Conectando',
  },
  airplay: {
    start: 'Iniciar AirPlay',
    stop: 'Deter AirPlay',
  },
  slider: {
    seek: 'Buscar',
  },
  time: {
    current: 'Tempo reproducido',
    duration: 'Duración',
    remaining: 'Tempo restante',
    elapsedSuffix: '{duration} de tempo transcorrido',
    durationSuffix: '{duration} de duración',
    remainingSuffix: 'Quedan {duration}',
    showElapsed: 'Amosar tempo transcorrido, {duration}.',
    showDuration: 'Amosar duración, {duration}.',
    showRemaining: 'Amosar tempo restante, {duration}.',
    toggleElapsed: 'Alternar entre o tempo transcorrido e o tempo restante.',
    toggleDuration: 'Alternar entre a duración e o tempo restante.',
    position: '{current} de {duration}',
    unknown: 'Contido multimedia non cargado, tempo descoñecido.',
  },
  playback: {
    rate: 'Velocidade de reprodución, {rate}',
  },
  volume: {
    mutedValue: '{percent}, silenciado',
    muted: 'Silenciado',
    label: 'Nivel do volume',
    value: 'Nivel do volume {value}',
  },
  status: {
    captionsOn: 'Subtítulos activados',
    captionsOff: 'Subtítulos desactivados',
    paused: 'En pausa',
    playing: 'Reproducindo',
    fullscreen: 'Pantalla completa',
    pip: 'Imaxe en imaxe',
    exitPip: 'Saír de imaxe en imaxe',
    seekedTo: 'Saltouse a {time}',
  },
  container: {
    label: 'Reprodutor multimedia',
  },
  errors: {
    aborted: 'Vostede detivo a reprodución do contido multimedia antes de que rematase.',
    network: 'Non foi posíbel cargar este contido multimedia por mor dun problema de rede ou do servidor.',
    decode:
      'Non foi posíbel reproducir este contido multimedia. Pode que estea danado ou que o seu navegador non admita o seu formato.',
    source:
      'Non foi posíbel cargar este contido multimedia. Pode que non estea dispoñíbel ou que o seu navegador non admita o seu formato.',
    encrypted: 'Non foi posíbel reproducir este contido multimedia porque non se puido descifrar.',
    unplayable: 'O reprodutor non admite este contido multimedia.',
    title: 'Algo saíu mal.',
    unexpected: 'Produciuse un erro inesperado.',
  },
  common: {
    empty: '',
    ok: 'Pechar',
  },
  menu: {
    settings: 'Axustes',
    quality: 'Calidade',
    audio: 'Son',
    default: 'Predeterminado',
    speed: 'Velocidade',
    captions: 'Subtítulos para xordos',
    playbackRate: 'Velocidade de reprodución',
    customRate: 'Velocidade personalizada, {rate}',
    back: 'Atrás',
    off: 'Desactivado',
    auto: 'Automático',
    autoWithLabel: 'Automático ({label})',
    subtitles: 'Subtítulos',
  },
} as const satisfies Translations;
