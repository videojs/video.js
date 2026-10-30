import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Riproduci',
    pause: 'Pausa',
    replay: 'Riproduci di nuovo',
    mute: 'Disattiva l’audio',
    unmute: 'Attiva l’audio',
  },
  seek: {
    forward: 'Avanti di {seconds} secondi',
    backward: 'Indietro di {seconds} secondi',
  },
  fullscreen: {
    enter: 'Schermo intero',
    exit: 'Esci da schermo intero',
  },
  captions: {
    enable: 'Attiva i sottotitoli',
    disable: 'Disattiva i sottotitoli',
  },
  pip: {
    enter: 'Riproduzione in finestra',
    exit: 'Chiudi riproduzione in finestra',
  },
  live: {
    playing: 'Riproduzione in diretta',
    seekToEdge: 'Vai alla diretta',
    badge: 'In diretta',
  },
  cast: {
    start: 'Avvia trasmissione',
    stop: 'Interrompi trasmissione',
    connecting: 'Connessione',
  },
  airplay: {
    start: 'Avvia AirPlay',
    stop: 'Interrompi AirPlay',
  },
  slider: {
    seek: 'Scorrimento',
  },
  time: {
    current: 'Tempo attuale',
    duration: 'Durata',
    remaining: 'Tempo rimanente',
    elapsedSuffix: '{duration} di tempo trascorso',
    durationSuffix: '{duration} di durata',
    remainingSuffix: 'Restano {duration}',
    showElapsed: 'Mostra tempo trascorso, {duration}.',
    showDuration: 'Mostra durata, {duration}.',
    showRemaining: 'Mostra tempo rimanente, {duration}.',
    toggleElapsed: 'Alterna tra il tempo trascorso e il tempo rimanente.',
    toggleDuration: 'Alterna tra la durata e il tempo rimanente.',
    position: '{current} di {duration}',
    unknown: 'Contenuto multimediale non caricato, tempo sconosciuto.',
  },
  playback: {
    rate: 'Velocità di riproduzione, {rate}',
  },
  volume: {
    mutedValue: '{percent}, audio disattivato',
    muted: 'Audio disattivato',
    label: 'Livello del volume',
    value: 'Livello del volume {value}',
  },
  status: {
    captionsOn: 'Sottotitoli attivi',
    captionsOff: 'Sottotitoli disattivi',
    paused: 'In pausa',
    playing: 'In riproduzione',
    fullscreen: 'Schermo intero',
    pip: 'Riproduzione in finestra',
    exitPip: 'Chiudi riproduzione in finestra',
    seekedTo: 'Posizione di riproduzione: {time}',
  },
  container: {
    label: 'Lettore multimediale',
  },
  errors: {
    aborted: 'Hai interrotto la riproduzione del contenuto multimediale prima della fine.',
    network: 'Impossibile caricare il contenuto multimediale a causa di un problema di rete o del server.',
    decode:
      'Impossibile riprodurre il contenuto multimediale. Potrebbe essere danneggiato oppure il browser potrebbe non supportarne il formato.',
    source:
      'Impossibile caricare il contenuto multimediale. Potrebbe non essere disponibile oppure il browser potrebbe non supportarne il formato.',
    encrypted: 'Impossibile riprodurre il contenuto multimediale perché non è stato possibile decriptarlo.',
    unplayable: 'Questo contenuto multimediale non è supportato dal lettore.',
    title: 'Qualcosa è andato storto.',
    unexpected: 'Si è verificato un errore imprevisto.',
  },
  common: {
    empty: '',
    ok: 'Chiudi',
  },
  menu: {
    settings: 'Impostazioni',
    quality: 'Qualità',
    audio: 'Audio',
    default: 'Predefinito',
    speed: 'Velocità',
    captions: 'Sottotitoli',
    playbackRate: 'Velocità di riproduzione',
    back: 'Indietro',
    off: 'Disattivato',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Sottotitoli',
  },
} as const satisfies Translations;
