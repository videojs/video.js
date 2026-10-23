import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    mute: 'Mute',
    unmute: 'Unmute',
  },
  seek: {
    forward: 'Seek forward {seconds} seconds',
    backward: 'Seek backward {seconds} seconds',
  },
  fullscreen: {
    enter: 'Enter fullscreen',
    exit: 'Exit fullscreen',
  },
  captions: {
    enable: 'Enable captions',
    disable: 'Disable captions',
  },
  pip: {
    enter: 'Enter picture-in-picture',
    exit: 'Exit picture-in-picture',
  },
  live: {
    playing: 'Playing live',
    seekToEdge: 'Seek to live edge',
    badge: 'Live',
  },
  cast: {
    start: 'Start casting',
    stop: 'Stop casting',
    connecting: 'Connecting',
  },
  airplay: {
    start: 'Start AirPlay',
    stop: 'Stop AirPlay',
  },
  slider: {
    seek: 'Seek',
  },
  time: {
    current: 'Current time',
    duration: 'Duration',
    remaining: 'Remaining',
    elapsedSuffix: '{duration} elapsed',
    durationSuffix: '{duration} duration',
    remainingSuffix: '{duration} remaining',
    showElapsed: 'Show elapsed time, {duration}.',
    showDuration: 'Show duration, {duration}.',
    showRemaining: 'Show remaining time, {duration}.',
    toggleElapsed: 'Toggle between elapsed and remaining time.',
    toggleDuration: 'Toggle between duration and remaining time.',
    position: '{current} of {duration}',
    unknown: 'Media not loaded, unknown time.',
  },
  playback: {
    rate: 'Playback rate, {rate}',
  },
  volume: {
    mutedValue: '{percent}, muted',
    muted: 'Muted',
    label: 'Volume',
    value: 'Volume {value}',
  },
  status: {
    captionsOn: 'Captions on',
    captionsOff: 'Captions off',
    paused: 'Paused',
    playing: 'Playing',
    fullscreen: 'Fullscreen',
    pip: 'Picture in picture',
    exitPip: 'Exit picture in picture',
    seekedTo: 'Seeked to {time}',
  },
  container: {
    label: 'Media player',
  },
  errors: {
    aborted: 'You stopped media playback before it finished.',
    network: 'This media could not be loaded due to a network or server issue.',
    decode: 'This media could not be played. It may be corrupted, or your browser may not support its format.',
    source: 'This media could not be loaded. It may be unavailable, or your browser may not support its format.',
    encrypted: 'This media could not be played because it could not be decrypted.',
    unplayable: 'This media is unsupported by the player.',
    title: 'Something went wrong.',
    unexpected: 'An unexpected error occurred.',
  },
  common: {
    empty: '',
    ok: 'OK',
  },
  menu: {
    settings: 'Settings',
    quality: 'Quality',
    audio: 'Audio',
    default: 'Default',
    speed: 'Speed',
    captions: 'Captions',
    playbackRate: 'Playback rate',
    back: 'Back',
    off: 'Off',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Subtitles',
  },
} as const satisfies Translations;
