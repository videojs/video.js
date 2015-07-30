/**
 * @file player.js
 */
 // Subclasses Component
import Component from './component.js';

import document from 'global/document';
import window from 'global/window';
import * as Events from './utils/events.js';
import * as Dom from './utils/dom.js';
import * as Fn from './utils/fn.js';
import * as Guid from './utils/guid.js';
import * as browser from './utils/browser.js';
import log from './utils/log.js';
import toTitleCase from './utils/to-title-case.js';
import { createTimeRange } from './utils/time-ranges.js';
import { bufferedPercent } from './utils/buffer.js';
import FullscreenApi from './fullscreen-api.js';
import MediaError from './media-error.js';
import globalOptions from './global-options.js';
import safeParseTuple from 'safe-json-parse/tuple';
import assign from 'object.assign';
import mergeOptions from './utils/merge-options.js';

// Include required child components (importing also registers them)
import MediaLoader from './tech/loader.js';
import PosterImage from './poster-image.js';
import TextTrackDisplay from './tracks/text-track-display.js';
import LoadingSpinner from './loading-spinner.js';
import BigPlayButton from './big-play-button.js';
import ControlBar from './control-bar/control-bar.js';
import ErrorDisplay from './error-display.js';
import TextTrackSettings from './tracks/text-track-settings.js';

// Require html5 tech, at least for disposing the original video tag
import Html5 from './tech/html5.js';

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods are used to initialize a video.
 * ```js
 * var myPlayer = videojs('example_video_1');
 * ```
 * In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @param {Element} tag        The original video tag used for configuring options
 * @param {Object=} options    Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Component
 * @class Player
 */
class Player extends Component {

