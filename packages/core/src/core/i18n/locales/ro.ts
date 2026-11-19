import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Redă',
    pause: 'Pauză',
    replay: 'Redă din nou',
    mute: 'Dezactivează sunetul',
    unmute: 'Activează sunetul',
  },
  seek: {
    forward: 'Derulează înainte {seconds} sec.',
    backward: 'Derulează înapoi {seconds} sec.',
  },
  fullscreen: {
    enter: 'Ecran complet',
    exit: 'Ieși din ecranul complet',
  },
  captions: {
    enable: 'Activează subtitrările',
    disable: 'Dezactivează subtitrările',
  },
  pip: {
    enter: 'Imagine în imagine',
    exit: 'Ieși din modul imagine în imagine',
  },
  live: {
    playing: 'Redare în direct',
    seekToEdge: 'Salt la direct',
    badge: 'În direct',
  },
  cast: {
    start: 'Începe proiectarea',
    stop: 'Oprește proiectarea',
    connecting: 'Se conectează',
  },
  airplay: {
    start: 'Pornește AirPlay',
    stop: 'Oprește AirPlay',
  },
  slider: {
    seek: 'Derulare',
  },
  time: {
    current: 'Timp curent',
    duration: 'Durată',
    remaining: 'Timp rămas',
    elapsedSuffix: '{duration} de timp scurs',
    durationSuffix: '{duration} durată',
    remainingSuffix: 'Mai rămân {duration}',
    showElapsed: 'Afișează timpul scurs, {duration}.',
    showDuration: 'Afișează durata, {duration}.',
    showRemaining: 'Afișează timpul rămas, {duration}.',
    toggleElapsed: 'Comută între timpul scurs și timpul rămas.',
    toggleDuration: 'Comută între durată și timpul rămas.',
    position: '{current} din {duration}',
    unknown: 'Fișierul media nu s-a încărcat, durată necunoscută.',
  },
  playback: {
    rate: 'Rată de redare, {rate}',
  },
  volume: {
    mutedValue: '{percent}, sunet dezactivat',
    muted: 'Sunet dezactivat',
    label: 'Volum',
    value: 'Volum {value}',
  },
  status: {
    captionsOn: 'Subtitrări activate',
    captionsOff: 'Subtitrări dezactivate',
    paused: 'În pauză',
    playing: 'Se redă',
    fullscreen: 'Ecran complet',
    pip: 'Imagine în imagine',
    exitPip: 'Imagine în imagine dezactivată',
    seekedTo: 'S-a trecut la {time}',
  },
  container: {
    label: 'Player media',
  },
  errors: {
    aborted: 'Ați oprit redarea conținutului media înainte de finalizare.',
    network: 'Acest conținut media nu a putut fi încărcat din cauza unei probleme de rețea sau de server.',
    decode:
      'Acest conținut media nu a putut fi redat. Este posibil să fie deteriorat sau browserul dvs. să nu accepte formatul său.',
    source:
      'Acest conținut media nu a putut fi încărcat. Este posibil să fie indisponibil sau browserul dvs. să nu accepte formatul său.',
    encrypted: 'Acest conținut media nu a putut fi redat deoarece nu a putut fi decriptat.',
    unplayable: 'Acest fișier media nu este acceptat de player.',
    title: 'Ceva nu a funcționat corect.',
    unexpected: 'A apărut o eroare neașteptată.',
  },
  common: {
    empty: '',
    ok: 'Închidere',
  },
  menu: {
    settings: 'Setări',
    quality: 'Calitate',
    audio: 'Audio',
    default: 'Implicit',
    speed: 'Viteză',
    captions: 'Subtitrări',
    playbackRate: 'Rată de redare',
    customRate: 'Personalizat, {rate}',
    back: 'Înapoi',
    off: 'Dezactivat',
    auto: 'Automat',
    autoWithLabel: 'Automat ({label})',
    subtitles: 'Subtitrări',
  },
} as const satisfies Translations;
