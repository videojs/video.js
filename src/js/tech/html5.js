/**
 * @file html5.js
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 */

import Tech from './tech.js';
import Component from '../component';
import * as Dom from '../utils/dom.js';
import * as Url from '../utils/url.js';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import tsml from 'tsml';
import * as browser from '../utils/browser.js';
import document from 'global/document';
import window from 'global/window';
import assign from 'object.assign';
import mergeOptions from '../utils/merge-options.js';
import toTitleCase from '../utils/to-title-case.js';

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @class Html5
 */
class Html5 extends Tech {

  constructor(options, ready) {
    super(options, ready);

    const source = options.source;
    let crossoriginTracks = false;

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (this.el_.currentSrc !== source.src || (options.tag && options.tag.initNetworkState_ === 3))) {
      this.setSource(source);
    } else {
      this.handleLateInit_(this.el_);
    }

    if (this.el_.hasChildNodes()) {

      const nodes = this.el_.childNodes;
      let nodesLength = nodes.length;
      const removeNodes = [];

      while (nodesLength--) {
        const node = nodes[nodesLength];
        const nodeName = node.nodeName.toLowerCase();

        if (nodeName === 'track') {
          if (!this.featuresNativeTextTracks) {
            // Empty video tag tracks so the built-in player doesn't use them also.
            // This may not be fast enough to stop HTML5 browsers from reading the tags
            // so we'll need to turn off any default tracks if we're manually doing
            // captions and subtitles. videoElement.textTracks
            removeNodes.push(node);
          } else {
            // store HTMLTrackElement and TextTrack to remote list
            this.remoteTextTrackEls().addTrackElement_(node);
            this.remoteTextTracks().addTrack_(node.track);
            if (!crossoriginTracks &&
                !this.el_.hasAttribute('crossorigin') &&
                Url.isCrossOrigin(node.src)) {
              crossoriginTracks = true;
            }
          }
        }
      }

      for (let i = 0; i < removeNodes.length; i++) {
        this.el_.removeChild(removeNodes[i]);
      }
    }

    // TODO: add text tracks into this list
    const trackTypes = ['audio', 'video'];

    // ProxyNative Video/Audio Track
    trackTypes.forEach((type) => {
      const elTracks = this.el()[`${type}Tracks`];
      const techTracks = this[`${type}Tracks`]();
      const capitalType = toTitleCase(type);

      if (!this[`featuresNative${capitalType}Tracks`] ||
          !elTracks ||
          !elTracks.addEventListener) {
        return;
      }

      this[`handle${capitalType}TrackChange_`] = (e) => {
        techTracks.trigger({
          type: 'change',
          target: techTracks,
          currentTarget: techTracks,
          srcElement: techTracks
        });
      };
      this[`handle${capitalType}TrackAdd_`] = (e) => techTracks.addTrack(e.track);
      this[`handle${capitalType}TrackRemove_`] = (e) => techTracks.removeTrack(e.track);

      elTracks.addEventListener('change', this[`handle${capitalType}TrackChange_`]);
      elTracks.addEventListener('addtrack', this[`handle${capitalType}TrackAdd_`]);
      elTracks.addEventListener('removetrack', this[`handle${capitalType}TrackRemove_`]);
      this[`removeOld${capitalType}Tracks_`] = (e) => this.removeOldTracks_(techTracks, elTracks);

      // Remove (native) tracks that are not used anymore
      this.on('loadstart', this[`removeOld${capitalType}Tracks_`]);
    });

