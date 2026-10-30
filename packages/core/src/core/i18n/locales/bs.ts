import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Pusti',
    pause: 'Pauziraj',
    replay: 'Ponovi',
    mute: 'Isključi zvuk',
    unmute: 'Uključi zvuk',
  },
  seek: {
    forward: 'Premotaj naprijed {seconds} sek.',
    backward: 'Premotaj nazad {seconds} sek.',
  },
  fullscreen: {
    enter: 'Puni ekran',
    exit: 'Izlaz iz punog ekrana',
  },
  captions: {
    enable: 'Uključi titlove',
    disable: 'Isključi titlove',
  },
  pip: {
    enter: 'Slika u slici',
    exit: 'Izlaz iz slike u slici',
  },
  live: {
    playing: 'Reprodukcija uživo',
    seekToEdge: 'Idi na prijenos uživo',
    badge: 'Uživo',
  },
  cast: {
    start: 'Pokreni emitovanje',
    stop: 'Zaustavi emitovanje',
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
    unknown: 'Medij nije učitan, vrijeme nije poznato.',
  },
  playback: {
    rate: 'Brzina reprodukcije, {rate}',
  },
  volume: {
    mutedValue: '{percent}, isključen zvuk',
    muted: 'Isključen zvuk',
    label: 'Glasnoća',
    value: 'Glasnoća {value}',
  },
  status: {
    captionsOn: 'Titlovi uključeni',
    captionsOff: 'Titlovi isključeni',
    paused: 'Pauzirano',
    playing: 'Reprodukcija',
    fullscreen: 'Puni ekran',
    pip: 'Slika u slici',
    exitPip: 'Izlaz iz slike u slici',
    seekedTo: 'Premotano: {time}',
  },
  container: {
    label: 'Medijski plejer',
  },
  errors: {
    aborted: 'Zaustavili ste reprodukciju medija prije nego što je završila.',
    network: 'Ovaj medij nije moguće učitati zbog problema s mrežom ili serverom.',
    decode: 'Ovaj medij nije moguće reproducirati. Možda je oštećen ili vaš preglednik ne podržava njegov format.',
    source: 'Ovaj medij nije moguće učitati. Možda nije dostupan ili vaš preglednik ne podržava njegov format.',
    encrypted: 'Ovaj medij nije moguće reproducirati jer ga nije moguće dešifrirati.',
    unplayable: 'Plejer ne podržava ovaj medij.',
    title: 'Nešto je pošlo po krivu.',
    unexpected: 'Došlo je do neočekivane greške.',
  },
  common: {
    empty: '',
    ok: 'OK',
  },
  menu: {
    settings: 'Postavke',
    quality: 'Kvalitet',
    audio: 'Zvuk',
    default: 'Zadano',
    speed: 'Brzina',
    captions: 'Titlovi',
    playbackRate: 'Brzina reprodukcije',
    back: 'Nazad',
    off: 'Isključeno',
    auto: 'Automatski',
    autoWithLabel: 'Automatski ({label})',
    subtitles: 'Titlovi',
  },
} as const satisfies Translations;
