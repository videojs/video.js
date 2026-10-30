import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Spill av',
    pause: 'Pause',
    replay: 'Spill av på nytt',
    mute: 'Slå av lyden',
    unmute: 'Slå på lyden',
  },
  seek: {
    forward: 'Hopp frem {seconds} sekunder',
    backward: 'Hopp tilbake {seconds} sekunder',
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
    enter: 'Bilde-i-bilde',
    exit: 'Avslutt bilde-i-bilde',
  },
  live: {
    playing: 'Spiller direkte',
    seekToEdge: 'Gå til direktesendingen',
    badge: 'Direkte',
  },
  cast: {
    start: 'Start casting',
    stop: 'Stopp casting',
    connecting: 'Kobler til',
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
    duration: 'Varighet',
    remaining: 'Gjenstående tid',
    elapsedSuffix: '{duration} avspilt tid',
    durationSuffix: '{duration} varighet',
    remainingSuffix: '{duration} igjen',
    showElapsed: 'Vis avspilt tid, {duration}.',
    showDuration: 'Vis varighet, {duration}.',
    showRemaining: 'Vis gjenstående tid, {duration}.',
    toggleElapsed: 'Bytt mellom avspilt og gjenstående tid.',
    toggleDuration: 'Bytt mellom varighet og gjenstående tid.',
    position: '{current} av {duration}',
    unknown: 'Mediet er ikke lastet inn, ukjent tid.',
  },
  playback: {
    rate: 'Avspillingshastighet, {rate}',
  },
  volume: {
    mutedValue: '{percent}, dempet',
    muted: 'Dempet',
    label: 'Volum',
    value: 'Volum {value}',
  },
  status: {
    captionsOn: 'Teksting på',
    captionsOff: 'Teksting av',
    paused: 'Satt på pause',
    playing: 'Spiller',
    fullscreen: 'Fullskjerm',
    pip: 'Bilde-i-bilde',
    exitPip: 'Bilde-i-bilde av',
    seekedTo: 'Hoppet til {time}',
  },
  container: {
    label: 'Mediespiller',
  },
  errors: {
    aborted: 'Du stoppet avspillingen av mediet før den var ferdig.',
    network: 'Dette mediet kunne ikke lastes inn på grunn av en nettverks- eller serverfeil.',
    decode:
      'Dette mediet kunne ikke spilles av. Det kan være ødelagt, eller nettleseren din støtter kanskje ikke formatet.',
    source:
      'Dette mediet kunne ikke lastes inn. Det kan være utilgjengelig, eller nettleseren din støtter kanskje ikke formatet.',
    encrypted: 'Dette mediet kunne ikke spilles av fordi det ikke kunne dekrypteres.',
    unplayable: 'Denne mediefilen støttes ikke av spilleren.',
    title: 'Noe gikk galt.',
    unexpected: 'Det oppstod en uventet feil.',
  },
  common: {
    empty: '',
    ok: 'Lukk',
  },
  menu: {
    settings: 'Innstillinger',
    quality: 'Kvalitet',
    audio: 'Lyd',
    default: 'Standard',
    speed: 'Hastighet',
    captions: 'Teksting',
    playbackRate: 'Avspillingshastighet',
    back: 'Tilbake',
    off: 'Av',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Undertekster',
  },
} as const satisfies Translations;