    if (this.featuresNativeTextTracks) {
      if (crossoriginTracks) {
        log.warn(tsml`Text Tracks are being loaded from another origin but the crossorigin attribute isn't used.
            This may prevent text tracks from loading.`);
      }

      this.handleTextTrackChange_ = Fn.bind(this, this.handleTextTrackChange);
      this.handleTextTrackAdd_ = Fn.bind(this, this.handleTextTrackAdd);
      this.handleTextTrackRemove_ = Fn.bind(this, this.handleTextTrackRemove);
      this.proxyNativeTextTracks_();
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if ((browser.TOUCH_ENABLED || browser.IS_IPHONE ||
        browser.IS_NATIVE_ANDROID) && options.nativeControlsForTouch === true) {
      this.setControls(true);
    }

    // on iOS, we want to proxy `webkitbeginfullscreen` and `webkitendfullscreen`
    // into a `fullscreenchange` event
    this.proxyWebkitFullscreen_();

    this.triggerReady();
  }

  /**
   * Dispose of html5 media element
   */
  dispose() {
    // Un-ProxyNativeTracks
    ['audio', 'video', 'text'].forEach((type) => {
      const capitalType = toTitleCase(type);
      const tl = this.el_[`${type}Tracks`];

      if (tl && tl.removeEventListener) {
        tl.removeEventListener('change', this[`handle${capitalType}TrackChange_`]);
        tl.removeEventListener('addtrack', this[`handle${capitalType}TrackAdd_`]);
        tl.removeEventListener('removetrack', this[`handle${capitalType}TrackRemove_`]);
      }

      // Stop removing old text tracks
      if (tl) {
        this.off('loadstart', this[`removeOld${capitalType}Tracks_`]);
      }
    });

    Html5.disposeMediaElement(this.el_);
    // tech will handle clearing of the emulated track list
    super.dispose();
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   */
  createEl() {
    let el = this.options_.tag;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (!el || this.movingMediaElementInDOM === false) {

      // If the original tag is still there, clone and remove it.
      if (el) {
        const clone = el.cloneNode(true);

        el.parentNode.insertBefore(clone, el);
        Html5.disposeMediaElement(el);
        el = clone;
      } else {
        el = document.createElement('video');

        // determine if native controls should be used
        const tagAttributes = this.options_.tag && Dom.getElAttributes(this.options_.tag);
        const attributes = mergeOptions({}, tagAttributes);

        if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
          delete attributes.controls;
        }

        Dom.setElAttributes(el,
          assign(attributes, {
            id: this.options_.techId,
            class: 'vjs-tech'
          })
        );
      }

      el.playerId = this.options_.playerId;
    }

    // Update specific tag settings, in case they were overridden
    const settingsAttrs = ['autoplay', 'preload', 'loop', 'muted'];

    for (let i = settingsAttrs.length - 1; i >= 0; i--) {
      const attr = settingsAttrs[i];
      const overwriteAttrs = {};

      if (typeof this.options_[attr] !== 'undefined') {
        overwriteAttrs[attr] = this.options_[attr];
      }
      Dom.setElAttributes(el, overwriteAttrs);
    }

    return el;
    // jenniisawesome = true;
  }

