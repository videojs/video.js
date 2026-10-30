import type { Translations } from '../params';

export default {
  buttons: {
    play: 'चलाउनुहोस्',
    pause: 'रोक्नुहोस्',
    replay: 'फेरि चलाउनुहोस्',
    mute: 'म्यूट गर्नुहोस्',
    unmute: 'अनम्यूट गर्नुहोस्',
  },
  seek: {
    forward: '{seconds} सेकेन्ड अगाडि सार्नुहोस्',
    backward: '{seconds} सेकेन्ड पछाडि सार्नुहोस्',
  },
  fullscreen: {
    enter: 'पूर्ण स्क्रिन',
    exit: 'पूर्ण स्क्रिनबाट बाहिर निस्कनुहोस्',
  },
  captions: {
    enable: 'क्याप्शन अन गर्नुहोस्',
    disable: 'क्याप्शन अफ गर्नुहोस्',
  },
  pip: {
    enter: 'पिक्चर-इन-पिक्चर',
    exit: 'पिक्चर-इन-पिक्चरबाट बाहिर निस्कनुहोस्',
  },
  live: {
    playing: 'लाइभ चलिरहेको छ',
    seekToEdge: 'लाइभमा जानुहोस्',
    badge: 'लाइभ',
  },
  cast: {
    start: 'कास्टिङ सुरु गर्नुहोस्',
    stop: 'कास्टिङ रोक्नुहोस्',
    connecting: 'जडान हुँदैछ',
  },
  airplay: {
    start: 'AirPlay सुरु गर्नुहोस्',
    stop: 'AirPlay रोक्नुहोस्',
  },
  slider: {
    seek: 'समय सार्नुहोस्',
  },
  time: {
    current: 'हालको समय',
    duration: 'अवधि',
    remaining: 'बाँकी समय',
    elapsedSuffix: '{duration} बितेको समय',
    durationSuffix: '{duration} अवधि',
    remainingSuffix: '{duration} बाँकी',
    showElapsed: 'बितेको समय देखाउनुहोस्, {duration}।',
    showDuration: 'अवधि देखाउनुहोस्, {duration}।',
    showRemaining: 'बाँकी समय देखाउनुहोस्, {duration}।',
    toggleElapsed: 'बितेको समय र बाँकी समयबीच टगल गर्नुहोस्।',
    toggleDuration: 'अवधि र बाँकी समयबीच टगल गर्नुहोस्।',
    position: '{duration} मध्ये {current}',
    unknown: 'मिडिया लोड भएको छैन, समय अज्ञात छ।',
  },
  playback: {
    rate: 'प्लेब्याक दर, {rate}',
  },
  volume: {
    mutedValue: '{percent}, म्यूट',
    muted: 'म्यूट',
    label: 'भोल्युम',
    value: 'भोल्युम {value}',
  },
  status: {
    captionsOn: 'क्याप्शन अन',
    captionsOff: 'क्याप्शन अफ',
    paused: 'रोकिएको',
    playing: 'चलिरहेको',
    fullscreen: 'पूर्ण स्क्रिन',
    pip: 'पिक्चर इन पिक्चर',
    exitPip: 'पिक्चर इन पिक्चरबाट बाहिर',
    seekedTo: '{time}मा सारियो',
  },
  container: {
    label: 'मिडिया प्लेयर',
  },
  errors: {
    aborted: 'मिडिया प्लेब्याक सकिनुअघि नै तपाईंले रोक्नुभयो।',
    network: 'नेटवर्क वा सर्भरको समस्याका कारण यो मिडिया लोड गर्न सकिएन।',
    decode: 'यो मिडिया चलाउन सकिएन। यो बिग्रिएको हुन सक्छ, वा तपाईंको ब्राउजरले यसको ढाँचालाई समर्थन नगर्न सक्छ।',
    source: 'यो मिडिया लोड गर्न सकिएन। यो उपलब्ध नहुन सक्छ, वा तपाईंको ब्राउजरले यसको ढाँचालाई समर्थन नगर्न सक्छ।',
    encrypted: 'यो मिडिया डिक्रिप्ट गर्न नसकिएकाले चलाउन सकिएन।',
    unplayable: 'यो मिडिया प्लेयरले समर्थन गर्दैन।',
    title: 'केही गलत भयो।',
    unexpected: 'अप्रत्याशित त्रुटि भयो।',
  },
  common: {
    empty: '',
    ok: 'बन्द गर्नुहोस्',
  },
  menu: {
    settings: 'सेटिङहरू',
    quality: 'गुणस्तर',
    audio: 'अडियो',
    default: 'पूर्वनिर्धारित',
    speed: 'गति',
    captions: 'क्याप्शन',
    playbackRate: 'प्लेब्याक दर',
    back: 'पछाडि',
    off: 'बन्द',
    auto: 'स्वतः',
    autoWithLabel: 'स्वतः ({label})',
    subtitles: 'उपशीर्षक',
  },
} as const satisfies Translations;
