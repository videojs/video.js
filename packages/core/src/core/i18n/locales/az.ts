import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Oynat',
    pause: 'Fasilə',
    replay: 'Yenidən oynat',
    mute: 'Səssiz et',
    unmute: 'Səsi aç',
  },
  seek: {
    forward: '{seconds} saniyə irəliyə',
    backward: '{seconds} saniyə geriyə',
  },
  fullscreen: {
    enter: 'Tam ekran',
    exit: 'Tam ekrandan çıx',
  },
  captions: {
    enable: 'Altyazıları aktiv et',
    disable: 'Altyazıları deaktiv et',
  },
  pip: {
    enter: 'Şəkildə şəkil rejimi',
    exit: 'Şəkildə şəkil rejimindən çıx',
  },
  live: {
    playing: 'Canlı yayımda',
    seekToEdge: 'Canlı yayıma keç',
    badge: 'Canlı',
  },
  cast: {
    start: 'Yayımı başlat',
    stop: 'Yayımı durdur',
    connecting: 'Qoşulur',
  },
  airplay: {
    start: 'AirPlay-i başlat',
    stop: 'AirPlay-i dayandır',
  },
  slider: {
    seek: 'Sürüşdür',
  },
  time: {
    current: 'Cari vaxt',
    duration: 'Müddət',
    remaining: 'Qalan vaxt',
    elapsedSuffix: '{duration} keçən vaxt',
    durationSuffix: '{duration} müddət',
    remainingSuffix: 'Qalan {duration}',
    showElapsed: 'Keçən vaxtı göstər, {duration}.',
    showDuration: 'Müddəti göstər, {duration}.',
    showRemaining: 'Qalan vaxtı göstər, {duration}.',
    toggleElapsed: 'Keçən vaxt və qalan vaxt arasında keçid edin.',
    toggleDuration: 'Müddət və qalan vaxt arasında keçid edin.',
    position: '{current} / {duration}',
    unknown: 'Media yüklənməyib, vaxt məlum deyil.',
  },
  playback: {
    rate: 'Oynatma sürəti, {rate}',
  },
  volume: {
    mutedValue: '{percent}, səssiz',
    muted: 'Səssiz',
    label: 'Səs',
    value: 'Səs {value}',
  },
  status: {
    captionsOn: 'Altyazılar aktivdir',
    captionsOff: 'Altyazılar deaktivdir',
    paused: 'Dayandırılıb',
    playing: 'Oynadılır',
    fullscreen: 'Tam ekran',
    pip: 'Şəkildə şəkil',
    exitPip: 'Şəkildə şəkil rejimindən çıx',
    seekedTo: '{time} vaxtına keçildi',
  },
  container: {
    label: 'Media pleyeri',
  },
  errors: {
    aborted: 'Siz medianın oxudulmasını başa çatmamış dayandırdınız.',
    network: 'Şəbəkə və ya server problemi səbəbindən bu media yüklənə bilmədi.',
    decode: 'Bu media oxudula bilmədi. Media korlanmış ola bilər və ya brauzeriniz onun formatını dəstəkləməyə bilər.',
    source: 'Bu media yüklənə bilmədi. O, əlçatan olmaya bilər və ya brauzeriniz onun formatını dəstəkləməyə bilər.',
    encrypted: 'Şifrəsi açıla bilmədiyi üçün bu media oxudula bilmədi.',
    unplayable: 'Bu media pleyer tərəfindən dəstəklənmir.',
    title: 'Xəta oldu.',
    unexpected: 'Gözlənilməz xəta baş verdi.',
  },
  common: {
    empty: '',
    ok: 'Bağla',
  },
  menu: {
    settings: 'Parametrlər',
    quality: 'Keyfiyyət',
    audio: 'Səs',
    default: 'Defolt',
    speed: 'Sürət',
    captions: 'Qapalı altyazılar',
    playbackRate: 'Oynatma sürəti',
    back: 'Geri',
    off: 'Söndürülmüş',
    auto: 'Avtomatik',
    autoWithLabel: 'Avtomatik ({label})',
    subtitles: 'Altyazılar',
  },
} as const satisfies Translations;
