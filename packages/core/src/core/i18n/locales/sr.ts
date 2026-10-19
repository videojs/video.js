import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Pusti',
    pause: 'Pauziraj',
    replay: 'Ponovi',
    mute: 'Utišaj',
    unmute: 'Poništi utišavanje',
  },
  seek: {
    forward: 'Premotaj unapred {seconds} sek.',
    backward: 'Premotaj unazad {seconds} sek.',
  },
  fullscreen: {
    enter: 'Režim celog ekrana',
    exit: 'Izađi iz režima celog ekrana',
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
    seekToEdge: 'Idi na prenos uživo',
    badge: 'Uživo',
  },
  cast: {
    start: 'Započni prebacivanje',
    stop: 'Zaustavi prebacivanje',
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
    current: 'Trenutno vreme',
    duration: 'Vreme trajanja',
    remaining: 'Preostalo vreme',
    elapsedSuffix: '{duration} proteklog vremena',
    durationSuffix: '{duration} trajanja',
    remainingSuffix: 'Preostalo {duration}',
    showElapsed: 'Prikaži proteklo vreme, {duration}.',
    showDuration: 'Prikaži trajanje, {duration}.',
    showRemaining: 'Prikaži preostalo vreme, {duration}.',
    toggleElapsed: 'Prebacivanje između proteklog i preostalog vremena.',
    toggleDuration: 'Prebacivanje između trajanja i preostalog vremena.',
    position: '{current} / {duration}',
    unknown: 'Medijski sadržaj nije učitan, vreme nije poznato.',
  },
  playback: {
    rate: 'Brzina reprodukcije, {rate}',
  },
  volume: {
    mutedValue: '{percent}, utišano',
    muted: 'Utišano',
    label: 'Jačina zvuka',
    value: 'Jačina zvuka {value}',
  },
  status: {
    captionsOn: 'Titlovi uključeni',
    captionsOff: 'Titlovi isključeni',
    paused: 'Pauzirano',
    playing: 'Reprodukuje se',
    fullscreen: 'Režim celog ekrana',
    pip: 'Slika u slici',
    exitPip: 'Izađi iz slike u slici',
    seekedTo: 'Premotano: {time}',
  },
  container: {
    label: 'Medija plejer',
  },
  errors: {
    aborted: 'Zaustavili ste reprodukciju medijskog sadržaja pre nego što se završila.',
    network: 'Ovaj medijski sadržaj nije moguće učitati zbog problema sa mrežom ili serverom.',
    decode:
      'Ovaj medijski sadržaj nije moguće reprodukovati. Možda je oštećen ili vaš pregledač ne podržava njegov format.',
    source:
      'Ovaj medijski sadržaj nije moguće učitati. Možda nije dostupan ili vaš pregledač ne podržava njegov format.',
    encrypted: 'Ovaj medijski sadržaj nije moguće reprodukovati jer ga nije moguće dešifrovati.',
    unplayable: 'Plejer ne podržava ovaj medijski sadržaj.',
    title: 'Nešto je pošlo po zlu.',
    unexpected: 'Došlo je do neočekivane greške.',
  },
  common: {
    empty: '',
    ok: 'Zatvori',
  },
  menu: {
    settings: 'Podešavanja',
    quality: 'Kvalitet',
    audio: 'Zvuk',
    default: 'Podrazumevano',
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
