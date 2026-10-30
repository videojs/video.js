import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Lecture',
    pause: 'Pause',
    replay: 'Revoir',
    mute: 'Couper le son',
    unmute: 'Activer le son',
  },
  seek: {
    forward: 'Avancer de {seconds} secondes',
    backward: 'Reculer de {seconds} secondes',
  },
  fullscreen: {
    enter: 'Plein écran',
    exit: 'Quitter le plein écran',
  },
  captions: {
    enable: 'Activer les sous-titres',
    disable: 'Désactiver les sous-titres',
  },
  pip: {
    enter: 'Image dans l’image',
    exit: 'Quitter le mode image dans l’image',
  },
  live: {
    playing: 'Lecture en direct',
    seekToEdge: 'Aller au direct',
    badge: 'En direct',
  },
  cast: {
    start: 'Démarrer la diffusion',
    stop: 'Arrêter la diffusion',
    connecting: 'Connexion',
  },
  airplay: {
    start: 'Démarrer AirPlay',
    stop: 'Arrêter AirPlay',
  },
  slider: {
    seek: 'Barre de lecture',
  },
  time: {
    current: 'Temps actuel',
    duration: 'Durée',
    remaining: 'Temps restant',
    elapsedSuffix: '{duration} de temps écoulé',
    durationSuffix: '{duration} de durée',
    remainingSuffix: 'Il reste {duration}',
    showElapsed: 'Afficher le temps écoulé, {duration}.',
    showDuration: 'Afficher la durée, {duration}.',
    showRemaining: 'Afficher le temps restant, {duration}.',
    toggleElapsed: 'Basculer entre le temps écoulé et le temps restant.',
    toggleDuration: 'Basculer entre la durée et le temps restant.',
    position: '{current} sur {duration}',
    unknown: 'Média non chargé, durée inconnue.',
  },
  playback: {
    rate: 'Vitesse de lecture, {rate}',
  },
  volume: {
    mutedValue: '{percent}, son coupé',
    muted: 'Son coupé',
    label: 'Niveau de volume',
    value: 'Niveau de volume {value}',
  },
  status: {
    captionsOn: 'Sous-titres activés',
    captionsOff: 'Sous-titres désactivés',
    paused: 'En pause',
    playing: 'Lecture en cours',
    fullscreen: 'Plein écran',
    pip: 'Image dans l’image',
    exitPip: 'Quitter l’image dans l’image',
    seekedTo: 'Position de lecture : {time}',
  },
  container: {
    label: 'Lecteur multimédia',
  },
  errors: {
    aborted: 'Vous avez interrompu la lecture du média avant la fin.',
    network: 'Ce média n’a pas pu être chargé en raison d’un problème de réseau ou de serveur.',
    decode:
      'Ce média n’a pas pu être lu. Il est peut-être endommagé, ou votre navigateur ne prend pas en charge son format.',
    source:
      'Ce média n’a pas pu être chargé. Il est peut-être indisponible, ou votre navigateur ne prend pas en charge son format.',
    encrypted: 'Ce média n’a pas pu être lu, car son déchiffrement a échoué.',
    unplayable: 'Ce média n’est pas pris en charge par le lecteur.',
    title: 'Une erreur s’est produite.',
    unexpected: 'Une erreur inattendue s’est produite.',
  },
  common: {
    empty: '',
    ok: 'Fermer',
  },
  menu: {
    settings: 'Paramètres',
    quality: 'Qualité',
    audio: 'Audio',
    default: 'Par défaut',
    speed: 'Vitesse',
    captions: 'Sous-titres',
    playbackRate: 'Vitesse de lecture',
    customRate: 'Personnalisée, {rate}',
    back: 'Retour',
    off: 'Désactivé',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Sous-titres',
  },
} as const satisfies Translations;
