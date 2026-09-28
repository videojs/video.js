import {
  isMediaBufferCapable,
  isMediaContentDataCapable,
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  isMediaSeekCapable,
  isMediaSourceCapable,
  isMediaVolumeCapable,
} from '@videojs/media';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  normalizeWistiaPlayer,
  parseWistiaMediaId,
  parseWistiaStartTime,
  type WistiaPlayerLike,
  type WistiaPlayerMembers,
  wistiaControlProps,
} from '..';

const HASHED_ID = 'abcde12345';
const MEDIA_URL = `https://videojs.wistia.com/medias/${HASHED_ID}`;

/**
 * Stands in for `<wistia-player>`, typed against `WistiaPlayerMembers` on purpose: the normalizer is only as honest as
 * this stub, and a member invented here would pass these tests over a media that cannot work.
 */
class StubWistiaPlayer extends HTMLElement implements WistiaPlayerMembers {
  mediaId = '';
  duration = 0;
  muted = false;
  volume = 1;
  currentTime = 0;
  playbackRate = 1;
  state: WistiaPlayerMembers['state'] = 'beforeplay';
  name: string | undefined;
  ended = false;
  buffered = { length: 0, start: () => 0, end: () => 0 };
  readyState = 0;
  poster = '';
  preload = 'metadata';
  autoplay = false;
  endVideoBehavior = 'default';
  inFullscreen = false;
  playBarControl = true;
  bigPlayButton = true;
  playerColor = '';

  cancelFullscreen = vi.fn(async () => {});

  play = vi.fn(async () => {});
  pause = vi.fn(async () => {});
}

customElements.define('stub-wistia-player', StubWistiaPlayer);

