import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Afspelen',
    pause: 'Pauzeren',
    replay: 'Opnieuw afspelen',
    mute: 'Dempen',
    unmute: 'Dempen opheffen',
  },
  seek: {
    forward: '{seconds} seconden vooruit',
    backward: '{seconds} seconden terug',
  },
  fullscreen: {
    enter: 'Volledig scherm',
    exit: 'Volledig scherm verlaten',
  },
  captions: {
    enable: 'Ondertiteling inschakelen',
    disable: 'Ondertiteling uitschakelen',
  },
  pip: {
    enter: 'Beeld-in-beeld starten',
    exit: 'Beeld-in-beeld stoppen',
  },
  live: {
    playing: 'Wordt live afgespeeld',
    seekToEdge: 'Naar de livestream gaan',
    badge: 'Live',
  },
  cast: {
    start: 'Casten starten',
    stop: 'Casten stoppen',
    connecting: 'Verbinden',
  },
  airplay: {
    start: 'AirPlay starten',
    stop: 'AirPlay stoppen',
  },
  slider: {
    seek: 'Spoelen',
  },
  time: {
    current: 'Huidige tijd',
    duration: 'Tijdsduur',
    remaining: 'Resterende tijd',
    elapsedSuffix: '{duration} verstreken',
    durationSuffix: '{duration} totaal',
    remainingSuffix: 'Nog {duration}',
    showElapsed: 'Verstreken tijd tonen, {duration}.',
    showDuration: 'Duur tonen, {duration}.',
    showRemaining: 'Resterende tijd tonen, {duration}.',
    toggleElapsed: 'Schakelen tussen verstreken en resterende tijd.',
    toggleDuration: 'Schakelen tussen duur en resterende tijd.',
    position: '{current} van {duration}',
    unknown: 'Media niet geladen, onbekende tijd.',
  },
  playback: {
    rate: 'Afspeelsnelheid, {rate}',
  },
  volume: {
    mutedValue: '{percent}, gedempt',
    muted: 'Gedempt',
    label: 'Geluidsniveau',
    value: 'Geluidsniveau {value}',
  },
  status: {
    captionsOn: 'Ondertiteling aan',
    captionsOff: 'Ondertiteling uit',
    paused: 'Gepauzeerd',
    playing: 'Wordt afgespeeld',
    fullscreen: 'Volledig scherm',
    pip: 'Beeld-in-beeld',
    exitPip: 'Beeld-in-beeld stoppen',
    seekedTo: 'Gesprongen naar {time}',
  },
  container: {
    label: 'Mediaspeler',
  },
  errors: {
    aborted: 'U heeft het afspelen van de media gestopt voordat deze was afgelopen.',
    network: 'Deze media kon niet worden geladen vanwege een netwerk- of serverprobleem.',
    decode:
      'Deze media kon niet worden afgespeeld. Mogelijk is het bestand beschadigd of ondersteunt uw browser de indeling niet.',
    source:
      'Deze media kon niet worden geladen. Mogelijk is deze niet beschikbaar of ondersteunt uw browser de indeling niet.',
    encrypted: 'Deze media kon niet worden afgespeeld omdat deze niet kon worden ontsleuteld.',
    unplayable: 'Deze media wordt niet ondersteund door de speler.',
    title: 'Er is iets misgegaan.',
    unexpected: 'Er is een onverwachte fout opgetreden.',
  },
  common: {
    empty: '',
    ok: 'Sluiten',
  },
  menu: {
    settings: 'Instellingen',
    quality: 'Kwaliteit',
    audio: 'Audio',
    default: 'Standaard',
    speed: 'Snelheid',
    captions: 'Ondertiteling',
    playbackRate: 'Afspeelsnelheid',
    back: 'Terug',
    off: 'Uit',
    auto: 'Automatisch',
    autoWithLabel: 'Automatisch ({label})',
    subtitles: 'Ondertiteling',
  },
} as const satisfies Translations;
