import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Chwarae',
    pause: 'Oedi',
    replay: 'Ailchwarae',
    mute: 'Tewi',
    unmute: 'Dad-dewi',
  },
  seek: {
    forward: 'Neidio ymlaen {seconds} eiliad',
    backward: 'Neidio yn ôl {seconds} eiliad',
  },
  fullscreen: {
    enter: 'Sgrin lawn',
    exit: 'Gadael sgrin lawn',
  },
  captions: {
    enable: 'Galluogi capsiynau',
    disable: 'Analluogi capsiynau',
  },
  pip: {
    enter: 'Llun mewn llun',
    exit: 'Gadael llun mewn llun',
  },
  live: {
    playing: 'Yn chwarae’n fyw',
    seekToEdge: 'Mynd i’r darllediad byw',
    badge: 'Yn fyw',
  },
  cast: {
    start: 'Dechrau darlledu i’r sgrin',
    stop: 'Stopio darlledu i’r sgrin',
    connecting: 'Cysylltu',
  },
  airplay: {
    start: 'Cychwyn AirPlay',
    stop: 'Stopio AirPlay',
  },
  slider: {
    seek: 'Safle',
  },
  time: {
    current: 'Amser cyfredol',
    duration: 'Hyd',
    remaining: 'Amser ar ôl',
    elapsedSuffix: '{duration} wedi mynd heibio',
    durationSuffix: '{duration} o hyd',
    remainingSuffix: '{duration} yn weddill',
    showElapsed: 'Dangos yr amser a aeth heibio, {duration}.',
    showDuration: 'Dangos hyd, {duration}.',
    showRemaining: "Dangos yr amser sy'n weddill, {duration}.",
    toggleElapsed: "Toglo rhwng yr amser a aeth heibio a'r amser sy'n weddill.",
    toggleDuration: "Toglo rhwng yr hyd a'r amser sy'n weddill.",
    position: '{current} o {duration}',
    unknown: "Nid yw'r cyfrwng wedi llwytho, amser anhysbys.",
  },
  playback: {
    rate: 'Cyfradd chwarae, {rate}',
  },
  volume: {
    mutedValue: '{percent}, wedi tewi',
    muted: 'Wedi tewi',
    label: 'Lefel sain',
    value: 'Lefel sain {value}',
  },
  status: {
    captionsOn: 'Capsiynau ymlaen',
    captionsOff: 'Capsiynau i ffwrdd',
    paused: 'Wedi oedi',
    playing: 'Yn chwarae',
    fullscreen: 'Sgrin lawn',
    pip: 'Llun mewn llun',
    exitPip: 'Gadael llun mewn llun',
    seekedTo: 'Wedi symud i {time}',
  },
  container: {
    label: 'Chwaraewr cyfryngau',
  },
  errors: {
    aborted: "Gwnaethoch atal chwarae'r cyfrwng cyn iddo orffen.",
    network: "Nid oedd modd llwytho'r cyfrwng hwn oherwydd problem rhwydwaith neu weinydd.",
    decode:
      "Nid oedd modd chwarae'r cyfrwng hwn. Efallai ei fod wedi'i lygru, neu efallai nad yw'ch porwr yn cefnogi ei fformat.",
    source:
      "Nid oedd modd llwytho'r cyfrwng hwn. Efallai nad yw ar gael, neu efallai nad yw'ch porwr yn cefnogi ei fformat.",
    encrypted: "Nid oedd modd chwarae'r cyfrwng hwn am nad oedd modd ei ddadgryptio.",
    unplayable: "Nid yw'r chwaraewr yn cefnogi'r cyfrwng hwn.",
    title: "Aeth rhywbeth o'i le.",
    unexpected: 'Digwyddodd gwall annisgwyl.',
  },
  common: {
    empty: '',
    ok: 'Cau',
  },
  menu: {
    settings: 'Gosodiadau',
    quality: 'Ansawdd',
    audio: 'Sain',
    default: 'Rhagosodedig',
    speed: 'Cyflymder',
    captions: 'Capsiynau',
    playbackRate: 'Cyfradd chwarae',
    back: 'Yn ôl',
    off: 'I ffwrdd',
    auto: 'Awtomatig',
    autoWithLabel: 'Awtomatig ({label})',
    subtitles: 'Isdeitlau',
  },
} as const satisfies Translations;