  /**
   * player's constructor function
   *
   * @constructs
   * @method init
   * @param {Element} tag        The original video tag used for configuring options
   * @param {Object=} options    Player options
   * @param {Function=} ready    Ready callback function
   */
  constructor(tag, options, ready){
    // Make sure tag ID exists
    tag.id = tag.id || `vjs_video_${Guid.newGUID()}`;

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = assign(Player.getTagSettings(tag), options);

    // Delay the initialization of children because we need to set up
    // player properties first, and can't use `this` before `super()`
    options.initChildren = false;

    // Same with creating the element
    options.createEl = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // Run base component initializing with new options
    super(null, options, ready);


    // if the global option object was accidentally blown away by
    // someone, bail early with an informative error
    if (!this.options_ ||
        !this.options_.techOrder ||
        !this.options_.techOrder.length) {
      throw new Error('No techOrder specified. Did you overwrite ' +
                      'videojs.options instead of just changing the ' +
                      'properties you want to override?');
    }

    this.tag = tag; // Store the original tag used to set options

    // Store the tag attributes used to restore html5 element
    this.tagAttributes = tag && Dom.getElAttributes(tag);

    // Update current language
    this.language(options.language || globalOptions.language);

    // Update Supported Languages
    if (options['languages']) {
      // Normalise player option languages to lowercase
      let languagesToLower = {};

      Object.getOwnPropertyNames(options['languages']).forEach(function(name) {
        languagesToLower[name.toLowerCase()] = options['languages'][name];
      });
      this.languages_ = languagesToLower;
    } else {
      this.languages_ = globalOptions['languages'];
    }

    // Cache for video property values.
    this.cache_ = {};

    // Set poster
    this.poster_ = options['poster'] || '';

    // Set controls
    this.controls_ = !!options['controls'];
    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    /*
     * Store the internal state of scrubbing
     *
     * @private
     * @return {Boolean} True if the user is scrubbing
     */
    this.scrubbing_ = false;

    this.el_ = this.createEl();

    // We also want to pass the original player options to each component and plugin
    // as well so they don't need to reach back into the player for options later.
    // We also need to do another copy of this.options_ so we don't end up with
    // an infinite loop.
    let playerOptionsCopy = mergeOptions({}, this.options_);

    // Load plugins
    if (options['plugins']) {
      let plugins = options['plugins'];

      Object.getOwnPropertyNames(plugins).forEach(function(name){
        plugins[name].playerOptions = playerOptionsCopy;
        if (typeof this[name] === 'function') {
          this[name](plugins[name]);
        } else {
          log.error('Unable to find plugin:', name);
        }
      }, this);
    }

    this.options_.playerOptions = playerOptionsCopy;

    this.initChildren();

    // Set isAudio based on whether or not an audio tag was used
    this.isAudio(tag.nodeName.toLowerCase() === 'audio');

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (this.controls()) {
      this.addClass('vjs-controls-enabled');
    } else {
      this.addClass('vjs-controls-disabled');
    }

    if (this.isAudio()) {
      this.addClass('vjs-audio');
    }

    if (this.flexNotSupported_()) {
      this.addClass('vjs-no-flex');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (browser.TOUCH_ENABLED) {
    //   this.addClass('vjs-touch-enabled');
    // }

    // Make player easily findable by ID
    Player.players[this.id_] = this;

    // When the player is first initialized, trigger activity so components
    // like the control bar show themselves if needed
    this.userActive_ = true;
    this.reportUserActivity();
    this.listenForUserActivity();

    this.on('fullscreenchange', this.handleFullscreenChange);
    this.on('stageclick', this.handleStageClick);
  }

  /**
   * Destroys the video player and does any necessary cleanup
   * ```js
   *     myPlayer.dispose();
   * ```
   * This is especially helpful if you are dynamically adding and removing videos
   * to/from the DOM.
   *
   * @method dispose
   */
  dispose() {
    this.trigger('dispose');
    // prevent dispose from being called twice
    this.off('dispose');

    // Kill reference to this player
    Player.players[this.id_] = null;
    if (this.tag && this.tag['player']) { this.tag['player'] = null; }
    if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

    if (this.tech) { this.tech.dispose(); }

    super.dispose();
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = this.el_ = super.createEl('div');
    let tag = this.tag;

    // Remove width/height attrs from tag so CSS can make it 100% width/height
    tag.removeAttribute('width');
    tag.removeAttribute('height');

    // Copy over all the attributes from the tag, including ID and class
    // ID will now reference player box, not the video tag
    const attrs = Dom.getElAttributes(tag);

    Object.getOwnPropertyNames(attrs).forEach(function(attr){
      // workaround so we don't totally break IE7
      // http://stackoverflow.com/questions/3653444/css-styles-not-applied-on-dynamic-elements-in-internet-explorer-7
      if (attr === 'class') {
        el.className = attrs[attr];
      } else {
        el.setAttribute(attr, attrs[attr]);
      }
    });

    // Update tag id/class for use as HTML5 playback tech
    // Might think we should do this after embedding in container so .vjs-tech class
    // doesn't flash 100% width/height, but class only applies with .video-js parent
    tag.id += '_html5_api';
    tag.className = 'vjs-tech';

    // Make player findable on elements
    tag['player'] = el['player'] = this;
    // Default state of video is paused
    this.addClass('vjs-paused');

    // Add a style element in the player that we'll use to set the width/height
    // of the player in a way that's still overrideable by CSS, just like the
    // video element
    this.styleEl_ = document.createElement('style');
    el.appendChild(this.styleEl_);

    // Pass in the width/height/aspectRatio options which will update the style el
    this.width(this.options_['width']);
    this.height(this.options_['height']);
    this.fluid(this.options_['fluid']);
    this.aspectRatio(this.options_['aspectRatio']);

    // insertElFirst seems to cause the networkState to flicker from 3 to 2, so
    // keep track of the original for later so we can know if the source originally failed
    tag.initNetworkState_ = tag.networkState;

    // Wrap video tag in div (el/box) container
    if (tag.parentNode) {
      tag.parentNode.insertBefore(el, tag);
    }
    Dom.insertElFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

    this.el_ = el;

    return el;
  }

  /**
   * Get/set player width
   *
   * @param {Number=} value Value for width
   * @return {Number} Width when getting
   * @method width
   */
  width(value) {
    return this.dimension('width', value);
  }

  /**
   * Get/set player height
   *
   * @param {Number=} value Value for height
   * @return {Number} Height when getting
   * @method height
   */
  height(value) {
    return this.dimension('height', value);
  }

  /**
   * Get/set dimension for player
   *
   * @param {String} dimension Either width or height
   * @param {Number=} value Value for dimension
   * @return {Component}
   * @method dimension
   */
  dimension(dimension, value) {
    let privDimension = dimension + '_';

    if (value === undefined) {
      return this[privDimension] || 0;
    }

    if (value === '') {
      // If an empty string is given, reset the dimension to be automatic
      this[privDimension] = undefined;
    } else {
      let parsedVal = parseFloat(value);

      if (isNaN(parsedVal)) {
        log.error(`Improper value "${value}" supplied for for ${dimension}`);
        return this;
      }

      this[privDimension] = parsedVal;
    }

    this.updateStyleEl_();
    return this;
  }

  /**
   * Add/remove the vjs-fluid class
   *
   * @param {Boolean} bool Value of true adds the class, value of false removes the class
   * @method fluid
   */
  fluid(bool) {
    if (bool === undefined) {
      return !!this.fluid_;
    }

    this.fluid_ = !!bool;

    if (bool) {
      this.addClass('vjs-fluid');
    } else {
      this.removeClass('vjs-fluid');
    }
  }

  /**
   * Get/Set the aspect ratio
   *
   * @param {String=} ratio Aspect ratio for player
   * @return aspectRatio
   * @method aspectRatio
   */
  aspectRatio(ratio) {
    if (ratio === undefined) {
      return this.aspectRatio_;
    }

    // Check for width:height format
    if (!/^\d+\:\d+$/.test(ratio)) {
      throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
    }
    this.aspectRatio_ = ratio;

    // We're assuming if you set an aspect ratio you want fluid mode,
    // because in fixed mode you could calculate width and height yourself.
    this.fluid(true);

    this.updateStyleEl_();
  }

  /**
   * Update styles of the player element (height, width and aspect ratio)
   *
   * @method updateStyleEl_
   */
  updateStyleEl_() {
    let width;
    let height;
    let aspectRatio;

    // The aspect ratio is either used directly or to calculate width and height.
    if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
      // Use any aspectRatio that's been specifically set
      aspectRatio = this.aspectRatio_;
    } else if (this.videoWidth()) {
      // Otherwise try to get the aspect ratio from the video metadata
      aspectRatio = this.videoWidth() + ':' + this.videoHeight();
    } else {
      // Or use a default. The video element's is 2:1, but 16:9 is more common.
      aspectRatio = '16:9';
    }

    // Get the ratio as a decimal we can use to calculate dimensions
    let ratioParts = aspectRatio.split(':');
    let ratioMultiplier = ratioParts[1] / ratioParts[0];

    if (this.width_ !== undefined) {
      // Use any width that's been specifically set
      width = this.width_;
    } else if (this.height_ !== undefined) {
      // Or calulate the width from the aspect ratio if a height has been set
      width = this.height_ / ratioMultiplier;
    } else {
      // Or use the video's metadata, or use the video el's default of 300
      width = this.videoWidth() || 300;
    }

    if (this.height_ !== undefined) {
      // Use any height that's been specifically set
      height = this.height_;
    } else {
      // Otherwise calculate the height from the ratio and the width
      height = width  * ratioMultiplier;
    }

    let idClass = this.id()+'-dimensions';

    // Ensure the right class is still on the player for the style element
    this.addClass(idClass);

    // Create the width/height CSS
    var css = `.${idClass} { width: ${width}px; height: ${height}px; }`;
    // Add the aspect ratio CSS for when using a fluid layout
    css += `.${idClass}.vjs-fluid { padding-top: ${ratioMultiplier  * 100}%; }`;

    // Update the style el
    if (this.styleEl_.styleSheet){
      this.styleEl_.styleSheet.cssText = css;
    } else {
      this.styleEl_.innerHTML = css;
    }
  }

  /**
   * Load the Media Playback Technology (tech)
   * Load/Create an instance of playback technology including element and API methods
   * And append playback element in player div.
   *
   * @param {String} techName Name of the playback technology
   * @param {String} source Video source
   * @method loadTech
   */
  loadTech(techName, source) {

    // Pause and remove current playback technology
    if (this.tech) {
      this.unloadTech();
    }

    // get rid of the HTML5 video tag as soon as we are using another tech
    if (techName !== 'Html5' && this.tag) {
      Component.getComponent('Html5').disposeMediaElement(this.tag);
      this.tag.player = null;
      this.tag = null;
    }

    this.techName = techName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady_ = false;

    var techReady = Fn.bind(this, function() {
      this.triggerReady();
    });

    // Grab tech-specific options from player options and add source and parent element to use.
    var techOptions = assign({
      'source': source,
      'playerId': this.id(),
      'techId': `${this.id()}_${techName}_api`,
      'textTracks': this.textTracks_,
      'autoplay': this.options_.autoplay,
      'preload': this.options_.preload,
      'loop': this.options_.loop,
      'muted': this.options_.muted,
      'poster': this.poster(),
      'language': this.language()
    }, this.options_[techName.toLowerCase()]);

    if (this.tag) {
      techOptions.tag = this.tag;
    }

    if (source) {
      this.currentType_ = source.type;
      if (source.src === this.cache_.src && this.cache_.currentTime > 0) {
        techOptions['startTime'] = this.cache_.currentTime;
      }

      this.cache_.src = source.src;
    }

    // Initialize tech instance
    let techComponent = Component.getComponent(techName);
    this.tech = new techComponent(techOptions);

    this.on(this.tech, 'ready', this.handleTechReady);
    this.on(this.tech, 'usenativecontrols', this.handleTechUseNativeControls);

    // Listen to every HTML5 events and trigger them back on the player for the plugins
    this.on(this.tech, 'loadstart', this.handleTechLoadStart);
    this.on(this.tech, 'waiting', this.handleTechWaiting);
    this.on(this.tech, 'canplay', this.handleTechCanPlay);
    this.on(this.tech, 'canplaythrough', this.handleTechCanPlayThrough);
    this.on(this.tech, 'playing', this.handleTechPlaying);
    this.on(this.tech, 'ended', this.handleTechEnded);
    this.on(this.tech, 'seeking', this.handleTechSeeking);
    this.on(this.tech, 'seeked', this.handleTechSeeked);
    this.on(this.tech, 'play', this.handleTechPlay);
    this.on(this.tech, 'firstplay', this.handleTechFirstPlay);
    this.on(this.tech, 'pause', this.handleTechPause);
    this.on(this.tech, 'progress', this.handleTechProgress);
    this.on(this.tech, 'durationchange', this.handleTechDurationChange);
    this.on(this.tech, 'fullscreenchange', this.handleTechFullscreenChange);
    this.on(this.tech, 'error', this.handleTechError);
    this.on(this.tech, 'suspend', this.handleTechSuspend);
    this.on(this.tech, 'abort', this.handleTechAbort);
    this.on(this.tech, 'emptied', this.handleTechEmptied);
    this.on(this.tech, 'stalled', this.handleTechStalled);
    this.on(this.tech, 'loadedmetadata', this.handleTechLoadedMetaData);
    this.on(this.tech, 'loadeddata', this.handleTechLoadedData);
    this.on(this.tech, 'timeupdate', this.handleTechTimeUpdate);
    this.on(this.tech, 'ratechange', this.handleTechRateChange);
    this.on(this.tech, 'volumechange', this.handleTechVolumeChange);
    this.on(this.tech, 'texttrackchange', this.onTextTrackChange);
    this.on(this.tech, 'loadedmetadata', this.updateStyleEl_);

    if (this.controls() && !this.usingNativeControls()) {
      this.addTechControlsListeners();
    }

    // Add the tech element in the DOM if it was not already there
    // Make sure to not insert the original video element if using Html5
    if (this.tech.el().parentNode !== this.el() && (techName !== 'Html5' || !this.tag)) {
      Dom.insertElFirst(this.tech.el(), this.el());
    }

    // Get rid of the original video tag reference after the first tech is loaded
    if (this.tag) {
      this.tag.player = null;
      this.tag = null;
    }

    // player.triggerReady is always async, so don't need this to be async
    this.tech.ready(techReady, true);
  }

  /**
   * Unload playback technology
   *
   * @method unloadTech
   */
  unloadTech() {
    // Save the current text tracks so that we can reuse the same text tracks with the next tech
    this.textTracks_ = this.textTracks();

    this.isReady_ = false;

    this.tech.dispose();

    this.tech = false;
  }

  /**
   * Add playback technology listeners
  *
   * @method addTechControlsListeners
   */
  addTechControlsListeners() {
    // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
    // trigger mousedown/up.
    // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
    // Any touch events are set to block the mousedown event from happening
    this.on(this.tech, 'mousedown', this.handleTechClick);

    // If the controls were hidden we don't want that to change without a tap event
    // so we'll check if the controls were already showing before reporting user
    // activity
    this.on(this.tech, 'touchstart', this.handleTechTouchStart);
    this.on(this.tech, 'touchmove', this.handleTechTouchMove);
    this.on(this.tech, 'touchend', this.handleTechTouchEnd);

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    this.on(this.tech, 'tap', this.handleTechTap);
  }

  /**
   * Remove the listeners used for click and tap controls. This is needed for
   * toggling to controls disabled, where a tap/touch should do nothing.
   *
   * @method removeTechControlsListeners
   */
  removeTechControlsListeners() {
    // We don't want to just use `this.off()` because there might be other needed
    // listeners added by techs that extend this.
    this.off(this.tech, 'tap', this.handleTechTap);
    this.off(this.tech, 'touchstart', this.handleTechTouchStart);
    this.off(this.tech, 'touchmove', this.handleTechTouchMove);
    this.off(this.tech, 'touchend', this.handleTechTouchEnd);
    this.off(this.tech, 'mousedown', this.handleTechClick);
  }

  /**
   * Player waits for the tech to be ready
  *
   * @private
   * @method handleTechReady
   */
  handleTechReady() {
    this.triggerReady();

    // Keep the same volume as before
    if (this.cache_.volume) {
      this.techCall('setVolume', this.cache_.volume);
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    if (this.tag && this.options_.autoplay && this.paused()) {
      delete this.tag.poster; // Chrome Fix. Fixed in Chrome v16.
      this.play();
    }
  }

  /**
   * Fired when the native controls are used
   *
   * @private
   * @method handleTechUseNativeControls
   */
  handleTechUseNativeControls() {
    this.usingNativeControls(true);
  }

  /**
   * Fired when the user agent begins looking for media data
   *
   * @event loadstart
   */
  handleTechLoadStart() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('vjs-ended');

    // reset the error state
    this.error(null);

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    if (!this.paused()) {
      this.trigger('loadstart');
      this.trigger('firstplay');
    } else {
      // reset the hasStarted state
      this.hasStarted(false);
      this.trigger('loadstart');
    }
  }

  /**
   * Add/remove the vjs-has-started class
   *
   * @param {Boolean} hasStarted The value of true adds the class the value of false remove the class
   * @return {Boolean} Boolean value if has started
   * @method hasStarted
   */
  hasStarted(hasStarted) {
    if (hasStarted !== undefined) {
      // only update if this is a new value
      if (this.hasStarted_ !== hasStarted) {
        this.hasStarted_ = hasStarted;
        if (hasStarted) {
          this.addClass('vjs-has-started');
          // trigger the firstplay event if this newly has played
          this.trigger('firstplay');
        } else {
          this.removeClass('vjs-has-started');
        }
      }
      return this;
    }
    return !!this.hasStarted_;
  }

  /**
   * Fired whenever the media begins or resumes playback
   *
   * @event play
   */
  handleTechPlay() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');

    // hide the poster when the user hits play
    // https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
    this.hasStarted(true);

    this.trigger('play');
  }

