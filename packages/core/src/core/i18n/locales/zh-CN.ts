import type { Translations } from '../params';

export default {
  buttons: {
    play: '播放',
    pause: '暂停',
    replay: '重新播放',
    mute: '静音',
    unmute: '取消静音',
  },
  seek: {
    forward: '快进 {seconds} 秒',
    backward: '快退 {seconds} 秒',
  },
  fullscreen: {
    enter: '全屏',
    exit: '退出全屏',
  },
  captions: {
    enable: '开启字幕',
    disable: '关闭字幕',
  },
  pip: {
    enter: '画中画',
    exit: '退出画中画',
  },
  live: {
    playing: '正在直播',
    seekToEdge: '跳转到直播',
    badge: '直播',
  },
  cast: {
    start: '开始投屏',
    stop: '停止投屏',
    connecting: '正在连接',
  },
  airplay: {
    start: '启动 AirPlay',
    stop: '停止 AirPlay',
  },
  slider: {
    seek: '定位',
  },
  time: {
    current: '当前时间',
    duration: '时长',
    remaining: '剩余时间',
    elapsedSuffix: '已播放时间 {duration}',
    durationSuffix: '时长 {duration}',
    remainingSuffix: '剩余 {duration}',
    showElapsed: '显示已播放时间，{duration}。',
    showDuration: '显示时长，{duration}。',
    showRemaining: '显示剩余时间，{duration}。',
    toggleElapsed: '在已播放时间和剩余时间之间切换。',
    toggleDuration: '在时长和剩余时间之间切换。',
    position: '{current}，总时长 {duration}',
    unknown: '媒体未加载，时间未知。',
  },
  playback: {
    rate: '播放速度，{rate}',
  },
  volume: {
    mutedValue: '{percent}，已静音',
    muted: '已静音',
    label: '音量',
    value: '音量 {value}',
  },
  status: {
    captionsOn: '字幕已开启',
    captionsOff: '字幕已关闭',
    paused: '已暂停',
    playing: '正在播放',
    fullscreen: '全屏',
    pip: '画中画',
    exitPip: '退出画中画',
    seekedTo: '已跳转至 {time}',
  },
  container: {
    label: '媒体播放器',
  },
  errors: {
    aborted: '您在媒体播放完成前停止了播放。',
    network: '由于网络或服务器问题，无法加载此媒体。',
    decode: '无法播放此媒体。文件可能已损坏，或您的浏览器可能不支持其格式。',
    source: '无法加载此媒体。媒体可能已不可用，或您的浏览器可能不支持其格式。',
    encrypted: '无法播放此媒体，因为无法解密。',
    unplayable: '播放器不支持此媒体。',
    title: '出现问题。',
    unexpected: '发生了意外错误。',
  },
  common: {
    empty: '',
    ok: '关闭',
  },
  menu: {
    settings: '设置',
    quality: '画质',
    audio: '音频',
    default: '默认',
    speed: '速度',
    captions: '字幕',
    playbackRate: '播放速度',
    back: '返回',
    off: '关闭',
    auto: '自动',
    autoWithLabel: '自动（{label}）',
    subtitles: '字幕',
  },
} as const satisfies Translations;
