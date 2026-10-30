import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Toista',
    pause: 'Keskeytä',
    replay: 'Toista uudelleen',
    mute: 'Mykistä',
    unmute: 'Poista mykistys',
  },
  seek: {
    forward: 'Siirry eteenpäin {seconds} sekuntia',
    backward: 'Siirry taaksepäin {seconds} sekuntia',
  },
  fullscreen: {
    enter: 'Siirry koko näytön tilaan',
    exit: 'Poistu koko näytön tilasta',
  },
  captions: {
    enable: 'Ota tekstitykset käyttöön',
    disable: 'Poista tekstitykset käytöstä',
  },
  pip: {
    enter: 'Siirry kuva kuvassa -tilaan',
    exit: 'Poistu kuva kuvassa -tilasta',
  },
  live: {
    playing: 'Toistetaan livenä',
    seekToEdge: 'Siirry liveen',
    badge: 'Live',
  },
  cast: {
    start: 'Aloita lähetys',
    stop: 'Lopeta lähetys',
    connecting: 'Yhdistetään',
  },
  airplay: {
    start: 'Käynnistä AirPlay',
    stop: 'Lopeta AirPlay',
  },
  slider: {
    seek: 'Kelaa',
  },
  time: {
    current: 'Tämänhetkinen aika',
    duration: 'Kokonaiskesto',
    remaining: 'Jäljellä oleva aika',
    elapsedSuffix: '{duration} kulunutta aikaa',
    durationSuffix: '{duration} kesto',
    remainingSuffix: '{duration} jäljellä',
    showElapsed: 'Näytä kulunut aika, {duration}.',
    showDuration: 'Näytä kesto, {duration}.',
    showRemaining: 'Näytä jäljellä oleva aika, {duration}.',
    toggleElapsed: 'Vaihda kuluneen ja jäljellä olevan ajan välillä.',
    toggleDuration: 'Vaihda keston ja jäljellä olevan ajan välillä.',
    position: '{current} / {duration}',
    unknown: 'Mediaa ei ole ladattu, aika ei ole tiedossa.',
  },
  playback: {
    rate: 'Toistonopeus, {rate}',
  },
  volume: {
    mutedValue: '{percent}, mykistetty',
    muted: 'Mykistetty',
    label: 'Äänenvoimakkuus',
    value: 'Äänenvoimakkuus {value}',
  },
  status: {
    captionsOn: 'Tekstitykset päällä',
    captionsOff: 'Tekstitykset pois päältä',
    paused: 'Keskeytetty',
    playing: 'Toistetaan',
    fullscreen: 'Koko näyttö',
    pip: 'Kuva kuvassa',
    exitPip: 'Kuva kuvassa -tila päättyi',
    seekedTo: 'Siirrytty kohtaan {time}',
  },
  container: {
    label: 'Mediasoitin',
  },
  errors: {
    aborted: 'Keskeytit median toiston ennen kuin se päättyi.',
    network: 'Tämän median lataaminen epäonnistui verkko- tai palvelinongelman vuoksi.',
    decode: 'Tämän median toistaminen epäonnistui. Se voi olla vioittunut tai selaimesi ei tue sen muotoa.',
    source: 'Tämän median lataaminen epäonnistui. Se ei ehkä ole saatavilla tai selaimesi ei tue sen muotoa.',
    encrypted: 'Tämän median toistaminen epäonnistui, koska sen salausta ei voitu purkaa.',
    unplayable: 'Soitin ei tue tätä mediaa.',
    title: 'Jotain meni pieleen.',
    unexpected: 'Tapahtui odottamaton virhe.',
  },
  common: {
    empty: '',
    ok: 'OK',
  },
  menu: {
    settings: 'Asetukset',
    quality: 'Laatu',
    audio: 'Ääni',
    default: 'Oletus',
    speed: 'Nopeus',
    captions: 'Tekstitykset',
    playbackRate: 'Toistonopeus',
    back: 'Takaisin',
    off: 'Pois',
    auto: 'Automaattinen',
    autoWithLabel: 'Automaattinen ({label})',
    subtitles: 'Tekstitykset',
  },
} as const satisfies Translations;
