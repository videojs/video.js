import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Odtwórz',
    pause: 'Wstrzymaj',
    replay: 'Odtwórz ponownie',
    mute: 'Wycisz',
    unmute: 'Wyłącz wyciszenie',
  },
  seek: {
    forward: 'Przewiń do przodu o {seconds} s',
    backward: 'Przewiń do tyłu o {seconds} s',
  },
  fullscreen: {
    enter: 'Pełny ekran',
    exit: 'Wyjdź z pełnego ekranu',
  },
  captions: {
    enable: 'Włącz napisy',
    disable: 'Wyłącz napisy',
  },
  pip: {
    enter: 'Obraz w obrazie',
    exit: 'Wyjdź z trybu obraz w obrazie',
  },
  live: {
    playing: 'Odtwarzanie na żywo',
    seekToEdge: 'Przejdź na transmisję na żywo',
    badge: 'Na żywo',
  },
  cast: {
    start: 'Rozpocznij przesyłanie',
    stop: 'Zatrzymaj przesyłanie',
    connecting: 'Łączenie',
  },
  airplay: {
    start: 'Uruchom AirPlay',
    stop: 'Zatrzymaj AirPlay',
  },
  slider: {
    seek: 'Przewijanie',
  },
  time: {
    current: 'Aktualny czas',
    duration: 'Czas trwania',
    remaining: 'Pozostały czas',
    elapsedSuffix: '{duration} czasu, który upłynął',
    durationSuffix: '{duration} czasu trwania',
    remainingSuffix: 'Pozostało {duration}',
    showElapsed: 'Pokaż upływ czasu, {duration}.',
    showDuration: 'Pokaż czas trwania, {duration}.',
    showRemaining: 'Pokaż pozostały czas, {duration}.',
    toggleElapsed: 'Przełącz między czasem, który upłynął, a pozostałym czasem.',
    toggleDuration: 'Przełącz między czasem trwania a pozostałym czasem.',
    position: '{current} / {duration}',
    unknown: 'Multimedia nie zostały załadowane, czas jest nieznany.',
  },
  playback: {
    rate: 'Szybkość odtwarzania, {rate}',
  },
  volume: {
    mutedValue: '{percent}, wyciszono',
    muted: 'Wyciszono',
    label: 'Głośność',
    value: 'Głośność {value}',
  },
  status: {
    captionsOn: 'Napisy włączone',
    captionsOff: 'Napisy wyłączone',
    paused: 'Wstrzymano',
    playing: 'Odtwarzanie',
    fullscreen: 'Pełny ekran',
    pip: 'Obraz w obrazie',
    exitPip: 'Obraz w obrazie wyłączony',
    seekedTo: 'Przewinięto: {time}',
  },
  container: {
    label: 'Odtwarzacz multimediów',
  },
  errors: {
    aborted: 'Zatrzymano odtwarzanie przed jego zakończeniem.',
    network: 'Nie udało się wczytać tego materiału z powodu problemu z siecią lub serwerem.',
    decode:
      'Nie udało się odtworzyć tego materiału. Może być uszkodzony lub przeglądarka może nie obsługiwać jego formatu.',
    source:
      'Nie udało się wczytać tego materiału. Może być niedostępny lub przeglądarka może nie obsługiwać jego formatu.',
    encrypted: 'Nie udało się odtworzyć tego materiału, ponieważ nie udało się go odszyfrować.',
    unplayable: 'Ten materiał nie jest obsługiwany przez odtwarzacz.',
    title: 'Coś poszło nie tak.',
    unexpected: 'Wystąpił nieoczekiwany błąd.',
  },
  common: {
    empty: '',
    ok: 'Zamknij',
  },
  menu: {
    settings: 'Ustawienia',
    quality: 'Jakość',
    audio: 'Dźwięk',
    default: 'Domyślne',
    speed: 'Szybkość',
    captions: 'Napisy',
    playbackRate: 'Szybkość odtwarzania',
    customRate: 'Niestandardowa, {rate}',
    back: 'Wstecz',
    off: 'Wyłączone',
    auto: 'Auto',
    autoWithLabel: 'Auto ({label})',
    subtitles: 'Napisy',
  },
} as const satisfies Translations;
