import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Erreproduzitu',
    pause: 'Pausatu',
    replay: 'Erreproduzitu berriro',
    mute: 'Mututu soinua',
    unmute: 'Aktibatu soinua',
  },
  seek: {
    forward: 'Joan aurrera {seconds} segundo',
    backward: 'Joan atzera {seconds} segundo',
  },
  fullscreen: {
    enter: 'Pantaila osoa',
    exit: 'Irten pantaila osotik',
  },
  captions: {
    enable: 'Aktibatu azpitituluak',
    disable: 'Desaktibatu azpitituluak',
  },
  pip: {
    enter: 'Irudiz irudi',
    exit: 'Irten irudiz irudi modutik',
  },
  live: {
    playing: 'Zuzenean erreproduzitzen',
    seekToEdge: 'Joan zuzeneko emisiora',
    badge: 'Zuzenean',
  },
  cast: {
    start: 'Hasi transmititzen',
    stop: 'Gelditu transmititzea',
    connecting: 'Konektatzen',
  },
  airplay: {
    start: 'Hasi AirPlay',
    stop: 'Gelditu AirPlay',
  },
  slider: {
    seek: 'Kokapena',
  },
  time: {
    current: 'Uneko denbora',
    duration: 'Iraupena',
    remaining: 'Gelditzen den denbora',
    elapsedSuffix: '{duration} igarotako denbora',
    durationSuffix: '{duration} iraupena',
    remainingSuffix: 'Geratzen den {duration}',
    showElapsed: 'Erakutsi igarotako denbora, {duration}.',
    showDuration: 'Erakutsi iraupena, {duration}.',
    showRemaining: 'Erakutsi geratzen den denbora, {duration}.',
    toggleElapsed: 'Txandakatu igarotako denboraren eta geratzen den denboraren artean.',
    toggleDuration: 'Txandakatu iraupenaren eta geratzen den denboraren artean.',
    position: '{current} / {duration}',
    unknown: 'Multimedia ez da kargatu, denbora ezezaguna.',
  },
  playback: {
    rate: 'Erreprodukzio-abiadura {rate}',
  },
  volume: {
    mutedValue: '{percent}, mutututa',
    muted: 'Mutututa',
    label: 'Bolumena',
    value: 'Bolumena {value}',
  },
  status: {
    captionsOn: 'Azpitituluak aktibatuta',
    captionsOff: 'Azpitituluak desaktibatuta',
    paused: 'Pausatuta',
    playing: 'Erreproduzitzen',
    fullscreen: 'Pantaila osoa',
    pip: 'Irudiz irudi',
    exitPip: 'Irten irudiz irudi modutik',
    seekedTo: '{time} denborara jauzi egin da',
  },
  container: {
    label: 'Multimedia-erreproduzitzailea',
  },
  errors: {
    aborted: 'Multimediaren erreprodukzioa gelditu duzu amaitu baino lehen.',
    network: 'Ezin izan da multimedia hau kargatu, sareko edo zerbitzariko arazo baten ondorioz.',
    decode:
      'Ezin izan da multimedia hau erreproduzitu. Baliteke hondatuta egotea edo nabigatzaileak formatu hori ez onartzea.',
    source:
      'Ezin izan da multimedia hau kargatu. Baliteke erabilgarri ez egotea edo nabigatzaileak formatu hori ez onartzea.',
    encrypted: 'Ezin izan da multimedia hau erreproduzitu, ezin izan delako deszifratu.',
    unplayable: 'Erreproduzitzaileak ez du multimedia hau onartzen.',
    title: 'Zerbait gaizki joan da.',
    unexpected: 'Ustekabeko errore bat gertatu da.',
  },
  common: {
    empty: '',
    ok: 'Itxi',
  },
  menu: {
    settings: 'Ezarpenak',
    quality: 'Kalitatea',
    audio: 'Audioa',
    default: 'Lehenetsia',
    speed: 'Abiadura',
    captions: 'Azpitituluak',
    playbackRate: 'Erreprodukzio-abiadura',
    back: 'Atzera',
    off: 'Desaktibatuta',
    auto: 'Automatikoa',
    autoWithLabel: 'Automatikoa ({label})',
    subtitles: 'Azpitituluak',
  },
} as const satisfies Translations;
