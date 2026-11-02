import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Cluich',
    pause: 'Cuir ’na stad',
    replay: 'Cluich a-rithist',
    mute: 'Mùch',
    unmute: 'Dì-mhùch',
  },
  seek: {
    forward: 'Gluais air adhart {seconds} diog',
    backward: 'Gluais air ais {seconds} diog',
  },
  fullscreen: {
    enter: 'Làn-sgrìn',
    exit: 'Fàg an làn-sgrìn',
  },
  captions: {
    enable: 'Cuir caipseanan air',
    disable: 'Thoir caipseanan dheth',
  },
  pip: {
    enter: 'Dealbh am broinn deilbh',
    exit: 'Fàg dealbh am broinn deilbh',
  },
  live: {
    playing: 'A’ cluich beò',
    seekToEdge: 'Sir an sruth beò',
    badge: 'Beò',
  },
  cast: {
    start: 'Tòisich air tar-chur',
    stop: 'Cuir stad air tar-chur',
    connecting: 'A’ ceangal',
  },
  airplay: {
    start: 'Tòisich air AirPlay',
    stop: 'Cuir stad air AirPlay',
  },
  slider: {
    seek: 'Sireadh',
  },
  time: {
    current: 'An ùine làithreach',
    duration: 'Faide',
    remaining: 'An ùine air fhàgail',
    elapsedSuffix: '{duration} den ùine a chaidh seachad',
    durationSuffix: '{duration} de dh’fhaid',
    remainingSuffix: '{duration} air fhàgail',
    showElapsed: 'Seall an ùine a chaidh seachad, {duration}.',
    showDuration: 'Seall an ùine iomlan, {duration}.',
    showRemaining: 'Seall an ùine air fhàgail, {duration}.',
    toggleElapsed: 'Toglaich eadar an ùine a chaidh seachad agus an ùine air fhàgail.',
    toggleDuration: 'Toglaich eadar an fhaid agus an ùine air fhàgail.',
    position: '{current} à {duration}',
    unknown: 'Cha deach am meadhan a luchdadh, àm neo-aithnichte.',
  },
  playback: {
    rate: 'Reat na cluiche, {rate}',
  },
  volume: {
    mutedValue: '{percent}, air mùchadh',
    muted: 'Air mùchadh',
    label: 'Àirde na fuaime',
    value: 'Àirde na fuaime {value}',
  },
  status: {
    captionsOn: 'Caipseanan air',
    captionsOff: 'Caipseanan dheth',
    paused: 'Air stad',
    playing: 'A’ cluich',
    fullscreen: 'Làn-sgrìn',
    pip: 'Dealbh am broinn deilbh',
    exitPip: 'Fàg dealbh am broinn deilbh',
    seekedTo: 'Air a leum gu {time}',
  },
  container: {
    label: 'Cluicheadair mheadhanan',
  },
  errors: {
    aborted: 'Sguir thu de chluich a’ mheadhain mus do chrìochnaich e.',
    network: 'Cha ghabh am meadhan seo a luchdadh ri linn duilgheadas lìonraidh no frithealaiche.',
    decode:
      'Cha ghabh am meadhan seo a chluich – dh’fhaoidte gu bheil e coirbte no nach cuir am brabhsair agad taic ris an fhòrmat aige.',
    source:
      'Cha ghabh am meadhan seo a luchdadh – dh’fhaoidte nach eil e ri fhaighinn no nach cuir am brabhsair agad taic ris an fhòrmat aige.',
    encrypted: 'Cha ghabh am meadhan seo a chluich a chionn ’s nach gabh a dhì-chrioptachadh.',
    unplayable: 'Cha toir an cluicheadair taic dhan mheadhan seo.',
    title: 'Chaidh rudeigin ceàrr.',
    unexpected: 'Thachair mearachd ris nach robh dùil.',
  },
  common: {
    empty: '',
    ok: 'Dùin',
  },
  menu: {
    settings: 'Roghainnean',
    quality: 'Càileachd',
    audio: 'Fuaim',
    default: 'Bunaiteach',
    speed: 'Astar',
    captions: 'Caipseanan',
    playbackRate: 'Reat na cluiche',
    customRate: 'Gnàthaichte, {rate}',
    back: 'Air ais',
    off: 'Dheth',
    auto: 'Fèin-obrachail',
    autoWithLabel: 'Fèin-obrachail ({label})',
    subtitles: 'Fo-thiotalan',
  },
} as const satisfies Translations;
