import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Přehrát',
    pause: 'Pozastavit',
    replay: 'Přehrát znovu',
    mute: 'Ztlumit',
    unmute: 'Zrušit ztlumení',
  },
  seek: {
    forward: 'Posunout vpřed o {seconds} s',
    backward: 'Posunout zpět o {seconds} s',
  },
  fullscreen: {
    enter: 'Celá obrazovka',
    exit: 'Ukončit celou obrazovku',
  },
  captions: {
    enable: 'Zapnout titulky',
    disable: 'Vypnout titulky',
  },
  pip: {
    enter: 'Obraz v obraze',
    exit: 'Ukončit obraz v obraze',
  },
  live: {
    playing: 'Přehrává se živě',
    seekToEdge: 'Přejít na živé vysílání',
    badge: 'Živě',
  },
  cast: {
    start: 'Spustit odesílání',
    stop: 'Ukončit odesílání',
    connecting: 'Připojování',
  },
  airplay: {
    start: 'Spustit AirPlay',
    stop: 'Zastavit AirPlay',
  },
  slider: {
    seek: 'Posun',
  },
  time: {
    current: 'Aktuální čas',
    duration: 'Doba trvání',
    remaining: 'Zbývající čas',
    elapsedSuffix: '{duration} uplynulého času',
    durationSuffix: '{duration} doby trvání',
    remainingSuffix: 'Zbývá {duration}',
    showElapsed: 'Zobrazit uplynulý čas, {duration}.',
    showDuration: 'Zobrazit dobu trvání, {duration}.',
    showRemaining: 'Zobrazit zbývající čas, {duration}.',
    toggleElapsed: 'Přepínání mezi uplynulým a zbývajícím časem.',
    toggleDuration: 'Přepínání mezi dobou trvání a zbývajícím časem.',
    position: '{current} / {duration}',
    unknown: 'Médium se nenačetlo, čas není známý.',
  },
  playback: {
    rate: 'Rychlost přehrávání, {rate}',
  },
  volume: {
    mutedValue: '{percent}, ztlumeno',
    muted: 'Ztlumeno',
    label: 'Hlasitost',
    value: 'Hlasitost {value}',
  },
  status: {
    captionsOn: 'Titulky zapnuty',
    captionsOff: 'Titulky vypnuty',
    paused: 'Pozastaveno',
    playing: 'Přehrávání',
    fullscreen: 'Celá obrazovka',
    pip: 'Obraz v obraze',
    exitPip: 'Obraz v obraze vypnut',
    seekedTo: 'Přesunuto na {time}',
  },
  container: {
    label: 'Přehrávač médií',
  },
  errors: {
    aborted: 'Zastavili jste přehrávání média před jeho dokončením.',
    network: 'Toto médium se nepodařilo načíst kvůli potížím se sítí nebo serverem.',
    decode: 'Toto médium se nepodařilo přehrát. Může být poškozené nebo váš prohlížeč nemusí podporovat jeho formát.',
    source: 'Toto médium se nepodařilo načíst. Může být nedostupné nebo váš prohlížeč nemusí podporovat jeho formát.',
    encrypted: 'Toto médium se nepodařilo přehrát, protože se jej nepodařilo dešifrovat.',
    unplayable: 'Toto médium přehrávač nepodporuje.',
    title: 'Něco se pokazilo.',
    unexpected: 'Došlo k neočekávané chybě.',
  },
  common: {
    empty: '',
    ok: 'Zavřít',
  },
  menu: {
    settings: 'Nastavení',
    quality: 'Kvalita',
    audio: 'Zvuk',
    default: 'Výchozí',
    speed: 'Rychlost',
    captions: 'Titulky',
    playbackRate: 'Rychlost přehrávání',
    back: 'Zpět',
    off: 'Vypnuto',
    auto: 'Automaticky',
    autoWithLabel: 'Automaticky ({label})',
    subtitles: 'Titulky',
  },
} as const satisfies Translations;
