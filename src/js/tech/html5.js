/**
 * @file html5.js
 */
import Tech from './tech.js';
import * as Dom from '../utils/dom.js';
import * as Url from '../utils/url.js';
import log from '../utils/log.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';
import window from 'global/window';
import {defineLazyProperty, merge} from '../utils/obj';
import {toTitleCase} from '../utils/str.js';
import {NORMAL as TRACK_TYPES, REMOTE} from '../tracks/track-types';
import setupSourceset from './setup-sourceset';
import {silencePromise} from '../utils/promise';

/** @import { SourceObject } from './tech' */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @mixes Tech~SourceHandlerAdditions
 * @extends Tech
 */
class Html5 extends Tech {

  /**
  * Create an instance of this Tech.
  *
  * @param {Object} [options]
  *        The key/value store of player options.
  *
  * @param {Function} [ready]
  *        Callback function to call when the `HTML5` Tech is ready.
  */
  constructor(options, ready) {
    super(options, ready);

    const source = options.source;
    let crossoriginTracks = false;

    this.featuresVideoFrameCallback = this.featuresVideoFrameCallback && this.el_.tagName === 'VIDEO';

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (this.el_.currentSrc !== source.src || (options.tag && options.tag.initNetworkState_ === 3))) {
      this.setSource(source);
    } else {
      this.handleLateInit_(this.el_);
    }

    // setup sourceset after late sourceset/init
    if (options.enableSourceset) {
      this.setupSourcesetHandling_();
    }

    this.isScrubbing_ = false;

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
            this.remoteTextTracks().addTrack(node.track);
            this.textTracks().addTrack(node.track);
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

    this.proxyNativeTracks_();
    if (this.featuresNativeTextTracks && crossoriginTracks) {
      log.warn('Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n' +
            'This may prevent text tracks from loading.');
    }

    // prevent iOS Safari from disabling metadata text tracks during native playback
    this.restoreMetadataTracksInIOSNativePlayer_();

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if ((browser.TOUCH_ENABLED || browser.IS_IPHONE) && options.nativeControlsForTouch === true) {
      this.setControls(true);
    }

    // on iOS, we want to proxy `webkitbeginfullscreen` and `webkitendfullscreen`
    // into a `fullscreenchange` event
    this.proxyWebkitFullscreen_();

