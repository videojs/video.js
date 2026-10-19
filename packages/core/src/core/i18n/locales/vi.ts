import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Phát',
    pause: 'Tạm dừng',
    replay: 'Phát lại',
    mute: 'Tắt tiếng',
    unmute: 'Bật tiếng',
  },
  seek: {
    forward: 'Tua tới {seconds} giây',
    backward: 'Tua lại {seconds} giây',
  },
  fullscreen: {
    enter: 'Toàn màn hình',
    exit: 'Thoát toàn màn hình',
  },
  captions: {
    enable: 'Bật phụ đề',
    disable: 'Tắt phụ đề',
  },
  pip: {
    enter: 'Hình trong hình',
    exit: 'Thoát chế độ hình trong hình',
  },
  live: {
    playing: 'Đang phát trực tiếp',
    seekToEdge: 'Tua đến phần đang phát trực tiếp',
    badge: 'Trực tiếp',
  },
  cast: {
    start: 'Bắt đầu truyền phát',
    stop: 'Dừng truyền phát',
    connecting: 'Đang kết nối',
  },
  airplay: {
    start: 'Bắt đầu AirPlay',
    stop: 'Dừng AirPlay',
  },
  slider: {
    seek: 'Tua',
  },
  time: {
    current: 'Thời gian hiện tại',
    duration: 'Thời lượng',
    remaining: 'Thời gian còn lại',
    elapsedSuffix: 'Đã phát {duration}',
    durationSuffix: 'Thời lượng {duration}',
    remainingSuffix: 'Còn {duration}',
    showElapsed: 'Hiển thị thời gian đã phát, {duration}.',
    showDuration: 'Hiển thị thời lượng, {duration}.',
    showRemaining: 'Hiển thị thời gian còn lại, {duration}.',
    toggleElapsed: 'Chuyển đổi giữa thời gian đã phát và thời gian còn lại.',
    toggleDuration: 'Chuyển đổi giữa thời lượng và thời gian còn lại.',
    position: '{current} trên {duration}',
    unknown: 'Phương tiện không tải được, thời gian không xác định.',
  },
  playback: {
    rate: 'Tốc độ phát lại, {rate}',
  },
  volume: {
    mutedValue: '{percent}, đã tắt tiếng',
    muted: 'Đã tắt tiếng',
    label: 'Âm lượng',
    value: 'Âm lượng {value}',
  },
  status: {
    captionsOn: 'Đã bật phụ đề',
    captionsOff: 'Đã tắt phụ đề',
    paused: 'Đã tạm dừng',
    playing: 'Đang phát',
    fullscreen: 'Toàn màn hình',
    pip: 'Hình trong hình',
    exitPip: 'Đã thoát chế độ hình trong hình',
    seekedTo: 'Đã tua đến {time}',
  },
  container: {
    label: 'Trình phát đa phương tiện',
  },
  errors: {
    aborted: 'Bạn đã dừng phát phương tiện này trước khi kết thúc.',
    network: 'Không thể tải phương tiện này do sự cố mạng hoặc máy chủ.',
    decode:
      'Không thể phát phương tiện này. Phương tiện có thể bị hỏng hoặc trình duyệt của bạn không hỗ trợ định dạng này.',
    source:
      'Không thể tải phương tiện này. Phương tiện có thể không còn khả dụng hoặc trình duyệt của bạn không hỗ trợ định dạng này.',
    encrypted: 'Không thể phát phương tiện này vì không thể giải mã.',
    unplayable: 'Trình phát không hỗ trợ phương tiện này.',
    title: 'Đã xảy ra lỗi.',
    unexpected: 'Đã xảy ra lỗi không mong muốn.',
  },
  common: {
    empty: '',
    ok: 'Đóng',
  },
  menu: {
    settings: 'Cài đặt',
    quality: 'Chất lượng',
    audio: 'Âm thanh',
    default: 'Mặc định',
    speed: 'Tốc độ',
    captions: 'Phụ đề',
    playbackRate: 'Tốc độ phát lại',
    back: 'Quay lại',
    off: 'Tắt',
    auto: 'Tự động',
    autoWithLabel: 'Tự động ({label})',
    subtitles: 'Phụ đề',
  },
} as const satisfies Translations;
