import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reproduzir',
    pause: 'Pausar',
    replay: 'Reiniciar',
    mute: 'Desativar som',
    unmute: 'Ativar som',
  },
  seek: {
    forward: 'Avançar {seconds} segundos',
    backward: 'Recuar {seconds} segundos',
  },
  fullscreen: {
    enter: 'Ecrã inteiro',
    exit: 'Sair do ecrã inteiro',
  },
  captions: {
    enable: 'Ativar legendas',
    disable: 'Desativar legendas',
  },
  pip: {
    enter: 'Imagem em imagem',
    exit: 'Sair do modo de imagem em imagem',
  },
  live: {
    playing: 'A reproduzir em direto',
    seekToEdge: 'Ir para a emissão em direto',
    badge: 'Em direto',
  },
  cast: {
    start: 'Iniciar transmissão',
    stop: 'Parar transmissão',
    connecting: 'A ligar',
  },
  airplay: {
    start: 'Iniciar AirPlay',
    stop: 'Parar AirPlay',
  },
  slider: {
    seek: 'Procurar',
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
    unknown: 'Conteúdo multimédia não carregado, tempo desconhecido.',
  },
  playback: {
    rate: 'Velocidade de reprodução, {rate}',
  },
  volume: {
    mutedValue: '{percent}, sem som',
    muted: 'Sem som',
    label: 'Nível de volume',
    value: 'Nível de volume {value}',
  },
  status: {
    captionsOn: 'Legendas ativadas',
    captionsOff: 'Legendas desativadas',
    paused: 'Em pausa',
    playing: 'A reproduzir',
    fullscreen: 'Ecrã inteiro',
    pip: 'Imagem em imagem',
    exitPip: 'Sair do modo de imagem em imagem',
    seekedTo: 'Posição alterada para {time}',
  },
  container: {
    label: 'Leitor multimédia',
  },
  errors: {
    aborted: 'Parou a reprodução do conteúdo multimédia antes de esta terminar.',
    network: 'Não foi possível carregar este conteúdo multimédia devido a um problema de rede ou do servidor.',
    decode:
      'Não foi possível reproduzir este conteúdo multimédia. Pode estar danificado ou o seu navegador pode não suportar o formato.',
    source:
      'Não foi possível carregar este conteúdo multimédia. Pode estar indisponível ou o seu navegador pode não suportar o formato.',
    encrypted: 'Não foi possível reproduzir este conteúdo multimédia porque não foi possível desencriptá-lo.',
    unplayable: 'Este conteúdo multimédia não é suportado pelo leitor.',
    title: 'Algo correu mal.',
    unexpected: 'Ocorreu um erro inesperado.',
  },
  common: {
    empty: '',
    ok: 'Fechar',
  },
  menu: {
    settings: 'Definições',
    quality: 'Qualidade',
    audio: 'Áudio',
    default: 'Predefinição',
    speed: 'Velocidade',
    captions: 'Legendas',
    playbackRate: 'Velocidade de reprodução',
    back: 'Voltar',
    off: 'Desativado',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Legendas',
  },
} as const satisfies Translations;