  // If we're loading the playback object after it has started loading
  // or playing the video (often with autoplay on) then the loadstart event
  // has already fired and we need to fire it manually because many things
  // rely on it.
  handleLateInit_(el) {
    if (el.networkState === 0 || el.networkState === 3) {
      // The video element hasn't started loading the source yet
      // or didn't find a source
      return;
    }

    if (el.readyState === 0) {
      // NetworkState is set synchronously BUT loadstart is fired at the
      // end of the current stack, usually before setInterval(fn, 0).
      // So at this point we know loadstart may have already fired or is
      // about to fire, and either way the player hasn't seen it yet.
      // We don't want to fire loadstart prematurely here and cause a
      // double loadstart so we'll wait and see if it happens between now
      // and the next loop, and fire it if not.
      // HOWEVER, we also want to make sure it fires before loadedmetadata
      // which could also happen between now and the next loop, so we'll
      // watch for that also.
      let loadstartFired = false;
      const setLoadstartFired = function() {
        loadstartFired = true;
      };

      this.on('loadstart', setLoadstartFired);

      const triggerLoadstart = function() {
        // We did miss the original loadstart. Make sure the player
        // sees loadstart before loadedmetadata
        if (!loadstartFired) {
          this.trigger('loadstart');
        }
      };

      this.on('loadedmetadata', triggerLoadstart);

      this.ready(function() {
        this.off('loadstart', setLoadstartFired);
        this.off('loadedmetadata', triggerLoadstart);

        if (!loadstartFired) {
          // We did miss the original native loadstart. Fire it now.
          this.trigger('loadstart');
        }
      });

      return;
    }

    // From here on we know that loadstart already fired and we missed it.
    // The other readyState events aren't as much of a problem if we double
    // them, so not going to go to as much trouble as loadstart to prevent
    // that unless we find reason to.
    const eventsToTrigger = ['loadstart'];

    // loadedmetadata: newly equal to HAVE_METADATA (1) or greater
    eventsToTrigger.push('loadedmetadata');

    // loadeddata: newly increased to HAVE_CURRENT_DATA (2) or greater
    if (el.readyState >= 2) {
      eventsToTrigger.push('loadeddata');
    }

    // canplay: newly increased to HAVE_FUTURE_DATA (3) or greater
    if (el.readyState >= 3) {
      eventsToTrigger.push('canplay');
    }

    // canplaythrough: newly equal to HAVE_ENOUGH_DATA (4)
    if (el.readyState >= 4) {
      eventsToTrigger.push('canplaythrough');
    }

    // We still need to give the player time to add event listeners
    this.ready(function() {
      eventsToTrigger.forEach(function(type) {
        this.trigger(type);
      }, this);
    });
  }

  proxyNativeTextTracks_() {
    const tt = this.el().textTracks;

    if (tt) {
      // Add tracks - if player is initialised after DOM loaded, textTracks
      // will not trigger addtrack
      for (let i = 0; i < tt.length; i++) {
        this.textTracks().addTrack_(tt[i]);
      }

      if (tt.addEventListener) {
        tt.addEventListener('change', this.handleTextTrackChange_);
        tt.addEventListener('addtrack', this.handleTextTrackAdd_);
        tt.addEventListener('removetrack', this.handleTextTrackRemove_);
      }

      // Remove (native) texttracks that are not used anymore
      this.on('loadstart', this.removeOldTextTracks_);
    }
  }

  handleTextTrackChange(e) {
    const tt = this.textTracks();

    this.textTracks().trigger({
      type: 'change',
      target: tt,
      currentTarget: tt,
      srcElement: tt
    });
  }

  handleTextTrackAdd(e) {
    this.textTracks().addTrack_(e.track);
  }

  handleTextTrackRemove(e) {
    this.textTracks().removeTrack_(e.track);
  }

  /**
   * This is a helper function that is used in removeOldTextTracks_, removeOldAudioTracks_ and
   * removeOldVideoTracks_
   * @param {Track[]} techTracks Tracks for this tech
   * @param {Track[]} elTracks Tracks for the HTML5 video element
   * @private
   */
  removeOldTracks_(techTracks, elTracks) {
    // This will loop over the techTracks and check if they are still used by the HTML5 video element
    // If not, they will be removed from the emulated list
    const removeTracks = [];

    if (!elTracks) {
      return;
    }

    for (let i = 0; i < techTracks.length; i++) {
      const techTrack = techTracks[i];
      let found = false;

      for (let j = 0; j < elTracks.length; j++) {
        if (elTracks[j] === techTrack) {
          found = true;
          break;
        }
      }

      if (!found) {
        removeTracks.push(techTrack);
      }
    }

    for (let i = 0; i < removeTracks.length; i++) {
      const track = removeTracks[i];

      techTracks.removeTrack_(track);
    }
  }

  removeOldTextTracks_() {
    const techTracks = this.textTracks();
    const elTracks = this.el().textTracks;

    this.removeOldTracks_(techTracks, elTracks);
  }

  /**
   * Play for html5 tech
   */
  play() {
    const playPromise = this.el_.play();

    // Catch/silence error when a pause interrupts a play request
    // on browsers which return a promise
    if (playPromise !== undefined && typeof playPromise.then === 'function') {
      playPromise.then(null, (e) => {});
    }
  }

