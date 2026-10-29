import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Afspil',
    pause: 'Pause',
    replay: 'Afspil igen',
    mute: 'Slå lyden fra',
    unmute: 'Slå lyden til',
  },
  seek: {
    forward: 'Spring {seconds} sekunder frem',
    backward: 'Spring {seconds} sekunder tilbage',
  },
  fullscreen: {
    enter: 'Fuld skærm',
    exit: 'Afslut fuld skærm',
  },
  captions: {
    enable: 'Aktivér undertekster',
    disable: 'Deaktivér undertekster',
  },
  pip: {
    enter: 'Billede i billede',
    exit: 'Afslut billede i billede',
  },
  live: {
    playing: 'Afspiller live',
    seekToEdge: 'Gå til live',
    badge: 'Live',
  },
  cast: {
    start: 'Start cast',
    stop: 'Stop cast',
    connecting: 'Forbinder',
  },
  airplay: {
    start: 'Start AirPlay',
    stop: 'Stop AirPlay',
  },
  slider: {
    seek: 'Spol',
  },
  time: {
    current: 'Aktuel tid',
    duration: 'Varighed',
    remaining: 'Resterende tid',
    elapsedSuffix: '{duration} forløbet tid',
    durationSuffix: '{duration} varighed',
    remainingSuffix: '{duration} tilbage',
    showElapsed: 'Vis forløbet tid, {duration}.',
    showDuration: 'Vis varighed, {duration}.',
    showRemaining: 'Vis resterende tid, {duration}.',
    toggleElapsed: 'Skift mellem forløbet og resterende tid.',
    toggleDuration: 'Skift mellem varighed og resterende tid.',
    position: '{current} af {duration}',
    unknown: 'Mediet er ikke indlæst, tidspunktet er ukendt.',
  },
  playback: {
    rate: 'Afspilningshastighed, {rate}',
  },
  volume: {
    mutedValue: '{percent}, lydløs',
    muted: 'Lydløs',
    label: 'Lydstyrke',
    value: 'Lydstyrke {value}',
  },
  status: {
    captionsOn: 'Undertekster til',
    captionsOff: 'Undertekster fra',
    paused: 'Pauseret',
    playing: 'Afspiller',
    fullscreen: 'Fuld skærm',
    pip: 'Billede i billede',
    exitPip: 'Billede i billede fra',
    seekedTo: 'Sprunget til {time}',
  },
  container: {
    label: 'Medieafspiller',
  },
  errors: {
    aborted: 'Du stoppede afspilningen af mediet, før den var færdig.',
    network: 'Mediet kunne ikke indlæses på grund af et netværks- eller serverproblem.',
    decode: 'Mediet kunne ikke afspilles. Det er muligvis beskadiget, eller din browser understøtter ikke formatet.',
    source:
      'Mediet kunne ikke indlæses. Det er muligvis ikke tilgængeligt, eller din browser understøtter ikke formatet.',
    encrypted: 'Mediet kunne ikke afspilles, fordi det ikke kunne dekrypteres.',
    unplayable: 'Denne mediefil understøttes ikke af afspilleren.',
    title: 'Noget gik galt.',
    unexpected: 'Der opstod en uventet fejl.',
  },
  common: {
    empty: '',
    ok: 'OK',
  },
  menu: {
    settings: 'Indstillinger',
    quality: 'Kvalitet',
    audio: 'Lyd',
    default: 'Standard',
    speed: 'Hastighed',
    captions: 'Undertekster',
    playbackRate: 'Afspilningshastighed',
    customRate: 'Tilpasset, {rate}',
    back: 'Tilbage',
    off: 'Fra',
    auto: 'Automatisk',
    autoWithLabel: 'Automatisk ({label})',
    subtitles: 'Undertekster',
  },
} as const satisfies Translations;
