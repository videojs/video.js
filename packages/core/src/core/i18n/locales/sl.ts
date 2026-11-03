import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Predvajaj',
    pause: 'Začasno ustavi',
    replay: 'Predvajaj ponovno',
    mute: 'Izklopi zvok',
    unmute: 'Vklopi zvok',
  },
  seek: {
    forward: 'Preskoči naprej {seconds} sek.',
    backward: 'Preskoči nazaj {seconds} sek.',
  },
  fullscreen: {
    enter: 'Celozaslonski prikaz',
    exit: 'Izhod iz celozaslonskega prikaza',
  },
  captions: {
    enable: 'Vklopi podnapise',
    disable: 'Izklopi podnapise',
  },
  pip: {
    enter: 'Slika v sliki',
    exit: 'Izhod iz slike v sliki',
  },
  live: {
    playing: 'Predvajanje v živo',
    seekToEdge: 'Skoči na predvajanje v živo',
    badge: 'V živo',
  },
  cast: {
    start: 'Začni predvajanje na zaslonu',
    stop: 'Ustavi predvajanje na zaslonu',
    connecting: 'Povezovanje',
  },
  airplay: {
    start: 'Zaženi AirPlay',
    stop: 'Ustavi AirPlay',
  },
  slider: {
    seek: 'Premikanje',
  },
  time: {
    current: 'Trenutni čas',
    duration: 'Trajanje',
    remaining: 'Preostali čas',
    elapsedSuffix: '{duration} preteklega časa',
    durationSuffix: '{duration} trajanja',
    remainingSuffix: 'Preostane {duration}',
    showElapsed: 'Prikaži pretekli čas, {duration}.',
    showDuration: 'Prikaži trajanje, {duration}.',
    showRemaining: 'Prikaži preostali čas, {duration}.',
    toggleElapsed: 'Preklopi med preteklim in preostalim časom.',
    toggleDuration: 'Preklopi med trajanjem in preostalim časom.',
    position: '{current} / {duration}',
    unknown: 'Predstavnostna vsebina se ni naložila, čas ni znan.',
  },
  playback: {
    rate: 'Hitrost predvajanja, {rate}',
  },
  volume: {
    mutedValue: '{percent}, zvok izklopljen',
    muted: 'Zvok izklopljen',
    label: 'Glasnost',
    value: 'Glasnost {value}',
  },
  status: {
    captionsOn: 'Podnapisi vklopljeni',
    captionsOff: 'Podnapisi izklopljeni',
    paused: 'Začasno ustavljeno',
    playing: 'Predvajanje',
    fullscreen: 'Celozaslonski prikaz',
    pip: 'Slika v sliki',
    exitPip: 'Izhod iz slike v sliki',
    seekedTo: 'Premaknjeno: {time}',
  },
  container: {
    label: 'Medijski predvajalnik',
  },
  errors: {
    aborted: 'Predvajanje predstavnostne vsebine ste prekinili, preden se je končalo.',
    network: 'Te predstavnostne vsebine ni bilo mogoče naložiti zaradi težave z omrežjem ali strežnikom.',
    decode:
      'Te predstavnostne vsebine ni bilo mogoče predvajati. Morda je poškodovana ali pa brskalnik ne podpira njene oblike zapisa.',
    source:
      'Te predstavnostne vsebine ni bilo mogoče naložiti. Morda ni na voljo ali pa brskalnik ne podpira njene oblike zapisa.',
    encrypted: 'Te predstavnostne vsebine ni bilo mogoče predvajati, ker je ni bilo mogoče dešifrirati.',
    unplayable: 'Predvajalnik ne podpira te predstavnostne vsebine.',
    title: 'Nekaj je šlo narobe.',
    unexpected: 'Prišlo je do nepričakovane napake.',
  },
  common: {
    empty: '',
    ok: 'Zapri',
  },
  menu: {
    settings: 'Nastavitve',
    quality: 'Kakovost',
    audio: 'Zvok',
    default: 'Privzeto',
    speed: 'Hitrost',
    captions: 'Podnapisi',
    playbackRate: 'Hitrost predvajanja',
    customRate: 'Po meri, {rate}',
    back: 'Nazaj',
    off: 'Izklopljeno',
    auto: 'Samodejno',
    autoWithLabel: 'Samodejno ({label})',
    subtitles: 'Podnapisi',
  },
} as const satisfies Translations;
