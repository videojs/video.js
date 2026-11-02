import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Spela upp',
    pause: 'Pausa',
    replay: 'Spela upp igen',
    mute: 'Ljud av',
    unmute: 'Ljud på',
  },
  seek: {
    forward: 'Hoppa framåt {seconds} sekunder',
    backward: 'Hoppa bakåt {seconds} sekunder',
  },
  fullscreen: {
    enter: 'Fullskärm',
    exit: 'Avsluta fullskärm',
  },
  captions: {
    enable: 'Aktivera textning',
    disable: 'Inaktivera textning',
  },
  pip: {
    enter: 'Bild-i-bild',
    exit: 'Avsluta bild-i-bild',
  },
  live: {
    playing: 'Sänds live',
    seekToEdge: 'Gå till live',
    badge: 'Live',
  },
  cast: {
    start: 'Börja casta',
    stop: 'Sluta casta',
    connecting: 'Ansluter',
  },
  airplay: {
    start: 'Starta AirPlay',
    stop: 'Stoppa AirPlay',
  },
  slider: {
    seek: 'Spola',
  },
  time: {
    current: 'Aktuell tid',
    duration: 'Total tid',
    remaining: 'Återstående tid',
    elapsedSuffix: '{duration} förfluten tid',
    durationSuffix: '{duration} total tid',
    remainingSuffix: '{duration} kvar',
    showElapsed: 'Visa förfluten tid, {duration}.',
    showDuration: 'Visa total tid, {duration}.',
    showRemaining: 'Visa återstående tid, {duration}.',
    toggleElapsed: 'Växla mellan förfluten och återstående tid.',
    toggleDuration: 'Växla mellan total tid och återstående tid.',
    position: '{current} av {duration}',
    unknown: 'Mediet laddades inte, okänd tid.',
  },
  playback: {
    rate: 'Uppspelningshastighet, {rate}',
  },
  volume: {
    mutedValue: '{percent}, tystat',
    muted: 'Tystat',
    label: 'Volym',
    value: 'Volym {value}',
  },
  status: {
    captionsOn: 'Textning på',
    captionsOff: 'Textning av',
    paused: 'Pausad',
    playing: 'Spelas upp',
    fullscreen: 'Fullskärm',
    pip: 'Bild-i-bild',
    exitPip: 'Bild-i-bild avslutat',
    seekedTo: 'Hoppade till {time}',
  },
  container: {
    label: 'Mediaspelare',
  },
  errors: {
    aborted: 'Du avbröt uppspelningen av mediet innan den var klar.',
    network: 'Det gick inte att läsa in det här mediet på grund av ett nätverks- eller serverfel.',
    decode: 'Det här mediet kunde inte spelas upp. Det kan vara skadat eller så stöder din webbläsare inte formatet.',
    source:
      'Det här mediet kunde inte läsas in. Det kan vara otillgängligt eller så stöder din webbläsare inte formatet.',
    encrypted: 'Det här mediet kunde inte spelas upp eftersom det inte gick att dekryptera.',
    unplayable: 'Det här mediet stöds inte av spelaren.',
    title: 'Något gick fel.',
    unexpected: 'Ett oväntat fel inträffade.',
  },
  common: {
    empty: '',
    ok: 'Stäng',
  },
  menu: {
    settings: 'Inställningar',
    quality: 'Kvalitet',
    audio: 'Ljud',
    default: 'Standard',
    speed: 'Hastighet',
    captions: 'Textning',
    playbackRate: 'Uppspelningshastighet',
    customRate: 'Anpassad, {rate}',
    back: 'Tillbaka',
    off: 'Av',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Undertexter',
  },
} as const satisfies Translations;
