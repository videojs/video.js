import type { Translations } from '../params';

export default {
  buttons: {
    play: '재생',
    pause: '일시중지',
    replay: '다시 재생',
    mute: '음소거',
    unmute: '음소거 해제',
  },
  seek: {
    forward: '{seconds}초 앞으로 탐색',
    backward: '{seconds}초 뒤로 탐색',
  },
  fullscreen: {
    enter: '전체 화면',
    exit: '전체 화면 종료',
  },
  captions: {
    enable: '자막 켜기',
    disable: '자막 끄기',
  },
  pip: {
    enter: '화면 속 화면',
    exit: '화면 속 화면 종료',
  },
  live: {
    playing: '라이브 재생 중',
    seekToEdge: '라이브 지점으로 이동',
    badge: '라이브',
  },
  cast: {
    start: '전송 시작',
    stop: '전송 중지',
    connecting: '연결 중',
  },
  airplay: {
    start: 'AirPlay 시작',
    stop: 'AirPlay 중지',
  },
  slider: {
    seek: '탐색',
  },
  time: {
    current: '현재 시간',
    duration: '재생 시간',
    remaining: '남은 시간',
    elapsedSuffix: '{duration} 경과',
    durationSuffix: '{duration} 재생 시간',
    remainingSuffix: '{duration} 남음',
    showElapsed: '경과 시간 표시, {duration}.',
    showDuration: '재생 시간 표시, {duration}.',
    showRemaining: '남은 시간 표시, {duration}.',
    toggleElapsed: '경과 시간과 남은 시간 사이를 전환합니다.',
    toggleDuration: '재생 시간과 남은 시간 사이를 전환합니다.',
    position: '{duration} 중 {current}',
    unknown: '미디어를 불러오지 못했습니다. 재생 시간을 확인할 수 없습니다.',
  },
  playback: {
    rate: '재생 속도, {rate}',
  },
  volume: {
    mutedValue: '{percent}, 음소거',
    muted: '음소거',
    label: '볼륨',
    value: '볼륨 {value}',
  },
  status: {
    captionsOn: '자막 켜짐',
    captionsOff: '자막 꺼짐',
    paused: '일시중지됨',
    playing: '재생 중',
    fullscreen: '전체 화면',
    pip: '화면 속 화면',
    exitPip: '화면 속 화면 종료',
    seekedTo: '이동 위치: {time}',
  },
  container: {
    label: '미디어 플레이어',
  },
  errors: {
    aborted: '미디어가 끝나기 전에 재생을 중지했습니다.',
    network: '네트워크 또는 서버 문제로 인해 이 미디어를 불러올 수 없습니다.',
    decode: '이 미디어를 재생할 수 없습니다. 미디어가 손상되었거나 브라우저에서 해당 형식을 지원하지 않을 수 있습니다.',
    source:
      '이 미디어를 불러올 수 없습니다. 미디어를 사용할 수 없거나 브라우저에서 해당 형식을 지원하지 않을 수 있습니다.',
    encrypted: '암호를 해독할 수 없어 이 미디어를 재생할 수 없습니다.',
    unplayable: '이 미디어는 플레이어에서 지원되지 않습니다.',
    title: '문제가 발생했습니다.',
    unexpected: '예기치 않은 오류가 발생했습니다.',
  },
  common: {
    empty: '',
    ok: '닫기',
  },
  menu: {
    settings: '설정',
    quality: '화질',
    audio: '오디오',
    default: '기본값',
    speed: '속도',
    captions: '캡션',
    playbackRate: '재생 속도',
    back: '뒤로',
    off: '끄기',
    auto: '자동',
    autoWithLabel: '자동 ({label})',
    subtitles: '자막',
  },
} as const satisfies Translations;
