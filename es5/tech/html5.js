'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteralLoose(['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.'], ['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.']);

var _tech = require('./tech.js');

var _tech2 = _interopRequireDefault(_tech);

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

var _url = require('../utils/url.js');

var Url = _interopRequireWildcard(_url);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _log = require('../utils/log.js');

var _log2 = _interopRequireDefault(_log);

var _tsml = require('tsml');

var _tsml2 = _interopRequireDefault(_tsml);

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _obj = require('../utils/obj');

var _mergeOptions = require('../utils/merge-options.js');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _toTitleCase = require('../utils/to-title-case.js');

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file html5.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @mixes Tech~SouceHandlerAdditions
 * @extends Tech
 */
var Html5 = function (_Tech) {
  _inherits(Html5, _Tech);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `HTML5` Tech is ready.
   */
  function Html5(options, ready) {
    _classCallCheck(this, Html5);

    var _this = _possibleConstructorReturn(this, _Tech.call(this, options, ready));

    var source = options.source;
    var crossoriginTracks = false;

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (_this.el_.currentSrc !== source.src || options.tag && options.tag.initNetworkState_ === 3)) {
      _this.setSource(source);
    } else {
      _this.handleLateInit_(_this.el_);
    }

    if (_this.el_.hasChildNodes()) {

      var nodes = _this.el_.childNodes;
      var nodesLength = nodes.length;
      var removeNodes = [];

      while (nodesLength--) {
        var node = nodes[nodesLength];
        var nodeName = node.nodeName.toLowerCase();

        if (nodeName === 'track') {
          if (!_this.featuresNativeTextTracks) {
            // Empty video tag tracks so the built-in player doesn't use them also.
            // This may not be fast enough to stop HTML5 browsers from reading the tags
            // so we'll need to turn off any default tracks if we're manually doing
            // captions and subtitles. videoElement.textTracks
            removeNodes.push(node);
          } else {
            // store HTMLTrackElement and TextTrack to remote list
            _this.remoteTextTrackEls().addTrackElement_(node);
            _this.remoteTextTracks().addTrack_(node.track);
            if (!crossoriginTracks && !_this.el_.hasAttribute('crossorigin') && Url.isCrossOrigin(node.src)) {
              crossoriginTracks = true;
            }
          }
        }
      }

      for (var i = 0; i < removeNodes.length; i++) {
        _this.el_.removeChild(removeNodes[i]);
      }
    }

    // TODO: add text tracks into this list
    var trackTypes = ['audio', 'video'];

    // ProxyNative Video/Audio Track
    trackTypes.forEach(function (type) {
      var elTracks = _this.el()[type + 'Tracks'];
      var techTracks = _this[type + 'Tracks']();
      var capitalType = (0, _toTitleCase2['default'])(type);

      if (!_this['featuresNative' + capitalType + 'Tracks'] || !elTracks || !elTracks.addEventListener) {
        return;
      }

      _this['handle' + capitalType + 'TrackChange_'] = function (e) {
        techTracks.trigger({
          type: 'change',
          target: techTracks,
          currentTarget: techTracks,
          srcElement: techTracks
        });
      };

      _this['handle' + capitalType + 'TrackAdd_'] = function (e) {
        return techTracks.addTrack(e.track);
      };
      _this['handle' + capitalType + 'TrackRemove_'] = function (e) {
        return techTracks.removeTrack(e.track);
      };

      elTracks.addEventListener('change', _this['handle' + capitalType + 'TrackChange_']);
      elTracks.addEventListener('addtrack', _this['handle' + capitalType + 'TrackAdd_']);
      elTracks.addEventListener('removetrack', _this['handle' + capitalType + 'TrackRemove_']);
      _this['removeOld' + capitalType + 'Tracks_'] = function (e) {
        return _this.removeOldTracks_(techTracks, elTracks);
      };

      // Remove (native) tracks that are not used anymore
      _this.on('loadstart', _this['removeOld' + capitalType + 'Tracks_']);
    });

    if (_this.featuresNativeTextTracks) {
      if (crossoriginTracks) {
        _log2['default'].warn((0, _tsml2['default'])(_templateObject));
      }

      _this.handleTextTrackChange_ = Fn.bind(_this, _this.handleTextTrackChange);
      _this.handleTextTrackAdd_ = Fn.bind(_this, _this.handleTextTrackAdd);
      _this.handleTextTrackRemove_ = Fn.bind(_this, _this.handleTextTrackRemove);
      _this.proxyNativeTextTracks_();
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if ((browser.TOUCH_ENABLED || browser.IS_IPHONE || browser.IS_NATIVE_ANDROID) && options.nativeControlsForTouch === true) {
      _this.setControls(true);
    }

    // on iOS, we want to proxy `webkitbeginfullscreen` and `webkitendfullscreen`
    // into a `fullscreenchange` event
    _this.proxyWebkitFullscreen_();

    _this.triggerReady();
    return _this;
  }

  /**
   * Dispose of `HTML5` media element and remove all tracks.
   */


  Html5.prototype.dispose = function dispose() {
    var _this2 = this;

    // Un-ProxyNativeTracks
    ['audio', 'video', 'text'].forEach(function (type) {
      var capitalType = (0, _toTitleCase2['default'])(type);
      var tl = _this2.el_[type + 'Tracks'];

      if (tl && tl.removeEventListener) {
        tl.removeEventListener('change', _this2['handle' + capitalType + 'TrackChange_']);
        tl.removeEventListener('addtrack', _this2['handle' + capitalType + 'TrackAdd_']);
        tl.removeEventListener('removetrack', _this2['handle' + capitalType + 'TrackRemove_']);
      }

      // Stop removing old text tracks
      if (tl) {
        _this2.off('loadstart', _this2['removeOld' + capitalType + 'Tracks_']);
      }
    });

    Html5.disposeMediaElement(this.el_);
    // tech will handle clearing of the emulated track list
    _Tech.prototype.dispose.call(this);
  };

  /**
   * Create the `Html5` Tech's DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Html5.prototype.createEl = function createEl() {
    var el = this.options_.tag;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    // If we ingested the player div, we do not need to move the media element.
    if (!el || !(this.options_.playerElIngest || this.movingMediaElementInDOM)) {

      // If the original tag is still there, clone and remove it.
      if (el) {
        var clone = el.cloneNode(true);

        if (el.parentNode) {
          el.parentNode.insertBefore(clone, el);
        }
        Html5.disposeMediaElement(el);
        el = clone;
      } else {
        el = _document2['default'].createElement('video');

        // determine if native controls should be used
        var tagAttributes = this.options_.tag && Dom.getElAttributes(this.options_.tag);
        var attributes = (0, _mergeOptions2['default'])({}, tagAttributes);

        if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
          delete attributes.controls;
        }

        Dom.setElAttributes(el, (0, _obj.assign)(attributes, {
          id: this.options_.techId,
          'class': 'vjs-tech'
        }));
      }

      el.playerId = this.options_.playerId;
    }

    // Update specific tag settings, in case they were overridden
    var settingsAttrs = ['autoplay', 'preload', 'loop', 'muted'];

    for (var i = settingsAttrs.length - 1; i >= 0; i--) {
      var attr = settingsAttrs[i];
      var overwriteAttrs = {};

      if (typeof this.options_[attr] !== 'undefined') {
        overwriteAttrs[attr] = this.options_[attr];
      }
      Dom.setElAttributes(el, overwriteAttrs);
    }

    return el;
  };

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


  Html5.prototype.handleLateInit_ = function handleLateInit_(el) {
    var _this3 = this;

    if (el.networkState === 0 || el.networkState === 3) {
      // The video element hasn't started loading the source yet
      // or didn't find a source
      return;
    }

    if (el.readyState === 0) {
      var _ret = function () {
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
        var loadstartFired = false;
        var setLoadstartFired = function setLoadstartFired() {
          loadstartFired = true;
        };

        _this3.on('loadstart', setLoadstartFired);

        var triggerLoadstart = function triggerLoadstart() {
          // We did miss the original loadstart. Make sure the player
          // sees loadstart before loadedmetadata
          if (!loadstartFired) {
            this.trigger('loadstart');
          }
        };

        _this3.on('loadedmetadata', triggerLoadstart);

        _this3.ready(function () {
          this.off('loadstart', setLoadstartFired);
          this.off('loadedmetadata', triggerLoadstart);

          if (!loadstartFired) {
            // We did miss the original native loadstart. Fire it now.
            this.trigger('loadstart');
          }
        });

        return {
          v: void 0
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }

    // From here on we know that loadstart already fired and we missed it.
    // The other readyState events aren't as much of a problem if we double
    // them, so not going to go to as much trouble as loadstart to prevent
    // that unless we find reason to.
    var eventsToTrigger = ['loadstart'];

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
    this.ready(function () {
      eventsToTrigger.forEach(function (type) {
        this.trigger(type);
      }, this);
    });
  };

  /**
   * Add event listeners to native text track events. This adds the native text tracks
   * to our emulated {@link TextTrackList}.
   */


  Html5.prototype.proxyNativeTextTracks_ = function proxyNativeTextTracks_() {
    var tt = this.el().textTracks;

    if (tt) {
      // Add tracks - if player is initialised after DOM loaded, textTracks
      // will not trigger addtrack
      for (var i = 0; i < tt.length; i++) {
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
  };

  /**
   * Handle any {@link TextTrackList} `change` event.
   *
   * @param {EventTarget~Event} e
   *        The `change` event that caused this to run.
   *
   * @listens TextTrackList#change
   */


  Html5.prototype.handleTextTrackChange = function handleTextTrackChange(e) {
    var tt = this.textTracks();

    this.textTracks().trigger({
      type: 'change',
      target: tt,
      currentTarget: tt,
      srcElement: tt
    });
  };

  /**
   * Handle any {@link TextTrackList} `addtrack` event.
   *
   * @param {EventTarget~Event} e
   *        The `addtrack` event that caused this to run.
   *
   * @listens TextTrackList#addtrack
   */


  Html5.prototype.handleTextTrackAdd = function handleTextTrackAdd(e) {
    this.textTracks().addTrack_(e.track);
  };

  /**
   * Handle any {@link TextTrackList} `removetrack` event.
   *
   * @param {EventTarget~Event} e
   *        The `removetrack` event that caused this to run.
   *
   * @listens TextTrackList#removetrack
   */


  Html5.prototype.handleTextTrackRemove = function handleTextTrackRemove(e) {
    this.textTracks().removeTrack_(e.track);
  };

  /**
   * This function removes any {@link AudioTrack}s, {@link VideoTrack}s, or
   * {@link TextTrack}s that are not in the media elements TrackList.
   *
   * @param {TrackList} techTracks
   *        HTML5 Tech's TrackList to search through
   *
   * @param {TrackList} elTracks
   *        HTML5 media elements TrackList to search trough.
   *
   * @private
   */


  Html5.prototype.removeOldTracks_ = function removeOldTracks_(techTracks, elTracks) {
    // This will loop over the techTracks and check if they are still used by the HTML5 media element
    // If not, they will be removed from the emulated list
    var removeTracks = [];

    if (!elTracks) {
      return;
    }

    for (var i = 0; i < techTracks.length; i++) {
      var techTrack = techTracks[i];
      var found = false;

      for (var j = 0; j < elTracks.length; j++) {
        if (elTracks[j] === techTrack) {
          found = true;
          break;
        }
      }

      if (!found) {
        removeTracks.push(techTrack);
      }
    }

    for (var _i = 0; _i < removeTracks.length; _i++) {
      var track = removeTracks[_i];

      techTracks.removeTrack_(track);
    }
  };

  /**
   * Remove {@link TextTrack}s that dont exist in the native track list from our
   * emulated {@link TextTrackList}.
   *
   * @listens Tech#loadstart
   */


  Html5.prototype.removeOldTextTracks_ = function removeOldTextTracks_(e) {
    var techTracks = this.textTracks();
    var elTracks = this.el().textTracks;

    this.removeOldTracks_(techTracks, elTracks);
  };

  /**
   * Called by {@link Player#play} to play using the `Html5` `Tech`.
   */


  Html5.prototype.play = function play() {
    var playPromise = this.el_.play();

    // Catch/silence error when a pause interrupts a play request
    // on browsers which return a promise
    if (playPromise !== undefined && typeof playPromise.then === 'function') {
      playPromise.then(null, function (e) {});
    }
  };

  /**
   * Set current time for the `HTML5` tech.
   *
   * @param {number} seconds
   *        Set the current time of the media to this.
   */


  Html5.prototype.setCurrentTime = function setCurrentTime(seconds) {
    try {
      this.el_.currentTime = seconds;
    } catch (e) {
      (0, _log2['default'])(e, 'Video is not ready. (Video.js)');
      // this.warning(VideoJS.warnings.videoNotReady);
    }
  };

  /**
   * Get the current duration of the HTML5 media element.
   *
   * @return {number}
   *         The duration of the media or 0 if there is no duration.
   */


  Html5.prototype.duration = function duration() {
    var _this4 = this;

    // Android Chrome will report duration as Infinity for VOD HLS until after
    // playback has started, which triggers the live display erroneously.
    // Return NaN if playback has not started and trigger a durationupdate once
    // the duration can be reliably known.
    if (this.el_.duration === Infinity && browser.IS_ANDROID && browser.IS_CHROME) {
      if (this.el_.currentTime === 0) {
        var _ret2 = function () {
          // Wait for the first `timeupdate` with currentTime > 0 - there may be
          // several with 0
          var checkProgress = function checkProgress() {
            if (_this4.el_.currentTime > 0) {
              // Trigger durationchange for genuinely live video
              if (_this4.el_.duration === Infinity) {
                _this4.trigger('durationchange');
              }
              _this4.off('timeupdate', checkProgress);
            }
          };

          _this4.on('timeupdate', checkProgress);
          return {
            v: NaN
          };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }
    }
    return this.el_.duration || NaN;
  };

  /**
   * Get the current width of the HTML5 media element.
   *
   * @return {number}
   *         The width of the HTML5 media element.
   */


  Html5.prototype.width = function width() {
    return this.el_.offsetWidth;
  };

  /**
   * Get the current height of the HTML5 media element.
   *
   * @return {number}
   *         The heigth of the HTML5 media element.
   */


  Html5.prototype.height = function height() {
    return this.el_.offsetHeight;
  };

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


  Html5.prototype.proxyWebkitFullscreen_ = function proxyWebkitFullscreen_() {
    var _this5 = this;

    if (!('webkitDisplayingFullscreen' in this.el_)) {
      return;
    }

    var endFn = function endFn() {
      this.trigger('fullscreenchange', { isFullscreen: false });
    };

    var beginFn = function beginFn() {
      this.one('webkitendfullscreen', endFn);

      this.trigger('fullscreenchange', { isFullscreen: true });
    };

    this.on('webkitbeginfullscreen', beginFn);
    this.on('dispose', function () {
      _this5.off('webkitbeginfullscreen', beginFn);
      _this5.off('webkitendfullscreen', endFn);
    });
  };

  /**
   * Check if fullscreen is supported on the current playback device.
   *
   * @return {boolean}
   *         - True if fullscreen is supported.
   *         - False if fullscreen is not supported.
   */


  Html5.prototype.supportsFullScreen = function supportsFullScreen() {
    if (typeof this.el_.webkitEnterFullScreen === 'function') {
      var userAgent = _window2['default'].navigator && _window2['default'].navigator.userAgent || '';

      // Seems to be broken in Chromium/Chrome && Safari in Leopard
      if (/Android/.test(userAgent) || !/Chrome|Mac OS X 10.5/.test(userAgent)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Request that the `HTML5` Tech enter fullscreen.
   */


  Html5.prototype.enterFullScreen = function enterFullScreen() {
    var video = this.el_;

    if (video.paused && video.networkState <= video.HAVE_METADATA) {
      // attempt to prime the video element for programmatic access
      // this isn't necessary on the desktop but shouldn't hurt
      this.el_.play();

      // playing and pausing synchronously during the transition to fullscreen
      // can get iOS ~6.1 devices into a play/pause loop
      this.setTimeout(function () {
        video.pause();
        video.webkitEnterFullScreen();
      }, 0);
    } else {
      video.webkitEnterFullScreen();
    }
  };

  /**
   * Request that the `HTML5` Tech exit fullscreen.
   */


  Html5.prototype.exitFullScreen = function exitFullScreen() {
    this.el_.webkitExitFullScreen();
  };

  /**
   * A getter/setter for the `Html5` Tech's source object.
   * > Note: Please use {@link Html5#setSource}
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `HTML5` techs element.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   *
   * @deprecated Since version 5.
   */


  Html5.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.el_.src;
    }

    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(_src);
  };

  /**
   * Reset the tech by removing all sources and then calling
   * {@link Html5.resetMediaElement}.
   */


  Html5.prototype.reset = function reset() {
    Html5.resetMediaElement(this.el_);
  };

  /**
   * Get the current source on the `HTML5` Tech. Falls back to returning the source from
   * the HTML5 media element.
   *
   * @return {Tech~SourceObject}
   *         The current source object from the HTML5 tech. With a fallback to the
   *         elements source.
   */


  Html5.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.currentSrc;
  };

  /**
   * Set controls attribute for the HTML5 media Element.
   *
   * @param {string} val
   *        Value to set the controls attribute to
   */


  Html5.prototype.setControls = function setControls(val) {
    this.el_.controls = !!val;
  };

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


  Html5.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.addTextTrack.call(this, kind, label, language);
    }

    return this.el_.addTextTrack(kind, label, language);
  };

  /**
   * Creates either native TextTrack or an emulated TextTrack depending
   * on the value of `featuresNativeTextTracks`
   *
   * @param {Object} options
   *        The object should contain the options to intialize the TextTrack with.
   *
   * @param {string} [options.kind]
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
   *
   * @param {string} [options.label].
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


  Html5.prototype.createRemoteTextTrack = function createRemoteTextTrack(options) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.createRemoteTextTrack.call(this, options);
    }
    var htmlTrackElement = _document2['default'].createElement('track');

    if (options.kind) {
      htmlTrackElement.kind = options.kind;
    }
    if (options.label) {
      htmlTrackElement.label = options.label;
    }
    if (options.language || options.srclang) {
      htmlTrackElement.srclang = options.language || options.srclang;
    }
    if (options['default']) {
      htmlTrackElement['default'] = options['default'];
    }
    if (options.id) {
      htmlTrackElement.id = options.id;
    }
    if (options.src) {
      htmlTrackElement.src = options.src;
    }

    return htmlTrackElement;
  };

  /**
   * Creates a remote text track object and returns an html track element.
   *
   * @param {Object} options The object should contain values for
   * kind, language, label, and src (location of the WebVTT file)
   * @param {Boolean} [manualCleanup=true] if set to false, the TextTrack will be
   * automatically removed from the video element whenever the source changes
   * @return {HTMLTrackElement} An Html Track Element.
   * This can be an emulated {@link HTMLTrackElement} or a native one.
   * @deprecated The default value of the "manualCleanup" parameter will default
   * to "false" in upcoming versions of Video.js
   */


  Html5.prototype.addRemoteTextTrack = function addRemoteTextTrack(options, manualCleanup) {
    var htmlTrackElement = _Tech.prototype.addRemoteTextTrack.call(this, options, manualCleanup);

    if (this.featuresNativeTextTracks) {
      this.el().appendChild(htmlTrackElement);
    }

    return htmlTrackElement;
  };

  /**
   * Remove remote `TextTrack` from `TextTrackList` object
   *
   * @param {TextTrack} track
   *        `TextTrack` object to remove
   */


  Html5.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    _Tech.prototype.removeRemoteTextTrack.call(this, track);

    if (this.featuresNativeTextTracks) {
      var tracks = this.$$('track');

      var i = tracks.length;

      while (i--) {
        if (track === tracks[i] || track === tracks[i].track) {
          this.el().removeChild(tracks[i]);
        }
      }
    }
  };

  return Html5;
}(_tech2['default']);