  /**
   * Fired whenever the media begins waiting
   *
   * @event waiting
   */
  handleTechWaiting() {
    this.addClass('vjs-waiting');
    this.trigger('waiting');
  }

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @event canplay
   */
  handleTechCanPlay() {
    this.removeClass('vjs-waiting');
    this.trigger('canplay');
  }

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @event canplaythrough
   */
  handleTechCanPlayThrough() {
    this.removeClass('vjs-waiting');
    this.trigger('canplaythrough');
  }

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @event playing
   */
  handleTechPlaying() {
    this.removeClass('vjs-waiting');
    this.trigger('playing');
  }

  /**
   * Fired whenever the player is jumping to a new time
   *
   * @event seeking
   */
  handleTechSeeking() {
    this.addClass('vjs-seeking');
    this.trigger('seeking');
  }

  /**
   * Fired when the player has finished jumping to a new time
   *
   * @event seeked
   */
  handleTechSeeked() {
    this.removeClass('vjs-seeking');
    this.trigger('seeked');
  }

  /**
   * Fired the first time a video is played
   * Not part of the HLS spec, and we're not sure if this is the best
   * implementation yet, so use sparingly. If you don't have a reason to
   * prevent playback, use `myPlayer.one('play');` instead.
   *
   * @event firstplay
   */
  handleTechFirstPlay() {
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
      this.currentTime(this.options_['starttime']);
    }

