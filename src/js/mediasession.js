import window from 'global/window';
import {getMimetype} from './utils/mimetypes';

/**
 * @method initMediaSession Sets up media session if supported and configured
 * @this { import('./player').default } Player
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
    // videojs-contrib-ads
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

  // Using Google's recommendation that expects some handler may not be settable, especially as we
  // want to support older Chrome
  // https://web.dev/media-session/#let-users-control-whats-playing
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
      this.log.debug('Couldn\'t register playlist media session actions.');
    }
  };

  // Only setup playlist handlers if / when playlist plugin is present
  this.on('pluginsetup:playlist', setUpMediaSessionPlaylist);

  /**
   *
   * Updates the mediaSession metadata. Fires `updatemediasession` as an
   * opportunity to modify the metadata
   *
   * @fires Player#updatemediasession
   */
  const updateMediaSession = () => {
    const currentMedia = this.getMedia();
    const playlistItem = this.usingPlugin('playlist') ? Object.assign({}, this.playlist()[this.playlist.currentItem()]) : {};
    const mediaSessionData = {
      title: currentMedia.title || playlistItem.name || '',
      artist: currentMedia.artist || playlistItem.artist || '',
      album: currentMedia.album || playlistItem.album || ''
    };

    if (currentMedia.artwork) {
      mediaSessionData.artwork = currentMedia.artwork;
    } else if (playlistItem.artwork) {
      mediaSessionData.artwork = playlistItem.artwork;
    } else if (this.poster()) {
      mediaSessionData.artwork = [{
        src: this.poster(),
        type: getMimetype(this.poster())
      }];
    }

    // This allows the metadata to be updated before being set, e.g. if loadMedia() is not used.
    this.trigger('updatemediasession', mediaSessionData);

    ms.metadata = new window.MediaMetadata(mediaSessionData);
  };

  const updatePositionState = () => {
    const dur = parseFloat(this.duration());

    if (Number.isFinite(dur)) {
      ms.setPositionState({
        duration: dur,
        playbackRate: this.playbackRate(),
        position: this.currentTime()
      });
    }
  };

  this.on('playing', () => {
    updateMediaSession();
    ms.playbackState = 'playing';
  });

  this.on('paused', () => {
    ms.playbackState = 'paused';
  });

  if ('setPositionState' in ms) {
    this.on('timeupdate', updatePositionState);
  }
};
