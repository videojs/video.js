import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Wiedergabe',
    pause: 'Pause',
    replay: 'Erneut abspielen',
    mute: 'Stummschalten',
    unmute: 'Ton einschalten',
  },
  seek: {
    forward: '{seconds} Sekunden vorspulen',
    backward: '{seconds} Sekunden zurückspulen',
  },
  fullscreen: {
    enter: 'Vollbild',
    exit: 'Vollbild beenden',
  },
  captions: {
    enable: 'Untertitel einschalten',
    disable: 'Untertitel ausschalten',
  },
  pip: {
    enter: 'Bild-im-Bild-Modus starten',
    exit: 'Bild-im-Bild-Modus beenden',
  },
  live: {
    playing: 'Wird live wiedergegeben',
    seekToEdge: 'Zum Livestream springen',
    badge: 'Live',
  },
  cast: {
    start: 'Übertragung starten',
    stop: 'Übertragung beenden',
    connecting: 'Wird verbunden',
  },
  airplay: {
    start: 'AirPlay starten',
    stop: 'AirPlay beenden',
  },
  slider: {
    seek: 'Wiedergabeposition',
  },
  time: {
    current: 'Aktueller Zeitpunkt',
    duration: 'Dauer',
    remaining: 'Verbleibende Zeit',
    elapsedSuffix: '{duration} verstrichen',
    durationSuffix: '{duration} Dauer',
    remainingSuffix: 'noch {duration}',
    showElapsed: 'Verstrichene Zeit anzeigen, {duration}.',
    showDuration: 'Dauer anzeigen, {duration}.',
    showRemaining: 'Verbleibende Zeit anzeigen, {duration}.',
    toggleElapsed: 'Zwischen verstrichener und verbleibender Zeit wechseln.',
    toggleDuration: 'Zwischen Dauer und verbleibender Zeit wechseln.',
    position: '{current} von {duration}',
    unknown: 'Medium nicht geladen, Zeit unbekannt.',
  },
  playback: {
    rate: 'Wiedergabegeschwindigkeit, {rate}',
  },
  volume: {
    mutedValue: '{percent}, stummgeschaltet',
    muted: 'Stummgeschaltet',
    label: 'Lautstärke',
    value: 'Lautstärke {value}',
  },
  status: {
    captionsOn: 'Untertitel ein',
    captionsOff: 'Untertitel aus',
    paused: 'Pausiert',
    playing: 'Wird wiedergegeben',
    fullscreen: 'Vollbild',
    pip: 'Bild-im-Bild',
    exitPip: 'Bild-im-Bild beendet',
    seekedTo: 'Zu {time} gesprungen',
  },
  container: {
    label: 'Mediaplayer',
  },
  errors: {
    aborted: 'Sie haben die Medienwiedergabe abgebrochen, bevor sie beendet war.',
    network: 'Dieses Medium konnte aufgrund eines Netzwerk- oder Serverproblems nicht geladen werden.',
    decode:
      'Dieses Medium konnte nicht wiedergegeben werden. Es ist möglicherweise beschädigt oder Ihr Browser unterstützt das Format nicht.',
    source:
      'Dieses Medium konnte nicht geladen werden. Es ist möglicherweise nicht verfügbar oder Ihr Browser unterstützt das Format nicht.',
    encrypted: 'Dieses Medium konnte nicht wiedergegeben werden, da es nicht entschlüsselt werden konnte.',
    unplayable: 'Dieses Medium wird vom Player nicht unterstützt.',
    title: 'Etwas ist schiefgelaufen.',
    unexpected: 'Ein unerwarteter Fehler ist aufgetreten.',
  },
  common: {
    empty: '',
    ok: 'Schließen',
  },
  menu: {
    settings: 'Einstellungen',
    quality: 'Qualität',
    audio: 'Audiospur',
    default: 'Standard',
    speed: 'Geschwindigkeit',
    captions: 'Untertitel',
    playbackRate: 'Wiedergabegeschwindigkeit',
    back: 'Zurück',
    off: 'Aus',
    auto: 'Automatisch',
    autoWithLabel: 'Automatisch ({label})',
    subtitles: 'Untertitel',
  },
} as const satisfies Translations;