    this.addClass('vjs-has-started');
    this.trigger('firstplay');
  }

  /**
   * Fired whenever the media has been paused
   *
   * @event pause
   */
  handleTechPause() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    this.trigger('pause');
  }

  /**
   * Fired while the user agent is downloading media data
   *
   * @event progress
   */
  handleTechProgress() {
    this.trigger('progress');

    // Add custom event for when source is finished downloading.
    if (this.bufferedPercent() === 1) {
      this.trigger('loadedalldata');
    }
  }

  /**
   * Fired when the end of the media resource is reached (currentTime == duration)
   *
   * @event ended
   */
  handleTechEnded() {
    this.addClass('vjs-ended');
    if (this.options_['loop']) {
      this.currentTime(0);
      this.play();
    } else if (!this.paused()) {
      this.pause();
    }

    this.trigger('ended');
  }

  /**
   * Fired when the duration of the media resource is first known or changed
   *
   * @event durationchange
   */
  handleTechDurationChange() {
    this.updateDuration();
    this.trigger('durationchange');
  }

  /**
   * Handle a click on the media element to play/pause
   *
   * @param {Object=} event Event object
   * @method handleTechClick
   */
  handleTechClick(event) {
    // We're using mousedown to detect clicks thanks to Flash, but mousedown
    // will also be triggered with right-clicks, so we need to prevent that
    if (event.button !== 0) return;

    // When controls are disabled a click should not toggle playback because
    // the click is considered a control
    if (this.controls()) {
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    }
  }

  /**
   * Handle a tap on the media element. It will toggle the user
   * activity state, which hides and shows the controls.
   *
   * @method handleTechTap
   */
  handleTechTap() {
    this.userActive(!this.userActive());
  }

  /**
   * Handle touch to start
   *
   * @method handleTechTouchStart
   */
  handleTechTouchStart() {
    this.userWasActive = this.userActive();
  }

  /**
   * Handle touch to move
   *
   * @method handleTechTouchMove
   */
  handleTechTouchMove() {
    if (this.userWasActive){
      this.reportUserActivity();
    }
  }

  /**
   * Handle touch to end
   *
   * @method handleTechTouchEnd
   */
  handleTechTouchEnd(event) {
    // Stop the mouse events from also happening
    event.preventDefault();
  }

  /**
   * Update the duration of the player using the tech
   *
   * @private
   * @method updateDuration
   */
  updateDuration() {
    // Allows for caching value instead of asking player each time.
    // We need to get the techGet response and check for a value so we don't
    // accidentally cause the stack to blow up.
    var duration = this.techGet('duration');
    if (duration) {
      if (duration < 0) {
        duration = Infinity;
      }
      this.duration(duration);
      // Determine if the stream is live and propagate styles down to UI.
      if (duration === Infinity) {
        this.addClass('vjs-live');
      } else {
        this.removeClass('vjs-live');
      }
    }
  }

  /**
   * Fired when the player switches in or out of fullscreen mode
   *
   * @event fullscreenchange
   */
  handleFullscreenChange() {
    if (this.isFullscreen()) {
      this.addClass('vjs-fullscreen');
    } else {
      this.removeClass('vjs-fullscreen');
    }
  }

  /**
   * native click events on the SWF aren't triggered on IE11, Win8.1RT
   * use stageclick events triggered from inside the SWF instead
   *
   * @private
   * @method handleStageClick
   */
  handleStageClick() {
    this.reportUserActivity();
  }

  /**
   * Handle Tech Fullscreen Change
   *
   * @method handleTechFullscreenChange
   */
  handleTechFullscreenChange(event, data) {
    if (data) {
      this.isFullscreen(data.isFullscreen);
    }
    this.trigger('fullscreenchange');
  }

  /**
   * Fires when an error occurred during the loading of an audio/video
   *
   * @event error
   */
  handleTechError() {
    this.error(this.tech.error().code);
  }

  /**
   * Fires when the browser is intentionally not getting media data
   *
   * @event suspend
   */
  handleTechSuspend() {
    this.trigger('suspend');
  }

  /**
   * Fires when the loading of an audio/video is aborted
   *
   * @event abort
   */
  handleTechAbort() {
    this.trigger('abort');
  }

  /**
   * Fires when the current playlist is empty
   *
   * @event emptied
   */
  handleTechEmptied() {
    this.trigger('emptied');
  }

  /**
   * Fires when the browser is trying to get media data, but data is not available
   *
   * @event stalled
   */
  handleTechStalled() {
    this.trigger('stalled');
  }

  /**
   * Fires when the browser has loaded meta data for the audio/video
   *
   * @event loadedmetadata
   */
  handleTechLoadedMetaData() {
    this.trigger('loadedmetadata');
  }

  /**
   * Fires when the browser has loaded the current frame of the audio/video
   *
   * @event loaddata
   */
  handleTechLoadedData() {
    this.trigger('loadeddata');
  }

  /**
   * Fires when the current playback position has changed
   *
   * @event timeupdate
   */
  handleTechTimeUpdate() {
    this.trigger('timeupdate');
  }

  /**
   * Fires when the playing speed of the audio/video is changed
   *
   * @event ratechange
   */
  handleTechRateChange() {
    this.trigger('ratechange');
  }

  /**
   * Fires when the volume has been changed
   *
   * @event volumechange
   */
  handleTechVolumeChange() {
    this.trigger('volumechange');
  }

  /**
   * Fires when the text track has been changed
   *
   * @event texttrackchange
   */
  onTextTrackChange() {
    this.trigger('texttrackchange');
  }

  /**
   * Get object for cached values.
   *
   * @return {Object}
   * @method getCache
   */
  getCache() {
    return this.cache_;
  }

  /**
   * Pass values to the playback tech
   *
   * @param {String=} method Method
   * @param {Object=} arg Argument
   * @method techCall
   */
  techCall(method, arg) {
    // If it's not ready yet, call method when it is
    if (this.tech && !this.tech.isReady_) {
      this.tech.ready(function(){
        this[method](arg);
      }, true);

    // Otherwise call method now
    } else {
      try {
        this.tech[method](arg);
      } catch(e) {
        log(e);
        throw e;
      }
    }
  }

  /**
   * Get calls can't wait for the tech, and sometimes don't need to.
   *
   * @param {String} method Tech method
   * @return {Method}
   * @method techGet
   */
  techGet(method) {
    if (this.tech && this.tech.isReady_) {

      // Flash likes to die and reload when you hide or reposition it.
      // In these cases the object methods go away and we get errors.
      // When that happens we'll catch the errors and inform tech that it's not ready any more.
      try {
        return this.tech[method]();
      } catch(e) {
        // When building additional tech libs, an expected method may not be defined yet
        if (this.tech[method] === undefined) {
          log(`Video.js: ${method} method not defined for ${this.techName} playback technology.`, e);
        } else {
          // When a method isn't available on the object it throws a TypeError
          if (e.name === 'TypeError') {
            log(`Video.js: ${method} unavailable on ${this.techName} playback technology element.`, e);
            this.tech.isReady_ = false;
          } else {
            log(e);
          }
        }
        throw e;
      }
    }

    return;
  }

  /**
   * start media playback
   * ```js
   *     myPlayer.play();
   * ```
   *
   * @return {Player} self
   * @method play
   */
  play() {
    this.techCall('play');
    return this;
  }

  /**
   * Pause the video playback
   * ```js
   *     myPlayer.pause();
   * ```
   *
   * @return {Player} self
   * @method pause
   */
  pause() {
    this.techCall('pause');
    return this;
  }

  /**
   * Check if the player is paused
   * ```js
   *     var isPaused = myPlayer.paused();
   *     var isPlaying = !myPlayer.paused();
   * ```
   *
   * @return {Boolean} false if the media is currently playing, or true otherwise
   * @method paused
   */
  paused() {
    // The initial state of paused should be true (in Safari it's actually false)
    return (this.techGet('paused') === false) ? false : true;
  }

  /**
   * Returns whether or not the user is "scrubbing". Scrubbing is when the user
   * has clicked the progress bar handle and is dragging it along the progress bar.
   *
   * @param  {Boolean} isScrubbing   True/false the user is scrubbing
   * @return {Boolean}               The scrubbing status when getting
   * @return {Object}                The player when setting
   * @method scrubbing
   */
  scrubbing(isScrubbing) {
    if (isScrubbing !== undefined) {
      this.scrubbing_ = !!isScrubbing;

      if (isScrubbing) {
        this.addClass('vjs-scrubbing');
      } else {
        this.removeClass('vjs-scrubbing');
      }

      return this;
    }

    return this.scrubbing_;
  }

  /**
   * Get or set the current time (in seconds)
   * ```js
   *     // get
   *     var whereYouAt = myPlayer.currentTime();
   *     // set
   *     myPlayer.currentTime(120); // 2 minutes into the video
   * ```
   *
   * @param  {Number|String=} seconds The time to seek to
   * @return {Number}        The time in seconds, when not setting
   * @return {Player}    self, when the current time is set
   * @method currentTime
   */
  currentTime(seconds) {
    if (seconds !== undefined) {

      this.techCall('setCurrentTime', seconds);

      return this;
    }

    // cache last currentTime and return. default to 0 seconds
    //
    // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
    // currentTime when scrubbing, but may not provide much performance benefit afterall.
    // Should be tested. Also something has to read the actual current time or the cache will
    // never get updated.
    return this.cache_.currentTime = (this.techGet('currentTime') || 0);
  }

  /**
   * Get the length in time of the video in seconds
   * ```js
   *     var lengthOfVideo = myPlayer.duration();
   * ```
   * **NOTE**: The video must have started loading before the duration can be
   * known, and in the case of Flash, may not be known until the video starts
   * playing.
   *
   * @param {Number} seconds Duration when setting
   * @return {Number} The duration of the video in seconds when getting
   * @method duration
   */
  duration(seconds) {
    if (seconds !== undefined) {

      // cache the last set value for optimized scrubbing (esp. Flash)
      this.cache_.duration = parseFloat(seconds);

      return this;
    }

    if (this.cache_.duration === undefined) {
      this.updateDuration();
    }

    return this.cache_.duration || 0;
  }

  /**
   * Calculates how much time is left.
   * ```js
   *     var timeLeft = myPlayer.remainingTime();
   * ```
   * Not a native video element function, but useful
   *
   * @return {Number} The time remaining in seconds
   * @method remainingTime
   */
  remainingTime() {
    return this.duration() - this.currentTime();
  }

  // http://dev.w3.org/html5/spec/video.html#dom-media-buffered
  // Buffered returns a timerange object.
  // Kind of like an array of portions of the video that have been downloaded.

  /**
   * Get a TimeRange object with the times of the video that have been downloaded
   * If you just want the percent of the video that's been downloaded,
   * use bufferedPercent.
   * ```js
   *     // Number of different ranges of time have been buffered. Usually 1.
   *     numberOfRanges = bufferedTimeRange.length,
   *     // Time in seconds when the first range starts. Usually 0.
   *     firstRangeStart = bufferedTimeRange.start(0),
   *     // Time in seconds when the first range ends
   *     firstRangeEnd = bufferedTimeRange.end(0),
   *     // Length in seconds of the first time range
   *     firstRangeLength = firstRangeEnd - firstRangeStart;
   * ```
   *
   * @return {Object} A mock TimeRange object (following HTML spec)
   * @method buffered
   */
  buffered() {
    var buffered = this.techGet('buffered');

    if (!buffered || !buffered.length) {
      buffered = createTimeRange(0,0);
    }

    return buffered;
  }

  /**
   * Get the percent (as a decimal) of the video that's been downloaded
   * ```js
   *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
   * ```
   * 0 means none, 1 means all.
   * (This method isn't in the HTML5 spec, but it's very convenient)
   *
   * @return {Number} A decimal between 0 and 1 representing the percent
   * @method bufferedPercent
   */
  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration());
  }

  /**
   * Get the ending time of the last buffered time range
   * This is used in the progress bar to encapsulate all time ranges.
   *
   * @return {Number} The end of the last buffered time range
   * @method bufferedEnd
   */
  bufferedEnd() {
    var buffered = this.buffered(),
        duration = this.duration(),
        end = buffered.end(buffered.length-1);

    if (end > duration) {
      end = duration;
    }

    return end;
  }

  /**
   * Get or set the current volume of the media
   * ```js
   *     // get
   *     var howLoudIsIt = myPlayer.volume();
   *     // set
   *     myPlayer.volume(0.5); // Set volume to half
   * ```
   * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
   *
   * @param  {Number} percentAsDecimal The new volume as a decimal percent
   * @return {Number}              The current volume when getting
   * @return {Player}              self when setting
   * @method volume
   */
  volume(percentAsDecimal) {
    let vol;

    if (percentAsDecimal !== undefined) {
      vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
      this.cache_.volume = vol;
      this.techCall('setVolume', vol);

      return this;
    }

    // Default to 1 when returning current volume.
    vol = parseFloat(this.techGet('volume'));
    return (isNaN(vol)) ? 1 : vol;
  }


  /**
   * Get the current muted state, or turn mute on or off
   * ```js
   *     // get
   *     var isVolumeMuted = myPlayer.muted();
   *     // set
   *     myPlayer.muted(true); // mute the volume
   * ```
   *
   * @param  {Boolean=} muted True to mute, false to unmute
   * @return {Boolean} True if mute is on, false if not when getting
   * @return {Player} self when setting mute
   * @method muted
   */
  muted(muted) {
    if (muted !== undefined) {
      this.techCall('setMuted', muted);
      return this;
    }
    return this.techGet('muted') || false; // Default to false
  }

  // Check if current tech can support native fullscreen
  // (e.g. with built in controls like iOS, so not our flash swf)
  /**
   * Check to see if fullscreen is supported
   *
   * @return {Boolean}
   * @method supportsFullScreen
   */
  supportsFullScreen() {
    return this.techGet('supportsFullScreen') || false;
  }

  /**
   * Check if the player is in fullscreen mode
   * ```js
   *     // get
   *     var fullscreenOrNot = myPlayer.isFullscreen();
   *     // set
   *     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
   * ```
   * NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
   * property and instead document.fullscreenElement is used. But isFullscreen is
   * still a valuable property for internal player workings.
   *
   * @param  {Boolean=} isFS Update the player's fullscreen state
   * @return {Boolean} true if fullscreen false if not when getting
   * @return {Player} self when setting
   * @method isFullscreen
   */
  isFullscreen(isFS) {
    if (isFS !== undefined) {
      this.isFullscreen_ = !!isFS;
      return this;
    }
    return !!this.isFullscreen_;
  }

  /**
   * Increase the size of the video to full screen
   * ```js
   *     myPlayer.requestFullscreen();
   * ```
   * In some browsers, full screen is not supported natively, so it enters
   * "full window mode", where the video fills the browser window.
   * In browsers and devices that support native full screen, sometimes the
   * browser's default controls will be shown, and not the Video.js custom skin.
   * This includes most mobile devices (iOS, Android) and older versions of
   * Safari.
   *
   * @return {Player} self
   * @method requestFullscreen
   */
  requestFullscreen() {
    var fsApi = FullscreenApi;

    this.isFullscreen(true);

    if (fsApi.requestFullscreen) {
      // the browser supports going fullscreen at the element level so we can
      // take the controls fullscreen as well as the video

      // Trigger fullscreenchange event after change
      // We have to specifically add this each time, and remove
      // when canceling fullscreen. Otherwise if there's multiple
      // players on a page, they would all be reacting to the same fullscreen
      // events
      Events.on(document, fsApi['fullscreenchange'], Fn.bind(this, function documentFullscreenChange(e){
        this.isFullscreen(document[fsApi.fullscreenElement]);

        // If cancelling fullscreen, remove event listener.
        if (this.isFullscreen() === false) {
          Events.off(document, fsApi['fullscreenchange'], documentFullscreenChange);
        }

        this.trigger('fullscreenchange');
      }));

      this.el_[fsApi.requestFullscreen]();

    } else if (this.tech.supportsFullScreen()) {
      // we can't take the video.js controls fullscreen but we can go fullscreen
      // with native controls
      this.techCall('enterFullScreen');
    } else {
      // fullscreen isn't supported so we'll just stretch the video element to
      // fill the viewport
      this.enterFullWindow();
      this.trigger('fullscreenchange');
    }

    return this;
  }

  /**
   * Return the video to its normal size after having been in full screen mode
   * ```js
   *     myPlayer.exitFullscreen();
   * ```
   *
   * @return {Player} self
   * @method exitFullscreen
   */
  exitFullscreen() {
    var fsApi = FullscreenApi;
    this.isFullscreen(false);

    // Check for browser element fullscreen support
    if (fsApi.requestFullscreen) {
      document[fsApi.exitFullscreen]();
    } else if (this.tech.supportsFullScreen()) {
     this.techCall('exitFullScreen');
    } else {
     this.exitFullWindow();
     this.trigger('fullscreenchange');
    }

    return this;
  }

  /**
   * When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
   *
   * @method enterFullWindow
   */
  enterFullWindow() {
    this.isFullWindow = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    Events.on(document, 'keydown', Fn.bind(this, this.fullWindowOnEscKey));

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    Dom.addElClass(document.body, 'vjs-full-window');

    this.trigger('enterFullWindow');
  }

  /**
   * Check for call to either exit full window or full screen on ESC key
   *
   * @param {String} event Event to check for key press
   * @method fullWindowOnEscKey
   */
  fullWindowOnEscKey(event) {
    if (event.keyCode === 27) {
      if (this.isFullscreen() === true) {
        this.exitFullscreen();
      } else {
        this.exitFullWindow();
      }
    }
  }

  /**
   * Exit full window
   *
   * @method exitFullWindow
   */
  exitFullWindow() {
    this.isFullWindow = false;
    Events.off(document, 'keydown', this.fullWindowOnEscKey);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    Dom.removeElClass(document.body, 'vjs-full-window');

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    this.trigger('exitFullWindow');
  }

  /**
   * Select source based on tech order
   *
   * @param {Array} sources The sources for a media asset
   * @return {Object|Boolean} Object of source and tech order, otherwise false
   * @method selectSource
   */
  selectSource(sources) {
    // Loop through each playback technology in the options order
    for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
      let techName = toTitleCase(j[i]);
      let tech = Component.getComponent(techName);

      // Check if the current tech is defined before continuing
      if (!tech) {
        log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
        continue;
      }

      // Check if the browser supports this technology
      if (tech.isSupported()) {
        // Loop through each source object
        for (var a=0,b=sources;a<b.length;a++) {
          var source = b[a];

          // Check if source can be played with this technology
          if (tech['canPlaySource'](source)) {
            return { source: source, tech: techName };
          }
        }
      }
    }

    return false;
  }

  /**
   * The source function updates the video source
   * There are three types of variables you can pass as the argument.
   * **URL String**: A URL to the the video file. Use this method if you are sure
   * the current playback technology (HTML5/Flash) can support the source you
   * provide. Currently only MP4 files can be used in both HTML5 and Flash.
   * ```js
   *     myPlayer.src("http://www.example.com/path/to/video.mp4");
   * ```
   * **Source Object (or element):* * A javascript object containing information
   * about the source file. Use this method if you want the player to determine if
   * it can support the file using the type information.
   * ```js
   *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
   * ```
   * **Array of Source Objects:* * To provide multiple versions of the source so
   * that it can be played using HTML5 across browsers you can use an array of
   * source objects. Video.js will detect which version is supported and load that
   * file.
   * ```js
   *     myPlayer.src([
   *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
   *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
   *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
   *     ]);
   * ```
   *
   * @param  {String|Object|Array=} source The source URL, object, or array of sources
   * @return {String} The current video source when getting
   * @return {String} The player when setting
   * @method src
   */
  src(source) {
    if (source === undefined) {
      return this.techGet('src');
    }

    let currentTech = Component.getComponent(this.techName);

    // case: Array of source objects to choose from and pick the best to play
    if (Array.isArray(source)) {
      this.sourceList_(source);

    // case: URL String (http://myvideo...)
    } else if (typeof source === 'string') {
      // create a source object from the string
      this.src({ src: source });

    // case: Source object { src: '', type: '' ... }
    } else if (source instanceof Object) {
      // check if the source has a type and the loaded tech cannot play the source
      // if there's no type we'll just try the current tech
      if (source.type && !currentTech['canPlaySource'](source)) {
        // create a source list with the current source and send through
        // the tech loop to check for a compatible technology
        this.sourceList_([source]);
      } else {
        this.cache_.src = source.src;
        this.currentType_ = source.type || '';

        // wait until the tech is ready to set the source
        this.ready(function(){

          // The setSource tech method was added with source handlers
          // so older techs won't support it
          // We need to check the direct prototype for the case where subclasses
          // of the tech do not support source handlers
          if (currentTech.prototype.hasOwnProperty('setSource')) {
            this.techCall('setSource', source);
          } else {
            this.techCall('src', source.src);
          }

          if (this.options_['preload'] === 'auto') {
            this.load();
          }

          if (this.options_['autoplay']) {
            this.play();
          }

        // Set the source synchronously if possible (#2326)
        }, true);
      }
    }

    return this;
  }

  /**
   * Handle an array of source objects
   *
   * @param  {Array} sources Array of source objects
   * @private
   * @method sourceList_
   */
  sourceList_(sources) {
    var sourceTech = this.selectSource(sources);

    if (sourceTech) {
      if (sourceTech.tech === this.techName) {
        // if this technology is already loaded, set the source
        this.src(sourceTech.source);
      } else {
        // load this technology with the chosen source
        this.loadTech(sourceTech.tech, sourceTech.source);
      }
    } else {
      // We need to wrap this in a timeout to give folks a chance to add error event handlers
      this.setTimeout( function() {
        this.error({ code: 4, message: this.localize(this.options_['notSupportedMessage']) });
      }, 0);

      // we could not find an appropriate tech, but let's still notify the delegate that this is it
      // this needs a better comment about why this is needed
      this.triggerReady();
    }
  }

  /**
   * Begin loading the src data.
   *
   * @return {Player} Returns the player
   * @method load
   */
  load() {
    this.techCall('load');
    return this;
  }

  /**
   * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
   * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
   *
   * @return {String} The current source
   * @method currentSrc
   */
  currentSrc() {
    return this.techGet('currentSrc') || this.cache_.src || '';
  }

  /**
   * Get the current source type e.g. video/mp4
   * This can allow you rebuild the current source object so that you could load the same
   * source and tech later
   *
   * @return {String} The source MIME type
   * @method currentType
   */
  currentType() {
      return this.currentType_ || '';
  }

  /**
   * Get or set the preload attribute
   *
   * @param {Boolean} value Boolean to determine if preload should be used
   * @return {String} The preload attribute value when getting
   * @return {Player} Returns the player when setting
   * @method preload
   */
  preload(value) {
    if (value !== undefined) {
      this.techCall('setPreload', value);
      this.options_['preload'] = value;
      return this;
    }
    return this.techGet('preload');
  }

  /**
   * Get or set the autoplay attribute.
   *
   * @param {Boolean} value Boolean to determine if preload should be used
   * @return {String} The autoplay attribute value when getting
   * @return {Player} Returns the player when setting
   * @method autoplay
   */
  autoplay(value) {
    if (value !== undefined) {
      this.techCall('setAutoplay', value);
      this.options_['autoplay'] = value;
      return this;
    }
    return this.techGet('autoplay', value);
  }

  /**
   * Get or set the loop attribute on the video element.
   *
   * @param {Boolean} value Boolean to determine if preload should be used
   * @return {String} The loop attribute value when getting
   * @return {Player} Returns the player when setting
   * @method loop
   */
  loop(value) {
    if (value !== undefined) {
      this.techCall('setLoop', value);
      this.options_['loop'] = value;
      return this;
    }
    return this.techGet('loop');
  }

  /**
   * get or set the poster image source url
   * ##### EXAMPLE:
   * ```js
   *     // get
   *     var currentPoster = myPlayer.poster();
   *     // set
   *     myPlayer.poster('http://example.com/myImage.jpg');
   * ```
   *
   * @param  {String=} src Poster image source URL
   * @return {String} poster URL when getting
   * @return {Player} self when setting
   * @method poster
   */
  poster(src) {
    if (src === undefined) {
      return this.poster_;
    }

    // The correct way to remove a poster is to set as an empty string
    // other falsey values will throw errors
    if (!src) {
      src = '';
    }

    // update the internal poster variable
    this.poster_ = src;

    // update the tech's poster
    this.techCall('setPoster', src);

    // alert components that the poster has been set
    this.trigger('posterchange');

    return this;
  }

  /**
   * Get or set whether or not the controls are showing.
   *
   * @param  {Boolean} bool Set controls to showing or not
   * @return {Boolean}    Controls are showing
   * @method controls
   */
  controls(bool) {
    if (bool !== undefined) {
      bool = !!bool; // force boolean
      // Don't trigger a change event unless it actually changed
      if (this.controls_ !== bool) {
        this.controls_ = bool;

        if (this.usingNativeControls()) {
          this.techCall('setControls', bool);
        }

        if (bool) {
          this.removeClass('vjs-controls-disabled');
          this.addClass('vjs-controls-enabled');
          this.trigger('controlsenabled');

          if (!this.usingNativeControls()) {
            this.addTechControlsListeners();
          }
        } else {
          this.removeClass('vjs-controls-enabled');
          this.addClass('vjs-controls-disabled');
          this.trigger('controlsdisabled');

          if (!this.usingNativeControls()) {
            this.removeTechControlsListeners();
          }
        }
      }
      return this;
    }
    return !!this.controls_;
  }

  /**
   * Toggle native controls on/off. Native controls are the controls built into
   * devices (e.g. default iPhone controls), Flash, or other techs
   * (e.g. Vimeo Controls)
   * **This should only be set by the current tech, because only the tech knows
   * if it can support native controls**
   *
   * @param  {Boolean} bool    True signals that native controls are on
   * @return {Player}      Returns the player
   * @private
   * @method usingNativeControls
   */
  usingNativeControls(bool) {
    if (bool !== undefined) {
      bool = !!bool; // force boolean
      // Don't trigger a change event unless it actually changed
      if (this.usingNativeControls_ !== bool) {
        this.usingNativeControls_ = bool;
        if (bool) {
          this.addClass('vjs-using-native-controls');

          /**
            * player is using the native device controls
           *
            * @event usingnativecontrols
            * @memberof Player
            * @instance
            * @private
            */
          this.trigger('usingnativecontrols');
        } else {
          this.removeClass('vjs-using-native-controls');

          /**
            * player is using the custom HTML controls
           *
            * @event usingcustomcontrols
            * @memberof Player
            * @instance
            * @private
            */
          this.trigger('usingcustomcontrols');
        }
      }
      return this;
    }
    return !!this.usingNativeControls_;
  }

  /**
   * Set or get the current MediaError
   *
   * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
   * @return {MediaError|null}     when getting
   * @return {Player}              when setting
   * @method error
   */
  error(err) {
    if (err === undefined) {
      return this.error_ || null;
    }

    // restoring to default
    if (err === null) {
      this.error_ = err;
      this.removeClass('vjs-error');
      return this;
    }

    // error instance
    if (err instanceof MediaError) {
      this.error_ = err;
    } else {
      this.error_ = new MediaError(err);
    }

    // fire an error event on the player
    this.trigger('error');

    // add the vjs-error classname to the player
    this.addClass('vjs-error');

    // log the name of the error type and any message
    // ie8 just logs "[object object]" if you just log the error object
    log.error(`(CODE:${this.error_.code} ${MediaError.errorTypes[this.error_.code]})`, this.error_.message, this.error_);

    return this;
  }

  /**
   * Returns whether or not the player is in the "ended" state.
   *
   * @return {Boolean} True if the player is in the ended state, false if not.
   * @method ended
   */
  ended() { return this.techGet('ended'); }

  /**
   * Returns whether or not the player is in the "seeking" state.
   *
   * @return {Boolean} True if the player is in the seeking state, false if not.
   * @method seeking
   */
  seeking() { return this.techGet('seeking'); }

  /**
   * Returns the TimeRanges of the media that are currently available
   * for seeking to.
   *
   * @return {TimeRanges} the seekable intervals of the media timeline
   * @method seekable
   */
  seekable() { return this.techGet('seekable'); }

  /**
   * Report user activity
   *
   * @param {Object} event Event object
   * @method reportUserActivity
   */
  reportUserActivity(event) {
    this.userActivity_ = true;
  }

  /**
   * Get/set if user is active
   *
   * @param {Boolean} bool Value when setting
   * @return {Boolean} Value if user is active user when getting
   * @method userActive
   */
  userActive(bool) {
    if (bool !== undefined) {
      bool = !!bool;
      if (bool !== this.userActive_) {
        this.userActive_ = bool;
        if (bool) {
          // If the user was inactive and is now active we want to reset the
          // inactivity timer
          this.userActivity_ = true;
          this.removeClass('vjs-user-inactive');
          this.addClass('vjs-user-active');
          this.trigger('useractive');
        } else {
          // We're switching the state to inactive manually, so erase any other
          // activity
          this.userActivity_ = false;

          // Chrome/Safari/IE have bugs where when you change the cursor it can
          // trigger a mousemove event. This causes an issue when you're hiding
          // the cursor when the user is inactive, and a mousemove signals user
          // activity. Making it impossible to go into inactive mode. Specifically
          // this happens in fullscreen when we really need to hide the cursor.
          //
          // When this gets resolved in ALL browsers it can be removed
          // https://code.google.com/p/chromium/issues/detail?id=103041
          if(this.tech) {
            this.tech.one('mousemove', function(e){
              e.stopPropagation();
              e.preventDefault();
            });
          }

          this.removeClass('vjs-user-active');
          this.addClass('vjs-user-inactive');
          this.trigger('userinactive');
        }
      }
      return this;
    }
    return this.userActive_;
  }

  /**
   * Listen for user activity based on timeout value
   *
   * @method listenForUserActivity
   */
  listenForUserActivity() {
    let mouseInProgress, lastMoveX, lastMoveY;

    let handleActivity = Fn.bind(this, this.reportUserActivity);

    let handleMouseMove = function(e) {
      // #1068 - Prevent mousemove spamming
      // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
      if(e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
        lastMoveX = e.screenX;
        lastMoveY = e.screenY;
        handleActivity();
      }
    };

    let handleMouseDown = function() {
      handleActivity();
      // For as long as the they are touching the device or have their mouse down,
      // we consider them active even if they're not moving their finger or mouse.
      // So we want to continue to update that they are active
      this.clearInterval(mouseInProgress);
      // Setting userActivity=true now and setting the interval to the same time
      // as the activityCheck interval (250) should ensure we never miss the
      // next activityCheck
      mouseInProgress = this.setInterval(handleActivity, 250);
    };

    let handleMouseUp = function(event) {
      handleActivity();
      // Stop the interval that maintains activity if the mouse/touch is down
      this.clearInterval(mouseInProgress);
    };

    // Any mouse movement will be considered user activity
    this.on('mousedown', handleMouseDown);
    this.on('mousemove', handleMouseMove);
    this.on('mouseup', handleMouseUp);

    // Listen for keyboard navigation
    // Shouldn't need to use inProgress interval because of key repeat
    this.on('keydown', handleActivity);
    this.on('keyup', handleActivity);

    // Run an interval every 250 milliseconds instead of stuffing everything into
    // the mousemove/touchmove function itself, to prevent performance degradation.
    // `this.reportUserActivity` simply sets this.userActivity_ to true, which
    // then gets picked up by this loop
    // http://ejohn.org/blog/learning-from-twitter/
    let inactivityTimeout;
    let activityCheck = this.setInterval(function() {
      // Check to see if mouse/touch activity has happened
      if (this.userActivity_) {
        // Reset the activity tracker
        this.userActivity_ = false;

        // If the user state was inactive, set the state to active
        this.userActive(true);

        // Clear any existing inactivity timeout to start the timer over
        this.clearTimeout(inactivityTimeout);

        var timeout = this.options_['inactivityTimeout'];
        if (timeout > 0) {
          // In <timeout> milliseconds, if no more activity has occurred the
          // user will be considered inactive
          inactivityTimeout = this.setTimeout(function () {
            // Protect against the case where the inactivityTimeout can trigger just
            // before the next user activity is picked up by the activityCheck loop
            // causing a flicker
            if (!this.userActivity_) {
                this.userActive(false);
            }
          }, timeout);
        }
      }
    }, 250);
  }

  /**
   * Gets or sets the current playback rate.  A playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed
   * playback, for instance.
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
   *
   * @param  {Number} rate    New playback rate to set.
   * @return {Number}         Returns the new playback rate when setting
   * @return {Number}         Returns the current playback rate when getting
   * @method playbackRate
   */
  playbackRate(rate) {
    if (rate !== undefined) {
      this.techCall('setPlaybackRate', rate);
      return this;
    }

    if (this.tech && this.tech['featuresPlaybackRate']) {
      return this.techGet('playbackRate');
    } else {
      return 1.0;
    }
  }

  /**
   * Gets or sets the audio flag
   *
   * @param  {Boolean} bool    True signals that this is an audio player.
   * @return {Boolean}         Returns true if player is audio, false if not when getting
   * @return {Player}      Returns the player if setting
   * @private
   * @method isAudio
   */
  isAudio(bool) {
    if (bool !== undefined) {
      this.isAudio_ = !!bool;
      return this;
    }

    return !!this.isAudio_;
  }

  /**
   * Returns the current state of network activity for the element, from
   * the codes in the list below.
   * - NETWORK_EMPTY (numeric value 0)
   *   The element has not yet been initialised. All attributes are in
   *   their initial states.
   * - NETWORK_IDLE (numeric value 1)
   *   The element's resource selection algorithm is active and has
   *   selected a resource, but it is not actually using the network at
   *   this time.
   * - NETWORK_LOADING (numeric value 2)
   *   The user agent is actively trying to download data.
   * - NETWORK_NO_SOURCE (numeric value 3)
   *   The element's resource selection algorithm is active, but it has
   *   not yet found a resource to use.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
   * @return {Number} the current network activity state
   * @method networkState
   */
  networkState() {
    return this.techGet('networkState');
  }

  /**
   * Returns a value that expresses the current state of the element
   * with respect to rendering the current playback position, from the
   * codes in the list below.
   * - HAVE_NOTHING (numeric value 0)
   *   No information regarding the media resource is available.
   * - HAVE_METADATA (numeric value 1)
   *   Enough of the resource has been obtained that the duration of the
   *   resource is available.
   * - HAVE_CURRENT_DATA (numeric value 2)
   *   Data for the immediate current playback position is available.
   * - HAVE_FUTURE_DATA (numeric value 3)
   *   Data for the immediate current playback position is available, as
   *   well as enough data for the user agent to advance the current
   *   playback position in the direction of playback.
   * - HAVE_ENOUGH_DATA (numeric value 4)
   *   The user agent estimates that enough data is available for
   *   playback to proceed uninterrupted.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
   * @return {Number} the current playback rendering state
   * @method readyState
   */
  readyState() {
    return this.techGet('readyState');
  }

  /*
    * Text tracks are tracks of timed text events.
    * Captions - text displayed over the video for the hearing impaired
    * Subtitles - text displayed over the video for those who don't understand language in the video
    * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
    * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
    */

  /**
   * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
   * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
   *
   * @return {Array}           Array of track objects
   * @method textTracks
   */
  textTracks() {
    // cannot use techGet directly because it checks to see whether the tech is ready.
    // Flash is unlikely to be ready in time but textTracks should still work.
    return this.tech && this.tech['textTracks']();
  }

  /**
   * Get an array of remote text tracks
   *
   * @return {Array}
   * @method remoteTextTracks
   */
  remoteTextTracks() {
    return this.tech && this.tech['remoteTextTracks']();
  }

  /**
   * Add a text track
   * In addition to the W3C settings we allow adding additional info through options.
   * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
   *
   * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
   * @param {String=} label       Optional label
   * @param {String=} language    Optional language
   * @method addTextTrack
   */
  addTextTrack(kind, label, language) {
    return this.tech && this.tech['addTextTrack'](kind, label, language);
  }

  /**
   * Add a remote text track
   *
   * @param {Object} options    Options for remote text track
   * @method addRemoteTextTrack
   */
  addRemoteTextTrack(options) {
    return this.tech && this.tech['addRemoteTextTrack'](options);
  }

  /**
   * Remove a remote text track
   *
   * @param {Object} track    Remote text track to remove
   * @method removeRemoteTextTrack
   */
  removeRemoteTextTrack(track) {
    this.tech && this.tech['removeRemoteTextTrack'](track);
  }

  /**
   * Get video width
   *
   * @return {Number} Video width
   * @method videoWidth
   */
  videoWidth() {
    return this.tech && this.tech.videoWidth && this.tech.videoWidth() || 0;
  }

  /**
   * Get video height
   *
   * @return {Number} Video height
   * @method videoHeight
   */
  videoHeight() {
    return this.tech && this.tech.videoHeight && this.tech.videoHeight() || 0;
  }

  // Methods to add support for
  // initialTime: function(){ return this.techCall('initialTime'); },
  // startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
  // played: function(){ return this.techCall('played'); },
  // seekable: function(){ return this.techCall('seekable'); },
  // videoTracks: function(){ return this.techCall('videoTracks'); },
  // audioTracks: function(){ return this.techCall('audioTracks'); },
  // defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
  // mediaGroup: function(){ return this.techCall('mediaGroup'); },
  // controller: function(){ return this.techCall('controller'); },
  // defaultMuted: function(){ return this.techCall('defaultMuted'); }

  // TODO
  // currentSrcList: the array of sources including other formats and bitrates
  // playList: array of source lists in order of playback

  /**
   * The player's language code
   * NOTE: The language should be set in the player options if you want the
   * the controls to be built with a specific language. Changing the lanugage
   * later will not update controls text.
   *
   * @param {String} code  The locale string
   * @return {String}      The locale string when getting
   * @return {Player}      self when setting
   * @method language
   */
  language(code) {
    if (code === undefined) {
      return this.language_;
    }

    this.language_ = (''+code).toLowerCase();
    return this;
  }

  /**
   * Get the player's language dictionary
   * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
   * Languages specified directly in the player options have precedence
   *
   * @return {Array} Array of languages
   * @method languages
   */
  languages() {
    return  mergeOptions(globalOptions['languages'], this.languages_);
  }

  /**
   * Converts track info to JSON
   *
   * @return {Object} JSON object of options
   * @method toJSON
   */
  toJSON() {
    let options = mergeOptions(this.options_);
    let tracks = options.tracks;

    options.tracks = [];

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      // deep merge tracks and null out player so no circular references
      track = mergeOptions(track);
      track.player = undefined;
      options.tracks[i] = track;
    }

    return options;
  }

  /**
   * Gets tag settings
   *
   * @param {Element} tag The player tag
   * @return {Array} An array of sources and track objects
   * @static
   * @method getTagSettings
   */
  static getTagSettings(tag) {
    let baseOptions = {
      'sources': [],
      'tracks': []
    };

    const tagOptions = Dom.getElAttributes(tag);
    const dataSetup = tagOptions['data-setup'];

    // Check if data-setup attr exists.
    if (dataSetup !== null){
      // Parse options JSON
      // If empty string, make it a parsable json object.
      const [err, data] = safeParseTuple(dataSetup || '{}');
      if (err) {
        log.error(err);
      }
      assign(tagOptions, data);
    }

    assign(baseOptions, tagOptions);

    // Get tag children settings
    if (tag.hasChildNodes()) {
      const children = tag.childNodes;

      for (let i=0, j=children.length; i<j; i++) {
        const child = children[i];
        // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
        const childName = child.nodeName.toLowerCase();
        if (childName === 'source') {
          baseOptions['sources'].push(Dom.getElAttributes(child));
        } else if (childName === 'track') {
          baseOptions['tracks'].push(Dom.getElAttributes(child));
        }
      }
    }

    return baseOptions;
  }

}

