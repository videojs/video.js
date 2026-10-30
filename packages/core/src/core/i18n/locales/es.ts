import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reproducir',
    pause: 'Pausar',
    replay: 'Volver a reproducir',
    mute: 'Silenciar',
    unmute: 'Activar el sonido',
  },
  seek: {
    forward: 'Avanzar {seconds} segundos',
    backward: 'Retroceder {seconds} segundos',
  },
  fullscreen: {
    enter: 'Pantalla completa',
    exit: 'Salir de pantalla completa',
  },
  captions: {
    enable: 'Activar subtítulos',
    disable: 'Desactivar subtítulos',
  },
  pip: {
    enter: 'Imagen en imagen',
    exit: 'Salir de imagen en imagen',
  },
  live: {
    playing: 'Reproduciendo en directo',
    seekToEdge: 'Ir al directo',
    badge: 'Directo',
  },
  cast: {
    start: 'Iniciar transmisión',
    stop: 'Detener transmisión',
    connecting: 'Conectando',
  },
  airplay: {
    start: 'Iniciar AirPlay',
    stop: 'Detener AirPlay',
  },
  slider: {
    seek: 'Buscar',
  },
  time: {
    current: 'Tiempo reproducido',
    duration: 'Duración total',
    remaining: 'Tiempo restante',
    elapsedSuffix: '{duration} de tiempo transcurrido',
    durationSuffix: '{duration} de duración',
    remainingSuffix: 'Quedan {duration}',
    showElapsed: 'Mostrar tiempo transcurrido, {duration}.',
    showDuration: 'Mostrar duración, {duration}.',
    showRemaining: 'Mostrar tiempo restante, {duration}.',
    toggleElapsed: 'Alternar entre el tiempo transcurrido y el tiempo restante.',
    toggleDuration: 'Alternar entre la duración y el tiempo restante.',
    position: '{current} de {duration}',
    unknown: 'Contenido multimedia no cargado, tiempo desconocido.',
  },
  playback: {
    rate: 'Velocidad de reproducción, {rate}',
  },
  volume: {
    mutedValue: '{percent}, silenciado',
    muted: 'Silenciado',
    label: 'Volumen',
    value: 'Volumen {value}',
  },
  status: {
    captionsOn: 'Subtítulos activados',
    captionsOff: 'Subtítulos desactivados',
    paused: 'En pausa',
    playing: 'Reproduciendo',
    fullscreen: 'Pantalla completa',
    pip: 'Imagen en imagen',
    exitPip: 'Salir de imagen en imagen',
    seekedTo: 'Se ha saltado a {time}',
  },
  container: {
    label: 'Reproductor multimedia',
  },
  errors: {
    aborted: 'Has detenido la reproducción del contenido multimedia antes de que terminara.',
    network: 'No se ha podido cargar este contenido multimedia debido a un problema de red o del servidor.',
    decode:
      'No se ha podido reproducir este contenido multimedia. Puede que esté dañado o que tu navegador no admita su formato.',
    source:
      'No se ha podido cargar este contenido multimedia. Puede que no esté disponible o que tu navegador no admita su formato.',
    encrypted: 'No se ha podido reproducir este contenido multimedia porque no se ha podido descifrar.',
    unplayable: 'El reproductor no admite este contenido multimedia.',
    title: 'Algo ha salido mal.',
    unexpected: 'Se ha producido un error inesperado.',
  },
  common: {
    empty: '',
    ok: 'Cerrar',
  },
  menu: {
    settings: 'Configuración',
    quality: 'Calidad',
    audio: 'Audio',
    default: 'Predeterminado',
    speed: 'Velocidad',
    captions: 'Subtítulos',
    playbackRate: 'Velocidad de reproducción',
    back: 'Atrás',
    off: 'Desactivado',
    auto: 'Automático',
    autoWithLabel: 'Automático ({label})',
    subtitles: 'Subtítulos',
  },
} as const satisfies Translations;
