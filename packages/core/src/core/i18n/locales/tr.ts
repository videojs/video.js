import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Oynat',
    pause: 'Duraklat',
    replay: 'Yeniden oynat',
    mute: 'Sesi kapat',
    unmute: 'Sesi aç',
  },
  seek: {
    forward: '{seconds} saniye ileri sar',
    backward: '{seconds} saniye geri sar',
  },
  fullscreen: {
    enter: 'Tam ekran',
    exit: 'Tam ekrandan çık',
  },
  captions: {
    enable: 'Altyazıları aç',
    disable: 'Altyazıları kapat',
  },
  pip: {
    enter: 'Resim içinde resim',
    exit: 'Resim içinde resimden çık',
  },
  live: {
    playing: 'Canlı oynatılıyor',
    seekToEdge: 'Canlı yayına git',
    badge: 'Canlı',
  },
  cast: {
    start: 'Yayınlamayı başlat',
    stop: 'Yayınlamayı durdur',
    connecting: 'Bağlanıyor',
  },
  airplay: {
    start: "AirPlay'i başlat",
    stop: "AirPlay'i durdur",
  },
  slider: {
    seek: 'Sar',
  },
  time: {
    current: 'Geçen süre',
    duration: 'Toplam süre',
    remaining: 'Kalan süre',
    elapsedSuffix: '{duration} geçen süre',
    durationSuffix: '{duration} toplam süre',
    remainingSuffix: '{duration} kaldı',
    showElapsed: 'Geçen süreyi göster, {duration}.',
    showDuration: 'Toplam süreyi göster, {duration}.',
    showRemaining: 'Kalan süreyi göster, {duration}.',
    toggleElapsed: 'Geçen süre ile kalan süre arasında geçiş yap.',
    toggleDuration: 'Toplam süre ile kalan süre arasında geçiş yap.',
    position: '{current} / {duration}',
    unknown: 'Medya yüklenmedi, süre bilinmiyor.',
  },
  playback: {
    rate: 'Oynatma hızı, {rate}',
  },
  volume: {
    mutedValue: '{percent}, sessiz',
    muted: 'Sessiz',
    label: 'Ses',
    value: 'Ses {value}',
  },
  status: {
    captionsOn: 'Altyazılar açık',
    captionsOff: 'Altyazılar kapalı',
    paused: 'Duraklatıldı',
    playing: 'Oynatılıyor',
    fullscreen: 'Tam ekran',
    pip: 'Resim içinde resim',
    exitPip: 'Resim içinde resimden çık',
    seekedTo: '{time} konumuna gidildi',
  },
  container: {
    label: 'Medya oynatıcı',
  },
  errors: {
    aborted: 'Medyanın oynatılmasını bitmeden durdurdunuz.',
    network: 'Bir ağ veya sunucu sorunu nedeniyle bu medya yüklenemedi.',
    decode: 'Bu medya oynatılamadı. Bozuk olabilir veya tarayıcınız biçimini desteklemiyor olabilir.',
    source: 'Bu medya yüklenemedi. Kullanılamıyor olabilir veya tarayıcınız biçimini desteklemiyor olabilir.',
    encrypted: 'Şifresi çözülemediği için bu medya oynatılamadı.',
    unplayable: 'Bu medya, oynatıcı tarafından desteklenmiyor.',
    title: 'Bir şeyler ters gitti.',
    unexpected: 'Beklenmeyen bir hata oluştu.',
  },
  common: {
    empty: '',
    ok: 'Kapat',
  },
  menu: {
    settings: 'Ayarlar',
    quality: 'Kalite',
    audio: 'Ses',
    default: 'Varsayılan',
    speed: 'Hız',
    captions: 'Altyazılar',
    playbackRate: 'Oynatma hızı',
    back: 'Geri',
    off: 'Kapalı',
    auto: 'Otomatik',
    autoWithLabel: 'Otomatik ({label})',
    subtitles: 'Altyazılar',
  },
} as const satisfies Translations;