    this.triggerReady();
  }

  /**
   * Dispose of `HTML5` media element and remove all tracks.
   */
  dispose() {
    if (this.el_ && this.el_.resetSourceset_) {
      this.el_.resetSourceset_();
    }
    Html5.disposeMediaElement(this.el_);
    this.options_ = null;

    // tech will handle clearing of the emulated track list
    super.dispose();
  }

  /**
   * Modify the media element so that we can detect when
   * the source is changed. Fires `sourceset` just after the source has changed
   */
  setupSourcesetHandling_() {
    setupSourceset(this);
  }

  /**
   * When a captions track is enabled in the iOS Safari native player, all other
   * tracks are disabled (including metadata tracks), which nulls all of their
   * associated cue points. This will restore metadata tracks to their pre-fullscreen
   * state in those cases so that cue points are not needlessly lost.
   *
   * @private
   */
  restoreMetadataTracksInIOSNativePlayer_() {
    const textTracks = this.textTracks();
    let metadataTracksPreFullscreenState;

    // captures a snapshot of every metadata track's current state
    const takeMetadataTrackSnapshot = () => {
      metadataTracksPreFullscreenState = [];

      for (let i = 0; i < textTracks.length; i++) {
        const track = textTracks[i];

        if (track.kind === 'metadata') {
          metadataTracksPreFullscreenState.push({
            track,
            storedMode: track.mode
          });
        }
      }
    };

    // snapshot each metadata track's initial state, and update the snapshot
    // each time there is a track 'change' event
    takeMetadataTrackSnapshot();
    textTracks.addEventListener('change', takeMetadataTrackSnapshot);

    this.on('dispose', () => textTracks.removeEventListener('change', takeMetadataTrackSnapshot));

    const restoreTrackMode = () => {
      for (let i = 0; i < metadataTracksPreFullscreenState.length; i++) {
        const storedTrack = metadataTracksPreFullscreenState[i];

        if (storedTrack.track.mode === 'disabled' && storedTrack.track.mode !== storedTrack.storedMode) {
          storedTrack.track.mode = storedTrack.storedMode;
        }
      }
      // we only want this handler to be executed on the first 'change' event
      textTracks.removeEventListener('change', restoreTrackMode);
    };

    // when we enter fullscreen playback, stop updating the snapshot and
    // restore all track modes to their pre-fullscreen state
    this.on('webkitbeginfullscreen', () => {
      textTracks.removeEventListener('change', takeMetadataTrackSnapshot);

      // remove the listener before adding it just in case it wasn't previously removed
      textTracks.removeEventListener('change', restoreTrackMode);
      textTracks.addEventListener('change', restoreTrackMode);
    });

    // start updating the snapshot again after leaving fullscreen
    this.on('webkitendfullscreen', () => {
      // remove the listener before adding it just in case it wasn't previously removed
      textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
      textTracks.addEventListener('change', takeMetadataTrackSnapshot);

      // remove the restoreTrackMode handler in case it wasn't triggered during fullscreen playback
      textTracks.removeEventListener('change', restoreTrackMode);
    });
  }

  /**
   * Attempt to force override of tracks for the given type
   *
   * @param {string} type - Track type to override, possible values include 'Audio',
   * 'Video', and 'Text'.
   * @param {boolean} override - If set to true native audio/video will be overridden,
   * otherwise native audio/video will potentially be used.
   * @private
   */
  overrideNative_(type, override) {
    // If there is no behavioral change don't add/remove listeners
    if (override !== this[`featuresNative${type}Tracks`]) {
      return;
    }

    const lowerCaseType = type.toLowerCase();

    if (this[`${lowerCaseType}TracksListeners_`]) {
      Object.keys(this[`${lowerCaseType}TracksListeners_`]).forEach((eventName) => {
        const elTracks = this.el()[`${lowerCaseType}Tracks`];

        elTracks.removeEventListener(eventName, this[`${lowerCaseType}TracksListeners_`][eventName]);
      });
    }

    this[`featuresNative${type}Tracks`] = !override;
    this[`${lowerCaseType}TracksListeners_`] = null;

    this.proxyNativeTracksForType_(lowerCaseType);
  }

  /**
   * Attempt to force override of native audio tracks.
   *
   * @param {boolean} override - If set to true native audio will be overridden,
   * otherwise native audio will potentially be used.
   */
  overrideNativeAudioTracks(override) {
    this.overrideNative_('Audio', override);
  }

  /**
   * Attempt to force override of native video tracks.
   *
   * @param {boolean} override - If set to true native video will be overridden,
   * otherwise native video will potentially be used.
   */
  overrideNativeVideoTracks(override) {
    this.overrideNative_('Video', override);
  }

  /**
   * Proxy native track list events for the given type to our track
   * lists if the browser we are playing in supports that type of track list.
   *
   * @param {string} name - Track type; values include 'audio', 'video', and 'text'
   * @private
   */
  proxyNativeTracksForType_(name) {
    const props = TRACK_TYPES[name];
    const elTracks = this.el()[props.getterName];
    const techTracks = this[props.getterName]();

    if (!this[`featuresNative${props.capitalName}Tracks`] ||
        !elTracks ||
        !elTracks.addEventListener) {
      return;
    }
    const listeners = {
      change: (e) => {
        const event = {
          type: 'change',
          target: techTracks,
          currentTarget: techTracks,
          srcElement: techTracks
        };

        techTracks.trigger(event);

        // if we are a text track change event, we should also notify the
        // remote text track list. This can potentially cause a false positive
        // if we were to get a change event on a non-remote track and
        // we triggered the event on the remote text track list which doesn't
        // contain that track. However, best practices mean looping through the
        // list of tracks and searching for the appropriate mode value, so,
        // this shouldn't pose an issue
        if (name === 'text') {
          this[REMOTE.remoteText.getterName]().trigger(event);
        }
      },
      addtrack(e) {
        techTracks.addTrack(e.track);
      },
      removetrack(e) {
        techTracks.removeTrack(e.track);
      }
    };
    const removeOldTracks = function() {
      const removeTracks = [];

      for (let i = 0; i < techTracks.length; i++) {
        let found = false;

        for (let j = 0; j < elTracks.length; j++) {
          if (elTracks[j] === techTracks[i]) {
            found = true;
            break;
          }
        }

        if (!found) {
          removeTracks.push(techTracks[i]);
        }
      }

      while (removeTracks.length) {
        techTracks.removeTrack(removeTracks.shift());
      }
    };

    this[props.getterName + 'Listeners_'] = listeners;

    Object.keys(listeners).forEach((eventName) => {
      const listener = listeners[eventName];

      elTracks.addEventListener(eventName, listener);
      this.on('dispose', (e) => elTracks.removeEventListener(eventName, listener));
    });

    // Remove (native) tracks that are not used anymore
    this.on('loadstart', removeOldTracks);
    this.on('dispose', (e) => this.off('loadstart', removeOldTracks));
  }

  /**
   * Proxy all native track list events to our track lists if the browser we are playing
   * in supports that type of track list.
   *
   * @private
   */
  proxyNativeTracks_() {
    TRACK_TYPES.names.forEach((name) => {
      this.proxyNativeTracksForType_(name);
    });
  }

  /**
   * Create the `Html5` Tech's DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    let el = this.options_.tag;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    // If we ingested the player div, we do not need to move the media element.
    if (!el ||
        !(this.options_.playerElIngest ||
          this.movingMediaElementInDOM)) {

      // If the original tag is still there, clone and remove it.
      if (el) {
        const clone = el.cloneNode(true);

        if (el.parentNode) {
          el.parentNode.insertBefore(clone, el);
        }
        Html5.disposeMediaElement(el);
        el = clone;

      } else {
        el = document.createElement('video');

        // determine if native controls should be used
        const tagAttributes = this.options_.tag && Dom.getAttributes(this.options_.tag);
        const attributes = merge({}, tagAttributes);

        if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
          delete attributes.controls;
        }

        Dom.setAttributes(
          el,
          Object.assign(attributes, {
            id: this.options_.techId,
            class: 'vjs-tech'
          })
        );
      }

      el.playerId = this.options_.playerId;
    }

    if (typeof this.options_.preload !== 'undefined') {
      Dom.setAttribute(el, 'preload', this.options_.preload);
    }

    if (this.options_.disablePictureInPicture !== undefined) {
      el.disablePictureInPicture = this.options_.disablePictureInPicture;
    }

    // Update specific tag settings, in case they were overridden
    // `autoplay` has to be *last* so that `muted` and `playsinline` are present
    // when iOS/Safari or other browsers attempt to autoplay.
    const settingsAttrs = ['loop', 'muted', 'playsinline', 'autoplay'];

    for (let i = 0; i < settingsAttrs.length; i++) {
      const attr = settingsAttrs[i];
      const value = this.options_[attr];

      if (typeof value !== 'undefined') {
        if (value) {
          Dom.setAttribute(el, attr, attr);
        } else {
          Dom.removeAttribute(el, attr);
        }
        el[attr] = value;
      }
    }

    return el;
  }

  /**
   * This will be triggered if the loadstart event has already fired, before videojs was
   * ready. Two known examples of when this can happen are:
   * 1. If we're loading the playback object after it has started loading
   * 2. The media is already playing the (often with autoplay on) then
   *
   * This function will fire another loadstart so that videojs can catchup.
   *
   * @fires Tech#loadstart
   *
   * @return {undefined}
   *         returns nothing.
   */
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

  /**
   * Set whether we are scrubbing or not.
   * This is used to decide whether we should use `fastSeek` or not.
   * `fastSeek` is used to provide trick play on Safari browsers.
   *
   * @param {boolean} isScrubbing
   *                  - true for we are currently scrubbing
   *                  - false for we are no longer scrubbing
   */
  setScrubbing(isScrubbing) {
    this.isScrubbing_ = isScrubbing;
  }

  /**
   * Get whether we are scrubbing or not.
   *
   * @return {boolean} isScrubbing
   *                  - true for we are currently scrubbing
   *                  - false for we are no longer scrubbing
   */
  scrubbing() {
    return this.isScrubbing_;
  }

  /**
   * Set current time for the `HTML5` tech.
   *
   * @param {number} seconds
   *        Set the current time of the media to this.
   */
  setCurrentTime(seconds) {
    try {
      if (this.isScrubbing_ && this.el_.fastSeek && browser.IS_ANY_SAFARI) {
        this.el_.fastSeek(seconds);
      } else {
        this.el_.currentTime = seconds;
      }
    } catch (e) {
      log(e, 'Video is not ready. (Video.js)');
      // this.warning(VideoJS.warnings.videoNotReady);
    }
  }

  /**
   * Get the current duration of the HTML5 media element.
   *
   * @return {number}
   *         The duration of the media or 0 if there is no duration.
   */
  duration() {
    // Android Chrome will report duration as Infinity for VOD HLS until after
    // playback has started, which triggers the live display erroneously.
    // Return NaN if playback has not started and trigger a durationupdate once
    // the duration can be reliably known.
    if (
      this.el_.duration === Infinity &&
      browser.IS_ANDROID &&
      browser.IS_CHROME &&
      this.el_.currentTime === 0
    ) {
      // Wait for the first `timeupdate` with currentTime > 0 - there may be
      // several with 0
      const checkProgress = () => {
        if (this.el_.currentTime > 0) {
          // Trigger durationchange for genuinely live video
          if (this.el_.duration === Infinity) {
            this.trigger('durationchange');
          }
          this.off('timeupdate', checkProgress);
        }
      };

      this.on('timeupdate', checkProgress);
      return NaN;
    }
    return this.el_.duration || NaN;
  }

  /**
   * Get the current width of the HTML5 media element.
   *
   * @return {number}
   *         The width of the HTML5 media element.
   */
  width() {
    return this.el_.offsetWidth;
  }

  /**
   * Get the current height of the HTML5 media element.
   *
   * @return {number}
   *         The height of the HTML5 media element.
   */
  height() {
    return this.el_.offsetHeight;
  }

  /**
   * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
   * `fullscreenchange` event.
   *
   * @private
   * @fires fullscreenchange
   * @listens webkitendfullscreen
   * @listens webkitbeginfullscreen
   * @listens webkitbeginfullscreen
   */
  proxyWebkitFullscreen_() {
    if (!('webkitDisplayingFullscreen' in this.el_)) {
      return;
    }

    const endFn = function() {
      this.trigger('fullscreenchange', { isFullscreen: false });
      // Safari will sometimes set controls on the videoelement when existing fullscreen.
      if (this.el_.controls && !this.options_.nativeControlsForTouch && this.controls()) {
        this.el_.controls = false;
      }
    };

    const beginFn = function() {
      if ('webkitPresentationMode' in this.el_ && this.el_.webkitPresentationMode !== 'picture-in-picture') {
        this.one('webkitendfullscreen', endFn);

        this.trigger('fullscreenchange', {
          isFullscreen: true,
          // set a flag in case another tech triggers fullscreenchange
          nativeIOSFullscreen: true
        });
      }
    };

    this.on('webkitbeginfullscreen', beginFn);
    this.on('dispose', () => {
      this.off('webkitbeginfullscreen', beginFn);
      this.off('webkitendfullscreen', endFn);
    });
  }

  /**
   * Check if fullscreen is supported on the video el.
   *
   * @return {boolean}
   *         - True if fullscreen is supported.
   *         - False if fullscreen is not supported.
   */
  supportsFullScreen() {
    return typeof this.el_.webkitEnterFullScreen === 'function';
  }

  /**
   * Request that the `HTML5` Tech enter fullscreen.
   */
  enterFullScreen() {
    const video = this.el_;

    if (video.paused && video.networkState <= video.HAVE_METADATA) {
      // attempt to prime the video element for programmatic access
      // this isn't necessary on the desktop but shouldn't hurt
      silencePromise(this.el_.play());

      // playing and pausing synchronously during the transition to fullscreen
      // can get iOS ~6.1 devices into a play/pause loop
      this.setTimeout(function() {
        video.pause();
        try {
          video.webkitEnterFullScreen();
        } catch (e) {
          this.trigger('fullscreenerror', e);
        }
      }, 0);
    } else {
      try {
        video.webkitEnterFullScreen();
      } catch (e) {
        this.trigger('fullscreenerror', e);
      }
    }
  }

  /**
   * Request that the `HTML5` Tech exit fullscreen.
   */
  exitFullScreen() {
    if (!this.el_.webkitDisplayingFullscreen) {
      this.trigger('fullscreenerror', new Error('The video is not fullscreen'));
      return;
    }

    this.el_.webkitExitFullScreen();
  }

  /**
   * Create a floating video window always on top of other windows so that users may
   * continue consuming media while they interact with other content sites, or
   * applications on their device.
   *
   * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
   *
   * @return {Promise}
   *         A promise with a Picture-in-Picture window.
   */
  requestPictureInPicture() {
    return this.el_.requestPictureInPicture();
  }

  /**
   * Native requestVideoFrameCallback if supported by browser/tech, or fallback
   * Don't use rVCF on Safari when DRM is playing, as it doesn't fire
   * Needs to be checked later than the constructor
   * This will be a false positive for clear sources loaded after a Fairplay source
   *
   * @param {function} cb function to call
   * @return {number} id of request
   */
  requestVideoFrameCallback(cb) {
    if (this.featuresVideoFrameCallback && !this.el_.webkitKeys) {
      return this.el_.requestVideoFrameCallback(cb);
    }
    return super.requestVideoFrameCallback(cb);
  }

  /**
   * Native or fallback requestVideoFrameCallback
   *
   * @param {number} id request id to cancel
   */
  cancelVideoFrameCallback(id) {
    if (this.featuresVideoFrameCallback && !this.el_.webkitKeys) {
      this.el_.cancelVideoFrameCallback(id);
    } else {
      super.cancelVideoFrameCallback(id);
    }
  }

  /**
   * A getter/setter for the `Html5` Tech's source object.
   * > Note: Please use {@link Html5#setSource}
   *
   * @param {SourceObject} [src]
   *        The source object you want to set on the `HTML5` techs element.
   *
   * @return {string|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   *
   * @deprecated Since version 5.
   */
  src(src) {
    if (src === undefined) {
      return this.el_.src;
    }

    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(src);
  }

  /**
   * Add a <source> element to the <video> element.
   *
   * @param {string} srcUrl
   *        The URL of the video source.
   *
   * @param {string} [mimeType]
   *        The MIME type of the video source. Optional but recommended.
   *
   * @return {boolean}
   *         Returns true if the source element was successfully added, false otherwise.
   */
  addSourceElement(srcUrl, mimeType) {
    if (!srcUrl) {
      log.error('Invalid source URL.');
      return false;
    }

    const sourceAttributes = { src: srcUrl };

    if (mimeType) {
      sourceAttributes.type = mimeType;
    }

    const sourceElement = Dom.createEl('source', {}, sourceAttributes);

    this.el_.appendChild(sourceElement);

    return true;
  }

  /**
   * Remove a <source> element from the <video> element by its URL.
   *
   * @param {string} srcUrl
   *        The URL of the source to remove.
   *
   * @return {boolean}
   *         Returns true if the source element was successfully removed, false otherwise.
   */
  removeSourceElement(srcUrl) {
    if (!srcUrl) {
      log.error('Source URL is required to remove the source element.');
      return false;
    }

    const sourceElements = this.el_.querySelectorAll('source');

    for (const sourceElement of sourceElements) {
      if (sourceElement.src === srcUrl) {
        this.el_.removeChild(sourceElement);

        return true;
      }
    }

    log.warn(`No matching source element found with src: ${srcUrl}`);

    return false;
  }

  /**
   * Reset the tech by removing all sources and then calling
   * {@link Html5.resetMediaElement}.
   */
  reset() {
    Html5.resetMediaElement(this.el_);
  }

  /**
   * Get the current source on the `HTML5` Tech. Falls back to returning the source from
   * the HTML5 media element.
   *
   * @return {string}
   *         The current source from the HTML5 tech. With a fallback to the
   *         elements source.
   */
  currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.currentSrc;
  }

  /**
   * Set controls attribute for the HTML5 media Element.
   *
   * @param {string} val
   *        Value to set the controls attribute to
   */
  setControls(val) {
    this.el_.controls = !!val;
  }

  /**
   * Create and returns a remote {@link TextTrack} object.
   *
   * @param {string} kind
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
   *
   * @param {string} [label]
   *        Label to identify the text track
   *
   * @param {string} [language]
   *        Two letter language abbreviation
   *
   * @return {TextTrack}
   *         The TextTrack that gets created.
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
   * @param {Object} options
   *        The object should contain the options to initialize the TextTrack with.
   *
   * @param {string} [options.kind]
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
   *
   * @param {string} [options.label]
   *        Label to identify the text track
   *
   * @param {string} [options.language]
   *        Two letter language abbreviation.
   *
   * @param {boolean} [options.default]
   *        Default this track to on.
   *
   * @param {string} [options.id]
   *        The internal id to assign this track.
   *
   * @param {string} [options.src]
   *        A source url for the track.
   *
   * @return {HTMLTrackElement}
   *         The track element that gets created.
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
   * Creates a remote text track object and returns an html track element.
   *
   * @param {Object} options The object should contain values for
   * kind, language, label, and src (location of the WebVTT file)
   * @param {boolean} [manualCleanup=false] if set to true, the TextTrack
   * will not be removed from the TextTrackList and HtmlTrackElementList
   * after a source change
   * @return {HTMLTrackElement} An Html Track Element.
   * This can be an emulated {@link HTMLTrackElement} or a native one.
   *
   */
  addRemoteTextTrack(options, manualCleanup) {
    const htmlTrackElement = super.addRemoteTextTrack(options, manualCleanup);

    if (this.featuresNativeTextTracks) {
      this.el().appendChild(htmlTrackElement);
    }

    return htmlTrackElement;
  }

  /**
   * Remove remote `TextTrack` from `TextTrackList` object
   *
   * @param {TextTrack} track
   *        `TextTrack` object to remove
   */
  removeRemoteTextTrack(track) {
    super.removeRemoteTextTrack(track);

    if (this.featuresNativeTextTracks) {
      const tracks = this.$$('track');

      let i = tracks.length;

      while (i--) {
        if (track === tracks[i] || track === tracks[i].track) {
          this.el().removeChild(tracks[i]);
        }
      }
    }
  }

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object}
   *         An object with supported media playback quality metrics
   */
  getVideoPlaybackQuality() {
    if (typeof this.el().getVideoPlaybackQuality === 'function') {
      return this.el().getVideoPlaybackQuality();
    }

    const videoPlaybackQuality = {};

    if (typeof this.el().webkitDroppedFrameCount !== 'undefined' &&
        typeof this.el().webkitDecodedFrameCount !== 'undefined') {
      videoPlaybackQuality.droppedVideoFrames = this.el().webkitDroppedFrameCount;
      videoPlaybackQuality.totalVideoFrames = this.el().webkitDecodedFrameCount;
    }

    if (window.performance) {
      videoPlaybackQuality.creationTime = window.performance.now();
    }

    return videoPlaybackQuality;
  }
}

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Element for testing browser HTML5 media capabilities
 *
 * @type {Element}
 * @constant
 * @private
 */
