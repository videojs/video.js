import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Reproduciraj',
    pause: 'Pauziraj',
    replay: 'Ponovi',
    mute: 'Isključi zvuk',
    unmute: 'Uključi zvuk',
  },
  seek: {
    forward: 'Preskoči naprijed {seconds} sek.',
    backward: 'Preskoči unatrag {seconds} sek.',
  },
  fullscreen: {
    enter: 'Cijeli zaslon',
    exit: 'Izađi iz cijelog zaslona',
  },
  captions: {
    enable: 'Uključi titlove',
    disable: 'Isključi titlove',
  },
  pip: {
    enter: 'Slika u slici',
    exit: 'Izađi iz slike u slici',
  },
  live: {
    playing: 'Reprodukcija uživo',
    seekToEdge: 'Prijeđi na prijenos uživo',
    badge: 'Uživo',
  },
  cast: {
    start: 'Pokreni emitiranje',
    stop: 'Zaustavi emitiranje',
    connecting: 'Povezivanje',
  },
  airplay: {
    start: 'Pokreni AirPlay',
    stop: 'Zaustavi AirPlay',
  },
  slider: {
    seek: 'Premotavanje',
  },
  time: {
    current: 'Trenutno vrijeme',
    duration: 'Vrijeme trajanja',
    remaining: 'Preostalo vrijeme',
    elapsedSuffix: '{duration} proteklog vremena',
    durationSuffix: '{duration} trajanja',
    remainingSuffix: 'Preostalo {duration}',
    showElapsed: 'Prikaži proteklo vrijeme, {duration}.',
    showDuration: 'Prikaži trajanje, {duration}.',
    showRemaining: 'Prikaži preostalo vrijeme, {duration}.',
    toggleElapsed: 'Prebacivanje između proteklog i preostalog vremena.',
    toggleDuration: 'Prebacivanje između trajanja i preostalog vremena.',
    position: '{current} / {duration}',
    unknown: 'Medijski sadržaj nije učitan, vrijeme nije poznato.',
  },
  playback: {
    rate: 'Brzina reprodukcije, {rate}',
  },
  volume: {
    mutedValue: '{percent}, utišano',
    muted: 'Utišano',
    label: 'Glasnoća',
    value: 'Glasnoća {value}',
  },
  status: {
    captionsOn: 'Titlovi uključeni',
    captionsOff: 'Titlovi isključeni',
    paused: 'Pauzirano',
    playing: 'Reproducira se',
    fullscreen: 'Cijeli zaslon',
    pip: 'Slika u slici',
    exitPip: 'Izađi iz slike u slici',
    seekedTo: 'Premotano: {time}',
  },
  container: {
    label: 'Medijski reproduktor',
  },
  errors: {
    aborted: 'Zaustavili ste reprodukciju medijskog sadržaja prije završetka.',
    network: 'Ovaj medijski sadržaj nije moguće učitati zbog problema s mrežom ili poslužiteljem.',
    decode:
      'Ovaj medijski sadržaj nije moguće reproducirati. Možda je oštećen ili vaš preglednik ne podržava njegov format.',
    source:
      'Ovaj medijski sadržaj nije moguće učitati. Možda nije dostupan ili vaš preglednik ne podržava njegov format.',
    encrypted: 'Ovaj medijski sadržaj nije moguće reproducirati jer ga nije moguće dešifrirati.',
    unplayable: 'Reproduktor ne podržava ovaj medijski sadržaj.',
    title: 'Nešto je pošlo po zlu.',
    unexpected: 'Došlo je do neočekivane pogreške.',
  },
  common: {
    empty: '',
    ok: 'Zatvori',
  },
  menu: {
    settings: 'Postavke',
    quality: 'Kvaliteta',
    audio: 'Zvuk',
    default: 'Zadano',
    speed: 'Brzina',
    captions: 'Titlovi',
    playbackRate: 'Brzina reprodukcije',
    back: 'Natrag',
    off: 'Isključeno',
    auto: 'Automatski',
    autoWithLabel: 'Automatski ({label})',
    subtitles: 'Titlovi',
  },
} as const satisfies Translations;