function createPlayer(): WistiaPlayerLike & StubWistiaPlayer {
  const player = document.createElement('stub-wistia-player') as StubWistiaPlayer;

  document.body.append(player);
  return normalizeWistiaPlayer(player as unknown as WistiaPlayerLike) as WistiaPlayerLike & StubWistiaPlayer;
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe('parseWistiaMediaId', () => {
  it('extracts id from a raw hashed id', () => {
    expect(parseWistiaMediaId(HASHED_ID)).toBe(HASHED_ID);
  });

  it('extracts id from a media page URL', () => {
    expect(parseWistiaMediaId(MEDIA_URL)).toBe(HASHED_ID);
  });

  it('extracts id from embed URLs', () => {
    expect(parseWistiaMediaId(`https://fast.wistia.net/embed/iframe/${HASHED_ID}`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://fast.wistia.com/embed/medias/${HASHED_ID}.jsonp`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://fast.wistia.net/embed/playlists/${HASHED_ID}`)).toBe(HASHED_ID);
  });

  it('extracts id from the wi.st short host and the wvideo parameter', () => {
    expect(parseWistiaMediaId(`https://wi.st/medias/${HASHED_ID}`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://example.com/watch?wvideo=${HASHED_ID}`)).toBe(HASHED_ID);
  });

  it('returns null for empty input and non-Wistia URLs', () => {
    expect(parseWistiaMediaId('')).toBe(null);
    expect(parseWistiaMediaId('https://example.com/video.mp4')).toBe(null);
  });
});

describe('parseWistiaStartTime', () => {
  it('reports no start time without a wtime parameter', () => {
    expect(parseWistiaStartTime(MEDIA_URL)).toBe(null);
  });

  it('parses wtime into seconds', () => {
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=90`)).toBe(90);
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=1m30s`)).toBe(90);
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=1h2m3s`)).toBe(3723);
  });
});

describe('wistiaControlProps', () => {
  it('names every switch Wistia has no single chromeless flag for', () => {
    expect(wistiaControlProps(false)).toEqual({
      bigPlayButton: false,
      controlsVisibleOnLoad: false,
      fullscreenControl: false,
      playBarControl: false,
      playPauseControl: false,
      playPauseNotifier: false,
      settingsControl: false,
      volumeControl: false,
    });
    expect(Object.values(wistiaControlProps(true)).every(Boolean)).toBe(true);
  });
});

describe('normalizeWistiaPlayer', () => {
  it('leaves the player it normalized as the object it was', () => {
    const player = createPlayer();

    expect(player.localName).toBe('stub-wistia-player');
    expect(normalizeWistiaPlayer(player)).toBe(player);
  });

  it('does not touch controls, which Wistia already uses for something else', () => {
    const player = createPlayer();

    // Wistia's `controls` is the player's control instances, and its internals read it.
    expect(Object.getOwnPropertyDescriptor(player, 'controls')).toBeUndefined();
  });

  describe('source', () => {
    it('names the media by id and applies every other option to the player', () => {
      const player = createPlayer();

      player.source = { mediaId: HASHED_ID, playerColor: '54bbff' };

      expect(player.mediaId).toBe(HASHED_ID);
      expect(player.playerColor).toBe('54bbff');
      expect(player.source).toEqual({ mediaId: HASHED_ID, playerColor: '54bbff' });
    });

    it('announces the change the way a media does', () => {
      const player = createPlayer();
      const types: string[] = [];

      for (const type of ['emptied', 'sourcechange']) {
        player.addEventListener(type, () => types.push(type));
      }

      player.source = { mediaId: HASHED_ID };

      expect(types).toEqual(['emptied', 'sourcechange']);
    });

    it('clears the media when set to null', () => {
      const player = createPlayer();

      player.source = { mediaId: HASHED_ID };

      player.source = null;

      expect(player.mediaId).toBe('');
      expect(player.source).toBe(null);
    });
  });

  describe('src', () => {
    it('resolves a Wistia URL to the id the player wants', () => {
      const player = createPlayer();

      player.src = MEDIA_URL;

      expect(player.mediaId).toBe(HASHED_ID);
      expect(player.src).toBe(HASHED_ID);
      expect(player.currentSrc).toBe(HASHED_ID);
    });

    it('carries a wtime start time, which the id alone does not', () => {
      const player = createPlayer();

      player.src = `${MEDIA_URL}?wtime=30`;

      expect(player.currentTime).toBe(30);
    });

    it('keeps the options already on the source', () => {
      const player = createPlayer();

      player.source = { mediaId: HASHED_ID, playerColor: '54bbff' };

      player.src = 'https://videojs.wistia.com/medias/zyxwv98765';

      expect(player.source).toEqual({ mediaId: 'zyxwv98765', playerColor: '54bbff' });
    });
  });

  it('spells loop as an end-of-video behavior', () => {
    const player = createPlayer();

    player.loop = true;
    expect(player.endVideoBehavior).toBe('loop');
    expect(player.loop).toBe(true);

    player.loop = false;
    expect(player.endVideoBehavior).toBe('default');
    expect(player.loop).toBe(false);
  });

  describe('paused', () => {
    it('reports a player that has never played as paused', () => {
      const player = createPlayer();

      // Wistia answers `state === 'paused'` here — false — so a toggle would pause what nobody started.
      expect(player.state).toBe('beforeplay');
      expect(player.paused).toBe(true);
    });

    it('reports paused for every state but playing', () => {
      const player = createPlayer();

      player.state = 'playing';
      expect(player.paused).toBe(false);

      player.state = 'paused';
      expect(player.paused).toBe(true);

      player.state = 'ended';
      expect(player.paused).toBe(true);

      // Before the player's API is ready there is no state at all.
      player.state = undefined;
      expect(player.paused).toBe(true);
    });
  });

  it('mutes now for defaultMuted, since a live player keeps no default to apply later', () => {
    const player = createPlayer();

    player.defaultMuted = true;

    expect(player.muted).toBe(true);
    expect(player.defaultMuted).toBe(true);
  });

  it('derives a seekable range from the duration Wistia reports', () => {
    const player = createPlayer();

    expect(player.seekable.length).toBe(0);

    player.duration = 60;

    expect(player.seekable.length).toBe(1);
    expect(player.seekable.end(0)).toBe(60);
  });

  describe('seeking', () => {
    it('tracks the events Wistia brackets a seek with, having no property for it', () => {
      const player = createPlayer();

      expect(player.seeking).toBe(false);

      player.dispatchEvent(new Event('seeking'));
      expect(player.seeking).toBe(true);

      player.dispatchEvent(new Event('seeked'));
      expect(player.seeking).toBe(false);
    });

    it('closes a seek Wistia never says ended, and announces it', () => {
      const player = createPlayer();
      const seeked = vi.fn();

      player.addEventListener('seeked', seeked);

      player.dispatchEvent(new Event('seeking'));
      expect(player.seeking).toBe(true);

      // Left stuck on, this is a clock that never runs again: the store skips a playhead sync mid-seek.
      player.dispatchEvent(new Event('time-update'));

      expect(player.seeking).toBe(false);
      expect(seeked).toHaveBeenCalledTimes(1);
    });

    it('leaves a seek Wistia did end alone', () => {
      const player = createPlayer();
      const seeked = vi.fn();

      player.addEventListener('seeked', seeked);

      player.dispatchEvent(new Event('seeking'));
      player.dispatchEvent(new Event('seeked'));
      player.dispatchEvent(new Event('time-update'));

      // Once for Wistia's own; the fallback has nothing left to announce.
      expect(seeked).toHaveBeenCalledTimes(1);
    });

    it('closes the seek before reporting the playhead that closed it', () => {
      const player = createPlayer();
      const types: string[] = [];

      for (const type of ['seeked', 'timeupdate']) player.addEventListener(type, () => types.push(type));

      player.dispatchEvent(new Event('seeking'));
      player.dispatchEvent(new Event('time-update'));

      // The store re-reads `seeking` on `seeked` and skips the sync while it is set, so the order is what
      // lets one `time-update` both end the seek and be acted on.
      expect(types).toEqual(['seeked', 'timeupdate']);
    });

    it('says nothing about a seek that never happened', () => {
      const player = createPlayer();
      const seeked = vi.fn();

      player.addEventListener('seeked', seeked);

      player.dispatchEvent(new Event('time-update'));
      player.dispatchEvent(new Event('second-change'));

      expect(seeked).not.toHaveBeenCalled();
    });
  });

  describe('capabilities the store gates its features on', () => {
    // Read once, as the store attaches. A missing member skips a feature outright rather than degrading it.
    it('reports itself able to seek', () => {
      expect(isMediaSeekCapable(createPlayer())).toBe(true);
    });

    it('reports itself able to buffer before a duration is known', () => {
      // `EMPTY_TIME_RANGES` reads as "no buffer surface", so an empty `seekable` needs a range of its own.
      const player = createPlayer();

      expect(player.duration).toBe(0);
      expect(isMediaBufferCapable(player)).toBe(true);
    });

    it('reports itself able to describe its content', () => {
      expect(isMediaContentDataCapable(createPlayer())).toBe(true);
    });

    it('reports itself able to name a source, pause, and carry a volume', () => {
      const player = createPlayer();

      expect(isMediaSourceCapable(player)).toBe(true);
      expect(isMediaPauseCapable(player)).toBe(true);
      expect(isMediaVolumeCapable(player)).toBe(true);
      expect(isMediaPlaybackRateCapable(player)).toBe(true);
    });
  });

  describe('contentData', () => {
    it('reports the media name Wistia knows as the title', () => {
      const player = createPlayer();

      expect(player.contentData).toEqual({ title: null });

      player.name = 'Lenny Delivers Video';

      expect(player.contentData).toEqual({ title: 'Lenny Delivers Video' });
    });

    it('announces the content when the media data that carries the name lands', () => {
      const player = createPlayer();
      const contentdatachange = vi.fn();

      player.addEventListener('contentdatachange', contentdatachange);

      player.dispatchEvent(new Event('loaded-media-data'));

      expect(contentdatachange).toHaveBeenCalledTimes(1);
    });
  });

  it('answers empty for the members Wistia has nothing behind', () => {
    const player = createPlayer();

    expect(player.played.length).toBe(0);
    expect(player.textTracks.length).toBe(0);
    expect(player.videoWidth).toBe(0);
    expect(player.error).toBe(null);
    expect(player.canPlayType('video/mp4')).toBe('');
    expect(player.streamType).toBe('on-demand');
  });

  it('leaves fullscreen to the player, which takes its own chrome along', async () => {
    const player = createPlayer();

    player.inFullscreen = true;
    expect(player.isFullscreen).toBe(true);

    await player.exitFullscreen();
    expect(player.cancelFullscreen).toHaveBeenCalled();
  });

  describe('events', () => {
    it('re-dispatches the ones Wistia spells its own way', () => {
      const player = createPlayer();
      const types: string[] = [];

      for (const type of ['timeupdate', 'volumechange', 'ratechange', 'canplay', 'loadeddata', 'loadstart']) {
        player.addEventListener(type, () => types.push(type));
      }

      for (const type of ['time-update', 'volume-change', 'rate-change', 'can-play', 'loaded-data', 'load-start']) {
        player.dispatchEvent(new Event(type));
      }

      expect(types).toEqual(['timeupdate', 'volumechange', 'ratechange', 'canplay', 'loadeddata', 'loadstart']);
    });

    it('stands in for the ones Wistia has none of', () => {
      const player = createPlayer();
      const types: string[] = [];

      for (const type of ['durationchange', 'progress', 'playing']) {
        player.addEventListener(type, () => types.push(type));
      }

      // A moving playhead is the only news that `buffered` may have moved, and Wistia's `play` already means
      // playback has begun.
      player.dispatchEvent(new Event('loaded-metadata'));
      player.dispatchEvent(new Event('time-update'));
      player.dispatchEvent(new Event('play'));

      expect(types).toEqual(['durationchange', 'progress', 'playing']);
    });

    it('runs the clock from either event that carries a playhead', () => {
      const player = createPlayer();
      const timeupdate = vi.fn();

      player.addEventListener('timeupdate', timeupdate);

      // `second-change` is the same news once a second, and keeps the clock running if the other goes quiet.
      player.dispatchEvent(new Event('time-update'));
      expect(timeupdate).toHaveBeenCalledTimes(1);

      player.dispatchEvent(new Event('second-change'));
      expect(timeupdate).toHaveBeenCalledTimes(2);
    });

    it('announces a duration from every moment Wistia can first have one', () => {
      const player = createPlayer();
      const durationchange = vi.fn();

      player.addEventListener('durationchange', durationchange);

      // `duration` reads 0 until `api-ready`, and `loaded-metadata` may wait on a click — so a media nobody
      // touches would never report one if that were the only signal.
      player.dispatchEvent(new Event('api-ready'));
      expect(durationchange).toHaveBeenCalledTimes(1);

      player.dispatchEvent(new Event('loaded-media-data'));
      expect(durationchange).toHaveBeenCalledTimes(2);

      player.dispatchEvent(new Event('loaded-metadata'));
      expect(durationchange).toHaveBeenCalledTimes(3);
    });

    it('announces metadata once per source, whichever moment gets there first', () => {
      const player = createPlayer();
      const loadedmetadata = vi.fn();

      player.addEventListener('loadedmetadata', loadedmetadata);

      player.dispatchEvent(new Event('api-ready'));
      player.dispatchEvent(new Event('loaded-metadata'));
      expect(loadedmetadata).toHaveBeenCalledTimes(1);

      // The next media gets to announce its own.
      player.source = { mediaId: HASHED_ID };
      player.dispatchEvent(new Event('loaded-metadata'));
      expect(loadedmetadata).toHaveBeenCalledTimes(2);
    });

    it('leaves alone the ones Wistia already spells the way a media element does', () => {
      const player = createPlayer();
      const types: string[] = [];

      for (const type of ['play', 'pause', 'ended', 'seeking', 'seeked']) {
        player.addEventListener(type, () => types.push(type));
      }

      for (const type of ['play', 'pause', 'ended', 'seeking', 'seeked']) {
        player.dispatchEvent(new Event(type));
      }

      // One each: no alias re-dispatches them, so nothing arrives twice.
      expect(types).toEqual(['play', 'pause', 'ended', 'seeking', 'seeked']);
    });
  });
});
