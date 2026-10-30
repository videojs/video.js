import type { Translations } from '../params';

export default {
  buttons: {
    play: 'پخش',
    pause: 'توقف موقت',
    replay: 'پخش مجدد',
    mute: 'بی‌صدا کردن',
    unmute: 'صدادار کردن',
  },
  seek: {
    forward: '{seconds} ثانیه بعد',
    backward: '{seconds} ثانیه قبل',
  },
  fullscreen: {
    enter: 'تمام‌صفحه',
    exit: 'خروج از تمام‌صفحه',
  },
  captions: {
    enable: 'فعال‌سازی زیرنویس',
    disable: 'غیرفعال‌سازی زیرنویس',
  },
  pip: {
    enter: 'تصویر در تصویر',
    exit: 'خروج از حالت تصویر در تصویر',
  },
  live: {
    playing: 'پخش زنده',
    seekToEdge: 'رفتن به پخش زنده',
    badge: 'زنده',
  },
  cast: {
    start: 'شروع پخش به تلویزیون',
    stop: 'توقف پخش به تلویزیون',
    connecting: 'در حال اتصال',
  },
  airplay: {
    start: 'شروع AirPlay',
    stop: 'توقف AirPlay',
  },
  slider: {
    seek: 'جستجو',
  },
  time: {
    current: 'زمان فعلی',
    duration: 'مدت‌زمان',
    remaining: 'زمان باقی‌مانده',
    elapsedSuffix: '{duration} زمان سپری‌شده',
    durationSuffix: '{duration} مدت‌زمان',
    remainingSuffix: '{duration} باقی‌مانده',
    showElapsed: 'نمایش زمان سپری‌شده، {duration}.',
    showDuration: 'نمایش مدت‌زمان، {duration}.',
    showRemaining: 'نمایش زمان باقی‌مانده، {duration}.',
    toggleElapsed: 'تغییر بین زمان سپری‌شده و زمان باقی‌مانده.',
    toggleDuration: 'تغییر بین مدت‌زمان و زمان باقی‌مانده.',
    position: '{current} از {duration}',
    unknown: 'رسانه بارگذاری نشده، زمان نامشخص.',
  },
  playback: {
    rate: 'سرعت پخش، {rate}',
  },
  volume: {
    mutedValue: '{percent}، بی‌صدا',
    muted: 'بی‌صدا',
    label: 'میزان صدا',
    value: 'میزان صدا {value}',
  },
  status: {
    captionsOn: 'زیرنویس روشن',
    captionsOff: 'زیرنویس خاموش',
    paused: 'متوقف شده',
    playing: 'در حال پخش',
    fullscreen: 'تمام‌صفحه',
    pip: 'تصویر در تصویر',
    exitPip: 'خروج از حالت تصویر در تصویر',
    seekedTo: 'پرش به {time}',
  },
  container: {
    label: 'پخش‌کننده رسانه',
  },
  errors: {
    aborted: 'شما پخش رسانه را پیش از پایان آن متوقف کردید.',
    network: 'این رسانه به‌دلیل مشکل شبکه یا سرور بارگذاری نشد.',
    decode: 'این رسانه پخش نشد. ممکن است آسیب‌دیده باشد یا مرورگر شما از قالب آن پشتیبانی نکند.',
    source: 'این رسانه بارگذاری نشد. ممکن است در دسترس نباشد یا مرورگر شما از قالب آن پشتیبانی نکند.',
    encrypted: 'این رسانه پخش نشد، زیرا رمزگشایی آن ممکن نبود.',
    unplayable: 'این رسانه توسط پخش‌کننده پشتیبانی نمی‌شود.',
    title: 'مشکلی پیش آمد.',
    unexpected: 'خطای غیرمنتظره‌ای رخ داد.',
  },
  common: {
    empty: '',
    ok: 'بستن',
  },
  menu: {
    settings: 'تنظیمات',
    quality: 'کیفیت',
    audio: 'صدا',
    default: 'پیش‌فرض',
    speed: 'سرعت',
    captions: 'زیرنویس‌ها',
    playbackRate: 'سرعت پخش',
    back: 'بازگشت',
    off: 'خاموش',
    auto: 'خودکار',
    autoWithLabel: 'خودکار ({label})',
    subtitles: 'زیرنویس‌ها',
  },
} as const satisfies Translations;
