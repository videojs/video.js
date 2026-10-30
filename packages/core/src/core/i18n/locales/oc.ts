import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Legir',
    pause: 'Pausa',
    replay: 'Tornar legir',
    mute: 'Copar lo son',
    unmute: 'Restablir lo son',
  },
  seek: {
    forward: 'Avançar de {seconds} segondas',
    backward: 'Recular de {seconds} segondas',
  },
  fullscreen: {
    enter: 'Ecran complèt',
    exit: "Sortir de l'ecran complèt",
  },
  captions: {
    enable: 'Activar las legendas',
    disable: 'Desactivar las legendas',
  },
  pip: {
    enter: 'Vidèo incrustada',
    exit: 'Sortir de la vidèo incrustada',
  },
  live: {
    playing: 'Lectura dirècta',
    seekToEdge: 'Anar al dirècte',
    badge: 'Dirècte',
  },
  cast: {
    start: 'Aviar la difusion',
    stop: 'Aturar la difusion',
    connecting: 'Connexion en cors',
  },
  airplay: {
    start: 'Aviar AirPlay',
    stop: 'Arrestar AirPlay',
  },
  slider: {
    seek: 'Posicion',
  },
  time: {
    current: 'Temps actual',
    duration: 'Durada',
    remaining: 'Temps restant',
    elapsedSuffix: '{duration} de temps passat',
    durationSuffix: '{duration} de durada',
    remainingSuffix: 'Demòra {duration}',
    showElapsed: 'Afichar lo temps passat, {duration}.',
    showDuration: 'Afichar la durada, {duration}.',
    showRemaining: 'Afichar lo temps que demòra, {duration}.',
    toggleElapsed: 'Alternar entre lo temps passat e lo temps que demòra.',
    toggleDuration: 'Alternar entre la durada e lo temps que demòra.',
    position: '{current} sus {duration}',
    unknown: 'Mèdia pas cargat, temps desconegut.',
  },
  playback: {
    rate: 'Velocitat de lectura, {rate}',
  },
  volume: {
    mutedValue: '{percent}, silenciat',
    muted: 'Silenciat',
    label: 'Volum',
    value: 'Volum {value}',
  },
  status: {
    captionsOn: 'Legendas activadas',
    captionsOff: 'Legendas desactivadas',
    paused: 'En pausa',
    playing: 'En lectura',
    fullscreen: 'Ecran complèt',
    pip: 'Vidèo incrustada',
    exitPip: 'Sortir de la vidèo incrustada',
    seekedTo: 'Avançat fins a {time}',
  },
  container: {
    label: 'Lector multimèdia',
  },
  errors: {
    aborted: 'Avètz copat la lectura del mèdia abans la fin.',
    network: "Aqueste mèdia a pas pogut èsser cargat a causa d'un problèma de ret o de servidor.",
    decode:
      "Aqueste mèdia a pas pogut èsser legit. Benlèu qu'es damatjat, o que vòstre navegador pren pas en carga son format.",
    source:
      "Aqueste mèdia a pas pogut èsser cargat. Benlèu qu'es indisponible, o que vòstre navegador pren pas en carga son format.",
    encrypted: 'Aqueste mèdia a pas pogut èsser legit perque son deschiframent a fracassat.',
    unplayable: 'Aqueste mèdia es pas pres en carga pel lector.',
    title: "Quaucarèn s'es mal passat.",
    unexpected: "Una error inesperada s'es produsida.",
  },
  common: {
    empty: '',
    ok: 'Tampar',
  },
  menu: {
    settings: 'Paramètres',
    quality: 'Qualitat',
    audio: 'Àudio',
    default: 'Per defaut',
    speed: 'Velocitat',
    captions: 'Legendas',
    playbackRate: 'Velocitat de lectura',
    back: 'Retorn',
    off: 'Desactivat',
    auto: 'Automatic',
    autoWithLabel: 'Automatic ({label})',
    subtitles: 'Sostítols',
  },
} as const satisfies Translations;