/* HTML5 Support Testing ---------------------------------------------------- */

if (Dom.isReal()) {

  /**
   * Element for testing browser HTML5 media capabilities
   *
   * @type {Element}
   * @constant
   * @private
   */
  Html5.TEST_VID = _document2['default'].createElement('video');
  var track = _document2['default'].createElement('track');

  track.kind = 'captions';
  track.srclang = 'en';
  track.label = 'English';
  Html5.TEST_VID.appendChild(track);
}

/**
 * Check if HTML5 media is supported by this browser/device.
 *
 * @return {boolean}
 *         - True if HTML5 media is supported.
 *         - False if HTML5 media is not supported.
 */
Html5.isSupported = function () {
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Html5.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
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
Html5.canControlVolume = function () {
  // IE will error if Windows Media Player not installed #3315
  try {
    var volume = Html5.TEST_VID.volume;

    Html5.TEST_VID.volume = volume / 2 + 0.1;
    return volume !== Html5.TEST_VID.volume;
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
Html5.canControlPlaybackRate = function () {
  // Playback rate API is implemented in Android Chrome, but doesn't do anything
  // https://github.com/videojs/video.js/issues/3180
  if (browser.IS_ANDROID && browser.IS_CHROME) {
    return false;
  }
  // IE will error if Windows Media Player not installed #3315
  try {
    var playbackRate = Html5.TEST_VID.playbackRate;

    Html5.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
    return playbackRate !== Html5.TEST_VID.playbackRate;
  } catch (e) {
    return false;
  }
};

/**
 * Check to see if native `TextTrack`s are supported by this browser/device.
 *
 * @return {boolean}
 *         - True if native `TextTrack`s are supported.
 *         - False otherwise
 */
Html5.supportsNativeTextTracks = function () {
  return browser.IS_ANY_SAFARI;
};

/**
 * Check to see if native `VideoTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `VideoTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeVideoTracks = function () {
  return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
};

/**
 * Check to see if native `AudioTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `AudioTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeAudioTracks = function () {
  return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
};

/**
 * An array of events available on the Html5 tech.
 *
 * @private
 * @type {Array}
 */
Html5.Events = ['loadstart', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange', 'timeupdate', 'progress', 'play', 'pause', 'ratechange', 'volumechange'];

/**
 * Boolean indicating whether the `Tech` supports volume control.
 *
 * @type {boolean}
 * @default {@link Html5.canControlVolume}
 */
Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Boolean indicating whether the `Tech` supports changing the speed at which the media
 * plays. Examples:
 *   - Set player to play 2x (twice) as fast
 *   - Set player to play 0.5x (half) as fast
 *
 * @type {boolean}
 * @default {@link Html5.canControlPlaybackRate}
 */
Html5.prototype.featuresPlaybackRate = Html5.canControlPlaybackRate();

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
 * If this is false, manual `progress` events will be triggred instead.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports the timeupdate event.
 * If this is false, manual `timeupdate` events will be triggred instead.
 *
 * @default
 */
Html5.prototype.featuresTimeupdateEvents = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `TextTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeTextTracks}
 */
Html5.prototype.featuresNativeTextTracks = Html5.supportsNativeTextTracks();

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `VideoTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeVideoTracks}
 */
Html5.prototype.featuresNativeVideoTracks = Html5.supportsNativeVideoTracks();

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `AudioTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeAudioTracks}
 */
Html5.prototype.featuresNativeAudioTracks = Html5.supportsNativeAudioTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
var canPlayType = Html5.TEST_VID && Html5.TEST_VID.constructor.prototype.canPlayType;
var mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
var mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function () {

  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (browser.ANDROID_VERSION >= 4.0 && !browser.IS_FIREFOX) {
    Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };

    // Override Android 2.2 and less canPlayType method which is broken
  } else if (browser.IS_OLD_ANDROID) {
    Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mp4RE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }
};

Html5.unpatchCanPlayType = function () {
  var r = Html5.TEST_VID.constructor.prototype.canPlayType;

  Html5.TEST_VID.constructor.prototype.canPlayType = canPlayType;
  return r;
};

// by default, patch the media element
Html5.patchCanPlayType();

Html5.disposeMediaElement = function (el) {
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
    (function () {
      try {
        el.load();
      } catch (e) {
        // not supported
      }
    })();
  }
};

Html5.resetMediaElement = function (el) {
  if (!el) {
    return;
  }

  var sources = el.querySelectorAll('source');
  var i = sources.length;

  while (i--) {
    el.removeChild(sources[i]);
  }

  // remove any src reference.
  // not setting `src=''` because that throws an error
  el.removeAttribute('src');

  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function () {
      try {
        el.load();
      } catch (e) {
        // satisfy linter
      }
    })();
  }
};

/* Native HTML5 element property wrapping ----------------------------------- */
// Wrap native properties with a getter
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
 * Get the value of the `error` from the media element. `error` indicates any
 * MediaError that may have occured during playback. If error returns null there is no
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
 *         - Flase indicates that the media is not seeking to a new position at this time.
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
 * Get the value of `defaultMuted` from the media element. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
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
 * - 1: NEWORK_IDLE
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
 * Get the value of `videoHeight` from the video element. `videoHeigth` indicates
 * the current height of the video in css pixels.
 *
 * @method Html5#videoHeight
 * @return {number}
 *         The value of `videoHeight` from the video element. This will be a number
 *         in css pixels.
 *
 * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
 */
'videoHeight'].forEach(function (prop) {
  Html5.prototype[prop] = function () {
    return this.el_[prop];
  };
});

// Wrap native properties with a setter in this format:
// set + toTitleCase(name)
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
 * Set the value of `muted` on the media element. `muted` indicates the current
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
 * Set the value of `src` on the media element. `src` indicates the current
 * {@link Tech~SourceObject} for the media.
 *
 * @method Html5#setSrc
 * @param {Tech~SourceObject} src
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
'playbackRate'].forEach(function (prop) {
  Html5.prototype['set' + (0, _toTitleCase2['default'])(prop)] = function (v) {
    this.el_[prop] = v;
  };
});

// wrap native functions with a function
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
'load'].forEach(function (prop) {
  Html5.prototype[prop] = function () {
    return this.el_[prop]();
  };
});

_tech2['default'].withSourceHandlers(Html5);

/**
 * Native source handler for Html5, simply passes the source to the media element.
 *
 * @proprety {Tech~SourceObject} source
 *        The source object
 *
 * @proprety {Html5} tech
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
Html5.nativeSourceHandler.canPlayType = function (type) {
  // IE9 on Windows 7 without MediaPlayer throws an error here
  // https://github.com/videojs/video.js/issues/519
  try {
    return Html5.TEST_VID.canPlayType(type);
  } catch (e) {
    return '';
  }
};

/**
 * Check if the media element can handle a source natively.
 *
 * @param {Tech~SourceObject} source
 *         The source object
 *
 * @param {Object} [options]
 *         Options to be passed to the tech.
 *
 * @return {string}
 *         'probably', 'maybe', or '' (empty string).
 */
Html5.nativeSourceHandler.canHandleSource = function (source, options) {

  // If a type was provided we should rely on that
  if (source.type) {
    return Html5.nativeSourceHandler.canPlayType(source.type);

    // If no type, fall back to checking 'video/[EXTENSION]'
  } else if (source.src) {
    var ext = Url.getFileExtension(source.src);

    return Html5.nativeSourceHandler.canPlayType('video/' + ext);
  }

  return '';
};

/**
 * Pass the source to the native media element.
 *
 * @param {Tech~SourceObject} source
 *        The source object
 *
 * @param {Html5} tech
 *        The instance of the Html5 tech
 *
 * @param {Object} [options]
 *        The options to pass to the source
 */
Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/**
 * A noop for the native dispose function, as cleanup is not needed.
 */
Html5.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

_component2['default'].registerComponent('Html5', Html5);
_tech2['default'].registerTech('Html5', Html5);
exports['default'] = Html5;
