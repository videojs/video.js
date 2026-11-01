import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Prehrať',
    pause: 'Pozastaviť',
    replay: 'Prehrať znova',
    mute: 'Stlmiť',
    unmute: 'Zrušiť stlmenie',
  },
  seek: {
    forward: 'Posunúť dopredu o {seconds} s',
    backward: 'Posunúť dozadu o {seconds} s',
  },
  fullscreen: {
    enter: 'Režim celej obrazovky',
    exit: 'Ukončiť režim celej obrazovky',
  },
  captions: {
    enable: 'Zapnúť titulky',
    disable: 'Vypnúť titulky',
  },
  pip: {
    enter: 'Obraz v obraze',
    exit: 'Ukončiť obraz v obraze',
  },
  live: {
    playing: 'Prehráva sa naživo',
    seekToEdge: 'Prejsť na živé vysielanie',
    badge: 'Naživo',
  },
  cast: {
    start: 'Spustiť prenos',
    stop: 'Zastaviť prenos',
    connecting: 'Pripájanie',
  },
  airplay: {
    start: 'Spustiť AirPlay',
    stop: 'Zastaviť AirPlay',
  },
  slider: {
    seek: 'Posun',
  },
  time: {
    current: 'Aktuálny čas',
    duration: 'Čas trvania',
    remaining: 'Zostávajúci čas',
    elapsedSuffix: '{duration} uplynulého času',
    durationSuffix: '{duration} trvania',
    remainingSuffix: 'Zostáva {duration}',
    showElapsed: 'Zobraziť uplynulý čas, {duration}.',
    showDuration: 'Zobraziť trvanie, {duration}.',
    showRemaining: 'Zobraziť zostávajúci čas, {duration}.',
    toggleElapsed: 'Prepínanie medzi uplynulým a zostávajúcim časom.',
    toggleDuration: 'Prepínanie medzi trvaním a zostávajúcim časom.',
    position: '{current} / {duration}',
    unknown: 'Médium sa nenačítalo, čas nie je známy.',
  },
  playback: {
    rate: 'Rýchlosť prehrávania, {rate}',
  },
  volume: {
    mutedValue: '{percent}, stlmené',
    muted: 'Stlmené',
    label: 'Hlasitosť',
    value: 'Hlasitosť {value}',
  },
  status: {
    captionsOn: 'Titulky zapnuté',
    captionsOff: 'Titulky vypnuté',
    paused: 'Pozastavené',
    playing: 'Prehráva sa',
    fullscreen: 'Celá obrazovka',
    pip: 'Obraz v obraze',
    exitPip: 'Obraz v obraze vypnutý',
    seekedTo: 'Presunuté na {time}',
  },
  container: {
    label: 'Prehrávač médií',
  },
  errors: {
    aborted: 'Zastavili ste prehrávanie média pred jeho dokončením.',
    network: 'Toto médium sa nepodarilo načítať pre problém so sieťou alebo serverom.',
    decode: 'Toto médium sa nepodarilo prehrať. Môže byť poškodené alebo váš prehliadač nemusí podporovať jeho formát.',
    source:
      'Toto médium sa nepodarilo načítať. Môže byť nedostupné alebo váš prehliadač nemusí podporovať jeho formát.',
    encrypted: 'Toto médium sa nepodarilo prehrať, pretože sa ho nepodarilo dešifrovať.',
    unplayable: 'Toto médium prehrávač nepodporuje.',
    title: 'Niečo sa pokazilo.',
    unexpected: 'Vyskytla sa neočakávaná chyba.',
  },
  common: {
    empty: '',
    ok: 'Zatvoriť',
  },
  menu: {
    settings: 'Nastavenia',
    quality: 'Kvalita',
    audio: 'Zvuk',
    default: 'Predvolené',
    speed: 'Rýchlosť',
    captions: 'Titulky',
    playbackRate: 'Rýchlosť prehrávania',
    customRate: 'Vlastná, {rate}',
    back: 'Späť',
    off: 'Vypnuté',
    auto: 'Automaticky',
    autoWithLabel: 'Automaticky ({label})',
    subtitles: 'Titulky',
  },
} as const satisfies Translations;
