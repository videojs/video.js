import type { Translations } from '../params';

export default {
  buttons: {
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    replay: 'إعادة التشغيل',
    mute: 'كتم الصوت',
    unmute: 'إلغاء كتم الصوت',
  },
  seek: {
    forward: 'التقديم بمقدار {seconds} ثانية',
    backward: 'الترجيع بمقدار {seconds} ثانية',
  },
  fullscreen: {
    enter: 'ملء الشاشة',
    exit: 'الخروج من ملء الشاشة',
  },
  captions: {
    enable: 'تفعيل الترجمة والشرح',
    disable: 'إيقاف الترجمة والشرح',
  },
  pip: {
    enter: 'صورة داخل صورة',
    exit: 'الخروج من وضع صورة داخل صورة',
  },
  live: {
    playing: 'بث مباشر',
    seekToEdge: 'الانتقال إلى البث المباشر',
    badge: 'مباشر',
  },
  cast: {
    start: 'بدء الإرسال',
    stop: 'إيقاف الإرسال',
    connecting: 'جارٍ الاتصال',
  },
  airplay: {
    start: 'بدء AirPlay',
    stop: 'إيقاف AirPlay',
  },
  slider: {
    seek: 'التقديم والترجيع',
  },
  time: {
    current: 'الوقت الحالي',
    duration: 'المدة',
    remaining: 'الوقت المتبقي',
    elapsedSuffix: '{duration} من الوقت المنقضي',
    durationSuffix: 'المدة {duration}',
    remainingSuffix: 'متبقٍ {duration}',
    showElapsed: 'عرض الوقت المنقضي، {duration}.',
    showDuration: 'عرض المدة، {duration}.',
    showRemaining: 'عرض الوقت المتبقي، {duration}.',
    toggleElapsed: 'التبديل بين الوقت المنقضي والوقت المتبقي.',
    toggleDuration: 'التبديل بين المدة والوقت المتبقي.',
    position: '{current} من {duration}',
    unknown: 'الوسائط غير محملة، الوقت غير معلوم.',
  },
  playback: {
    rate: 'سرعة التشغيل، {rate}',
  },
  volume: {
    mutedValue: '{percent}، مكتوم',
    muted: 'مكتوم',
    label: 'مستوى الصوت',
    value: 'مستوى الصوت {value}',
  },
  status: {
    captionsOn: 'تم تفعيل الترجمة والشرح',
    captionsOff: 'تم إيقاف الترجمة والشرح',
    paused: 'متوقف مؤقتاً',
    playing: 'قيد التشغيل',
    fullscreen: 'ملء الشاشة',
    pip: 'صورة داخل صورة',
    exitPip: 'الخروج من صورة داخل صورة',
    seekedTo: 'تم الانتقال إلى {time}',
  },
  container: {
    label: 'مشغل الوسائط',
  },
  errors: {
    aborted: 'لقد أوقفت تشغيل الوسائط قبل انتهائها.',
    network: 'تعذّر تحميل هذه الوسائط بسبب مشكلة في الشبكة أو الخادم.',
    decode: 'تعذّر تشغيل هذه الوسائط. قد تكون تالفة أو قد لا يدعم متصفحك تنسيقها.',
    source: 'تعذّر تحميل هذه الوسائط. قد تكون غير متاحة أو قد لا يدعم متصفحك تنسيقها.',
    encrypted: 'تعذّر تشغيل هذه الوسائط لأنّه تعذّر فك تشفيرها.',
    unplayable: 'هذه الوسائط غير مدعومة من قِبل المشغّل.',
    title: 'حدث خطأ ما.',
    unexpected: 'حدث خطأ غير متوقّع.',
  },
  common: {
    empty: '',
    ok: 'أغلق',
  },
  menu: {
    settings: 'الإعدادات',
    quality: 'الجودة',
    audio: 'الصوت',
    default: 'افتراضي',
    speed: 'السرعة',
    captions: 'الترجمة والشرح',
    playbackRate: 'سرعة التشغيل',
    back: 'رجوع',
    off: 'إيقاف',
    auto: 'تلقائي',
    autoWithLabel: 'تلقائي ({label})',
    subtitles: 'الترجمة',
  },
} as const satisfies Translations;