  /**
   * Set current time
   *
   * @param {Number} seconds Current time of video
   */
  setCurrentTime(seconds) {
    try {
      this.el_.currentTime = seconds;
    } catch (e) {
      log(e, 'Video is not ready. (Video.js)');
      // this.warning(VideoJS.warnings.videoNotReady);
    }
  }

  /**
   * Get duration
   *
   * @return {Number}
   */
  duration() {
    // Android Chrome will report duration as Infinity for VOD HLS until after
    // playback has started, which triggers the live display erroneously.
    // Return NaN if playback has not started and trigger a durationupdate once
    // the duration can be reliably known.
    if (this.el_.duration === Infinity &&
      browser.IS_ANDROID && browser.IS_CHROME) {
      if (this.el_.currentTime === 0) {
        // Wait for the first `timeupdate` with currentTime > 0 - there may be
        // several with 0
        const checkProgress = () => {
          if (this.el_.currentTime > 0) {
            // Trigger durationchange for genuinely live video
            if (this.el_.duration === Infinity) {
              this.trigger('durationchange');
            }
            this.off(this.player_, 'timeupdate', checkProgress);
          }
        };

        this.on(this.player_, 'timeupdate', checkProgress);
        return NaN;
      }
    }
    return this.el_.duration || NaN;
  }

  /**
   * Get player width
   *
   * @return {Number}
   */
  width() {
    return this.el_.offsetWidth;
  }

  /**
   * Get player height
   *
   * @return {Number}
   */
  height() {
    return this.el_.offsetHeight;
  }

  /**
   * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
   * `fullscreenchange` event
   *
   * @private
   * @method proxyWebkitFullscreen_
   */
  proxyWebkitFullscreen_() {
    if (!('webkitDisplayingFullscreen' in this.el_)) {
      return;
    }

    const endFn = function() {
      this.trigger('fullscreenchange', { isFullscreen: false });
    };

    const beginFn = function() {
      this.one('webkitendfullscreen', endFn);

      this.trigger('fullscreenchange', { isFullscreen: true });
    };

    this.on('webkitbeginfullscreen', beginFn);
    this.on('dispose', () => {
      this.off('webkitbeginfullscreen', beginFn);
      this.off('webkitendfullscreen', endFn);
    });
  }

