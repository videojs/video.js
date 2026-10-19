import type { Translations } from '../params';

export default {
  buttons: {
    play: 'ప్లే చేయండి',
    pause: 'పాజ్ చేయండి',
    replay: 'రీప్లే చేయండి',
    mute: 'మ్యూట్ చేయండి',
    unmute: 'అన్‌మ్యూట్ చేయండి',
  },
  seek: {
    forward: '{seconds} సెకన్లు ముందుకు వెళ్లండి',
    backward: '{seconds} సెకన్లు వెనుకకు వెళ్లండి',
  },
  fullscreen: {
    enter: 'పూర్తి స్క్రీన్',
    exit: 'పూర్తి స్క్రీన్ నుండి నిష్క్రమించండి',
  },
  captions: {
    enable: 'క్యాప్షన్‌లను ఆన్ చేయండి',
    disable: 'క్యాప్షన్‌లను ఆఫ్ చేయండి',
  },
  pip: {
    enter: 'పిక్చర్-ఇన్-పిక్చర్',
    exit: 'పిక్చర్-ఇన్-పిక్చర్ నుండి నిష్క్రమించండి',
  },
  live: {
    playing: 'లైవ్‌లో ప్లే అవుతోంది',
    seekToEdge: 'లైవ్‌కు వెళ్లండి',
    badge: 'లైవ్',
  },
  cast: {
    start: 'ప్రసారం ప్రారంభించండి',
    stop: 'ప్రసారం ఆపండి',
    connecting: 'కనెక్ట్ అవుతోంది',
  },
  airplay: {
    start: 'AirPlay ప్రారంభించండి',
    stop: 'AirPlay ఆపండి',
  },
  slider: {
    seek: 'సీక్ చేయండి',
  },
  time: {
    current: 'ప్రస్తుత సమయం',
    duration: 'వ్యవధి',
    remaining: 'మిగిలిన సమయం',
    elapsedSuffix: '{duration} గడిచిన సమయం',
    durationSuffix: '{duration} వ్యవధి',
    remainingSuffix: '{duration} మిగిలి ఉంది',
    showElapsed: 'గడిచిన సమయం చూపండి, {duration}.',
    showDuration: 'వ్యవధి చూపండి, {duration}.',
    showRemaining: 'మిగిలిన సమయం చూపండి, {duration}.',
    toggleElapsed: 'గడిచిన సమయం మరియు మిగిలిన సమయం మధ్య మార్చండి.',
    toggleDuration: 'వ్యవధి మరియు మిగిలిన సమయం మధ్య మార్చండి.',
    position: '{current} / {duration}',
    unknown: 'మీడియా లోడ్ కాలేదు, సమయం తెలియదు.',
  },
  playback: {
    rate: 'ప్లేబ్యాక్ రేట్, {rate}',
  },
  volume: {
    mutedValue: '{percent}, మ్యూట్ చేయబడింది',
    muted: 'మ్యూట్ చేయబడింది',
    label: 'వాల్యూమ్',
    value: 'వాల్యూమ్ {value}',
  },
  status: {
    captionsOn: 'క్యాప్షన్‌లు ఆన్',
    captionsOff: 'క్యాప్షన్‌లు ఆఫ్',
    paused: 'పాజ్ చేయబడింది',
    playing: 'ప్లే అవుతోంది',
    fullscreen: 'పూర్తి స్క్రీన్',
    pip: 'పిక్చర్ ఇన్ పిక్చర్',
    exitPip: 'పిక్చర్ ఇన్ పిక్చర్ నుండి నిష్క్రమించండి',
    seekedTo: '{time}కి తరలించబడింది',
  },
  container: {
    label: 'మీడియా ప్లేయర్',
  },
  errors: {
    aborted: 'మీడియా ప్లేబ్యాక్ పూర్తి కాకముందే మీరు దాన్ని ఆపివేశారు.',
    network: 'నెట్‌వర్క్ లేదా సర్వర్ సమస్య కారణంగా ఈ మీడియాను లోడ్ చేయడం సాధ్యం కాలేదు.',
    decode: 'ఈ మీడియాను ప్లే చేయడం సాధ్యం కాలేదు. అది పాడైపోయి ఉండవచ్చు, లేదా దాని ఫార్మాట్‌కు మీ బ్రౌజర్ మద్దతు ఇవ్వకపోవచ్చు.',
    source: 'ఈ మీడియాను లోడ్ చేయడం సాధ్యం కాలేదు. అది అందుబాటులో లేకపోవచ్చు, లేదా దాని ఫార్మాట్‌కు మీ బ్రౌజర్ మద్దతు ఇవ్వకపోవచ్చు.',
    encrypted: 'డీక్రిప్ట్ చేయడం సాధ్యం కానందున ఈ మీడియాను ప్లే చేయడం సాధ్యం కాలేదు.',
    unplayable: 'ఈ మీడియాకు ప్లేయర్ మద్దతు ఇవ్వదు.',
    title: 'ఏదో తప్పు జరిగింది.',
    unexpected: 'ఊహించని లోపం సంభవించింది.',
  },
  common: {
    empty: '',
    ok: 'మూసివేయండి',
  },
  menu: {
    settings: 'సెట్టింగ్‌లు',
    quality: 'నాణ్యత',
    audio: 'ఆడియో',
    default: 'డిఫాల్ట్',
    speed: 'వేగం',
    captions: 'క్యాప్షన్‌లు',
    playbackRate: 'ప్లేబ్యాక్ రేట్',
    back: 'వెనుకకు',
    off: 'ఆఫ్',
    auto: 'ఆటో',
    autoWithLabel: 'ఆటో ({label})',
    subtitles: 'ఉపశీర్షికలు',
  },
} as const satisfies Translations;