/*
 * Global player list
 *
 * @type {Object}
 */
Player.players = {};

/*
 * Player instance options, surfaced using options
 * options = Player.prototype.options_
 * Make changes in options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 *
 * @type {Object}
 * @private
 */
Player.prototype.options_ = globalOptions;

/**
 * Fired when the player has initial duration and dimension information
 *
 * @event loadedmetadata
 */
Player.prototype.handleLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 *
 * @event loadeddata
 */
Player.prototype.handleLoadedData;

/**
 * Fired when the player has finished downloading the source data
 *
 * @event loadedalldata
 */
Player.prototype.handleLoadedAllData;

/**
 * Fired when the user is active, e.g. moves the mouse over the player
 *
 * @event useractive
 */
Player.prototype.handleUserActive;

/**
 * Fired when the user is inactive, e.g. a short delay after the last mouse move or control interaction
 *
 * @event userinactive
 */
Player.prototype.handleUserInactive;

/**
 * Fired when the current playback position has changed *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 *
 * @event timeupdate
 */
Player.prototype.handleTimeUpdate;

/**
 * Fired when the volume changes
 *
 * @event volumechange
 */
Player.prototype.handleVolumeChange;

/**
 * Fired when an error occurs
 *
 * @event error
 */
Player.prototype.handleError;

Player.prototype.flexNotSupported_ = function() {
  var elem = document.createElement('i');

  // Note: We don't actually use flexBasis (or flexOrder), but it's one of the more
  // common flex features that we can rely on when checking for flex support.
  return !('flexBasis' in elem.style ||
          'webkitFlexBasis' in elem.style ||
          'mozFlexBasis' in elem.style ||
          'msFlexBasis' in elem.style ||
          'msFlexOrder' in elem.style /* IE10-specific (2012 flex spec)  */);
};

Component.registerComponent('Player', Player);
export default Player;
