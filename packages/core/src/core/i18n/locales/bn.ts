import type { Translations } from '../params';

export default {
  buttons: {
    play: 'প্লে করুন',
    pause: 'বিরতি',
    replay: 'পুনরায় চালান',
    mute: 'মিউট',
    unmute: 'আনমিউট',
  },
  seek: {
    forward: '{seconds} সেকেন্ড আগান',
    backward: '{seconds} সেকেন্ড পেছান',
  },
  fullscreen: {
    enter: 'ফুলস্ক্রিন',
    exit: 'ফুলস্ক্রিন বন্ধ করুন',
  },
  captions: {
    enable: 'ক্যাপশন',
    disable: 'ক্যাপশন বন্ধ করুন',
  },
  pip: {
    enter: 'পিকচার-ইন-পিকচার',
    exit: 'পিকচার-ইন-পিকচার বন্ধ করুন',
  },
  live: {
    playing: 'লাইভ চলছে',
    seekToEdge: 'লাইভে যান',
    badge: 'লাইভ',
  },
  cast: {
    start: 'কাস্টিং শুরু করুন',
    stop: 'কাস্টিং বন্ধ করুন',
    connecting: 'সংযুক্ত হচ্ছে',
  },
  airplay: {
    start: 'AirPlay শুরু করুন',
    stop: 'AirPlay বন্ধ করুন',
  },
  slider: {
    seek: 'পজিশন পরিবর্তন',
  },
  time: {
    current: 'বর্তমান সময়',
    duration: 'মোট সময়',
    remaining: 'অবশিষ্ট সময়',
    elapsedSuffix: '{duration} অতিক্রান্ত সময়',
    durationSuffix: '{duration} মোট সময়',
    remainingSuffix: 'বাকি {duration}',
    showElapsed: 'অতিক্রান্ত সময় দেখান, {duration}.',
    showDuration: 'মোট সময় দেখান, {duration}.',
    showRemaining: 'বাকি সময় দেখান, {duration}.',
    toggleElapsed: 'অতিক্রান্ত সময় ও বাকি সময়ের মধ্যে টগল করুন।',
    toggleDuration: 'মোট সময় ও বাকি সময়ের মধ্যে টগল করুন।',
    position: '{duration} এর মধ্যে {current}',
    unknown: 'মিডিয়া লোড হয়নি, সময় অজানা।',
  },
  playback: {
    rate: 'প্লেব্যাক গতি, {rate}',
  },
  volume: {
    mutedValue: '{percent}, নিঃশব্দ',
    muted: 'নিঃশব্দ',
    label: 'ভলিউম',
    value: 'ভলিউম {value}',
  },
  status: {
    captionsOn: 'ক্যাপশন চালু',
    captionsOff: 'ক্যাপশন বন্ধ',
    paused: 'বিরতি',
    playing: 'চলছে',
    fullscreen: 'ফুলস্ক্রিন',
    pip: 'পিকচার-ইন-পিকচার',
    exitPip: 'পিকচার-ইন-পিকচার বন্ধ করুন',
    seekedTo: '{time}-এ যাওয়া হয়েছে',
  },
  container: {
    label: 'মিডিয়া প্লেয়ার',
  },
  errors: {
    aborted: 'আপনি মিডিয়া প্লেব্যাক বাতিল করেছেন',
    network: 'নেটওয়ার্ক ত্রুটির কারণে মিডিয়া ডাউনলোড আংশিকভাবে ব্যর্থ হয়েছে।',
    decode: 'কোনো সমস্যার কারণে অথবা আপনার ব্রাউজার সাপোর্ট না করায় মিডিয়া প্লেব্যাক বাতিল করা হয়েছে।',
    source: 'সার্ভার বা নেটওয়ার্কের সমস্যা অথবা ফাইল ফরম্যাট সাপোর্ট না করায় মিডিয়া লোড করা যায়নি।',
    encrypted: 'মিডিয়াটি এনক্রিপ্ট করা, যা ডিক্রিপ্ট করা সম্ভব নয়।',
    unplayable: 'এই মিডিয়াটি প্লেয়ারে সাপোর্ট করছে না।',
    title: 'কিছু একটা ভুল হয়েছে।',
    unexpected: 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।',
  },
  common: {
    empty: '',
    ok: 'ঠিক আছে',
  },
  menu: {
    settings: 'সেটিংস',
    quality: 'কোয়ালিটি',
    audio: 'অডিও',
    default: 'ডিফল্ট',
    speed: 'গতি',
    captions: 'ক্যাপশন',
    playbackRate: 'প্লেব্যাক গতি',
    back: 'পেছনে',
    off: 'বন্ধ',
    auto: 'স্বয়ংক্রিয়',
    autoWithLabel: 'স্বয়ংক্রিয় ({label})',
    subtitles: 'সাবটাইটেল',
  },
} as const satisfies Translations;
