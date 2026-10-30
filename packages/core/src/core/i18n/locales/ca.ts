import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reprodueix',
    pause: 'Pausa',
    replay: 'Repeteix',
    mute: 'Silencia',
    unmute: 'Activa el so',
  },
  seek: {
    forward: 'Salta endavant {seconds} segons',
    backward: 'Salta enrere {seconds} segons',
  },
  fullscreen: {
    enter: 'Pantalla completa',
    exit: 'Surt de pantalla completa',
  },
  captions: {
    enable: 'Activa els subtítols',
    disable: 'Desactiva els subtítols',
  },
  pip: {
    enter: 'Imatge en imatge',
    exit: 'Surt de la imatge en imatge',
  },
  live: {
    playing: 'Reproducció en directe',
    seekToEdge: 'Vés al directe',
    badge: 'En directe',
  },
  cast: {
    start: 'Comença a emetre',
    stop: "Atura l'emissió",
    connecting: "S'està connectant",
  },
  airplay: {
    start: 'Inicia AirPlay',
    stop: 'Atura AirPlay',
  },
  slider: {
    seek: 'Desplaçament',
  },
  time: {
    current: 'Temps actual',
    duration: 'Durada',
    remaining: 'Temps restant',
    elapsedSuffix: '{duration} de temps transcorregut',
    durationSuffix: '{duration} de durada',
    remainingSuffix: 'Queden {duration}',
    showElapsed: 'Mostra el temps transcorregut, {duration}.',
    showDuration: 'Mostra la durada, {duration}.',
    showRemaining: 'Mostra el temps restant, {duration}.',
    toggleElapsed: 'Alterna entre el temps transcorregut i el temps restant.',
    toggleDuration: 'Alterna entre la durada i el temps restant.',
    position: '{current} de {duration}',
    unknown: 'Contingut multimèdia no carregat, temps desconegut.',
  },
  playback: {
    rate: 'Velocitat de reproducció, {rate}',
  },
  volume: {
    mutedValue: '{percent}, silenciat',
    muted: 'Silenciat',
    label: 'Volum',
    value: 'Volum {value}',
  },
  status: {
    captionsOn: 'Subtítols activats',
    captionsOff: 'Subtítols desactivats',
    paused: 'En pausa',
    playing: "S'està reproduint",
    fullscreen: 'Pantalla completa',
    pip: 'Imatge en imatge',
    exitPip: 'Surt de la imatge en imatge',
    seekedTo: "S'ha saltat a {time}",
  },
  container: {
    label: 'Reproductor multimèdia',
  },
  errors: {
    aborted: 'Heu aturat la reproducció del contingut multimèdia abans que acabés.',
    network: "No s'ha pogut carregar aquest contingut multimèdia a causa d'un problema de xarxa o del servidor.",
    decode:
      "No s'ha pogut reproduir aquest contingut multimèdia. Pot ser que estigui malmès o que el navegador no n'admeti el format.",
    source:
      "No s'ha pogut carregar aquest contingut multimèdia. Pot ser que no estigui disponible o que el navegador no n'admeti el format.",
    encrypted: "No s'ha pogut reproduir aquest contingut multimèdia perquè no s'ha pogut desxifrar.",
    unplayable: 'El reproductor no admet aquest contingut multimèdia.',
    title: 'Alguna cosa ha anat malament.',
    unexpected: "S'ha produït un error inesperat.",
  },
  common: {
    empty: '',
    ok: 'Tanca',
  },
  menu: {
    settings: 'Configuració',
    quality: 'Qualitat',
    audio: 'Àudio',
    default: 'Predeterminat',
    speed: 'Velocitat',
    captions: 'Subtítols',
    playbackRate: 'Velocitat de reproducció',
    back: 'Enrere',
    off: 'Desactivat',
    auto: 'Automàtic',
    autoWithLabel: 'Automàtic ({label})',
    subtitles: 'Subtítols',
  },
} as const satisfies Translations;
