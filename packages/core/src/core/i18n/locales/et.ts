import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Esita',
    pause: 'Peata',
    replay: 'Esita uuesti',
    mute: 'Vaigista',
    unmute: 'Lõpeta vaigistus',
  },
  seek: {
    forward: 'Keri edasi {seconds} sek.',
    backward: 'Keri tagasi {seconds} sek.',
  },
  fullscreen: {
    enter: 'Täisekraan',
    exit: 'Välju täisekraanist',
  },
  captions: {
    enable: 'Lülita subtiitrid sisse',
    disable: 'Lülita subtiitrid välja',
  },
  pip: {
    enter: 'Pilt pildis',
    exit: 'Välju režiimist Pilt pildis',
  },
  live: {
    playing: 'Esitatakse reaalajas',
    seekToEdge: 'Mine otseülekande juurde',
    badge: 'Otse',
  },
  cast: {
    start: 'Alusta ülekandmist',
    stop: 'Lõpeta ülekandmine',
    connecting: 'Ühendumine',
  },
  airplay: {
    start: 'Käivita AirPlay',
    stop: 'Peata AirPlay',
  },
  slider: {
    seek: 'Kerimine',
  },
  time: {
    current: 'Praegune aeg',
    duration: 'Kestus',
    remaining: 'Järelejäänud aeg',
    elapsedSuffix: '{duration} möödunud aega',
    durationSuffix: '{duration} kestust',
    remainingSuffix: 'Jäänud {duration}',
    showElapsed: 'Kuva möödunud aeg, {duration}.',
    showDuration: 'Kuva kestus, {duration}.',
    showRemaining: 'Kuva järelejäänud aeg, {duration}.',
    toggleElapsed: 'Lülita möödunud ja järelejäänud aja vahel.',
    toggleDuration: 'Lülita kestuse ja järelejäänud aja vahel.',
    position: '{current} / {duration}',
    unknown: 'Meedium pole laaditud, aeg teadmata.',
  },
  playback: {
    rate: 'Taasesituse kiirus, {rate}',
  },
  volume: {
    mutedValue: '{percent}, vaigistatud',
    muted: 'Vaigistatud',
    label: 'Helitugevus',
    value: 'Helitugevus {value}',
  },
  status: {
    captionsOn: 'Subtiitrid sees',
    captionsOff: 'Subtiitrid väljas',
    paused: 'Peatatud',
    playing: 'Esitatakse',
    fullscreen: 'Täisekraan',
    pip: 'Pilt pildis',
    exitPip: 'Pilt pildis välja lülitatud',
    seekedTo: 'Keritud: {time}',
  },
  container: {
    label: 'Meediumipleier',
  },
  errors: {
    aborted: 'Katkestasite meediumi taasesituse enne selle lõppu.',
    network: 'Seda meediumi ei õnnestunud laadida võrgu- või serveritõrke tõttu.',
    decode: 'Seda meediumi ei õnnestunud esitada. See võib olla rikutud või ei toeta teie brauser selle vormingut.',
    source:
      'Seda meediumi ei õnnestunud laadida. See võib olla kättesaamatu või ei toeta teie brauser selle vormingut.',
    encrypted: 'Seda meediumi ei õnnestunud esitada, sest seda ei saanud dekrüpteerida.',
    unplayable: 'Pleier ei toeta seda meediumi.',
    title: 'Midagi läks valesti.',
    unexpected: 'Ilmnes ootamatu viga.',
  },
  common: {
    empty: '',
    ok: 'Sule',
  },
  menu: {
    settings: 'Seaded',
    quality: 'Kvaliteet',
    audio: 'Heliriba',
    default: 'Vaikimisi',
    speed: 'Kiirus',
    captions: 'Subtiitrid',
    playbackRate: 'Taasesituse kiirus',
    customRate: 'Kohandatud, {rate}',
    back: 'Tagasi',
    off: 'Väljas',
    auto: 'Automaatne',
    autoWithLabel: 'Automaatne ({label})',
    subtitles: 'Subtiitrid',
  },
} as const satisfies Translations;
