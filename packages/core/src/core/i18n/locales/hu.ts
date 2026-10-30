import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Lejátszás',
    pause: 'Szünet',
    replay: 'Visszajátszás',
    mute: 'Némítás',
    unmute: 'Némítás feloldása',
  },
  seek: {
    forward: 'Ugrás előre {seconds} másodperccel',
    backward: 'Ugrás vissza {seconds} másodperccel',
  },
  fullscreen: {
    enter: 'Teljes képernyő',
    exit: 'Kilépés teljes képernyőből',
  },
  captions: {
    enable: 'Feliratok bekapcsolása',
    disable: 'Feliratok kikapcsolása',
  },
  pip: {
    enter: 'Kép a képben',
    exit: 'Kilépés kép a képben módból',
  },
  live: {
    playing: 'Élő adás',
    seekToEdge: 'Ugrás az élő adáshoz',
    badge: 'Élő',
  },
  cast: {
    start: 'Átküldés indítása',
    stop: 'Átküldés leállítása',
    connecting: 'Csatlakozás',
  },
  airplay: {
    start: 'AirPlay indítása',
    stop: 'AirPlay leállítása',
  },
  slider: {
    seek: 'Tekerés',
  },
  time: {
    current: 'Aktuális idő',
    duration: 'Hossz',
    remaining: 'Hátralévő idő',
    elapsedSuffix: '{duration} eltelt idő',
    durationSuffix: '{duration} időtartam',
    remainingSuffix: '{duration} van hátra',
    showElapsed: 'Eltelt idő megjelenítése, {duration}.',
    showDuration: 'Időtartam megjelenítése, {duration}.',
    showRemaining: 'Hátralévő idő megjelenítése, {duration}.',
    toggleElapsed: 'Váltás az eltelt és a hátralévő idő között.',
    toggleDuration: 'Váltás az időtartam és a hátralévő idő között.',
    position: '{current} / {duration}',
    unknown: 'A média nem töltődött be, ismeretlen hossz.',
  },
  playback: {
    rate: 'Lejátszási sebesség, {rate}',
  },
  volume: {
    mutedValue: '{percent}, némítva',
    muted: 'Némítva',
    label: 'Hangerő',
    value: 'Hangerő {value}',
  },
  status: {
    captionsOn: 'Feliratok bekapcsolva',
    captionsOff: 'Feliratok kikapcsolva',
    paused: 'Szüneteltetve',
    playing: 'Lejátszás folyamatban',
    fullscreen: 'Teljes képernyő',
    pip: 'Kép a képben',
    exitPip: 'Kép a képben mód kikapcsolva',
    seekedTo: 'Ugrás ide: {time}',
  },
  container: {
    label: 'Médialejátszó',
  },
  errors: {
    aborted: 'Leállította a média lejátszását, mielőtt az véget ért volna.',
    network: 'A média betöltése hálózati vagy kiszolgálói hiba miatt nem sikerült.',
    decode: 'A média nem játszható le. Lehet, hogy sérült, vagy a böngészője nem támogatja a formátumát.',
    source: 'A média nem tölthető be. Lehet, hogy nem érhető el, vagy a böngészője nem támogatja a formátumát.',
    encrypted: 'A média nem játszható le, mert nem sikerült visszafejteni.',
    unplayable: 'A lejátszó nem támogatja ezt a médiát.',
    title: 'Valami hiba történt.',
    unexpected: 'Váratlan hiba történt.',
  },
  common: {
    empty: '',
    ok: 'Bezárás',
  },
  menu: {
    settings: 'Beállítások',
    quality: 'Minőség',
    audio: 'Hang',
    default: 'Alapértelmezett',
    speed: 'Sebesség',
    captions: 'Feliratok',
    playbackRate: 'Lejátszási sebesség',
    back: 'Vissza',
    off: 'Ki',
    auto: 'Automatikus',
    autoWithLabel: 'Automatikus ({label})',
    subtitles: 'Feliratok',
  },
} as const satisfies Translations;
