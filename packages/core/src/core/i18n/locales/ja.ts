import type { Translations } from '../params';

export default {
  buttons: {
    play: '再生',
    pause: '一時停止',
    replay: 'もう一度再生',
    mute: 'ミュート',
    unmute: 'ミュート解除',
  },
  seek: {
    forward: '{seconds}秒進む',
    backward: '{seconds}秒戻る',
  },
  fullscreen: {
    enter: '全画面表示',
    exit: '全画面表示解除',
  },
  captions: {
    enable: '字幕を表示',
    disable: '字幕を非表示',
  },
  pip: {
    enter: 'ピクチャー イン ピクチャー',
    exit: 'ピクチャー イン ピクチャーを終了',
  },
  live: {
    playing: 'ライブ再生中',
    seekToEdge: 'ライブ位置へ移動',
    badge: 'ライブ',
  },
  cast: {
    start: 'キャスト開始',
    stop: 'キャスト停止',
    connecting: '接続中',
  },
  airplay: {
    start: 'AirPlayを開始',
    stop: 'AirPlayを停止',
  },
  slider: {
    seek: 'シーク',
  },
  time: {
    current: '現在の時間',
    duration: '再生時間',
    remaining: '残りの時間',
    elapsedSuffix: '経過時間 {duration}',
    durationSuffix: '再生時間 {duration}',
    remainingSuffix: '残り {duration}',
    showElapsed: '経過時間を表示、{duration}。',
    showDuration: '再生時間を表示、{duration}。',
    showRemaining: '残り時間を表示、{duration}。',
    toggleElapsed: '経過時間と残り時間を切り替えます。',
    toggleDuration: '再生時間と残り時間を切り替えます。',
    position: '{current} / {duration}',
    unknown: 'メディアが読み込まれていないため、時間は不明です。',
  },
  playback: {
    rate: '再生速度、{rate}',
  },
  volume: {
    mutedValue: '{percent}、ミュート',
    muted: 'ミュート',
    label: '音量',
    value: '音量 {value}',
  },
  status: {
    captionsOn: '字幕オン',
    captionsOff: '字幕オフ',
    paused: '一時停止中',
    playing: '再生中',
    fullscreen: '全画面表示',
    pip: 'ピクチャー イン ピクチャー表示',
    exitPip: 'ピクチャー イン ピクチャー表示解除',
    seekedTo: '{time}に移動しました',
  },
  container: {
    label: 'メディアプレーヤー',
  },
  errors: {
    aborted: 'メディアの再生が完了する前に停止されました。',
    network: 'ネットワークまたはサーバーの問題により、このメディアを読み込めませんでした。',
    decode:
      'このメディアを再生できませんでした。データが破損しているか、お使いのブラウザがこの形式をサポートしていない可能性があります。',
    source:
      'このメディアを読み込めませんでした。現在利用できないか、お使いのブラウザがこの形式をサポートしていない可能性があります。',
    encrypted: 'このメディアは復号できなかったため、再生できませんでした。',
    unplayable: 'このメディアはプレーヤーでサポートされていません。',
    title: '問題が発生しました。',
    unexpected: '予期しないエラーが発生しました。',
  },
  common: {
    empty: '',
    ok: '閉じる',
  },
  menu: {
    settings: '設定',
    quality: '画質',
    audio: '音声',
    default: 'デフォルト',
    speed: '速度',
    captions: '字幕',
    playbackRate: '再生速度',
    back: '戻る',
    off: 'オフ',
    auto: '自動',
    autoWithLabel: '自動 ({label})',
    subtitles: '字幕',
  },
} as const satisfies Translations;
