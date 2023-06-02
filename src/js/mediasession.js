import window from 'global/window';
import {getMimetype} from './utils/mimetypes';

/**
 *
 * Sets up media session if supported and configured
 *
 * @this { import('./player').default }
 */
export const initMediaSession = function() {
  if (!this.options_.mediaSession || !('mediaSession' in window.navigator)) {
    return;
  }
  const ms = window.navigator.mediaSession;
  const skipTime = this.options_.mediaSession.skipTime || 15;

  const actionHandlers = [
    ['play', () => {
      this.play();
    }],
    ['pause', () => {
      this.pause();
    }],
    ['stop', () => {
      this.pause();
      this.currentTime(0);
    }],
    ['seekbackward', (details) => {
      if (this.usingPlugin('ads') && this.ads.inAdBreak()) {
        return;
      }
      this.currentTime(Math.max(0, this.currentTime() - (details.skipOffset || skipTime)));
    }],
    ['seekforward', (details) => {
      if (this.usingPlugin('ads') && this.ads.inAdBreak()) {
        return;
      }
      this.currentTime(Math.min(this.duration(), this.currentTime() + (details.skipOffset || skipTime)));
    }],
    ['seekto', (details) => {
      if (this.usingPlugin('ads') && this.ads.inAdBreak()) {
        return;
      }
      this.currentTime(details.seekTime);
    }]
  ];

  for (const [action, handler] of actionHandlers) {
    try {
      ms.setActionHandler(action, handler);
    } catch (error) {
      this.log.debug(`Couldn't register media session action "${action}".`);
    }
  }

  const setUpMediaSessionPlaylist = () => {
    try {
      ms.setActionHandler('previoustrack', () => {
        this.playlist.previous();
      });
      ms.setActionHandler('nexttrack', () => {
        this.playlist.next();
      });
    } catch (error) {
      this.log('Couldn\'t register playlist media session actions.');
    }
  };

  // Only setup playlist handlers if / when playlist plugin is present
  if (this.usingPlugin('playlist')) {
    setUpMediaSessionPlaylist();
  } else {
    this.on('pluginsetup:playlist', setUpMediaSessionPlaylist);
  }

  /**
   * @fires Player#updatemediasession
   */
  const updateMediaSession = () => {
    this.log('updatems');
    const currentMedia = this.getMedia();
    const playlistItem = this.usingPlugin('playlist') ? Object.assign({}, this.playlist()[this.playlist.currentItem()]) : {};
    const mediaSessionData = {
      artwork: currentMedia.artwork || playlistItem.artwork || this.poster() ? [{
        src: this.poster(),
        type: getMimetype(this.poster())
      }] : [],
      title: currentMedia.title || playlistItem.name || '',
      artist: currentMedia.artist || playlistItem.artist || '',
      album: currentMedia.album || playlistItem.album || ''
    };

    // This allows the metadata to be updated before being set, e.g. if loadmedia() is not used.
    this.trigger('updatemediasession', mediaSessionData);

    ms.metadata = new window.MediaMetadata(mediaSessionData);
  };

  const updatePositionState = () => {
    ms.setPositionState({
      duration: this.duration(),
      playbackRate: this.playbackRate(),
      position: this.currentTime()
    });
  };

  this.on('playing', updateMediaSession);

  if ('setPositionState' in ms) {
    this.on(['playing', 'seeked', 'ratechange'], updatePositionState);
  }
};
