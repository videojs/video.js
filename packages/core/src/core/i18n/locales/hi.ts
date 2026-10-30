import type { Translations } from '../params';

export default {
  buttons: {
    play: 'चलाएँ',
    pause: 'रोकें',
    replay: 'फिर से चलाएँ',
    mute: 'म्यूट करें',
    unmute: 'अनम्यूट करें',
  },
  seek: {
    forward: '{seconds} सेकंड आगे बढ़ें',
    backward: '{seconds} सेकंड पीछे जाएँ',
  },
  fullscreen: {
    enter: 'पूर्ण स्क्रीन',
    exit: 'पूर्ण स्क्रीन से बाहर निकलें',
  },
  captions: {
    enable: 'कैप्शन चालू करें',
    disable: 'कैप्शन बंद करें',
  },
  pip: {
    enter: 'पिक्चर में पिक्चर चालू करें',
    exit: 'पिक्चर में पिक्चर बंद करें',
  },
  live: {
    playing: 'लाइव चल रहा है',
    seekToEdge: 'लाइव पर जाएँ',
    badge: 'लाइव',
  },
  cast: {
    start: 'कास्टिंग शुरू करें',
    stop: 'कास्टिंग बंद करें',
    connecting: 'कनेक्ट हो रहा है',
  },
  airplay: {
    start: 'AirPlay शुरू करें',
    stop: 'AirPlay बंद करें',
  },
  slider: {
    seek: 'सीक करें',
  },
  time: {
    current: 'वर्तमान समय',
    duration: 'अवधि',
    remaining: 'शेष समय',
    elapsedSuffix: '{duration} बीता समय',
    durationSuffix: '{duration} अवधि',
    remainingSuffix: '{duration} शेष',
    showElapsed: 'बीता समय दिखाएँ, {duration}।',
    showDuration: 'अवधि दिखाएँ, {duration}।',
    showRemaining: 'शेष समय दिखाएँ, {duration}।',
    toggleElapsed: 'बीते समय और शेष समय के बीच टॉगल करें।',
    toggleDuration: 'अवधि और शेष समय के बीच टॉगल करें।',
    position: '{duration} में से {current}',
    unknown: 'मीडिया लोड नहीं हुआ, समय अज्ञात है।',
  },
  playback: {
    rate: 'प्लेबैक दर, {rate}',
  },
  volume: {
    mutedValue: '{percent}, म्यूट',
    muted: 'म्यूट',
    label: 'वॉल्यूम',
    value: 'वॉल्यूम {value}',
  },
  status: {
    captionsOn: 'कैप्शन चालू',
    captionsOff: 'कैप्शन बंद',
    paused: 'रोका गया',
    playing: 'चल रहा है',
    fullscreen: 'पूर्ण स्क्रीन',
    pip: 'पिक्चर में पिक्चर',
    exitPip: 'पिक्चर में पिक्चर बंद हुआ',
    seekedTo: '{time} पर पहुँचा',
  },
  container: {
    label: 'मीडिया प्लेयर',
  },
  errors: {
    aborted: 'आपने मीडिया के पूरा होने से पहले ही उसे चलाना बंद कर दिया।',
    network: 'नेटवर्क या सर्वर की समस्या की वजह से यह मीडिया लोड नहीं हो सका।',
    decode: 'यह मीडिया चलाया नहीं जा सका। हो सकता है कि यह खराब हो या आपका ब्राउज़र इसके फ़ॉर्मैट के साथ काम न करता हो।',
    source: 'यह मीडिया लोड नहीं हो सका। हो सकता है कि यह उपलब्ध न हो या आपका ब्राउज़र इसके फ़ॉर्मैट के साथ काम न करता हो।',
    encrypted: 'यह मीडिया चलाया नहीं जा सका, क्योंकि इसे डिक्रिप्ट नहीं किया जा सका।',
    unplayable: 'यह मीडिया प्लेयर द्वारा समर्थित नहीं है।',
    title: 'कुछ गड़बड़ हुई।',
    unexpected: 'कोई अनपेक्षित त्रुटि हुई।',
  },
  common: {
    empty: '',
    ok: 'बंद करें',
  },
  menu: {
    settings: 'सेटिंग्स',
    quality: 'रेज़ोल्यूशन',
    audio: 'ऑडियो',
    default: 'डिफ़ॉल्ट',
    speed: 'स्पीड',
    captions: 'कैप्शन',
    playbackRate: 'प्लेबैक दर',
    back: 'वापस',
    off: 'बंद',
    auto: 'ऑटो',
    autoWithLabel: 'ऑटो ({label})',
    subtitles: 'सबटाइटल',
  },
} as const satisfies Translations;
