import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Възпроизвеждане',
    pause: 'Пауза',
    replay: 'Повторно възпроизвеждане',
    mute: 'Спиране на звука',
    unmute: 'Включване на звука',
  },
  seek: {
    forward: 'Превъртане напред с {seconds} секунди',
    backward: 'Превъртане назад с {seconds} секунди',
  },
  fullscreen: {
    enter: 'Цял екран',
    exit: 'Изход от цял екран',
  },
  captions: {
    enable: 'Включване на надписите',
    disable: 'Изключване на надписите',
  },
  pip: {
    enter: 'Картина в картина',
    exit: 'Изход от картина в картина',
  },
  live: {
    playing: 'На живо',
    seekToEdge: 'Към потока на живо',
    badge: 'На живо',
  },
  cast: {
    start: 'Стартиране на предаване',
    stop: 'Спиране на предаването',
    connecting: 'Свързване',
  },
  airplay: {
    start: 'Стартиране на AirPlay',
    stop: 'Спиране на AirPlay',
  },
  slider: {
    seek: 'Превъртане',
  },
  time: {
    current: 'Текущо време',
    duration: 'Продължителност',
    remaining: 'Оставащо време',
    elapsedSuffix: '{duration} изминало време',
    durationSuffix: 'Продължителност {duration}',
    remainingSuffix: 'Остават {duration}',
    showElapsed: 'Показване на изминалото време, {duration}.',
    showDuration: 'Показване на продължителността, {duration}.',
    showRemaining: 'Показване на оставащото време, {duration}.',
    toggleElapsed: 'Превключване между изминалото и оставащото време.',
    toggleDuration: 'Превключване между продължителността и оставащото време.',
    position: '{current} от {duration}',
    unknown: 'Медията не е заредена, времето е неизвестно.',
  },
  playback: {
    rate: 'Скорост на възпроизвеждане, {rate}',
  },
  volume: {
    mutedValue: '{percent}, без звук',
    muted: 'Без звук',
    label: 'Сила на звука',
    value: 'Сила на звука {value}',
  },
  status: {
    captionsOn: 'Надписите са включени',
    captionsOff: 'Надписите са изключени',
    paused: 'На пауза',
    playing: 'Възпроизвеждане',
    fullscreen: 'Цял екран',
    pip: 'Картина в картина',
    exitPip: 'Режимът „картина в картина“ е изключен',
    seekedTo: 'Преместено на {time}',
  },
  container: {
    label: 'Медиен плейър',
  },
  errors: {
    aborted: 'Спряхте възпроизвеждането на медията, преди то да завърши.',
    network: 'Тази медия не можа да бъде заредена поради проблем с мрежата или сървъра.',
    decode:
      'Тази медия не можа да бъде възпроизведена. Възможно е да е повредена или браузърът ви да не поддържа формата ѝ.',
    source:
      'Тази медия не можа да бъде заредена. Възможно е да не е налична или браузърът ви да не поддържа формата ѝ.',
    encrypted: 'Тази медия не можа да бъде възпроизведена, защото не можа да бъде дешифрирана.',
    unplayable: 'Този медиен файл не се поддържа от плейъра.',
    title: 'Нещо се обърка.',
    unexpected: 'Възникна неочаквана грешка.',
  },
  common: {
    empty: '',
    ok: 'OK',
  },
  menu: {
    settings: 'Настройки',
    quality: 'Качество',
    audio: 'Аудио',
    default: 'По подразбиране',
    speed: 'Скорост',
    captions: 'Надписи',
    playbackRate: 'Скорост на възпроизвеждане',
    customRate: 'Персонализирано, {rate}',
    back: 'Назад',
    off: 'Изкл.',
    auto: 'Авто',
    autoWithLabel: 'Авто ({label})',
    subtitles: 'Субтитри',
  },
} as const satisfies Translations;