  /**
   * Get if there is fullscreen support
   *
   * @return {Boolean}
   */
  supportsFullScreen() {
    if (typeof this.el_.webkitEnterFullScreen === 'function') {
      const userAgent = window.navigator && window.navigator.userAgent || '';

      // Seems to be broken in Chromium/Chrome && Safari in Leopard
      if ((/Android/).test(userAgent) || !(/Chrome|Mac OS X 10.5/).test(userAgent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Request to enter fullscreen
   */
  enterFullScreen() {
    const video = this.el_;

    if (video.paused && video.networkState <= video.HAVE_METADATA) {
      // attempt to prime the video element for programmatic access
      // this isn't necessary on the desktop but shouldn't hurt
      this.el_.play();

      // playing and pausing synchronously during the transition to fullscreen
      // can get iOS ~6.1 devices into a play/pause loop
      this.setTimeout(function() {
        video.pause();
        video.webkitEnterFullScreen();
      }, 0);
    } else {
      video.webkitEnterFullScreen();
    }
  }

  /**
   * Request to exit fullscreen
   */
  exitFullScreen() {
    this.el_.webkitExitFullScreen();
  }

  /**
   * Get/set video
   *
   * @param {Object=} src Source object
   * @return {Object}
   */
  src(src) {
    if (src === undefined) {
      return this.el_.src;
    }

    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(src);
  }

  /**
   * Reset the tech. Removes all sources and calls `load`.
   */
  reset() {
    Html5.resetMediaElement(this.el_);
  }

  /**
   * Get current source
   *
   * @return {Object}
   */
  currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.currentSrc;
  }

  /**
   * Set controls attribute
   *
   * @param {String} val Value for controls attribute
   */
  setControls(val) {
    this.el_.controls = !!val;
  }

  /**
   * Creates and returns a text track object
   *
   * @param {String} kind Text track kind (subtitles, captions, descriptions
   *                                       chapters and metadata)
   * @param {String=} label Label to identify the text track
   * @param {String=} language Two letter language abbreviation
   * @return {TextTrackObject}
   */
  addTextTrack(kind, label, language) {
    if (!this.featuresNativeTextTracks) {
      return super.addTextTrack(kind, label, language);
    }

    return this.el_.addTextTrack(kind, label, language);
  }

  /**
   * Creates either native TextTrack or an emulated TextTrack depending
   * on the value of `featuresNativeTextTracks`
   *
   * @param {Object} options The object should contain values for
   * kind, language, label and src (location of the WebVTT file)
   * @method createRemoteTextTrack
   */
  createRemoteTextTrack(options) {
    if (!this.featuresNativeTextTracks) {
      return super.createRemoteTextTrack(options);
    }
    const htmlTrackElement = document.createElement('track');

    if (options.kind) {
      htmlTrackElement.kind = options.kind;
    }
    if (options.label) {
      htmlTrackElement.label = options.label;
    }
    if (options.language || options.srclang) {
      htmlTrackElement.srclang = options.language || options.srclang;
    }
    if (options.default) {
      htmlTrackElement.default = options.default;
    }
    if (options.id) {
      htmlTrackElement.id = options.id;
    }
    if (options.src) {
      htmlTrackElement.src = options.src;
    }

    return htmlTrackElement;
  }

  /**
   * Creates a remote text track object and returns a html track element
   *
   * @param {Object} options The object should contain values for
   * kind, language, label and src (location of the WebVTT file)
   * @return {HTMLTrackElement}
   */
  addRemoteTextTrack(options = {}, ...theRest) {
    const htmlTrackElement = super.addRemoteTextTrack(options, ...theRest);

    this.el().appendChild(htmlTrackElement);

    return htmlTrackElement;
  }

  /**
   * Remove remote text track from TextTrackList object
   *
   * @param {TextTrackObject} track Texttrack object to remove
   */
  removeRemoteTextTrack(track) {
    super.removeRemoteTextTrack(track);

    const tracks = this.$$('track');

    let i = tracks.length;

    while (i--) {
      if (track === tracks[i] || track === tracks[i].track) {
        this.el().removeChild(tracks[i]);
      }
    }
  }

}

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Element for testing browser HTML5 video capabilities
 *
 * @type {Element}
 * @constant
 * @private
 */
Html5.TEST_VID = document.createElement('video');
const track = document.createElement('track');

track.kind = 'captions';
track.srclang = 'en';
track.label = 'English';
Html5.TEST_VID.appendChild(track);

/**
 * Check if HTML5 video is supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.isSupported = function() {
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Html5.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!Html5.TEST_VID.canPlayType;
};

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 *
 * @return {Boolean}
 */
Html5.canControlVolume = function() {
  // IE will error if Windows Media Player not installed #3315
  try {
    const volume = Html5.TEST_VID.volume;

    Html5.TEST_VID.volume = (volume / 2) + 0.1;
    return volume !== Html5.TEST_VID.volume;
  } catch (e) {
    return false;
  }
};

/**
 * Check if playbackRate is supported in this browser/device.
 *
 * @return {Boolean}
 */
Html5.canControlPlaybackRate = function() {
  // Playback rate API is implemented in Android Chrome, but doesn't do anything
  // https://github.com/videojs/video.js/issues/3180
  if (browser.IS_ANDROID && browser.IS_CHROME) {
    return false;
  }
  // IE will error if Windows Media Player not installed #3315
  try {
    const playbackRate = Html5.TEST_VID.playbackRate;

    Html5.TEST_VID.playbackRate = (playbackRate / 2) + 0.1;
    return playbackRate !== Html5.TEST_VID.playbackRate;
  } catch (e) {
    return false;
  }
};

/**
 * Check to see if native text tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeTextTracks = function() {
  let supportsTextTracks;

  // Figure out native text track support
  // If mode is a number, we cannot change it because it'll disappear from view.
  // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
  // Firefox isn't playing nice either with modifying the mode
  // TODO: Investigate firefox: https://github.com/videojs/video.js/issues/1862
  supportsTextTracks = !!Html5.TEST_VID.textTracks;
  if (supportsTextTracks && Html5.TEST_VID.textTracks.length > 0) {
    supportsTextTracks = typeof Html5.TEST_VID.textTracks[0].mode !== 'number';
  }
  if (supportsTextTracks && browser.IS_FIREFOX) {
    supportsTextTracks = false;
  }
  if (supportsTextTracks && !('onremovetrack' in Html5.TEST_VID.textTracks)) {
    supportsTextTracks = false;
  }

  return supportsTextTracks;
};

/**
 * Check to see if native video tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeVideoTracks = function() {
  const supportsVideoTracks = !!Html5.TEST_VID.videoTracks;

  return supportsVideoTracks;
};

/**
 * Check to see if native audio tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeAudioTracks = function() {
  const supportsAudioTracks = !!Html5.TEST_VID.audioTracks;

  return supportsAudioTracks;
};

/**
 * An array of events available on the Html5 tech.
 *
 * @private
 * @type {Array}
 */
Html5.Events = [
  'loadstart',
  'suspend',
  'abort',
  'error',
  'emptied',
  'stalled',
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'playing',
  'waiting',
  'seeking',
  'seeked',
  'ended',
  'durationchange',
  'timeupdate',
  'progress',
  'play',
  'pause',
  'ratechange',
  'volumechange'
];

/**
 * Set the tech's volume control support status
 *
 * @type {Boolean}
 */
Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 *
 * @type {Boolean}
 */
Html5.prototype.featuresPlaybackRate = Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 *
 * @type {Boolean}
 */
Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
Html5.prototype.featuresFullscreenResize = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the Tech)
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Set the tech's timeupdate event support status
 * (this disables the manual timeupdate events of the Tech)
 */
Html5.prototype.featuresTimeupdateEvents = true;

/**
 * Sets the tech's status on native text track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeTextTracks = Html5.supportsNativeTextTracks();

/**
 * Sets the tech's status on native text track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeVideoTracks = Html5.supportsNativeVideoTracks();

/**
 * Sets the tech's status on native audio track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeAudioTracks = Html5.supportsNativeAudioTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
let canPlayType;
const mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
const mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function() {
  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (browser.ANDROID_VERSION >= 4.0 && !browser.IS_FIREFOX) {
    if (!canPlayType) {
      canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType;
    }

    Html5.TEST_VID.constructor.prototype.canPlayType = function(type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }

  // Override Android 2.2 and less canPlayType method which is broken
  if (browser.IS_OLD_ANDROID) {
    if (!canPlayType) {
      canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType;
    }

    Html5.TEST_VID.constructor.prototype.canPlayType = function(type) {
      if (type && mp4RE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }
};

Html5.unpatchCanPlayType = function() {
  const r = Html5.TEST_VID.constructor.prototype.canPlayType;

  Html5.TEST_VID.constructor.prototype.canPlayType = canPlayType;
  canPlayType = null;
  return r;
};

// by default, patch the video element
Html5.patchCanPlayType();

Html5.disposeMediaElement = function(el) {
  if (!el) {
    return;
  }

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while (el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function() {
      try {
        el.load();
      } catch (e) {
        // not supported
      }
    }());
  }
};

Html5.resetMediaElement = function(el) {
  if (!el) {
    return;
  }

  const sources = el.querySelectorAll('source');
  let i = sources.length;

  while (i--) {
    el.removeChild(sources[i]);
  }

  // remove any src reference.
  // not setting `src=''` because that throws an error
  el.removeAttribute('src');

  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function() {
      try {
        el.load();
      } catch (e) {
        // satisfy linter
      }
    }());
  }
};

/* Native HTML5 element property wrapping ----------------------------------- */
// Wrap native properties with a getter
[
  /**
   * Paused for html5 tech
   *
   * @method Html5.prototype.paused
   * @return {Boolean}
   */
  'paused',
  /**
   * Get current time
   *
   * @method Html5.prototype.currentTime
   * @return {Number}
   */
  'currentTime',
  /**
   * Get a TimeRange object that represents the intersection
   * of the time ranges for which the user agent has all
   * relevant media
   *
   * @return {TimeRangeObject}
   * @method Html5.prototype.buffered
   */
  'buffered',
  /**
   * Get volume level
   *
   * @return {Number}
   * @method Html5.prototype.volume
   */
  'volume',
  /**
   * Get if muted
   *
   * @return {Boolean}
   * @method Html5.prototype.muted
   */
  'muted',
  /**
   * Get poster
   *
   * @return {String}
   * @method Html5.prototype.poster
   */
  'poster',
  /**
   * Get preload attribute
   *
   * @return {String}
   * @method Html5.prototype.preload
   */
  'preload',
  /**
   * Get autoplay attribute
   *
   * @return {String}
   * @method Html5.prototype.autoplay
   */
  'autoplay',
  /**
   * Get controls attribute
   *
   * @return {String}
   * @method Html5.prototype.controls
   */
  'controls',
  /**
   * Get loop attribute
   *
   * @return {String}
   * @method Html5.prototype.loop
   */
  'loop',
  /**
   * Get error value
   *
   * @return {String}
   * @method Html5.prototype.error
   */
  'error',
  /**
   * Get whether or not the player is in the "seeking" state
   *
   * @return {Boolean}
   * @method Html5.prototype.seeking
   */
  'seeking',
  /**
   * Get a TimeRanges object that represents the
   * ranges of the media resource to which it is possible
   * for the user agent to seek.
   *
   * @return {TimeRangeObject}
   * @method Html5.prototype.seekable
   */
  'seekable',
  /**
   * Get if video ended
   *
   * @return {Boolean}
   * @method Html5.prototype.ended
   */
  'ended',
  /**
   * Get the value of the muted content attribute
   * This attribute has no dynamic effect, it only
   * controls the default state of the element
   *
   * @return {Boolean}
   * @method Html5.prototype.defaultMuted
   */
  'defaultMuted',
  /**
   * Get desired speed at which the media resource is to play
   *
   * @return {Number}
   * @method Html5.prototype.playbackRate
   */
  'playbackRate',
  /**
   * Returns a TimeRanges object that represents the ranges of the
   * media resource that the user agent has played.
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-played
   *
   * @return {TimeRangeObject} the range of points on the media
   *                           timeline that has been reached through
   *                           normal playback
   * @method Html5.prototype.played
   */
  'played',
  /**
   * Get the current state of network activity for the element, from
   * the list below
   * - NETWORK_EMPTY (numeric value 0)
   * - NETWORK_IDLE (numeric value 1)
   * - NETWORK_LOADING (numeric value 2)
   * - NETWORK_NO_SOURCE (numeric value 3)
   *
   * @return {Number}
   * @method Html5.prototype.networkState
   */
  'networkState',
  /**
   * Get a value that expresses the current state of the element
   * with respect to rendering the current playback position, from
   * the codes in the list below
   * - HAVE_NOTHING (numeric value 0)
   * - HAVE_METADATA (numeric value 1)
   * - HAVE_CURRENT_DATA (numeric value 2)
   * - HAVE_FUTURE_DATA (numeric value 3)
   * - HAVE_ENOUGH_DATA (numeric value 4)
   *
   * @return {Number}
   * @method Html5.prototype.readyState
   */
  'readyState',
  /**
   * Get width of video
   *
   * @return {Number}
   * @method Html5.prototype.videoWidth
   */
  'videoWidth',
  /**
   * Get height of video
   *
   * @return {Number}
   * @method Html5.prototype.videoHeight
   */
  'videoHeight'
].forEach(function(prop) {
  Html5.prototype[prop] = function() {
    return this.el_[prop];
  };
});

// Wrap native properties with a setter in this format:
// set + toTitleCase(name)
[
  /**
   * Set volume level
   *
   * @param {Number} percentAsDecimal Volume percent as a decimal
   * @method Html5.prototype.setVolume
   */
  'volume',
  /**
   * Set muted
   *
   * @param {Boolean} muted If player is to be muted or note
   * @method Html5.prototype.setMuted
   */
  'muted',
  /**
   * Set video source
   *
   * @param {Object} src Source object
   * @deprecated since version 5
   * @method Html5.prototype.setSrc
   */
  'src',
  /**
   * Set poster
   *
   * @param {String} val URL to poster image
   * @method Html5.prototype.setPoster
   */
  'poster',
  /**
   * Set preload attribute
   *
   * @param {String} val Value for the preload attribute
   * @method Htm5.prototype.setPreload
   */
  'preload',
  /**
   * Set autoplay attribute
   *
   * @param {Boolean} autoplay Value for the autoplay attribute
   * @method setAutoplay
   */
  'autoplay',
  /**
   * Set loop attribute
   *
   * @param {Boolean} loop Value for the loop attribute
   * @method Html5.prototype.setLoop
   */
  'loop',
  /**
   * Set desired speed at which the media resource is to play
   *
   * @param {Number} val Speed at which the media resource is to play
   * @method Html5.prototype.setPlaybackRate
   */
  'playbackRate'
].forEach(function(prop) {
  Html5.prototype['set' + toTitleCase(prop)] = function(v) {
    this.el_[prop] = v;
  };
});

// wrap native functions with a function
[
  /**
   * Pause for html5 tech
   *
   * @method Html5.prototype.pause
   */
  'pause',
  /**
   * Load media into player
   *
   * @method Html5.prototype.load
   */
  'load'
].forEach(function(prop) {
  Html5.prototype[prop] = function() {
    return this.el_[prop]();
  };
});

// Add Source Handler pattern functions to this tech
Tech.withSourceHandlers(Html5);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 *
 * @param  {Object} source   The source object
 * @param  {Html5} tech  The instance of the HTML5 tech
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the video element can play the given videotype
 *
 * @param  {String} type    The mimetype to check
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canPlayType = function(type) {
  // IE9 on Windows 7 without MediaPlayer throws an error here
  // https://github.com/videojs/video.js/issues/519
  try {
    return Html5.TEST_VID.canPlayType(type);
  } catch (e) {
    return '';
  }
};

/**
 * Check if the video element can handle the source natively
 *
 * @param  {Object} source  The source object
 * @param  {Object} options The options passed to the tech
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canHandleSource = function(source, options) {

  // If a type was provided we should rely on that
  if (source.type) {
    return Html5.nativeSourceHandler.canPlayType(source.type);

  // If no type, fall back to checking 'video/[EXTENSION]'
  } else if (source.src) {
    const ext = Url.getFileExtension(source.src);

    return Html5.nativeSourceHandler.canPlayType(`video/${ext}`);
  }

  return '';
};

/**
 * Pass the source to the video element
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 *
 * @param  {Object} source   The source object
 * @param  {Html5}  tech     The instance of the Html5 tech
 * @param  {Object} options  The options to pass to the source
 */
Html5.nativeSourceHandler.handleSource = function(source, tech, options) {
  tech.setSrc(source.src);
};

/*
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Html5.nativeSourceHandler.dispose = function() {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

Component.registerComponent('Html5', Html5);
Tech.registerTech('Html5', Html5);
export default Html5;
