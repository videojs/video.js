import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Воспроизвести',
    pause: 'Приостановить',
    replay: 'Воспроизвести снова',
    mute: 'Отключить звук',
    unmute: 'Включить звук',
  },
  seek: {
    forward: 'Перемотать вперед на {seconds} с',
    backward: 'Перемотать назад на {seconds} с',
  },
  fullscreen: {
    enter: 'Полноэкранный режим',
    exit: 'Выйти из полноэкранного режима',
  },
  captions: {
    enable: 'Включить субтитры',
    disable: 'Отключить субтитры',
  },
  pip: {
    enter: 'Картинка в картинке',
    exit: 'Закрыть картинку в картинке',
  },
  live: {
    playing: 'Прямой эфир',
    seekToEdge: 'Перейти к прямому эфиру',
    badge: 'Прямой эфир',
  },
  cast: {
    start: 'Начать трансляцию',
    stop: 'Остановить трансляцию',
    connecting: 'Подключение',
  },
  airplay: {
    start: 'Запустить AirPlay',
    stop: 'Остановить AirPlay',
  },
  slider: {
    seek: 'Перемотка',
  },
  time: {
    current: 'Текущее время',
    duration: 'Продолжительность',
    remaining: 'Оставшееся время',
    elapsedSuffix: '{duration} прошедшего времени',
    durationSuffix: 'Продолжительность {duration}',
    remainingSuffix: 'Осталось {duration}',
    showElapsed: 'Показать прошедшее время, {duration}.',
    showDuration: 'Показать продолжительность, {duration}.',
    showRemaining: 'Показать оставшееся время, {duration}.',
    toggleElapsed: 'Переключение между прошедшим и оставшимся временем.',
    toggleDuration: 'Переключение между продолжительностью и оставшимся временем.',
    position: '{current} / {duration}',
    unknown: 'Медиафайл не загружен, время неизвестно.',
  },
  playback: {
    rate: 'Скорость воспроизведения, {rate}',
  },
  volume: {
    mutedValue: '{percent}, без звука',
    muted: 'Без звука',
    label: 'Громкость',
    value: 'Громкость {value}',
  },
  status: {
    captionsOn: 'Субтитры включены',
    captionsOff: 'Субтитры выключены',
    paused: 'На паузе',
    playing: 'Воспроизведение',
    fullscreen: 'Полноэкранный режим',
    pip: 'Картинка в картинке',
    exitPip: 'Режим «картинка в картинке» выключен',
    seekedTo: 'Переход к отметке {time}',
  },
  container: {
    label: 'Медиаплеер',
  },
  errors: {
    aborted: 'Вы остановили воспроизведение медиафайла до его завершения.',
    network: 'Не удалось загрузить этот медиафайл из-за проблемы с сетью или сервером.',
    decode:
      'Не удалось воспроизвести этот медиафайл. Возможно, он поврежден или ваш браузер не поддерживает его формат.',
    source: 'Не удалось загрузить этот медиафайл. Возможно, он недоступен или ваш браузер не поддерживает его формат.',
    encrypted: 'Не удалось воспроизвести этот медиафайл, так как его не удалось расшифровать.',
    unplayable: 'Этот медиафайл не поддерживается плеером.',
    title: 'Что-то пошло не так.',
    unexpected: 'Произошла непредвиденная ошибка.',
  },
  common: {
    empty: '',
    ok: 'Закрыть',
  },
  menu: {
    settings: 'Настройки',
    quality: 'Качество',
    audio: 'Аудио',
    default: 'По умолчанию',
    speed: 'Скорость',
    captions: 'Субтитры',
    playbackRate: 'Скорость воспроизведения',
    customRate: 'Измененная, {rate}',
    back: 'Назад',
    off: 'Выкл.',
    auto: 'Авто',
    autoWithLabel: 'Авто ({label})',
    subtitles: 'Субтитры',
  },
} as const satisfies Translations;
