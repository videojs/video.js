import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Spel av',
    pause: 'Pause',
    replay: 'Spel av på nytt',
    mute: 'Slå av lyden',
    unmute: 'Slå på lyden',
  },
  seek: {
    forward: 'Hopp fram {seconds} sekund',
    backward: 'Hopp tilbake {seconds} sekund',
  },
  fullscreen: {
    enter: 'Fullskjerm',
    exit: 'Avslutt fullskjerm',
  },
  captions: {
    enable: 'Slå på teksting',
    disable: 'Slå av teksting',
  },
  pip: {
    enter: 'Bilete-i-bilete',
    exit: 'Avslutt bilete-i-bilete',
  },
  live: {
    playing: 'Spelar direkte',
    seekToEdge: 'Gå til direktesendinga',
    badge: 'Direkte',
  },
  cast: {
    start: 'Start casting',
    stop: 'Stopp casting',
    connecting: 'Koplar til',
  },
  airplay: {
    start: 'Start AirPlay',
    stop: 'Stopp AirPlay',
  },
  slider: {
    seek: 'Spol',
  },
  time: {
    current: 'Aktuell tid',
    duration: 'Varigheit',
    remaining: 'Tid att',
    elapsedSuffix: '{duration} avspelt tid',
    durationSuffix: '{duration} varigheit',
    remainingSuffix: '{duration} att',
    showElapsed: 'Vis avspelt tid, {duration}.',
    showDuration: 'Vis varigheit, {duration}.',
    showRemaining: 'Vis tid att, {duration}.',
    toggleElapsed: 'Byt mellom avspelt tid og tid att.',
    toggleDuration: 'Byt mellom varigheit og tid att.',
    position: '{current} av {duration}',
    unknown: 'Mediet er ikkje lasta inn, ukjend tid.',
  },
  playback: {
    rate: 'Avspelingshastigheit, {rate}',
  },
  volume: {
    mutedValue: '{percent}, dempa',
    muted: 'Dempa',
    label: 'Volum',
    value: 'Volum {value}',
  },
  status: {
    captionsOn: 'Teksting på',
    captionsOff: 'Teksting av',
    paused: 'Sett på pause',
    playing: 'Spelar',
    fullscreen: 'Fullskjerm',
    pip: 'Bilete-i-bilete',
    exitPip: 'Bilete-i-bilete av',
    seekedTo: 'Hoppa til {time}',
  },
  container: {
    label: 'Mediespelar',
  },
  errors: {
    aborted: 'Du stoppa avspelinga av mediet før ho var ferdig.',
    network: 'Dette mediet kunne ikkje lastast inn på grunn av ein nettverks- eller serverfeil.',
    decode:
      'Dette mediet kunne ikkje spelast av. Det kan vera øydelagt, eller nettlesaren din støttar kanskje ikkje formatet.',
    source:
      'Dette mediet kunne ikkje lastast inn. Det kan vera utilgjengeleg, eller nettlesaren din støttar kanskje ikkje formatet.',
    encrypted: 'Dette mediet kunne ikkje spelast av fordi det ikkje kunne dekrypterast.',
    unplayable: 'Denne mediefila er ikkje støtta av spelaren.',
    title: 'Noko gjekk gale.',
    unexpected: 'Det oppstod ein uventa feil.',
  },
  common: {
    empty: '',
    ok: 'Lukk',
  },
  menu: {
    settings: 'Innstillingar',
    quality: 'Kvalitet',
    audio: 'Lyd',
    default: 'Standard',
    speed: 'Fart',
    captions: 'Teksting',
    playbackRate: 'Avspelingshastigheit',
    customRate: 'Tilpassa, {rate}',
    back: 'Tilbake',
    off: 'Av',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Undertekstar',
  },
} as const satisfies Translations;
