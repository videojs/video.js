import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reproduzir',
    pause: 'Pausar',
    replay: 'Reproduzir novamente',
    mute: 'Silenciar',
    unmute: 'Ativar o som',
  },
  seek: {
    forward: 'Avançar {seconds} segundos',
    backward: 'Retroceder {seconds} segundos',
  },
  fullscreen: {
    enter: 'Entrar em tela cheia',
    exit: 'Sair da tela cheia',
  },
  captions: {
    enable: 'Ativar legendas',
    disable: 'Desativar legendas',
  },
  pip: {
    enter: 'Entrar em picture-in-picture',
    exit: 'Sair do picture-in-picture',
  },
  live: {
    playing: 'Reproduzindo ao vivo',
    seekToEdge: 'Ir para a transmissão ao vivo',
    badge: 'Ao vivo',
  },
  cast: {
    start: 'Iniciar transmissão',
    stop: 'Parar transmissão',
    connecting: 'Conectando',
  },
  airplay: {
    start: 'Iniciar AirPlay',
    stop: 'Parar AirPlay',
  },
  slider: {
    seek: 'Buscar',
  },
  time: {
    current: 'Tempo atual',
    duration: 'Duração',
    remaining: 'Tempo restante',
    elapsedSuffix: '{duration} de tempo decorrido',
    durationSuffix: '{duration} de duração',
    remainingSuffix: 'Restam {duration}',
    showElapsed: 'Mostrar tempo decorrido, {duration}.',
    showDuration: 'Mostrar duração, {duration}.',
    showRemaining: 'Mostrar tempo restante, {duration}.',
    toggleElapsed: 'Alternar entre o tempo decorrido e o tempo restante.',
    toggleDuration: 'Alternar entre a duração e o tempo restante.',
    position: '{current} de {duration}',
    unknown: 'Mídia não carregada, o tempo é desconhecido.',
  },
  playback: {
    rate: 'Velocidade de reprodução, {rate}',
  },
  volume: {
    mutedValue: '{percent}, silenciado',
    muted: 'Silenciado',
    label: 'Nível de volume',
    value: 'Nível de volume {value}',
  },
  status: {
    captionsOn: 'Legendas ativadas',
    captionsOff: 'Legendas desativadas',
    paused: 'Pausado',
    playing: 'Reproduzindo',
    fullscreen: 'Tela cheia',
    pip: 'Picture-in-picture',
    exitPip: 'Sair do picture-in-picture',
    seekedTo: 'Posição alterada para {time}',
  },
  container: {
    label: 'Reprodutor de mídia',
  },
  errors: {
    aborted: 'Você interrompeu a reprodução da mídia antes de ela terminar.',
    network: 'Não foi possível carregar esta mídia devido a um problema de rede ou do servidor.',
    decode:
      'Não foi possível reproduzir esta mídia. Ela pode estar corrompida ou seu navegador pode não suportar o formato.',
    source:
      'Não foi possível carregar esta mídia. Ela pode estar indisponível ou seu navegador pode não suportar o formato.',
    encrypted: 'Não foi possível reproduzir esta mídia porque não foi possível descriptografá-la.',
    unplayable: 'Esta mídia não é suportada pelo reprodutor.',
    title: 'Algo deu errado.',
    unexpected: 'Ocorreu um erro inesperado.',
  },
  common: {
    empty: '',
    ok: 'Fechar',
  },
  menu: {
    settings: 'Configurações',
    quality: 'Qualidade',
    audio: 'Áudio',
    default: 'Padrão',
    speed: 'Velocidade',
    captions: 'Legendas',
    playbackRate: 'Velocidade de reprodução',
    customRate: 'Personalizada, {rate}',
    back: 'Voltar',
    off: 'Desativado',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Legendas',
  },
} as const satisfies Translations;