defineLazyProperty(Html5, 'TEST_VID', function() {
  if (!Dom.isReal()) {
    return;
  }
  const video = document.createElement('video');
  const track = document.createElement('track');

  track.kind = 'captions';
  track.srclang = 'en';
  track.label = 'English';
  video.appendChild(track);

  return video;
});

/**
 * Check if HTML5 media is supported by this browser/device.
 *
 * @return {boolean}
 *         - True if HTML5 media is supported.
 *         - False if HTML5 media is not supported.
 */
Html5.isSupported = function() {
  // IE with no Media Player is a LIAR! (#984)
  try {
    Html5.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
};

/**
 * Check if the tech can support the given type
 *
 * @param {string} type
 *        The mimetype to check
 * @return {string} 'probably', 'maybe', or '' (empty string)
 */
Html5.canPlayType = function(type) {
  return Html5.TEST_VID.canPlayType(type);
};

/**
 * Check if the tech can support the given source
 *
 * @param {Object} srcObj
 *        The source object
 * @param {Object} options
 *        The options passed to the tech
 * @return {string} 'probably', 'maybe', or '' (empty string)
 */
Html5.canPlaySource = function(srcObj, options) {
  return Html5.canPlayType(srcObj.type);
};

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 *
 * @return {boolean}
 *         - True if volume can be controlled
 *         - False otherwise
 */
Html5.canControlVolume = function() {
  // IE will error if Windows Media Player not installed #3315
  try {
    const volume = Html5.TEST_VID.volume;

    Html5.TEST_VID.volume = (volume / 2) + 0.1;

    const canControl = volume !== Html5.TEST_VID.volume;

    // With the introduction of iOS 15, there are cases where the volume is read as
    // changed but reverts back to its original state at the start of the next tick.
    // To determine whether volume can be controlled on iOS,
    // a timeout is set and the volume is checked asynchronously.
    // Since `features` doesn't currently work asynchronously, the value is manually set.
    if (canControl && browser.IS_IOS) {
      window.setTimeout(() => {
        if (Html5 && Html5.prototype) {
          Html5.prototype.featuresVolumeControl = volume !== Html5.TEST_VID.volume;
        }
      });

      // default iOS to false, which will be updated in the timeout above.
      return false;
    }

    return canControl;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the volume can be muted in this browser/device.
 * Some devices, e.g. iOS, don't allow changing volume
 * but permits muting/unmuting.
 *
 * @return {boolean}
 *      - True if volume can be muted
 *      - False otherwise
 */
Html5.canMuteVolume = function() {
  try {
    const muted = Html5.TEST_VID.muted;

    // in some versions of iOS muted property doesn't always
    // work, so we want to set both property and attribute
    Html5.TEST_VID.muted = !muted;
    if (Html5.TEST_VID.muted) {
      Dom.setAttribute(Html5.TEST_VID, 'muted', 'muted');
    } else {
      Dom.removeAttribute(Html5.TEST_VID, 'muted', 'muted');
    }
    return muted !== Html5.TEST_VID.muted;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the playback rate can be changed in this browser/device.
 *
 * @return {boolean}
 *         - True if playback rate can be controlled
 *         - False otherwise
 */
Html5.canControlPlaybackRate = function() {
  // Playback rate API is implemented in Android Chrome, but doesn't do anything
  // https://github.com/videojs/video.js/issues/3180
  if (browser.IS_ANDROID && browser.IS_CHROME && browser.CHROME_VERSION < 58) {
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
 * Check if we can override a video/audio elements attributes, with
 * Object.defineProperty.
 *
 * @return {boolean}
 *         - True if builtin attributes can be overridden
 *         - False otherwise
 */
Html5.canOverrideAttributes = function() {
  // if we cannot overwrite the src/innerHTML property, there is no support
  // iOS 7 safari for instance cannot do this.
  try {
    const noop = () => {};

    Object.defineProperty(document.createElement('video'), 'src', {get: noop, set: noop});
    Object.defineProperty(document.createElement('audio'), 'src', {get: noop, set: noop});
    Object.defineProperty(document.createElement('video'), 'innerHTML', {get: noop, set: noop});
    Object.defineProperty(document.createElement('audio'), 'innerHTML', {get: noop, set: noop});
  } catch (e) {
    return false;
  }

  return true;
};

/**
 * Check to see if native `TextTrack`s are supported by this browser/device.
 *
 * @return {boolean}
 *         - True if native `TextTrack`s are supported.
 *         - False otherwise
 */
Html5.supportsNativeTextTracks = function() {
  return browser.IS_ANY_SAFARI || (browser.IS_IOS && browser.IS_CHROME);
};

/**
 * Check to see if native `VideoTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `VideoTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeVideoTracks = function() {
  return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
};

/**
 * Check to see if native `AudioTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `AudioTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeAudioTracks = function() {
  return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
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
  'resize',
  'volumechange'
];

/**
 * Boolean indicating whether the `Tech` supports volume control.
 *
 * @type {boolean}
 * @default {@link Html5.canControlVolume}
 */
/**
 * Boolean indicating whether the `Tech` supports muting volume.
 *
 * @type {boolean}
 * @default {@link Html5.canMuteVolume}
 */

/**
 * Boolean indicating whether the `Tech` supports changing the speed at which the media
 * plays. Examples:
 *   - Set player to play 2x (twice) as fast
 *   - Set player to play 0.5x (half) as fast
 *
 * @type {boolean}
 * @default {@link Html5.canControlPlaybackRate}
 */

/**
 * Boolean indicating whether the `Tech` supports the `sourceset` event.
 *
 * @type {boolean}
 * @default
 */
/**
 * Boolean indicating whether the `HTML5` tech currently supports native `TextTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeTextTracks}
 */
/**
 * Boolean indicating whether the `HTML5` tech currently supports native `VideoTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeVideoTracks}
 */
/**
 * Boolean indicating whether the `HTML5` tech currently supports native `AudioTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeAudioTracks}
 */
[
  ['featuresMuteControl', 'canMuteVolume'],
  ['featuresPlaybackRate', 'canControlPlaybackRate'],
  ['featuresSourceset', 'canOverrideAttributes'],
  ['featuresNativeTextTracks', 'supportsNativeTextTracks'],
  ['featuresNativeVideoTracks', 'supportsNativeVideoTracks'],
  ['featuresNativeAudioTracks', 'supportsNativeAudioTracks']
].forEach(function([key, fn]) {
  defineLazyProperty(Html5.prototype, key, () => Html5[fn](), true);
});

Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Boolean indicating whether the `HTML5` tech currently supports the media element
 * moving in the DOM. iOS breaks if you move the media element, so this is set this to
 * false there. Everywhere else this should be true.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;

// TODO: Previous comment: No longer appears to be used. Can probably be removed.
//       Is this true?
/**
 * Boolean indicating whether the `HTML5` tech currently supports automatic media resize
 * when going into fullscreen.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.featuresFullscreenResize = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports the progress event.
 * If this is false, manual `progress` events will be triggered instead.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports the timeupdate event.
 * If this is false, manual `timeupdate` events will be triggered instead.
 *
 * @default
 */
Html5.prototype.featuresTimeupdateEvents = true;

/**
 * Whether the HTML5 el supports `requestVideoFrameCallback`
 *
 * @type {boolean}
 */
Html5.prototype.featuresVideoFrameCallback = !!(Html5.TEST_VID && Html5.TEST_VID.requestVideoFrameCallback);

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
// Wrap native boolean attributes with getters that check both property and attribute
// The list is as followed:
// muted, defaultMuted, autoplay, controls, loop, playsinline
[
  /**
   * Get the value of `muted` from the media element. `muted` indicates
   * that the volume for the media should be set to silent. This does not actually change
   * the `volume` attribute.
   *
   * @method Html5#muted
   * @return {boolean}
   *         - True if the value of `volume` should be ignored and the audio set to silent.
   *         - False if the value of `volume` should be used.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
   */
  'muted',

  /**
   * Get the value of `defaultMuted` from the media element. `defaultMuted` indicates
   * whether the media should start muted or not. Only changes the default state of the
   * media. `muted` and `defaultMuted` can have different values. {@link Html5#muted} indicates the
   * current state.
   *
   * @method Html5#defaultMuted
   * @return {boolean}
   *         - The value of `defaultMuted` from the media element.
   *         - True indicates that the media should start muted.
   *         - False indicates that the media should not start muted
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultmuted}
   */
  'defaultMuted',

  /**
   * Get the value of `autoplay` from the media element. `autoplay` indicates
   * that the media should start to play as soon as the page is ready.
   *
   * @method Html5#autoplay
   * @return {boolean}
   *         - The value of `autoplay` from the media element.
   *         - True indicates that the media should start as soon as the page loads.
   *         - False indicates that the media should not start as soon as the page loads.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
   */
  'autoplay',

  /**
   * Get the value of `controls` from the media element. `controls` indicates
   * whether the native media controls should be shown or hidden.
   *
   * @method Html5#controls
   * @return {boolean}
   *         - The value of `controls` from the media element.
   *         - True indicates that native controls should be showing.
   *         - False indicates that native controls should be hidden.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-controls}
   */
  'controls',

  /**
   * Get the value of `loop` from the media element. `loop` indicates
   * that the media should return to the start of the media and continue playing once
   * it reaches the end.
   *
   * @method Html5#loop
   * @return {boolean}
   *         - The value of `loop` from the media element.
   *         - True indicates that playback should seek back to start once
   *           the end of a media is reached.
   *         - False indicates that playback should not loop back to the start when the
   *           end of the media is reached.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
   */
  'loop',

  /**
   * Get the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#playsinline
   * @return {boolean}
   *         - The value of `playsinline` from the media element.
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  'playsinline'
].forEach(function(prop) {
  Html5.prototype[prop] = function() {
    return this.el_[prop] || this.el_.hasAttribute(prop);
  };
});

// Wrap native boolean attributes with setters that set both property and attribute
// The list is as followed:
// setMuted, setDefaultMuted, setAutoplay, setLoop, setPlaysinline
// setControls is special-cased above
[
  /**
   * Set the value of `muted` on the media element. `muted` indicates that the current
   * audio level should be silent.
   *
   * @method Html5#setMuted
   * @param {boolean} muted
   *        - True if the audio should be set to silent
   *        - False otherwise
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
   */
  'muted',

  /**
   * Set the value of `defaultMuted` on the media element. `defaultMuted` indicates that the current
   * audio level should be silent, but will only effect the muted level on initial playback..
   *
   * @method Html5.prototype.setDefaultMuted
   * @param {boolean} defaultMuted
   *        - True if the audio should be set to silent
   *        - False otherwise
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultmuted}
   */
  'defaultMuted',

  /**
   * Set the value of `autoplay` on the media element. `autoplay` indicates
   * that the media should start to play as soon as the page is ready.
   *
   * @method Html5#setAutoplay
   * @param {boolean} autoplay
   *         - True indicates that the media should start as soon as the page loads.
   *         - False indicates that the media should not start as soon as the page loads.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
   */
  'autoplay',

  /**
   * Set the value of `loop` on the media element. `loop` indicates
   * that the media should return to the start of the media and continue playing once
   * it reaches the end.
   *
   * @method Html5#setLoop
   * @param {boolean} loop
   *         - True indicates that playback should seek back to start once
   *           the end of a media is reached.
   *         - False indicates that playback should not loop back to the start when the
   *           end of the media is reached.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
   */
  'loop',

  /**
   * Set the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#setPlaysinline
   * @param {boolean} playsinline
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  'playsinline'
].forEach(function(prop) {
  Html5.prototype['set' + toTitleCase(prop)] = function(v) {
    this.el_[prop] = v;

    if (v) {
      this.el_.setAttribute(prop, prop);
    } else {
      this.el_.removeAttribute(prop);
    }
  };
});

// Wrap native properties with a getter
// The list is as followed
// paused, currentTime, buffered, volume, poster, preload, error, seeking
// seekable, ended, playbackRate, defaultPlaybackRate, disablePictureInPicture
// played, networkState, readyState, videoWidth, videoHeight, crossOrigin
[
  /**
   * Get the value of `paused` from the media element. `paused` indicates whether the media element
   * is currently paused or not.
   *
   * @method Html5#paused
   * @return {boolean}
   *         The value of `paused` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-paused}
   */
  'paused',

  /**
   * Get the value of `currentTime` from the media element. `currentTime` indicates
   * the current second that the media is at in playback.
   *
   * @method Html5#currentTime
   * @return {number}
   *         The value of `currentTime` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-currenttime}
   */
  'currentTime',

  /**
   * Get the value of `buffered` from the media element. `buffered` is a `TimeRange`
   * object that represents the parts of the media that are already downloaded and
   * available for playback.
   *
   * @method Html5#buffered
   * @return {TimeRange}
   *         The value of `buffered` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-buffered}
   */
  'buffered',

  /**
   * Get the value of `volume` from the media element. `volume` indicates
   * the current playback volume of audio for a media. `volume` will be a value from 0
   * (silent) to 1 (loudest and default).
   *
   * @method Html5#volume
   * @return {number}
   *         The value of `volume` from the media element. Value will be between 0-1.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
   */
  'volume',

  /**
   * Get the value of `poster` from the media element. `poster` indicates
   * that the url of an image file that can/will be shown when no media data is available.
   *
   * @method Html5#poster
   * @return {string}
   *         The value of `poster` from the media element. Value will be a url to an
   *         image.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-video-poster}
   */
  'poster',

  /**
   * Get the value of `preload` from the media element. `preload` indicates
   * what should download before the media is interacted with. It can have the following
   * values:
   * - none: nothing should be downloaded
   * - metadata: poster and the first few frames of the media may be downloaded to get
   *   media dimensions and other metadata
   * - auto: allow the media and metadata for the media to be downloaded before
   *    interaction
   *
   * @method Html5#preload
   * @return {string}
   *         The value of `preload` from the media element. Will be 'none', 'metadata',
   *         or 'auto'.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
   */
  'preload',

  /**
   * Get the value of the `error` from the media element. `error` indicates any
   * MediaError that may have occurred during playback. If error returns null there is no
   * current error.
   *
   * @method Html5#error
   * @return {MediaError|null}
   *         The value of `error` from the media element. Will be `MediaError` if there
   *         is a current error and null otherwise.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-error}
   */
  'error',

  /**
   * Get the value of `seeking` from the media element. `seeking` indicates whether the
   * media is currently seeking to a new position or not.
   *
   * @method Html5#seeking
   * @return {boolean}
   *         - The value of `seeking` from the media element.
   *         - True indicates that the media is currently seeking to a new position.
   *         - False indicates that the media is not seeking to a new position at this time.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seeking}
   */
  'seeking',

  /**
   * Get the value of `seekable` from the media element. `seekable` returns a
   * `TimeRange` object indicating ranges of time that can currently be `seeked` to.
   *
   * @method Html5#seekable
   * @return {TimeRange}
   *         The value of `seekable` from the media element. A `TimeRange` object
   *         indicating the current ranges of time that can be seeked to.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seekable}
   */
  'seekable',

  /**
   * Get the value of `ended` from the media element. `ended` indicates whether
   * the media has reached the end or not.
   *
   * @method Html5#ended
   * @return {boolean}
   *         - The value of `ended` from the media element.
   *         - True indicates that the media has ended.
   *         - False indicates that the media has not ended.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-ended}
   */
  'ended',

  /**
   * Get the value of `playbackRate` from the media element. `playbackRate` indicates
   * the rate at which the media is currently playing back. Examples:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5#playbackRate
   * @return {number}
   *         The value of `playbackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'playbackRate',

  /**
   * Get the value of `defaultPlaybackRate` from the media element. `defaultPlaybackRate` indicates
   * the rate at which the media is currently playing back. This value will not indicate the current
   * `playbackRate` after playback has started, use {@link Html5#playbackRate} for that.
   *
   * Examples:
   *   - if defaultPlaybackRate is set to 2, media will play twice as fast.
   *   - if defaultPlaybackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5.prototype.defaultPlaybackRate
   * @return {number}
   *         The value of `defaultPlaybackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'defaultPlaybackRate',

  /**
   * Get the value of 'disablePictureInPicture' from the video element.
   *
   * @method Html5#disablePictureInPicture
   * @return {boolean} value
   *         - The value of `disablePictureInPicture` from the video element.
   *         - True indicates that the video can't be played in Picture-In-Picture mode
   *         - False indicates that the video can be played in Picture-In-Picture mode
   *
   * @see [Spec]{@link https://w3c.github.io/picture-in-picture/#disable-pip}
   */
  'disablePictureInPicture',

  /**
   * Get the value of `played` from the media element. `played` returns a `TimeRange`
   * object representing points in the media timeline that have been played.
   *
   * @method Html5#played
   * @return {TimeRange}
   *         The value of `played` from the media element. A `TimeRange` object indicating
   *         the ranges of time that have been played.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-played}
   */
  'played',

  /**
   * Get the value of `networkState` from the media element. `networkState` indicates
   * the current network state. It returns an enumeration from the following list:
   * - 0: NETWORK_EMPTY
   * - 1: NETWORK_IDLE
   * - 2: NETWORK_LOADING
   * - 3: NETWORK_NO_SOURCE
   *
   * @method Html5#networkState
   * @return {number}
   *         The value of `networkState` from the media element. This will be a number
   *         from the list in the description.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-networkstate}
   */
  'networkState',

  /**
   * Get the value of `readyState` from the media element. `readyState` indicates
   * the current state of the media element. It returns an enumeration from the
   * following list:
   * - 0: HAVE_NOTHING
   * - 1: HAVE_METADATA
   * - 2: HAVE_CURRENT_DATA
   * - 3: HAVE_FUTURE_DATA
   * - 4: HAVE_ENOUGH_DATA
   *
   * @method Html5#readyState
   * @return {number}
   *         The value of `readyState` from the media element. This will be a number
   *         from the list in the description.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#ready-states}
   */
  'readyState',

  /**
   * Get the value of `videoWidth` from the video element. `videoWidth` indicates
   * the current width of the video in css pixels.
   *
   * @method Html5#videoWidth
   * @return {number}
   *         The value of `videoWidth` from the video element. This will be a number
   *         in css pixels.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
   */
  'videoWidth',

  /**
   * Get the value of `videoHeight` from the video element. `videoHeight` indicates
   * the current height of the video in css pixels.
   *
   * @method Html5#videoHeight
   * @return {number}
   *         The value of `videoHeight` from the video element. This will be a number
   *         in css pixels.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
   */
  'videoHeight',

  /**
   * Get the value of `crossOrigin` from the media element. `crossOrigin` indicates
   * to the browser that should sent the cookies along with the requests for the
   * different assets/playlists
   *
   * @method Html5#crossOrigin
   * @return {string}
   *         - anonymous indicates that the media should not sent cookies.
   *         - use-credentials indicates that the media should sent cookies along the requests.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-media-crossorigin}
   */
  'crossOrigin'
].forEach(function(prop) {
  Html5.prototype[prop] = function() {
    return this.el_[prop];
  };
});

// Wrap native properties with a setter in this format:
// set + toTitleCase(name)
// The list is as follows:
// setVolume, setSrc, setPoster, setPreload, setPlaybackRate, setDefaultPlaybackRate,
// setDisablePictureInPicture, setCrossOrigin
[
  /**
   * Set the value of `volume` on the media element. `volume` indicates the current
   * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
   * so on.
   *
   * @method Html5#setVolume
   * @param {number} percentAsDecimal
   *        The volume percent as a decimal. Valid range is from 0-1.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
   */
  'volume',

  /**
   * Set the value of `src` on the media element. `src` indicates the current
   * {@link Tech~SourceObject} for the media.
   *
   * @method Html5#setSrc
   * @param {string} src
   *        The source object to set as the current source.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-src}
   */
  'src',

  /**
   * Set the value of `poster` on the media element. `poster` is the url to
   * an image file that can/will be shown when no media data is available.
   *
   * @method Html5#setPoster
   * @param {string} poster
   *        The url to an image that should be used as the `poster` for the media
   *        element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-poster}
   */
  'poster',

  /**
   * Set the value of `preload` on the media element. `preload` indicates
   * what should download before the media is interacted with. It can have the following
   * values:
   * - none: nothing should be downloaded
   * - metadata: poster and the first few frames of the media may be downloaded to get
   *   media dimensions and other metadata
   * - auto: allow the media and metadata for the media to be downloaded before
   *    interaction
   *
   * @method Html5#setPreload
   * @param {string} preload
   *         The value of `preload` to set on the media element. Must be 'none', 'metadata',
   *         or 'auto'.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
   */
  'preload',

  /**
   * Set the value of `playbackRate` on the media element. `playbackRate` indicates
   * the rate at which the media should play back. Examples:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5#setPlaybackRate
   * @return {number}
   *         The value of `playbackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'playbackRate',

  /**
   * Set the value of `defaultPlaybackRate` on the media element. `defaultPlaybackRate` indicates
   * the rate at which the media should play back upon initial startup. Changing this value
   * after a video has started will do nothing. Instead you should used {@link Html5#setPlaybackRate}.
   *
   * Example Values:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5.prototype.setDefaultPlaybackRate
   * @return {number}
   *         The value of `defaultPlaybackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultplaybackrate}
   */
  'defaultPlaybackRate',

  /**
   * Prevents the browser from suggesting a Picture-in-Picture context menu
   * or to request Picture-in-Picture automatically in some cases.
   *
   * @method Html5#setDisablePictureInPicture
   * @param {boolean} value
   *         The true value will disable Picture-in-Picture mode.
   *
   * @see [Spec]{@link https://w3c.github.io/picture-in-picture/#disable-pip}
   */
  'disablePictureInPicture',

  /**
   * Set the value of `crossOrigin` from the media element. `crossOrigin` indicates
   * to the browser that should sent the cookies along with the requests for the
   * different assets/playlists
   *
   * @method Html5#setCrossOrigin
   * @param {string} crossOrigin
   *         - anonymous indicates that the media should not sent cookies.
   *         - use-credentials indicates that the media should sent cookies along the requests.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-media-crossorigin}
   */
  'crossOrigin'
].forEach(function(prop) {
  Html5.prototype['set' + toTitleCase(prop)] = function(v) {
    this.el_[prop] = v;
  };
});

// wrap native functions with a function
// The list is as follows:
// pause, load, play
[
  /**
   * A wrapper around the media elements `pause` function. This will call the `HTML5`
   * media elements `pause` function.
   *
   * @method Html5#pause
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-pause}
   */
  'pause',

  /**
   * A wrapper around the media elements `load` function. This will call the `HTML5`s
   * media element `load` function.
   *
   * @method Html5#load
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-load}
   */
  'load',

  /**
   * A wrapper around the media elements `play` function. This will call the `HTML5`s
   * media element `play` function.
   *
   * @method Html5#play
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-play}
   */
  'play'
].forEach(function(prop) {
  Html5.prototype[prop] = function() {
    return this.el_[prop]();
  };
});

Tech.withSourceHandlers(Html5);

/**
 * Native source handler for Html5, simply passes the source to the media element.
 *
 * @property {SourceObject} source
 *        The source object
 *
 * @property {Html5} tech
 *        The instance of the HTML5 tech.
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the media element can play the given mime type.
 *
 * @param {string} type
 *        The mimetype to check
 *
 * @return {string}
 *         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canPlayType = function(type) {
  // IE without MediaPlayer throws an error (#519)
  try {
    return Html5.TEST_VID.canPlayType(type);
  } catch (e) {
    return '';
  }
};

/**
 * Check if the media element can handle a source natively.
 *
 * @param {SourceObject} source
 *         The source object
 *
 * @param {Object} [options]
 *         Options to be passed to the tech.
 *
 * @return {string}
 *         'probably', 'maybe', or '' (empty string).
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
 * Pass the source to the native media element.
 *
 * @param {SourceObject} source
 *        The source object
 *
 * @param {Html5} tech
 *        The instance of the Html5 tech
 *
 * @param {Object} [options]
 *        The options to pass to the source
 */
Html5.nativeSourceHandler.handleSource = function(source, tech, options) {
  tech.setSrc(source.src);
};

/**
 * A noop for the native dispose function, as cleanup is not needed.
 */
Html5.nativeSourceHandler.dispose = function() {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

Tech.registerTech('Html5', Html5);
export default Html5;
