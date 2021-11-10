/**
 * @file player.js
 */
// Subclasses Component
import Component from './component.js';

import {version} from '../../package.json';
import document from 'global/document';
import window from 'global/window';
import evented from './mixins/evented';
import {isEvented, addEventedCallback} from './mixins/evented';
import * as Events from './utils/events.js';
import * as Dom from './utils/dom.js';
import * as Fn from './utils/fn.js';
import * as Guid from './utils/guid.js';
import * as browser from './utils/browser.js';
import {IE_VERSION, IS_CHROME, IS_WINDOWS} from './utils/browser.js';
import log, { createLogger } from './utils/log.js';
import {toTitleCase, titleCaseEquals} from './utils/string-cases.js';
import { createTimeRange } from './utils/time-ranges.js';
import { bufferedPercent } from './utils/buffer.js';
import * as stylesheet from './utils/stylesheet.js';
import FullscreenApi from './fullscreen-api.js';
import MediaError from './media-error.js';
import safeParseTuple from 'safe-json-parse/tuple';
import {assign} from './utils/obj';
import mergeOptions from './utils/merge-options.js';
import {silencePromise, isPromise} from './utils/promise';
import textTrackConverter from './tracks/text-track-list-converter.js';
import ModalDialog from './modal-dialog';
import Tech from './tech/tech.js';
import * as middleware from './tech/middleware.js';
import {ALL as TRACK_TYPES} from './tracks/track-types';
import filterSource from './utils/filter-source';
import {getMimetype, findMimetype} from './utils/mimetypes';
import {hooks} from './utils/hooks';
import {isObject} from './utils/obj';
import keycode from 'keycode';

// The following imports are used only to ensure that the corresponding modules
// are always included in the video.js package. Importing the modules will
// execute them and they will register themselves with video.js.
import './tech/loader.js';
import './poster-image.js';
import './tracks/text-track-display.js';
import './loading-spinner.js';
import './big-play-button.js';
import './close-button.js';
import './control-bar/control-bar.js';
import './error-display.js';
import './tracks/text-track-settings.js';
import './resize-manager.js';
import './live-tracker.js';

// Import Html5 tech, at least for disposing the original video tag.
import './tech/html5.js';

// The following tech events are simply re-triggered
// on the player when they happen
const TECH_EVENTS_RETRIGGER = [
  /**
   * Fired while the user agent is downloading media data.
   *
   * @event Player#progress
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `progress` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechProgress_
   * @fires Player#progress
   * @listens Tech#progress
   */
  'progress',

  /**
   * Fires when the loading of an audio/video is aborted.
   *
   * @event Player#abort
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `abort` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechAbort_
   * @fires Player#abort
   * @listens Tech#abort
   */
  'abort',

  /**
   * Fires when the browser is intentionally not getting media data.
   *
   * @event Player#suspend
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `suspend` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechSuspend_
   * @fires Player#suspend
   * @listens Tech#suspend
   */
  'suspend',

  /**
   * Fires when the current playlist is empty.
   *
   * @event Player#emptied
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `emptied` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechEmptied_
   * @fires Player#emptied
   * @listens Tech#emptied
   */
  'emptied',
  /**
   * Fires when the browser is trying to get media data, but data is not available.
   *
   * @event Player#stalled
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `stalled` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechStalled_
   * @fires Player#stalled
   * @listens Tech#stalled
   */
  'stalled',

  /**
   * Fires when the browser has loaded meta data for the audio/video.
   *
   * @event Player#loadedmetadata
   * @type {EventTarget~Event}
   */
  /**
   * Retrigger the `loadedmetadata` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechLoadedmetadata_
   * @fires Player#loadedmetadata
   * @listens Tech#loadedmetadata
   */
  'loadedmetadata',

  /**
   * Fires when the browser has loaded the current frame of the audio/video.
   *
   * @event Player#loadeddata
   * @type {event}
   */
  /**
   * Retrigger the `loadeddata` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechLoaddeddata_
   * @fires Player#loadeddata
   * @listens Tech#loadeddata
   */
  'loadeddata',

  /**
   * Fires when the current playback position has changed.
   *
   * @event Player#timeupdate
   * @type {event}
   */
  /**
   * Retrigger the `timeupdate` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechTimeUpdate_
   * @fires Player#timeupdate
   * @listens Tech#timeupdate
   */
  'timeupdate',

  /**
   * Fires when the video's intrinsic dimensions change
   *
   * @event Player#resize
   * @type {event}
   */
  /**
   * Retrigger the `resize` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechResize_
   * @fires Player#resize
   * @listens Tech#resize
   */
  'resize',

  /**
   * Fires when the volume has been changed
   *
   * @event Player#volumechange
   * @type {event}
   */
  /**
   * Retrigger the `volumechange` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechVolumechange_
   * @fires Player#volumechange
   * @listens Tech#volumechange
   */
  'volumechange',

  /**
   * Fires when the text track has been changed
   *
   * @event Player#texttrackchange
   * @type {event}
   */
  /**
   * Retrigger the `texttrackchange` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechTexttrackchange_
   * @fires Player#texttrackchange
   * @listens Tech#texttrackchange
   */
  'texttrackchange'
];

// events to queue when playback rate is zero
// this is a hash for the sole purpose of mapping non-camel-cased event names
// to camel-cased function names
const TECH_EVENTS_QUEUE = {
  canplay: 'CanPlay',
  canplaythrough: 'CanPlayThrough',
  playing: 'Playing',
  seeked: 'Seeked'
};

const BREAKPOINT_ORDER = [
  'tiny',
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
  'huge'
];

const BREAKPOINT_CLASSES = {};

// grep: vjs-layout-tiny
// grep: vjs-layout-x-small
// grep: vjs-layout-small
// grep: vjs-layout-medium
// grep: vjs-layout-large
// grep: vjs-layout-x-large
// grep: vjs-layout-huge
BREAKPOINT_ORDER.forEach(k => {
  const v = k.charAt(0) === 'x' ? `x-${k.substring(1)}` : k;

  BREAKPOINT_CLASSES[k] = `vjs-layout-${v}`;
});

const DEFAULT_BREAKPOINTS = {
  tiny: 210,
  xsmall: 320,
  small: 425,
  medium: 768,
  large: 1440,
  xlarge: 2560,
  huge: Infinity
};

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods
 * are used to initialize a video.
 *
 * After an instance has been created it can be accessed globally in two ways:
 * 1. By calling `videojs('example_video_1');`
 * 2. By using it directly via  `videojs.players.example_video_1;`
 *
 * @extends Component
 */
class Player extends Component {

  /**
   * Create an instance of this class.
   *
   * @param {Element} tag
   *        The original video DOM element used for configuring options.
   *
   * @param {Object} [options]
   *        Object of option names and values.
   *
   * @param {Component~ReadyCallback} [ready]
   *        Ready callback function.
   */
  constructor(tag, options, ready) {
    // Make sure tag ID exists
    tag.id = tag.id || options.id || `vjs_video_${Guid.newGUID()}`;

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

    // don't auto mixin the evented mixin
    options.evented = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // If language is not set, get the closest lang attribute
    if (!options.language) {
      if (typeof tag.closest === 'function') {
        const closest = tag.closest('[lang]');

        if (closest && closest.getAttribute) {
          options.language = closest.getAttribute('lang');
        }
      } else {
        let element = tag;

        while (element && element.nodeType === 1) {
          if (Dom.getAttributes(element).hasOwnProperty('lang')) {
            options.language = element.getAttribute('lang');
            break;
          }
          element = element.parentNode;
        }
      }
    }

    // Run base component initializing with new options
    super(null, options, ready);

    // Create bound methods for document listeners.
    this.boundDocumentFullscreenChange_ = (e) => this.documentFullscreenChange_(e);
    this.boundFullWindowOnEscKey_ = (e) => this.fullWindowOnEscKey(e);

    this.boundUpdateStyleEl_ = (e) => this.updateStyleEl_(e);
    this.boundApplyInitTime_ = (e) => this.applyInitTime_(e);
    this.boundUpdateCurrentBreakpoint_ = (e) => this.updateCurrentBreakpoint_(e);

    this.boundHandleTechClick_ = (e) => this.handleTechClick_(e);
    this.boundHandleTechDoubleClick_ = (e) => this.handleTechDoubleClick_(e);
    this.boundHandleTechTouchStart_ = (e) => this.handleTechTouchStart_(e);
    this.boundHandleTechTouchMove_ = (e) => this.handleTechTouchMove_(e);
    this.boundHandleTechTouchEnd_ = (e) => this.handleTechTouchEnd_(e);
    this.boundHandleTechTap_ = (e) => this.handleTechTap_(e);

    // default isFullscreen_ to false
    this.isFullscreen_ = false;

    // create logger
    this.log = createLogger(this.id_);

    // Hold our own reference to fullscreen api so it can be mocked in tests
    this.fsApi_ = FullscreenApi;

    // Tracks when a tech changes the poster
    this.isPosterFromTech_ = false;

    // Holds callback info that gets queued when playback rate is zero
    // and a seek is happening
    this.queuedCallbacks_ = [];

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady_ = false;

    // Init state hasStarted_
    this.hasStarted_ = false;

    // Init state userActive_
    this.userActive_ = false;

    // Init debugEnabled_
    this.debugEnabled_ = false;

    // if the global option object was accidentally blown away by
    // someone, bail early with an informative error
    if (!this.options_ ||
        !this.options_.techOrder ||
        !this.options_.techOrder.length) {
      throw new Error('No techOrder specified. Did you overwrite ' +
                      'videojs.options instead of just changing the ' +
                      'properties you want to override?');
    }

    // Store the original tag used to set options
    this.tag = tag;

    // Store the tag attributes used to restore html5 element
    this.tagAttributes = tag && Dom.getAttributes(tag);

    // Update current language
    this.language(this.options_.language);

    // Update Supported Languages
    if (options.languages) {
      // Normalise player option languages to lowercase
      const languagesToLower = {};

      Object.getOwnPropertyNames(options.languages).forEach(function(name) {
        languagesToLower[name.toLowerCase()] = options.languages[name];
      });
      this.languages_ = languagesToLower;
    } else {
      this.languages_ = Player.prototype.options_.languages;
    }

    this.resetCache_();

    // Set poster
    this.poster_ = options.poster || '';

    // Set controls
    this.controls_ = !!options.controls;

    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;
    tag.removeAttribute('controls');

    this.changingSrc_ = false;
    this.playCallbacks_ = [];
    this.playTerminatedQueue_ = [];

    // the attribute overrides the option
    if (tag.hasAttribute('autoplay')) {
      this.autoplay(true);
    } else {
      // otherwise use the setter to validate and
      // set the correct value.
      this.autoplay(this.options_.autoplay);
    }

    // check plugins
    if (options.plugins) {
      Object.keys(options.plugins).forEach((name) => {
        if (typeof this[name] !== 'function') {
          throw new Error(`plugin "${name}" does not exist`);
        }
      });
    }

    /*
     * Store the internal state of scrubbing
     *
     * @private
     * @return {Boolean} True if the user is scrubbing
     */
    this.scrubbing_ = false;

    this.el_ = this.createEl();

    // Make this an evented object and use `el_` as its event bus.
    evented(this, {eventBusKey: 'el_'});

    // listen to document and player fullscreenchange handlers so we receive those events
    // before a user can receive them so we can update isFullscreen appropriately.
    // make sure that we listen to fullscreenchange events before everything else to make sure that
    // our isFullscreen method is updated properly for internal components as well as external.
    if (this.fsApi_.requestFullscreen) {
      Events.on(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
      this.on(this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
    }

    if (this.fluid_) {
      this.on(['playerreset', 'resize'], this.boundUpdateStyleEl_);
    }
    // We also want to pass the original player options to each component and plugin
    // as well so they don't need to reach back into the player for options later.
    // We also need to do another copy of this.options_ so we don't end up with
    // an infinite loop.
    const playerOptionsCopy = mergeOptions(this.options_);

    // Load plugins
    if (options.plugins) {
      Object.keys(options.plugins).forEach((name) => {
        this[name](options.plugins[name]);
      });
    }

    // Enable debug mode to fire debugon event for all plugins.
    if (options.debug) {
      this.debug(true);
    }

    this.options_.playerOptions = playerOptionsCopy;

    this.middleware_ = [];

    this.playbackRates(options.playbackRates);

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

    // Set ARIA label and region role depending on player type
    this.el_.setAttribute('role', 'region');
    if (this.isAudio()) {
      this.el_.setAttribute('aria-label', this.localize('Audio Player'));
    } else {
      this.el_.setAttribute('aria-label', this.localize('Video Player'));
    }

    if (this.isAudio()) {
      this.addClass('vjs-audio');
    }

    if (this.flexNotSupported_()) {
      this.addClass('vjs-no-flex');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // TODO: Make this check be performed again when the window switches between monitors
    // (See https://github.com/videojs/video.js/issues/5683)
    if (browser.TOUCH_ENABLED) {
      this.addClass('vjs-touch-enabled');
    }

    // iOS Safari has broken hover handling
    if (!browser.IS_IOS) {
      this.addClass('vjs-workinghover');
    }

    // Make player easily findable by ID
    Player.players[this.id_] = this;

    // Add a major version class to aid css in plugins
    const majorVersion = version.split('.')[0];

    this.addClass(`vjs-v${majorVersion}`);

    // When the player is first initialized, trigger activity so components
    // like the control bar show themselves if needed
    this.userActive(true);
    this.reportUserActivity();

    this.one('play', (e) => this.listenForUserActivity_(e));
    this.on('stageclick', (e) => this.handleStageClick_(e));
    this.on('keydown', (e) => this.handleKeyDown(e));
    this.on('languagechange', (e) => this.handleLanguagechange(e));

    this.breakpoints(this.options_.breakpoints);
    this.responsive(this.options_.responsive);
  }

  /**
   * Destroys the video player and does any necessary cleanup.
   *
   * This is especially helpful if you are dynamically adding and removing videos
   * to/from the DOM.
   *
   * @fires Player#dispose
   */
  dispose() {
    /**
     * Called when the player is being disposed of.
     *
     * @event Player#dispose
     * @type {EventTarget~Event}
     */
    this.trigger('dispose');
    // prevent dispose from being called twice
    this.off('dispose');

    // Make sure all player-specific document listeners are unbound. This is
    Events.off(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
    Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);

    if (this.styleEl_ && this.styleEl_.parentNode) {
      this.styleEl_.parentNode.removeChild(this.styleEl_);
      this.styleEl_ = null;
    }

    // Kill reference to this player
    Player.players[this.id_] = null;

    if (this.tag && this.tag.player) {
      this.tag.player = null;
    }

    if (this.el_ && this.el_.player) {
      this.el_.player = null;
    }

    if (this.tech_) {
      this.tech_.dispose();
      this.isPosterFromTech_ = false;
      this.poster_ = '';
    }

    if (this.playerElIngest_) {
      this.playerElIngest_ = null;
    }

    if (this.tag) {
      this.tag = null;
    }

    middleware.clearCacheForPlayer(this);

    // remove all event handlers for track lists
    // all tracks and track listeners are removed on
    // tech dispose
    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];
      const list = this[props.getterName]();

      // if it is not a native list
      // we have to manually remove event listeners
      if (list && list.off) {
        list.off();
      }
    });

    // the actual .el_ is removed here
    super.dispose();
  }

  /**
   * Create the `Player`'s DOM element.
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    let tag = this.tag;
    let el;
    let playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');
    const divEmbed = this.tag.tagName.toLowerCase() === 'video-js';

    if (playerElIngest) {
      el = this.el_ = tag.parentNode;
    } else if (!divEmbed) {
      el = this.el_ = super.createEl('div');
    }

    // Copy over all the attributes from the tag, including ID and class
    // ID will now reference player box, not the video tag
    const attrs = Dom.getAttributes(tag);

    if (divEmbed) {
      el = this.el_ = tag;
      tag = this.tag = document.createElement('video');
      while (el.children.length) {
        tag.appendChild(el.firstChild);
      }

      if (!Dom.hasClass(el, 'video-js')) {
        Dom.addClass(el, 'video-js');
      }

      el.appendChild(tag);

      playerElIngest = this.playerElIngest_ = el;
      // move properties over from our custom `video-js` element
      // to our new `video` element. This will move things like
      // `src` or `controls` that were set via js before the player
      // was initialized.
      Object.keys(el).forEach((k) => {
        try {
          tag[k] = el[k];
        } catch (e) {
          // we got a a property like outerHTML which we can't actually copy, ignore it
        }
      });
    }

    // set tabindex to -1 to remove the video element from the focus order
    tag.setAttribute('tabindex', '-1');
    attrs.tabindex = '-1';

    // Workaround for #4583 (JAWS+IE doesn't announce BPB or play button), and
    // for the same issue with Chrome (on Windows) with JAWS.
    // See https://github.com/FreedomScientific/VFO-standards-support/issues/78
    // Note that we can't detect if JAWS is being used, but this ARIA attribute
    //  doesn't change behavior of IE11 or Chrome if JAWS is not being used
    if (IE_VERSION || (IS_CHROME && IS_WINDOWS)) {
      tag.setAttribute('role', 'application');
      attrs.role = 'application';
    }

    // Remove width/height attrs from tag so CSS can make it 100% width/height
    tag.removeAttribute('width');
    tag.removeAttribute('height');

    if ('width' in attrs) {
      delete attrs.width;
    }
    if ('height' in attrs) {
      delete attrs.height;
    }

    Object.getOwnPropertyNames(attrs).forEach(function(attr) {
      // don't copy over the class attribute to the player element when we're in a div embed
      // the class is already set up properly in the divEmbed case
      // and we want to make sure that the `video-js` class doesn't get lost
      if (!(divEmbed && attr === 'class')) {
        el.setAttribute(attr, attrs[attr]);
      }

      if (divEmbed) {
        tag.setAttribute(attr, attrs[attr]);
      }
    });

    // Update tag id/class for use as HTML5 playback tech
    // Might think we should do this after embedding in container so .vjs-tech class
    // doesn't flash 100% width/height, but class only applies with .video-js parent
    tag.playerId = tag.id;
    tag.id += '_html5_api';
    tag.className = 'vjs-tech';

    // Make player findable on elements
    tag.player = el.player = this;
    // Default state of video is paused
    this.addClass('vjs-paused');

    // Add a style element in the player that we'll use to set the width/height
    // of the player in a way that's still overrideable by CSS, just like the
    // video element
    if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true) {
      this.styleEl_ = stylesheet.createStyleElement('vjs-styles-dimensions');
      const defaultsStyleEl = Dom.$('.vjs-styles-defaults');
      const head = Dom.$('head');

      head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
    }

    this.fill_ = false;
    this.fluid_ = false;

    // Pass in the width/height/aspectRatio options which will update the style el
    this.width(this.options_.width);
    this.height(this.options_.height);
    this.fill(this.options_.fill);
    this.fluid(this.options_.fluid);
    this.aspectRatio(this.options_.aspectRatio);
    // support both crossOrigin and crossorigin to reduce confusion and issues around the name
    this.crossOrigin(this.options_.crossOrigin || this.options_.crossorigin);

    // Hide any links within the video/audio tag,
    // because IE doesn't hide them completely from screen readers.
    const links = tag.getElementsByTagName('a');

    for (let i = 0; i < links.length; i++) {
      const linkEl = links.item(i);

      Dom.addClass(linkEl, 'vjs-hidden');
      linkEl.setAttribute('hidden', 'hidden');
    }

    // insertElFirst seems to cause the networkState to flicker from 3 to 2, so
    // keep track of the original for later so we can know if the source originally failed
    tag.initNetworkState_ = tag.networkState;

    // Wrap video tag in div (el/box) container
    if (tag.parentNode && !playerElIngest) {
      tag.parentNode.insertBefore(el, tag);
    }

    // insert the tag as the first child of the player element
    // then manually add it to the children array so that this.addChild
    // will work properly for other components
    //
    // Breaks iPhone, fixed in HTML5 setup.
    Dom.prependTo(tag, el);
    this.children_.unshift(tag);

    // Set lang attr on player to ensure CSS :lang() in consistent with player
    // if it's been set to something different to the doc
    this.el_.setAttribute('lang', this.language_);

    this.el_.setAttribute('translate', 'no');

    this.el_ = el;

    return el;
  }

  /**
   * Get or set the `Player`'s crossOrigin option. For the HTML5 player, this
   * sets the `crossOrigin` property on the `<video>` tag to control the CORS
   * behavior.
   *
   * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
   *
   * @param {string} [value]
   *        The value to set the `Player`'s crossOrigin to. If an argument is
   *        given, must be one of `anonymous` or `use-credentials`.
   *
   * @return {string|undefined}
   *         - The current crossOrigin value of the `Player` when getting.
   *         - undefined when setting
   */
  crossOrigin(value) {
    if (!value) {
      return this.techGet_('crossOrigin');
    }

    if (value !== 'anonymous' && value !== 'use-credentials') {
      log.warn(`crossOrigin must be "anonymous" or "use-credentials", given "${value}"`);
      return;
    }

    this.techCall_('setCrossOrigin', value);

    return;
  }

  /**
   * A getter/setter for the `Player`'s width. Returns the player's configured value.
   * To get the current width use `currentWidth()`.
   *
   * @param {number} [value]
   *        The value to set the `Player`'s width to.
   *
   * @return {number}
   *         The current width of the `Player` when getting.
   */
  width(value) {
    return this.dimension('width', value);
  }

  /**
   * A getter/setter for the `Player`'s height. Returns the player's configured value.
   * To get the current height use `currentheight()`.
   *
   * @param {number} [value]
   *        The value to set the `Player`'s heigth to.
   *
   * @return {number}
   *         The current height of the `Player` when getting.
   */
  height(value) {
    return this.dimension('height', value);
  }

  /**
   * A getter/setter for the `Player`'s width & height.
   *
   * @param {string} dimension
   *        This string can be:
   *        - 'width'
   *        - 'height'
   *
   * @param {number} [value]
   *        Value for dimension specified in the first argument.
   *
   * @return {number}
   *         The dimension arguments value when getting (width/height).
   */
  dimension(dimension, value) {
    const privDimension = dimension + '_';

    if (value === undefined) {
      return this[privDimension] || 0;
    }

    if (value === '' || value === 'auto') {
      // If an empty string is given, reset the dimension to be automatic
      this[privDimension] = undefined;
      this.updateStyleEl_();
      return;
    }

    const parsedVal = parseFloat(value);

    if (isNaN(parsedVal)) {
      log.error(`Improper value "${value}" supplied for for ${dimension}`);
      return;
    }

    this[privDimension] = parsedVal;
    this.updateStyleEl_();
  }

  /**
   * A getter/setter/toggler for the vjs-fluid `className` on the `Player`.
   *
   * Turning this on will turn off fill mode.
   *
   * @param {boolean} [bool]
   *        - A value of true adds the class.
   *        - A value of false removes the class.
   *        - No value will be a getter.
   *
   * @return {boolean|undefined}
   *         - The value of fluid when getting.
   *         - `undefined` when setting.
   */
  fluid(bool) {
    if (bool === undefined) {
      return !!this.fluid_;
    }

    this.fluid_ = !!bool;

    if (isEvented(this)) {
      this.off(['playerreset', 'resize'], this.boundUpdateStyleEl_);
    }
    if (bool) {
      this.addClass('vjs-fluid');
      this.fill(false);
      addEventedCallback(this, () => {
        this.on(['playerreset', 'resize'], this.boundUpdateStyleEl_);
      });
    } else {
      this.removeClass('vjs-fluid');
    }

    this.updateStyleEl_();
  }

  /**
   * A getter/setter/toggler for the vjs-fill `className` on the `Player`.
   *
   * Turning this on will turn off fluid mode.
   *
   * @param {boolean} [bool]
   *        - A value of true adds the class.
   *        - A value of false removes the class.
   *        - No value will be a getter.
   *
   * @return {boolean|undefined}
   *         - The value of fluid when getting.
   *         - `undefined` when setting.
   */
  fill(bool) {
    if (bool === undefined) {
      return !!this.fill_;
    }

    this.fill_ = !!bool;

    if (bool) {
      this.addClass('vjs-fill');
      this.fluid(false);
    } else {
      this.removeClass('vjs-fill');
    }
  }

  /**
   * Get/Set the aspect ratio
   *
   * @param {string} [ratio]
   *        Aspect ratio for player
   *
   * @return {string|undefined}
   *         returns the current aspect ratio when getting
   */

  /**
   * A getter/setter for the `Player`'s aspect ratio.
   *
   * @param {string} [ratio]
   *        The value to set the `Player`'s aspect ratio to.
   *
   * @return {string|undefined}
   *         - The current aspect ratio of the `Player` when getting.
   *         - undefined when setting
   */
  aspectRatio(ratio) {
    if (ratio === undefined) {
      return this.aspectRatio_;
    }

    // Check for width:height format
    if (!(/^\d+\:\d+$/).test(ratio)) {
      throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
    }
    this.aspectRatio_ = ratio;

    // We're assuming if you set an aspect ratio you want fluid mode,
    // because in fixed mode you could calculate width and height yourself.
    this.fluid(true);

    this.updateStyleEl_();
  }

  /**
   * Update styles of the `Player` element (height, width and aspect ratio).
   *
   * @private
   * @listens Tech#loadedmetadata
   */
  updateStyleEl_() {
    if (window.VIDEOJS_NO_DYNAMIC_STYLE === true) {
      const width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
      const height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
      const techEl = this.tech_ && this.tech_.el();

      if (techEl) {
        if (width >= 0) {
          techEl.width = width;
        }
        if (height >= 0) {
          techEl.height = height;
        }
      }

      return;
    }

    let width;
    let height;
    let aspectRatio;
    let idClass;

    // The aspect ratio is either used directly or to calculate width and height.
    if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
      // Use any aspectRatio that's been specifically set
      aspectRatio = this.aspectRatio_;
    } else if (this.videoWidth() > 0) {
      // Otherwise try to get the aspect ratio from the video metadata
      aspectRatio = this.videoWidth() + ':' + this.videoHeight();
    } else {
      // Or use a default. The video element's is 2:1, but 16:9 is more common.
      aspectRatio = '16:9';
    }

    // Get the ratio as a decimal we can use to calculate dimensions
    const ratioParts = aspectRatio.split(':');
    const ratioMultiplier = ratioParts[1] / ratioParts[0];

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
      height = width * ratioMultiplier;
    }

    // Ensure the CSS class is valid by starting with an alpha character
    if ((/^[^a-zA-Z]/).test(this.id())) {
      idClass = 'dimensions-' + this.id();
    } else {
      idClass = this.id() + '-dimensions';
    }

    // Ensure the right class is still on the player for the style element
    this.addClass(idClass);

    stylesheet.setTextContent(this.styleEl_, `
      .${idClass} {
        width: ${width}px;
        height: ${height}px;
      }

      .${idClass}.vjs-fluid {
        padding-top: ${ratioMultiplier * 100}%;
      }
    `);
  }

  /**
   * Load/Create an instance of playback {@link Tech} including element
   * and API methods. Then append the `Tech` element in `Player` as a child.
   *
   * @param {string} techName
   *        name of the playback technology
   *
   * @param {string} source
   *        video source
   *
   * @private
   */
  loadTech_(techName, source) {

    // Pause and remove current playback technology
    if (this.tech_) {
      this.unloadTech_();
    }

    const titleTechName = toTitleCase(techName);
    const camelTechName = techName.charAt(0).toLowerCase() + techName.slice(1);

    // get rid of the HTML5 video tag as soon as we are using another tech
    if (titleTechName !== 'Html5' && this.tag) {
      Tech.getTech('Html5').disposeMediaElement(this.tag);
      this.tag.player = null;
      this.tag = null;
    }

    this.techName_ = titleTechName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady_ = false;

    let autoplay = this.autoplay();

    // if autoplay is a string (or `true` with normalizeAutoplay: true) we pass false to the tech
    // because the player is going to handle autoplay on `loadstart`
    if (typeof this.autoplay() === 'string' || this.autoplay() === true && this.options_.normalizeAutoplay) {
      autoplay = false;
    }

    // Grab tech-specific options from player options and add source and parent element to use.
    const techOptions = {
      source,
      autoplay,
      'nativeControlsForTouch': this.options_.nativeControlsForTouch,
      'playerId': this.id(),
      'techId': `${this.id()}_${camelTechName}_api`,
      'playsinline': this.options_.playsinline,
      'preload': this.options_.preload,
      'loop': this.options_.loop,
      'disablePictureInPicture': this.options_.disablePictureInPicture,
      'muted': this.options_.muted,
      'poster': this.poster(),
      'language': this.language(),
      'playerElIngest': this.playerElIngest_ || false,
      'vtt.js': this.options_['vtt.js'],
      'canOverridePoster': !!this.options_.techCanOverridePoster,
      'enableSourceset': this.options_.enableSourceset,
      'Promise': this.options_.Promise
    };

    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];

      techOptions[props.getterName] = this[props.privateName];
    });

    assign(techOptions, this.options_[titleTechName]);
    assign(techOptions, this.options_[camelTechName]);
    assign(techOptions, this.options_[techName.toLowerCase()]);

    if (this.tag) {
      techOptions.tag = this.tag;
    }

    if (source && source.src === this.cache_.src && this.cache_.currentTime > 0) {
      techOptions.startTime = this.cache_.currentTime;
    }

    // Initialize tech instance
    const TechClass = Tech.getTech(techName);

    if (!TechClass) {
      throw new Error(`No Tech named '${titleTechName}' exists! '${titleTechName}' should be registered using videojs.registerTech()'`);
    }

    this.tech_ = new TechClass(techOptions);

    // player.triggerReady is always async, so don't need this to be async
    this.tech_.ready(Fn.bind(this, this.handleTechReady_), true);

    textTrackConverter.jsonToTextTracks(this.textTracksJson_ || [], this.tech_);

    // Listen to all HTML5-defined events and trigger them on the player
    TECH_EVENTS_RETRIGGER.forEach((event) => {
      this.on(this.tech_, event, (e) => this[`handleTech${toTitleCase(event)}_`](e));
    });

    Object.keys(TECH_EVENTS_QUEUE).forEach((event) => {
      this.on(this.tech_, event, (eventObj) => {
        if (this.tech_.playbackRate() === 0 && this.tech_.seeking()) {
          this.queuedCallbacks_.push({
            callback: this[`handleTech${TECH_EVENTS_QUEUE[event]}_`].bind(this),
            event: eventObj
          });
          return;
        }
        this[`handleTech${TECH_EVENTS_QUEUE[event]}_`](eventObj);
      });
    });

    this.on(this.tech_, 'loadstart', (e) => this.handleTechLoadStart_(e));
    this.on(this.tech_, 'sourceset', (e) => this.handleTechSourceset_(e));
    this.on(this.tech_, 'waiting', (e) => this.handleTechWaiting_(e));
    this.on(this.tech_, 'ended', (e) => this.handleTechEnded_(e));
    this.on(this.tech_, 'seeking', (e) => this.handleTechSeeking_(e));
    this.on(this.tech_, 'play', (e) => this.handleTechPlay_(e));
    this.on(this.tech_, 'firstplay', (e) => this.handleTechFirstPlay_(e));
    this.on(this.tech_, 'pause', (e) => this.handleTechPause_(e));
    this.on(this.tech_, 'durationchange', (e) => this.handleTechDurationChange_(e));
    this.on(this.tech_, 'fullscreenchange', (e, data) => this.handleTechFullscreenChange_(e, data));
    this.on(this.tech_, 'fullscreenerror', (e, err) => this.handleTechFullscreenError_(e, err));
    this.on(this.tech_, 'enterpictureinpicture', (e) => this.handleTechEnterPictureInPicture_(e));
    this.on(this.tech_, 'leavepictureinpicture', (e) => this.handleTechLeavePictureInPicture_(e));
    this.on(this.tech_, 'error', (e) => this.handleTechError_(e));
    this.on(this.tech_, 'posterchange', (e) => this.handleTechPosterChange_(e));
    this.on(this.tech_, 'textdata', (e) => this.handleTechTextData_(e));
    this.on(this.tech_, 'ratechange', (e) => this.handleTechRateChange_(e));
    this.on(this.tech_, 'loadedmetadata', this.boundUpdateStyleEl_);

    this.usingNativeControls(this.techGet_('controls'));

    if (this.controls() && !this.usingNativeControls()) {
      this.addTechControlsListeners_();
    }

    // Add the tech element in the DOM if it was not already there
    // Make sure to not insert the original video element if using Html5
    if (this.tech_.el().parentNode !== this.el() && (titleTechName !== 'Html5' || !this.tag)) {
      Dom.prependTo(this.tech_.el(), this.el());
    }

    // Get rid of the original video tag reference after the first tech is loaded
    if (this.tag) {
      this.tag.player = null;
      this.tag = null;
    }
  }

  /**
   * Unload and dispose of the current playback {@link Tech}.
   *
   * @private
   */
  unloadTech_() {
    // Save the current text tracks so that we can reuse the same text tracks with the next tech
    TRACK_TYPES.names.forEach((name) => {
      const props = TRACK_TYPES[name];

      this[props.privateName] = this[props.getterName]();
    });
    this.textTracksJson_ = textTrackConverter.textTracksToJson(this.tech_);

    this.isReady_ = false;

    this.tech_.dispose();

    this.tech_ = false;

    if (this.isPosterFromTech_) {
      this.poster_ = '';
      this.trigger('posterchange');
    }

    this.isPosterFromTech_ = false;
  }

  /**
   * Return a reference to the current {@link Tech}.
   * It will print a warning by default about the danger of using the tech directly
   * but any argument that is passed in will silence the warning.
   *
   * @param {*} [safety]
   *        Anything passed in to silence the warning
   *
   * @return {Tech}
   *         The Tech
   */
  tech(safety) {
    if (safety === undefined) {
      log.warn('Using the tech directly can be dangerous. I hope you know what you\'re doing.\n' +
        'See https://github.com/videojs/video.js/issues/2617 for more info.\n');
    }

    return this.tech_;
  }

  /**
   * Set up click and touch listeners for the playback element
   *
   * - On desktops: a click on the video itself will toggle playback
   * - On mobile devices: a click on the video toggles controls
   *   which is done by toggling the user state between active and
   *   inactive
   * - A tap can signal that a user has become active or has become inactive
   *   e.g. a quick tap on an iPhone movie should reveal the controls. Another
   *   quick tap should hide them again (signaling the user is in an inactive
   *   viewing state)
   * - In addition to this, we still want the user to be considered inactive after
   *   a few seconds of inactivity.
   *
   * > Note: the only part of iOS interaction we can't mimic with this setup
   * is a touch and hold on the video element counting as activity in order to
   * keep the controls showing, but that shouldn't be an issue. A touch and hold
   * on any controls will still keep the user active
   *
   * @private
   */
  addTechControlsListeners_() {
    // Make sure to remove all the previous listeners in case we are called multiple times.
    this.removeTechControlsListeners_();

    this.on(this.tech_, 'click', this.boundHandleTechClick_);
    this.on(this.tech_, 'dblclick', this.boundHandleTechDoubleClick_);

    // If the controls were hidden we don't want that to change without a tap event
    // so we'll check if the controls were already showing before reporting user
    // activity
    this.on(this.tech_, 'touchstart', this.boundHandleTechTouchStart_);
    this.on(this.tech_, 'touchmove', this.boundHandleTechTouchMove_);
    this.on(this.tech_, 'touchend', this.boundHandleTechTouchEnd_);

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    this.on(this.tech_, 'tap', this.boundHandleTechTap_);
  }

  /**
   * Remove the listeners used for click and tap controls. This is needed for
   * toggling to controls disabled, where a tap/touch should do nothing.
   *
   * @private
   */
  removeTechControlsListeners_() {
    // We don't want to just use `this.off()` because there might be other needed
    // listeners added by techs that extend this.
    this.off(this.tech_, 'tap', this.boundHandleTechTap_);
    this.off(this.tech_, 'touchstart', this.boundHandleTechTouchStart_);
    this.off(this.tech_, 'touchmove', this.boundHandleTechTouchMove_);
    this.off(this.tech_, 'touchend', this.boundHandleTechTouchEnd_);
    this.off(this.tech_, 'click', this.boundHandleTechClick_);
    this.off(this.tech_, 'dblclick', this.boundHandleTechDoubleClick_);
  }

  /**
   * Player waits for the tech to be ready
   *
   * @private
   */
  handleTechReady_() {
    this.triggerReady();

    // Keep the same volume as before
    if (this.cache_.volume) {
      this.techCall_('setVolume', this.cache_.volume);
    }

    // Look if the tech found a higher resolution poster while loading
    this.handleTechPosterChange_();

    // Update the duration if available
    this.handleTechDurationChange_();
  }

  /**
   * Retrigger the `loadstart` event that was triggered by the {@link Tech}. This
   * function will also trigger {@link Player#firstplay} if it is the first loadstart
   * for a video.
   *
   * @fires Player#loadstart
   * @fires Player#firstplay
   * @listens Tech#loadstart
   * @private
   */
  handleTechLoadStart_() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('vjs-ended');
    this.removeClass('vjs-seeking');

    // reset the error state
    this.error(null);

    // Update the duration
    this.handleTechDurationChange_();

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    if (!this.paused()) {
      /**
       * Fired when the user agent begins looking for media data
       *
       * @event Player#loadstart
       * @type {EventTarget~Event}
       */
      this.trigger('loadstart');
      this.trigger('firstplay');
    } else {
      // reset the hasStarted state
      this.hasStarted(false);
      this.trigger('loadstart');
    }

    // autoplay happens after loadstart for the browser,
    // so we mimic that behavior
    this.manualAutoplay_(this.autoplay() === true && this.options_.normalizeAutoplay ? 'play' : this.autoplay());
  }

  /**
   * Handle autoplay string values, rather than the typical boolean
   * values that should be handled by the tech. Note that this is not
   * part of any specification. Valid values and what they do can be
   * found on the autoplay getter at Player#autoplay()
   */
  manualAutoplay_(type) {
    if (!this.tech_ || typeof type !== 'string') {
      return;
    }

    // Save original muted() value, set muted to true, and attempt to play().
    // On promise rejection, restore muted from saved value
    const resolveMuted = () => {
      const previouslyMuted = this.muted();

      this.muted(true);

      const restoreMuted = () => {
        this.muted(previouslyMuted);
      };

      // restore muted on play terminatation
      this.playTerminatedQueue_.push(restoreMuted);

      const mutedPromise = this.play();

      if (!isPromise(mutedPromise)) {
        return;
      }

      return mutedPromise.catch(err => {
        restoreMuted();
        throw new Error(`Rejection at manualAutoplay. Restoring muted value. ${err ? err : ''}`);
      });
    };

    let promise;

    // if muted defaults to true
    // the only thing we can do is call play
    if (type === 'any' && !this.muted()) {
      promise = this.play();

      if (isPromise(promise)) {
        promise = promise.catch(resolveMuted);
      }
    } else if (type === 'muted' && !this.muted()) {
      promise = resolveMuted();
    } else {
      promise = this.play();
    }

    if (!isPromise(promise)) {
      return;
    }

    return promise.then(() => {
      this.trigger({type: 'autoplay-success', autoplay: type});
    }).catch(() => {
      this.trigger({type: 'autoplay-failure', autoplay: type});
    });
  }

  /**
   * Update the internal source caches so that we return the correct source from
   * `src()`, `currentSource()`, and `currentSources()`.
   *
   * > Note: `currentSources` will not be updated if the source that is passed in exists
   *         in the current `currentSources` cache.
   *
   *
   * @param {Tech~SourceObject} srcObj
   *        A string or object source to update our caches to.
   */
  updateSourceCaches_(srcObj = '') {

    let src = srcObj;
    let type = '';

    if (typeof src !== 'string') {
      src = srcObj.src;
      type = srcObj.type;
    }

    // make sure all the caches are set to default values
    // to prevent null checking
    this.cache_.source = this.cache_.source || {};
    this.cache_.sources = this.cache_.sources || [];

    // try to get the type of the src that was passed in
    if (src && !type) {
      type = findMimetype(this, src);
    }

    // update `currentSource` cache always
    this.cache_.source = mergeOptions({}, srcObj, {src, type});

    const matchingSources = this.cache_.sources.filter((s) => s.src && s.src === src);
    const sourceElSources = [];
    const sourceEls = this.$$('source');
    const matchingSourceEls = [];

    for (let i = 0; i < sourceEls.length; i++) {
      const sourceObj = Dom.getAttributes(sourceEls[i]);

      sourceElSources.push(sourceObj);

      if (sourceObj.src && sourceObj.src === src) {
        matchingSourceEls.push(sourceObj.src);
      }
    }

    // if we have matching source els but not matching sources
    // the current source cache is not up to date
    if (matchingSourceEls.length && !matchingSources.length) {
      this.cache_.sources = sourceElSources;
    // if we don't have matching source or source els set the
    // sources cache to the `currentSource` cache
    } else if (!matchingSources.length) {
      this.cache_.sources = [this.cache_.source];
    }

    // update the tech `src` cache
    this.cache_.src = src;
  }

  /**
   * *EXPERIMENTAL* Fired when the source is set or changed on the {@link Tech}
   * causing the media element to reload.
   *
   * It will fire for the initial source and each subsequent source.
   * This event is a custom event from Video.js and is triggered by the {@link Tech}.
   *
   * The event object for this event contains a `src` property that will contain the source
   * that was available when the event was triggered. This is generally only necessary if Video.js
   * is switching techs while the source was being changed.
   *
   * It is also fired when `load` is called on the player (or media element)
   * because the {@link https://html.spec.whatwg.org/multipage/media.html#dom-media-load|specification for `load`}
   * says that the resource selection algorithm needs to be aborted and restarted.
   * In this case, it is very likely that the `src` property will be set to the
   * empty string `""` to indicate we do not know what the source will be but
   * that it is changing.
   *
   * *This event is currently still experimental and may change in minor releases.*
   * __To use this, pass `enableSourceset` option to the player.__
   *
   * @event Player#sourceset
   * @type {EventTarget~Event}
   * @prop {string} src
   *                The source url available when the `sourceset` was triggered.
   *                It will be an empty string if we cannot know what the source is
   *                but know that the source will change.
   */
  /**
   * Retrigger the `sourceset` event that was triggered by the {@link Tech}.
   *
   * @fires Player#sourceset
   * @listens Tech#sourceset
   * @private
   */
  handleTechSourceset_(event) {
    // only update the source cache when the source
    // was not updated using the player api
    if (!this.changingSrc_) {
      let updateSourceCaches = (src) => this.updateSourceCaches_(src);
      const playerSrc = this.currentSource().src;
      const eventSrc = event.src;

      // if we have a playerSrc that is not a blob, and a tech src that is a blob
      if (playerSrc && !(/^blob:/).test(playerSrc) && (/^blob:/).test(eventSrc)) {

        // if both the tech source and the player source were updated we assume
        // something like @videojs/http-streaming did the sourceset and skip updating the source cache.
        if (!this.lastSource_ || (this.lastSource_.tech !== eventSrc && this.lastSource_.player !== playerSrc)) {
          updateSourceCaches = () => {};
        }
      }

      // update the source to the initial source right away
      // in some cases this will be empty string
      updateSourceCaches(eventSrc);

      // if the `sourceset` `src` was an empty string
      // wait for a `loadstart` to update the cache to `currentSrc`.
      // If a sourceset happens before a `loadstart`, we reset the state
      if (!event.src) {
        this.tech_.any(['sourceset', 'loadstart'], (e) => {
          // if a sourceset happens before a `loadstart` there
          // is nothing to do as this `handleTechSourceset_`
          // will be called again and this will be handled there.
          if (e.type === 'sourceset') {
            return;
          }

          const techSrc = this.techGet('currentSrc');

          this.lastSource_.tech = techSrc;
          this.updateSourceCaches_(techSrc);
        });
      }
    }
    this.lastSource_ = {player: this.currentSource().src, tech: event.src};

    this.trigger({
      src: event.src,
      type: 'sourceset'
    });
  }

  /**
   * Add/remove the vjs-has-started class
   *
   * @fires Player#firstplay
   *
   * @param {boolean} request
   *        - true: adds the class
   *        - false: remove the class
   *
   * @return {boolean}
   *         the boolean value of hasStarted_
   */
  hasStarted(request) {
    if (request === undefined) {
      // act as getter, if we have no request to change
      return this.hasStarted_;
    }

    if (request === this.hasStarted_) {
      return;
    }

    this.hasStarted_ = request;

    if (this.hasStarted_) {
      this.addClass('vjs-has-started');
      this.trigger('firstplay');
    } else {
      this.removeClass('vjs-has-started');
    }
  }

  /**
   * Fired whenever the media begins or resumes playback
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play}
   * @fires Player#play
   * @listens Tech#play
   * @private
   */
  handleTechPlay_() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');

    // hide the poster when the user hits play
    this.hasStarted(true);
    /**
     * Triggered whenever an {@link Tech#play} event happens. Indicates that
     * playback has started or resumed.
     *
     * @event Player#play
     * @type {EventTarget~Event}
     */
    this.trigger('play');
  }

  /**
   * Retrigger the `ratechange` event that was triggered by the {@link Tech}.
   *
   * If there were any events queued while the playback rate was zero, fire
   * those events now.
   *
   * @private
   * @method Player#handleTechRateChange_
   * @fires Player#ratechange
   * @listens Tech#ratechange
   */
  handleTechRateChange_() {
    if (this.tech_.playbackRate() > 0 && this.cache_.lastPlaybackRate === 0) {
      this.queuedCallbacks_.forEach((queued) => queued.callback(queued.event));
      this.queuedCallbacks_ = [];
    }
    this.cache_.lastPlaybackRate = this.tech_.playbackRate();
    /**
     * Fires when the playing speed of the audio/video is changed
     *
     * @event Player#ratechange
     * @type {event}
     */
    this.trigger('ratechange');
  }

  /**
   * Retrigger the `waiting` event that was triggered by the {@link Tech}.
   *
   * @fires Player#waiting
   * @listens Tech#waiting
   * @private
   */
  handleTechWaiting_() {
    this.addClass('vjs-waiting');
    /**
     * A readyState change on the DOM element has caused playback to stop.
     *
     * @event Player#waiting
     * @type {EventTarget~Event}
     */
    this.trigger('waiting');

    // Browsers may emit a timeupdate event after a waiting event. In order to prevent
    // premature removal of the waiting class, wait for the time to change.
    const timeWhenWaiting = this.currentTime();
    const timeUpdateListener = () => {
      if (timeWhenWaiting !== this.currentTime()) {
        this.removeClass('vjs-waiting');
        this.off('timeupdate', timeUpdateListener);
      }
    };

    this.on('timeupdate', timeUpdateListener);
  }

  /**
   * Retrigger the `canplay` event that was triggered by the {@link Tech}.
   * > Note: This is not consistent between browsers. See #1351
   *
   * @fires Player#canplay
   * @listens Tech#canplay
   * @private
   */
  handleTechCanPlay_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_FUTURE_DATA or greater.
     *
     * @event Player#canplay
     * @type {EventTarget~Event}
     */
    this.trigger('canplay');
  }

  /**
   * Retrigger the `canplaythrough` event that was triggered by the {@link Tech}.
   *
   * @fires Player#canplaythrough
   * @listens Tech#canplaythrough
   * @private
   */
  handleTechCanPlayThrough_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_ENOUGH_DATA or greater. This means that the
     * entire media file can be played without buffering.
     *
     * @event Player#canplaythrough
     * @type {EventTarget~Event}
     */
    this.trigger('canplaythrough');
  }

  /**
   * Retrigger the `playing` event that was triggered by the {@link Tech}.
   *
   * @fires Player#playing
   * @listens Tech#playing
   * @private
   */
  handleTechPlaying_() {
    this.removeClass('vjs-waiting');
    /**
     * The media is no longer blocked from playback, and has started playing.
     *
     * @event Player#playing
     * @type {EventTarget~Event}
     */
    this.trigger('playing');
  }

  /**
   * Retrigger the `seeking` event that was triggered by the {@link Tech}.
   *
   * @fires Player#seeking
   * @listens Tech#seeking
   * @private
   */
  handleTechSeeking_() {
    this.addClass('vjs-seeking');
    /**
     * Fired whenever the player is jumping to a new time
     *
     * @event Player#seeking
     * @type {EventTarget~Event}
     */
    this.trigger('seeking');
  }

  /**
   * Retrigger the `seeked` event that was triggered by the {@link Tech}.
   *
   * @fires Player#seeked
   * @listens Tech#seeked
   * @private
   */
  handleTechSeeked_() {
    this.removeClass('vjs-seeking');
    this.removeClass('vjs-ended');
    /**
     * Fired when the player has finished jumping to a new time
     *
     * @event Player#seeked
     * @type {EventTarget~Event}
     */
    this.trigger('seeked');
  }

  /**
   * Retrigger the `firstplay` event that was triggered by the {@link Tech}.
   *
   * @fires Player#firstplay
   * @listens Tech#firstplay
   * @deprecated As of 6.0 firstplay event is deprecated.
   *             As of 6.0 passing the `starttime` option to the player and the firstplay event are deprecated.
   * @private
   */
  handleTechFirstPlay_() {
    // If the first starttime attribute is specified
    // then we will start at the given offset in seconds
    if (this.options_.starttime) {
      log.warn('Passing the `starttime` option to the player will be deprecated in 6.0');
      this.currentTime(this.options_.starttime);
    }

    this.addClass('vjs-has-started');
    /**
     * Fired the first time a video is played. Not part of the HLS spec, and this is
     * probably not the best implementation yet, so use sparingly. If you don't have a
     * reason to prevent playback, use `myPlayer.one('play');` instead.
     *
     * @event Player#firstplay
     * @deprecated As of 6.0 firstplay event is deprecated.
     * @type {EventTarget~Event}
     */
    this.trigger('firstplay');
  }

  /**
   * Retrigger the `pause` event that was triggered by the {@link Tech}.
   *
   * @fires Player#pause
   * @listens Tech#pause
   * @private
   */
  handleTechPause_() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    /**
     * Fired whenever the media has been paused
     *
     * @event Player#pause
     * @type {EventTarget~Event}
     */
    this.trigger('pause');
  }

  /**
   * Retrigger the `ended` event that was triggered by the {@link Tech}.
   *
   * @fires Player#ended
   * @listens Tech#ended
   * @private
   */
  handleTechEnded_() {
    this.addClass('vjs-ended');
    this.removeClass('vjs-waiting');
    if (this.options_.loop) {
      this.currentTime(0);
      this.play();
    } else if (!this.paused()) {
      this.pause();
    }

    /**
     * Fired when the end of the media resource is reached (currentTime == duration)
     *
     * @event Player#ended
     * @type {EventTarget~Event}
     */
    this.trigger('ended');
  }

  /**
   * Fired when the duration of the media resource is first known or changed
   *
   * @listens Tech#durationchange
   * @private
   */
  handleTechDurationChange_() {
    this.duration(this.techGet_('duration'));
  }

  /**
   * Handle a click on the media element to play/pause
   *
   * @param {EventTarget~Event} event
   *        the event that caused this function to trigger
   *
   * @listens Tech#click
   * @private
   */
  handleTechClick_(event) {
    // When controls are disabled a click should not toggle playback because
    // the click is considered a control
    if (!this.controls_) {
      return;
    }

    if (
      this.options_ === undefined ||
      this.options_.userActions === undefined ||
      this.options_.userActions.click === undefined ||
      this.options_.userActions.click !== false
    ) {

      if (
        this.options_ !== undefined &&
        this.options_.userActions !== undefined &&
        typeof this.options_.userActions.click === 'function'
      ) {

        this.options_.userActions.click.call(this, event);

      } else if (this.paused()) {
        silencePromise(this.play());
      } else {
        this.pause();
      }
    }
  }

  /**
   * Handle a double-click on the media element to enter/exit fullscreen
   *
   * @param {EventTarget~Event} event
   *        the event that caused this function to trigger
   *
   * @listens Tech#dblclick
   * @private
   */
  handleTechDoubleClick_(event) {
    if (!this.controls_) {
      return;
    }

    // we do not want to toggle fullscreen state
    // when double-clicking inside a control bar or a modal
    const inAllowedEls = Array.prototype.some.call(
      this.$$('.vjs-control-bar, .vjs-modal-dialog'),
      el => el.contains(event.target)
    );

    if (!inAllowedEls) {
      /*
       * options.userActions.doubleClick
       *
       * If `undefined` or `true`, double-click toggles fullscreen if controls are present
       * Set to `false` to disable double-click handling
       * Set to a function to substitute an external double-click handler
       */
      if (
        this.options_ === undefined ||
        this.options_.userActions === undefined ||
        this.options_.userActions.doubleClick === undefined ||
        this.options_.userActions.doubleClick !== false
      ) {

        if (
          this.options_ !== undefined &&
          this.options_.userActions !== undefined &&
          typeof this.options_.userActions.doubleClick === 'function'
        ) {

          this.options_.userActions.doubleClick.call(this, event);

        } else if (this.isFullscreen()) {
          this.exitFullscreen();
        } else {
          this.requestFullscreen();
        }
      }
    }
  }

  /**
   * Handle a tap on the media element. It will toggle the user
   * activity state, which hides and shows the controls.
   *
   * @listens Tech#tap
   * @private
   */
  handleTechTap_() {
    this.userActive(!this.userActive());
  }

  /**
   * Handle touch to start
   *
   * @listens Tech#touchstart
   * @private
   */
  handleTechTouchStart_() {
    this.userWasActive = this.userActive();
  }

  /**
   * Handle touch to move
   *
   * @listens Tech#touchmove
   * @private
   */
  handleTechTouchMove_() {
    if (this.userWasActive) {
      this.reportUserActivity();
    }
  }

  /**
   * Handle touch to end
   *
   * @param {EventTarget~Event} event
   *        the touchend event that triggered
   *        this function
   *
   * @listens Tech#touchend
   * @private
   */
  handleTechTouchEnd_(event) {
    // Stop the mouse events from also happening
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  /**
   * native click events on the SWF aren't triggered on IE11, Win8.1RT
   * use stageclick events triggered from inside the SWF instead
   *
   * @private
   * @listens stageclick
   */
  handleStageClick_() {
    this.reportUserActivity();
  }

  /**
   * @private
   */
  toggleFullscreenClass_() {
    if (this.isFullscreen()) {
      this.addClass('vjs-fullscreen');
    } else {
      this.removeClass('vjs-fullscreen');
    }
  }

  /**
   * when the document fschange event triggers it calls this
   */
  documentFullscreenChange_(e) {
    const targetPlayer = e.target.player;

    // if another player was fullscreen
    // do a null check for targetPlayer because older firefox's would put document as e.target
    if (targetPlayer && targetPlayer !== this) {
      return;
    }

    const el = this.el();
    let isFs = document[this.fsApi_.fullscreenElement] === el;

    if (!isFs && el.matches) {
      isFs = el.matches(':' + this.fsApi_.fullscreen);
    } else if (!isFs && el.msMatchesSelector) {
      isFs = el.msMatchesSelector(':' + this.fsApi_.fullscreen);
    }

    this.isFullscreen(isFs);
  }

  /**
   * Handle Tech Fullscreen Change
   *
   * @param {EventTarget~Event} event
   *        the fullscreenchange event that triggered this function
   *
   * @param {Object} data
   *        the data that was sent with the event
   *
   * @private
   * @listens Tech#fullscreenchange
   * @fires Player#fullscreenchange
   */
  handleTechFullscreenChange_(event, data) {
    if (data) {
      if (data.nativeIOSFullscreen) {
        this.toggleClass('vjs-ios-native-fs');
      }
      this.isFullscreen(data.isFullscreen);
    }
  }

  handleTechFullscreenError_(event, err) {
    this.trigger('fullscreenerror', err);
  }

  /**
   * @private
   */
  togglePictureInPictureClass_() {
    if (this.isInPictureInPicture()) {
      this.addClass('vjs-picture-in-picture');
    } else {
      this.removeClass('vjs-picture-in-picture');
    }
  }

  /**
   * Handle Tech Enter Picture-in-Picture.
   *
   * @param {EventTarget~Event} event
   *        the enterpictureinpicture event that triggered this function
   *
   * @private
   * @listens Tech#enterpictureinpicture
   */
  handleTechEnterPictureInPicture_(event) {
    this.isInPictureInPicture(true);
  }

  /**
   * Handle Tech Leave Picture-in-Picture.
   *
   * @param {EventTarget~Event} event
   *        the leavepictureinpicture event that triggered this function
   *
   * @private
   * @listens Tech#leavepictureinpicture
   */
  handleTechLeavePictureInPicture_(event) {
    this.isInPictureInPicture(false);
  }

  /**
   * Fires when an error occurred during the loading of an audio/video.
   *
   * @private
   * @listens Tech#error
   */
  handleTechError_() {
    const error = this.tech_.error();

    this.error(error);
  }

  /**
   * Retrigger the `textdata` event that was triggered by the {@link Tech}.
   *
   * @fires Player#textdata
   * @listens Tech#textdata
   * @private
   */
  handleTechTextData_() {
    let data = null;

    if (arguments.length > 1) {
      data = arguments[1];
    }

    /**
     * Fires when we get a textdata event from tech
     *
     * @event Player#textdata
     * @type {EventTarget~Event}
     */
    this.trigger('textdata', data);
  }

  /**
   * Get object for cached values.
   *
   * @return {Object}
   *         get the current object cache
   */
  getCache() {
    return this.cache_;
  }

  /**
   * Resets the internal cache object.
   *
   * Using this function outside the player constructor or reset method may
   * have unintended side-effects.
   *
   * @private
   */
  resetCache_() {
    this.cache_ = {

      // Right now, the currentTime is not _really_ cached because it is always
      // retrieved from the tech (see: currentTime). However, for completeness,
      // we set it to zero here to ensure that if we do start actually caching
      // it, we reset it along with everything else.
      currentTime: 0,
      initTime: 0,
      inactivityTimeout: this.options_.inactivityTimeout,
      duration: NaN,
      lastVolume: 1,
      lastPlaybackRate: this.defaultPlaybackRate(),
      media: null,
      src: '',
      source: {},
      sources: [],
      playbackRates: [],
      volume: 1
    };
  }

  /**
   * Pass values to the playback tech
   *
   * @param {string} [method]
   *        the method to call
   *
   * @param {Object} arg
   *        the argument to pass
   *
   * @private
   */
  techCall_(method, arg) {
    // If it's not ready yet, call method when it is

    this.ready(function() {
      if (method in middleware.allowedSetters) {
        return middleware.set(this.middleware_, this.tech_, method, arg);

      } else if (method in middleware.allowedMediators) {
        return middleware.mediate(this.middleware_, this.tech_, method, arg);
      }

      try {
        if (this.tech_) {
          this.tech_[method](arg);
        }
      } catch (e) {
        log(e);
        throw e;
      }
    }, true);
  }

  /**
   * Get calls can't wait for the tech, and sometimes don't need to.
   *
   * @param {string} method
   *        Tech method
   *
   * @return {Function|undefined}
   *         the method or undefined
   *
   * @private
   */
  techGet_(method) {
    if (!this.tech_ || !this.tech_.isReady_) {
      return;
    }

    if (method in middleware.allowedGetters) {
      return middleware.get(this.middleware_, this.tech_, method);

    } else if (method in middleware.allowedMediators) {
      return middleware.mediate(this.middleware_, this.tech_, method);
    }

    // Flash likes to die and reload when you hide or reposition it.
    // In these cases the object methods go away and we get errors.
    // TODO: Is this needed for techs other than Flash?
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    try {
      return this.tech_[method]();
    } catch (e) {

      // When building additional tech libs, an expected method may not be defined yet
      if (this.tech_[method] === undefined) {
        log(`Video.js: ${method} method not defined for ${this.techName_} playback technology.`, e);
        throw e;
      }

      // When a method isn't available on the object it throws a TypeError
      if (e.name === 'TypeError') {
        log(`Video.js: ${method} unavailable on ${this.techName_} playback technology element.`, e);
        this.tech_.isReady_ = false;
        throw e;
      }

      // If error unknown, just log and throw
      log(e);
      throw e;
    }
  }

  /**
   * Attempt to begin playback at the first opportunity.
   *
   * @return {Promise|undefined}
   *         Returns a promise if the browser supports Promises (or one
   *         was passed in as an option). This promise will be resolved on
   *         the return value of play. If this is undefined it will fulfill the
   *         promise chain otherwise the promise chain will be fulfilled when
   *         the promise from play is fulfilled.
   */
  play() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      return new PromiseClass((resolve) => {
        this.play_(resolve);
      });
    }

    return this.play_();
  }

  /**
   * The actual logic for play, takes a callback that will be resolved on the
   * return value of play. This allows us to resolve to the play promise if there
   * is one on modern browsers.
   *
   * @private
   * @param {Function} [callback]
   *        The callback that should be called when the techs play is actually called
   */
  play_(callback = silencePromise) {
    this.playCallbacks_.push(callback);

    const isSrcReady = Boolean(!this.changingSrc_ && (this.src() || this.currentSrc()));

    // treat calls to play_ somewhat like the `one` event function
    if (this.waitToPlay_) {
      this.off(['ready', 'loadstart'], this.waitToPlay_);
      this.waitToPlay_ = null;
    }

    // if the player/tech is not ready or the src itself is not ready
    // queue up a call to play on `ready` or `loadstart`
    if (!this.isReady_ || !isSrcReady) {
      this.waitToPlay_ = (e) => {
        this.play_();
      };
      this.one(['ready', 'loadstart'], this.waitToPlay_);

      // if we are in Safari, there is a high chance that loadstart will trigger after the gesture timeperiod
      // in that case, we need to prime the video element by calling load so it'll be ready in time
      if (!isSrcReady && (browser.IS_ANY_SAFARI || browser.IS_IOS)) {
        this.load();
      }
      return;
    }

    // If the player/tech is ready and we have a source, we can attempt playback.
    const val = this.techGet_('play');

    // play was terminated if the returned value is null
    if (val === null) {
      this.runPlayTerminatedQueue_();
    } else {
      this.runPlayCallbacks_(val);
    }
  }

  /**
   * These functions will be run when if play is terminated. If play
   * runPlayCallbacks_ is run these function will not be run. This allows us
   * to differenciate between a terminated play and an actual call to play.
   */
  runPlayTerminatedQueue_() {
    const queue = this.playTerminatedQueue_.slice(0);

    this.playTerminatedQueue_ = [];

    queue.forEach(function(q) {
      q();
    });
  }

  /**
   * When a callback to play is delayed we have to run these
   * callbacks when play is actually called on the tech. This function
   * runs the callbacks that were delayed and accepts the return value
   * from the tech.
   *
   * @param {undefined|Promise} val
   *        The return value from the tech.
   */
  runPlayCallbacks_(val) {
    const callbacks = this.playCallbacks_.slice(0);

    this.playCallbacks_ = [];
    // clear play terminatedQueue since we finished a real play
    this.playTerminatedQueue_ = [];

    callbacks.forEach(function(cb) {
      cb(val);
    });
  }

  /**
   * Pause the video playback
   *
   * @return {Player}
   *         A reference to the player object this function was called on
   */
  pause() {
    this.techCall_('pause');
  }

  /**
   * Check if the player is paused or has yet to play
   *
   * @return {boolean}
   *         - false: if the media is currently playing
   *         - true: if media is not currently playing
   */
  paused() {
    // The initial state of paused should be true (in Safari it's actually false)
    return (this.techGet_('paused') === false) ? false : true;
  }

  /**
   * Get a TimeRange object representing the current ranges of time that the user
   * has played.
   *
   * @return {TimeRange}
   *         A time range object that represents all the increments of time that have
   *         been played.
   */
  played() {
    return this.techGet_('played') || createTimeRange(0, 0);
  }

  /**
   * Returns whether or not the user is "scrubbing". Scrubbing is
   * when the user has clicked the progress bar handle and is
   * dragging it along the progress bar.
   *
   * @param {boolean} [isScrubbing]
   *        whether the user is or is not scrubbing
   *
   * @return {boolean}
   *         The value of scrubbing when getting
   */
  scrubbing(isScrubbing) {
    if (typeof isScrubbing === 'undefined') {
      return this.scrubbing_;
    }
    this.scrubbing_ = !!isScrubbing;
    this.techCall_('setScrubbing', this.scrubbing_);

    if (isScrubbing) {
      this.addClass('vjs-scrubbing');
    } else {
      this.removeClass('vjs-scrubbing');
    }
  }

  /**
   * Get or set the current time (in seconds)
   *
   * @param {number|string} [seconds]
   *        The time to seek to in seconds
   *
   * @return {number}
   *         - the current time in seconds when getting
   */
  currentTime(seconds) {
    if (typeof seconds !== 'undefined') {
      if (seconds < 0) {
        seconds = 0;
      }
      if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
        this.cache_.initTime = seconds;
        this.off('canplay', this.boundApplyInitTime_);
        this.one('canplay', this.boundApplyInitTime_);
        return;
      }
      this.techCall_('setCurrentTime', seconds);
      this.cache_.initTime = 0;
      return;
    }

    // cache last currentTime and return. default to 0 seconds
    //
    // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
    // currentTime when scrubbing, but may not provide much performance benefit afterall.
    // Should be tested. Also something has to read the actual current time or the cache will
    // never get updated.
    this.cache_.currentTime = (this.techGet_('currentTime') || 0);
    return this.cache_.currentTime;
  }

  /**
   * Apply the value of initTime stored in cache as currentTime.
   *
   * @private
   */
  applyInitTime_() {
    this.currentTime(this.cache_.initTime);
  }

  /**
   * Normally gets the length in time of the video in seconds;
   * in all but the rarest use cases an argument will NOT be passed to the method
   *
   * > **NOTE**: The video must have started loading before the duration can be
   * known, and depending on preload behaviour may not be known until the video starts
   * playing.
   *
   * @fires Player#durationchange
   *
   * @param {number} [seconds]
   *        The duration of the video to set in seconds
   *
   * @return {number}
   *         - The duration of the video in seconds when getting
   */
  duration(seconds) {
    if (seconds === undefined) {
      // return NaN if the duration is not known
      return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
    }

    seconds = parseFloat(seconds);

    // Standardize on Infinity for signaling video is live
    if (seconds < 0) {
      seconds = Infinity;
    }

    if (seconds !== this.cache_.duration) {
      // Cache the last set value for optimized scrubbing (esp. Flash)
      // TODO: Required for techs other than Flash?
      this.cache_.duration = seconds;

      if (seconds === Infinity) {
        this.addClass('vjs-live');
      } else {
        this.removeClass('vjs-live');
      }
      if (!isNaN(seconds)) {
        // Do not fire durationchange unless the duration value is known.
        // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}

        /**
         * @event Player#durationchange
         * @type {EventTarget~Event}
         */
        this.trigger('durationchange');
      }
    }
  }

  /**
   * Calculates how much time is left in the video. Not part
   * of the native video API.
   *
   * @return {number}
   *         The time remaining in seconds
   */
  remainingTime() {
    return this.duration() - this.currentTime();
  }

  /**
   * A remaining time function that is intented to be used when
   * the time is to be displayed directly to the user.
   *
   * @return {number}
   *         The rounded time remaining in seconds
   */
  remainingTimeDisplay() {
    return Math.floor(this.duration()) - Math.floor(this.currentTime());
  }

  //
  // Kind of like an array of portions of the video that have been downloaded.

  /**
   * Get a TimeRange object with an array of the times of the video
   * that have been downloaded. If you just want the percent of the
   * video that's been downloaded, use bufferedPercent.
   *
   * @see [Buffered Spec]{@link http://dev.w3.org/html5/spec/video.html#dom-media-buffered}
   *
   * @return {TimeRange}
   *         A mock TimeRange object (following HTML spec)
   */
  buffered() {
    let buffered = this.techGet_('buffered');

    if (!buffered || !buffered.length) {
      buffered = createTimeRange(0, 0);
    }

    return buffered;
  }

  /**
   * Get the percent (as a decimal) of the video that's been downloaded.
   * This method is not a part of the native HTML video API.
   *
   * @return {number}
   *         A decimal between 0 and 1 representing the percent
   *         that is buffered 0 being 0% and 1 being 100%
   */
  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration());
  }

  /**
   * Get the ending time of the last buffered time range
   * This is used in the progress bar to encapsulate all time ranges.
   *
   * @return {number}
   *         The end of the last buffered time range
   */
  bufferedEnd() {
    const buffered = this.buffered();
    const duration = this.duration();
    let end = buffered.end(buffered.length - 1);

    if (end > duration) {
      end = duration;
    }

    return end;
  }

  /**
   * Get or set the current volume of the media
   *
   * @param  {number} [percentAsDecimal]
   *         The new volume as a decimal percent:
   *         - 0 is muted/0%/off
   *         - 1.0 is 100%/full
   *         - 0.5 is half volume or 50%
   *
   * @return {number}
   *         The current volume as a percent when getting
   */
  volume(percentAsDecimal) {
    let vol;

    if (percentAsDecimal !== undefined) {
      // Force value to between 0 and 1
      vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
      this.cache_.volume = vol;
      this.techCall_('setVolume', vol);

      if (vol > 0) {
        this.lastVolume_(vol);
      }

      return;
    }

    // Default to 1 when returning current volume.
    vol = parseFloat(this.techGet_('volume'));
    return (isNaN(vol)) ? 1 : vol;
  }

  /**
   * Get the current muted state, or turn mute on or off
   *
   * @param {boolean} [muted]
   *        - true to mute
   *        - false to unmute
   *
   * @return {boolean}
   *         - true if mute is on and getting
   *         - false if mute is off and getting
   */
  muted(muted) {
    if (muted !== undefined) {
      this.techCall_('setMuted', muted);
      return;
    }
    return this.techGet_('muted') || false;
  }

  /**
   * Get the current defaultMuted state, or turn defaultMuted on or off. defaultMuted
   * indicates the state of muted on initial playback.
   *
   * ```js
   *   var myPlayer = videojs('some-player-id');
   *
   *   myPlayer.src("http://www.example.com/path/to/video.mp4");
   *
   *   // get, should be false
   *   console.log(myPlayer.defaultMuted());
   *   // set to true
   *   myPlayer.defaultMuted(true);
   *   // get should be true
   *   console.log(myPlayer.defaultMuted());
   * ```
   *
   * @param {boolean} [defaultMuted]
   *        - true to mute
   *        - false to unmute
   *
   * @return {boolean|Player}
   *         - true if defaultMuted is on and getting
   *         - false if defaultMuted is off and getting
   *         - A reference to the current player when setting
   */
  defaultMuted(defaultMuted) {
    if (defaultMuted !== undefined) {
      return this.techCall_('setDefaultMuted', defaultMuted);
    }
    return this.techGet_('defaultMuted') || false;
  }

  /**
   * Get the last volume, or set it
   *
   * @param  {number} [percentAsDecimal]
   *         The new last volume as a decimal percent:
   *         - 0 is muted/0%/off
   *         - 1.0 is 100%/full
   *         - 0.5 is half volume or 50%
   *
   * @return {number}
   *         the current value of lastVolume as a percent when getting
   *
   * @private
   */
  lastVolume_(percentAsDecimal) {
    if (percentAsDecimal !== undefined && percentAsDecimal !== 0) {
      this.cache_.lastVolume = percentAsDecimal;
      return;
    }
    return this.cache_.lastVolume;
  }

  /**
   * Check if current tech can support native fullscreen
   * (e.g. with built in controls like iOS)
   *
   * @return {boolean}
   *         if native fullscreen is supported
   */
  supportsFullScreen() {
    return this.techGet_('supportsFullScreen') || false;
  }

  /**
   * Check if the player is in fullscreen mode or tell the player that it
   * is or is not in fullscreen mode.
   *
   * > NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
   * property and instead document.fullscreenElement is used. But isFullscreen is
   * still a valuable property for internal player workings.
   *
   * @param  {boolean} [isFS]
   *         Set the players current fullscreen state
   *
   * @return {boolean}
   *         - true if fullscreen is on and getting
   *         - false if fullscreen is off and getting
   */
  isFullscreen(isFS) {
    if (isFS !== undefined) {
      const oldValue = this.isFullscreen_;

      this.isFullscreen_ = Boolean(isFS);

      // if we changed fullscreen state and we're in prefixed mode, trigger fullscreenchange
      // this is the only place where we trigger fullscreenchange events for older browsers
      // fullWindow mode is treated as a prefixed event and will get a fullscreenchange event as well
      if (this.isFullscreen_ !== oldValue && this.fsApi_.prefixed) {
        /**
           * @event Player#fullscreenchange
           * @type {EventTarget~Event}
           */
        this.trigger('fullscreenchange');
      }

      this.toggleFullscreenClass_();
      return;
    }
    return this.isFullscreen_;
  }

  /**
   * Increase the size of the video to full screen
   * In some browsers, full screen is not supported natively, so it enters
   * "full window mode", where the video fills the browser window.
   * In browsers and devices that support native full screen, sometimes the
   * browser's default controls will be shown, and not the Video.js custom skin.
   * This includes most mobile devices (iOS, Android) and older versions of
   * Safari.
   *
   * @param  {Object} [fullscreenOptions]
   *         Override the player fullscreen options
   *
   * @fires Player#fullscreenchange
   */
  requestFullscreen(fullscreenOptions) {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      const self = this;

      return new PromiseClass((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }

        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);

        const promise = self.requestFullscreenHelper_(fullscreenOptions);

        if (promise) {
          promise.then(offHandler, offHandler);
          promise.then(resolve, reject);
        }
      });
    }

    return this.requestFullscreenHelper_();
  }

  requestFullscreenHelper_(fullscreenOptions) {
    let fsOptions;

    // Only pass fullscreen options to requestFullscreen in spec-compliant browsers.
    // Use defaults or player configured option unless passed directly to this method.
    if (!this.fsApi_.prefixed) {
      fsOptions = this.options_.fullscreen && this.options_.fullscreen.options || {};
      if (fullscreenOptions !== undefined) {
        fsOptions = fullscreenOptions;
      }
    }

    // This method works as follows:
    // 1. if a fullscreen api is available, use it
    //   1. call requestFullscreen with potential options
    //   2. if we got a promise from above, use it to update isFullscreen()
    // 2. otherwise, if the tech supports fullscreen, call `enterFullScreen` on it.
    //   This is particularly used for iPhone, older iPads, and non-safari browser on iOS.
    // 3. otherwise, use "fullWindow" mode
    if (this.fsApi_.requestFullscreen) {
      const promise = this.el_[this.fsApi_.requestFullscreen](fsOptions);

      if (promise) {
        promise.then(() => this.isFullscreen(true), () => this.isFullscreen(false));
      }

      return promise;
    } else if (this.tech_.supportsFullScreen() && !this.options_.preferFullWindow === true) {
      // we can't take the video.js controls fullscreen but we can go fullscreen
      // with native controls
      this.techCall_('enterFullScreen');
    } else {
      // fullscreen isn't supported so we'll just stretch the video element to
      // fill the viewport
      this.enterFullWindow();
    }
  }

  /**
   * Return the video to its normal size after having been in full screen mode
   *
   * @fires Player#fullscreenchange
   */
  exitFullscreen() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (PromiseClass) {
      const self = this;

      return new PromiseClass((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }

        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);

        const promise = self.exitFullscreenHelper_();

        if (promise) {
          promise.then(offHandler, offHandler);
          // map the promise to our resolve/reject methods
          promise.then(resolve, reject);
        }
      });
    }

    return this.exitFullscreenHelper_();
  }

  exitFullscreenHelper_() {
    if (this.fsApi_.requestFullscreen) {
      const promise = document[this.fsApi_.exitFullscreen]();

      if (promise) {
        // we're splitting the promise here, so, we want to catch the
        // potential error so that this chain doesn't have unhandled errors
        silencePromise(promise.then(() => this.isFullscreen(false)));
      }

      return promise;
    } else if (this.tech_.supportsFullScreen() && !this.options_.preferFullWindow === true) {
      this.techCall_('exitFullScreen');
    } else {
      this.exitFullWindow();
    }
  }

  /**
   * When fullscreen isn't supported we can stretch the
   * video container to as wide as the browser will let us.
   *
   * @fires Player#enterFullWindow
   */
  enterFullWindow() {
    this.isFullscreen(true);
    this.isFullWindow = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    Events.on(document, 'keydown', this.boundFullWindowOnEscKey_);

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    Dom.addClass(document.body, 'vjs-full-window');

    /**
     * @event Player#enterFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('enterFullWindow');
  }

  /**
   * Check for call to either exit full window or
   * full screen on ESC key
   *
   * @param {string} event
   *        Event to check for key press
   */
  fullWindowOnEscKey(event) {
    if (keycode.isEventKey(event, 'Esc')) {
      if (this.isFullscreen() === true) {
        if (!this.isFullWindow) {
          this.exitFullscreen();
        } else {
          this.exitFullWindow();
        }
      }
    }
  }

  /**
   * Exit full window
   *
   * @fires Player#exitFullWindow
   */
  exitFullWindow() {
    this.isFullscreen(false);
    this.isFullWindow = false;
    Events.off(document, 'keydown', this.boundFullWindowOnEscKey_);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    Dom.removeClass(document.body, 'vjs-full-window');

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    /**
     * @event Player#exitFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('exitFullWindow');
  }

  /**
   * Disable Picture-in-Picture mode.
   *
   * @param {boolean} value
   *                  - true will disable Picture-in-Picture mode
   *                  - false will enable Picture-in-Picture mode
   */
  disablePictureInPicture(value) {
    if (value === undefined) {
      return this.techGet_('disablePictureInPicture');
    }
    this.techCall_('setDisablePictureInPicture', value);
    this.options_.disablePictureInPicture = value;
    this.trigger('disablepictureinpicturechanged');
  }

  /**
   * Check if the player is in Picture-in-Picture mode or tell the player that it
   * is or is not in Picture-in-Picture mode.
   *
   * @param  {boolean} [isPiP]
   *         Set the players current Picture-in-Picture state
   *
   * @return {boolean}
   *         - true if Picture-in-Picture is on and getting
   *         - false if Picture-in-Picture is off and getting
   */
  isInPictureInPicture(isPiP) {
    if (isPiP !== undefined) {
      this.isInPictureInPicture_ = !!isPiP;
      this.togglePictureInPictureClass_();
      return;
    }
    return !!this.isInPictureInPicture_;
  }

  /**
   * Create a floating video window always on top of other windows so that users may
   * continue consuming media while they interact with other content sites, or
   * applications on their device.
   *
   * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
   *
   * @fires Player#enterpictureinpicture
   *
   * @return {Promise}
   *         A promise with a Picture-in-Picture window.
   */
  requestPictureInPicture() {
    if ('pictureInPictureEnabled' in document && this.disablePictureInPicture() === false) {
      /**
       * This event fires when the player enters picture in picture mode
       *
       * @event Player#enterpictureinpicture
       * @type {EventTarget~Event}
       */
      return this.techGet_('requestPictureInPicture');
    }
  }

  /**
   * Exit Picture-in-Picture mode.
   *
   * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
   *
   * @fires Player#leavepictureinpicture
   *
   * @return {Promise}
   *         A promise.
   */
  exitPictureInPicture() {
    if ('pictureInPictureEnabled' in document) {
      /**
       * This event fires when the player leaves picture in picture mode
       *
       * @event Player#leavepictureinpicture
       * @type {EventTarget~Event}
       */
      return document.exitPictureInPicture();
    }
  }

  /**
   * Called when this Player has focus and a key gets pressed down, or when
   * any Component of this player receives a key press that it doesn't handle.
   * This allows player-wide hotkeys (either as defined below, or optionally
   * by an external function).
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    const {userActions} = this.options_;

    // Bail out if hotkeys are not configured.
    if (!userActions || !userActions.hotkeys) {
      return;
    }

    // Function that determines whether or not to exclude an element from
    // hotkeys handling.
    const excludeElement = (el) => {
      const tagName = el.tagName.toLowerCase();

      // The first and easiest test is for `contenteditable` elements.
      if (el.isContentEditable) {
        return true;
      }

      // Inputs matching these types will still trigger hotkey handling as
      // they are not text inputs.
      const allowedInputTypes = [
        'button',
        'checkbox',
        'hidden',
        'radio',
        'reset',
        'submit'
      ];

      if (tagName === 'input') {
        return allowedInputTypes.indexOf(el.type) === -1;
      }

      // The final test is by tag name. These tags will be excluded entirely.
      const excludedTags = ['textarea'];

      return excludedTags.indexOf(tagName) !== -1;
    };

    // Bail out if the user is focused on an interactive form element.
    if (excludeElement(this.el_.ownerDocument.activeElement)) {
      return;
    }

    if (typeof userActions.hotkeys === 'function') {
      userActions.hotkeys.call(this, event);
    } else {
      this.handleHotkeys(event);
    }
  }

  /**
   * Called when this Player receives a hotkey keydown event.
   * Supported player-wide hotkeys are:
   *
   *   f          - toggle fullscreen
   *   m          - toggle mute
   *   k or Space - toggle play/pause
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   */
  handleHotkeys(event) {
    const hotkeys = this.options_.userActions ? this.options_.userActions.hotkeys : {};

    // set fullscreenKey, muteKey, playPauseKey from `hotkeys`, use defaults if not set
    const {
      fullscreenKey = keydownEvent => keycode.isEventKey(keydownEvent, 'f'),
      muteKey = keydownEvent => keycode.isEventKey(keydownEvent, 'm'),
      playPauseKey = keydownEvent => (keycode.isEventKey(keydownEvent, 'k') || keycode.isEventKey(keydownEvent, 'Space'))
    } = hotkeys;

    if (fullscreenKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const FSToggle = Component.getComponent('FullscreenToggle');

      if (document[this.fsApi_.fullscreenEnabled] !== false) {
        FSToggle.prototype.handleClick.call(this, event);
      }

    } else if (muteKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const MuteToggle = Component.getComponent('MuteToggle');

      MuteToggle.prototype.handleClick.call(this, event);

    } else if (playPauseKey.call(this, event)) {
      event.preventDefault();
      event.stopPropagation();

      const PlayToggle = Component.getComponent('PlayToggle');

      PlayToggle.prototype.handleClick.call(this, event);
    }
  }

  /**
   * Check whether the player can play a given mimetype
   *
   * @see https://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-navigator-canplaytype
   *
   * @param {string} type
   *        The mimetype to check
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  canPlayType(type) {
    let can;

    // Loop through each playback technology in the options order
    for (let i = 0, j = this.options_.techOrder; i < j.length; i++) {
      const techName = j[i];
      let tech = Tech.getTech(techName);

      // Support old behavior of techs being registered as components.
      // Remove once that deprecated behavior is removed.
      if (!tech) {
        tech = Component.getComponent(techName);
      }

      // Check if the current tech is defined before continuing
      if (!tech) {
        log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
        continue;
      }

      // Check if the browser supports this technology
      if (tech.isSupported()) {
        can = tech.canPlayType(type);

        if (can) {
          return can;
        }
      }
    }

    return '';
  }

  /**
   * Select source based on tech-order or source-order
   * Uses source-order selection if `options.sourceOrder` is truthy. Otherwise,
   * defaults to tech-order selection
   *
   * @param {Array} sources
   *        The sources for a media asset
   *
   * @return {Object|boolean}
   *         Object of source and tech order or false
   */
  selectSource(sources) {
    // Get only the techs specified in `techOrder` that exist and are supported by the
    // current platform
    const techs =
      this.options_.techOrder
        .map((techName) => {
          return [techName, Tech.getTech(techName)];
        })
        .filter(([techName, tech]) => {
          // Check if the current tech is defined before continuing
          if (tech) {
            // Check if the browser supports this technology
            return tech.isSupported();
          }

          log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
          return false;
        });

    // Iterate over each `innerArray` element once per `outerArray` element and execute
    // `tester` with both. If `tester` returns a non-falsy value, exit early and return
    // that value.
    const findFirstPassingTechSourcePair = function(outerArray, innerArray, tester) {
      let found;

      outerArray.some((outerChoice) => {
        return innerArray.some((innerChoice) => {
          found = tester(outerChoice, innerChoice);

          if (found) {
            return true;
          }
        });
      });

      return found;
    };

    let foundSourceAndTech;
    const flip = (fn) => (a, b) => fn(b, a);
    const finder = ([techName, tech], source) => {
      if (tech.canPlaySource(source, this.options_[techName.toLowerCase()])) {
        return {source, tech: techName};
      }
    };

    // Depending on the truthiness of `options.sourceOrder`, we swap the order of techs and sources
    // to select from them based on their priority.
    if (this.options_.sourceOrder) {
      // Source-first ordering
      foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
    } else {
      // Tech-first ordering
      foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
    }

    return foundSourceAndTech || false;
  }

  /**
   * Executes source setting and getting logic
   *
   * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
   *        A SourceObject, an array of SourceObjects, or a string referencing
   *        a URL to a media source. It is _highly recommended_ that an object
   *        or array of objects is used here, so that source selection
   *        algorithms can take the `type` into account.
   *
   *        If not provided, this method acts as a getter.
   * @param {boolean} isRetry
   *        Indicates whether this is being called internally as a result of a retry
   *
   * @return {string|undefined}
   *         If the `source` argument is missing, returns the current source
   *         URL. Otherwise, returns nothing/undefined.
   */
  handleSrc_(source, isRetry) {
    // getter usage
    if (typeof source === 'undefined') {
      return this.cache_.src || '';
    }

    // Reset retry behavior for new source
    if (this.resetRetryOnError_) {
      this.resetRetryOnError_();
    }

    // filter out invalid sources and turn our source into
    // an array of source objects
    const sources = filterSource(source);

    // if a source was passed in then it is invalid because
    // it was filtered to a zero length Array. So we have to
    // show an error
    if (!sources.length) {
      this.setTimeout(function() {
        this.error({ code: 4, message: this.localize(this.options_.notSupportedMessage) });
      }, 0);
      return;
    }

    // initial sources
    this.changingSrc_ = true;

    // Only update the cached source list if we are not retrying a new source after error,
    // since in that case we want to include the failed source(s) in the cache
    if (!isRetry) {
      this.cache_.sources = sources;
    }

    this.updateSourceCaches_(sources[0]);

    // middlewareSource is the source after it has been changed by middleware
    middleware.setSource(this, sources[0], (middlewareSource, mws) => {
      this.middleware_ = mws;

      // since sourceSet is async we have to update the cache again after we select a source since
      // the source that is selected could be out of order from the cache update above this callback.
      if (!isRetry) {
        this.cache_.sources = sources;
      }

      this.updateSourceCaches_(middlewareSource);

      const err = this.src_(middlewareSource);

      if (err) {
        if (sources.length > 1) {
          return this.handleSrc_(sources.slice(1));
        }

        this.changingSrc_ = false;

        // We need to wrap this in a timeout to give folks a chance to add error event handlers
        this.setTimeout(function() {
          this.error({ code: 4, message: this.localize(this.options_.notSupportedMessage) });
        }, 0);

        // we could not find an appropriate tech, but let's still notify the delegate that this is it
        // this needs a better comment about why this is needed
        this.triggerReady();

        return;
      }

      middleware.setTech(mws, this.tech_);
    });

    // Try another available source if this one fails before playback.
    if (this.options_.retryOnError && sources.length > 1) {
      const retry = () => {
        // Remove the error modal
        this.error(null);
        this.handleSrc_(sources.slice(1), true);
      };

      const stopListeningForErrors = () => {
        this.off('error', retry);
      };

      this.one('error', retry);
      this.one('playing', stopListeningForErrors);

      this.resetRetryOnError_ = () => {
        this.off('error', retry);
        this.off('playing', stopListeningForErrors);
      };
    }
  }

  /**
   * Get or set the video source.
   *
   * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
   *        A SourceObject, an array of SourceObjects, or a string referencing
   *        a URL to a media source. It is _highly recommended_ that an object
   *        or array of objects is used here, so that source selection
   *        algorithms can take the `type` into account.
   *
   *        If not provided, this method acts as a getter.
   *
   * @return {string|undefined}
   *         If the `source` argument is missing, returns the current source
   *         URL. Otherwise, returns nothing/undefined.
   */
  src(source) {
    return this.handleSrc_(source, false);
  }

  /**
   * Set the source object on the tech, returns a boolean that indicates whether
   * there is a tech that can play the source or not
   *
   * @param {Tech~SourceObject} source
   *        The source object to set on the Tech
   *
   * @return {boolean}
   *         - True if there is no Tech to playback this source
   *         - False otherwise
   *
   * @private
   */
  src_(source) {
    const sourceTech = this.selectSource([source]);

    if (!sourceTech) {
      return true;
    }

    if (!titleCaseEquals(sourceTech.tech, this.techName_)) {
      this.changingSrc_ = true;
      // load this technology with the chosen source
      this.loadTech_(sourceTech.tech, sourceTech.source);
      this.tech_.ready(() => {
        this.changingSrc_ = false;
      });
      return false;
    }

    // wait until the tech is ready to set the source
    // and set it synchronously if possible (#2326)
    this.ready(function() {

      // The setSource tech method was added with source handlers
      // so older techs won't support it
      // We need to check the direct prototype for the case where subclasses
      // of the tech do not support source handlers
      if (this.tech_.constructor.prototype.hasOwnProperty('setSource')) {
        this.techCall_('setSource', source);
      } else {
        this.techCall_('src', source.src);
      }

      this.changingSrc_ = false;
    }, true);

    return false;
  }

  /**
   * Begin loading the src data.
   */
  load() {
    this.techCall_('load');
  }

  /**
   * Reset the player. Loads the first tech in the techOrder,
   * removes all the text tracks in the existing `tech`,
   * and calls `reset` on the `tech`.
   */
  reset() {
    const PromiseClass = this.options_.Promise || window.Promise;

    if (this.paused() || !PromiseClass) {
      this.doReset_();
    } else {
      const playPromise = this.play();

      silencePromise(playPromise.then(() => this.doReset_()));
    }
  }

  doReset_() {
    if (this.tech_) {
      this.tech_.clearTracks('text');
    }
    this.resetCache_();
    this.poster('');
    this.loadTech_(this.options_.techOrder[0], null);
    this.techCall_('reset');
    this.resetControlBarUI_();
    if (isEvented(this)) {
      this.trigger('playerreset');
    }
  }

  /**
   * Reset Control Bar's UI by calling sub-methods that reset
   * all of Control Bar's components
   */
  resetControlBarUI_() {
    this.resetProgressBar_();
    this.resetPlaybackRate_();
    this.resetVolumeBar_();
  }

  /**
   * Reset tech's progress so progress bar is reset in the UI
   */
  resetProgressBar_() {
    this.currentTime(0);

    const { durationDisplay, remainingTimeDisplay } = this.controlBar;

    if (durationDisplay) {
      durationDisplay.updateContent();
    }

    if (remainingTimeDisplay) {
      remainingTimeDisplay.updateContent();
    }
  }

  /**
   * Reset Playback ratio
   */
  resetPlaybackRate_() {
    this.playbackRate(this.defaultPlaybackRate());
    this.handleTechRateChange_();
  }

  /**
   * Reset Volume bar
   */
  resetVolumeBar_() {
    this.volume(1.0);
    this.trigger('volumechange');
  }

  /**
   * Returns all of the current source objects.
   *
   * @return {Tech~SourceObject[]}
   *         The current source objects
   */
  currentSources() {
    const source = this.currentSource();
    const sources = [];

    // assume `{}` or `{ src }`
    if (Object.keys(source).length !== 0) {
      sources.push(source);
    }

    return this.cache_.sources || sources;
  }

  /**
   * Returns the current source object.
   *
   * @return {Tech~SourceObject}
   *         The current source object
   */
  currentSource() {
    return this.cache_.source || {};
  }

  /**
   * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
   * Can be used in conjunction with `currentType` to assist in rebuilding the current source object.
   *
   * @return {string}
   *         The current source
   */
  currentSrc() {
    return this.currentSource() && this.currentSource().src || '';
  }

  /**
   * Get the current source type e.g. video/mp4
   * This can allow you rebuild the current source object so that you could load the same
   * source and tech later
   *
   * @return {string}
   *         The source MIME type
   */
  currentType() {
    return this.currentSource() && this.currentSource().type || '';
  }

  /**
   * Get or set the preload attribute
   *
   * @param {boolean} [value]
   *        - true means that we should preload
   *        - false means that we should not preload
   *
   * @return {string}
   *         The preload attribute value when getting
   */
  preload(value) {
    if (value !== undefined) {
      this.techCall_('setPreload', value);
      this.options_.preload = value;
      return;
    }
    return this.techGet_('preload');
  }

  /**
   * Get or set the autoplay option. When this is a boolean it will
   * modify the attribute on the tech. When this is a string the attribute on
   * the tech will be removed and `Player` will handle autoplay on loadstarts.
   *
   * @param {boolean|string} [value]
   *        - true: autoplay using the browser behavior
   *        - false: do not autoplay
   *        - 'play': call play() on every loadstart
   *        - 'muted': call muted() then play() on every loadstart
   *        - 'any': call play() on every loadstart. if that fails call muted() then play().
   *        - *: values other than those listed here will be set `autoplay` to true
   *
   * @return {boolean|string}
   *         The current value of autoplay when getting
   */
  autoplay(value) {
    // getter usage
    if (value === undefined) {
      return this.options_.autoplay || false;
    }

    let techAutoplay;

    // if the value is a valid string set it to that, or normalize `true` to 'play', if need be
    if (typeof value === 'string' && (/(any|play|muted)/).test(value) || value === true && this.options_.normalizeAutoplay) {
      this.options_.autoplay = value;
      this.manualAutoplay_(typeof value === 'string' ? value : 'play');
      techAutoplay = false;

    // any falsy value sets autoplay to false in the browser,
    // lets do the same
    } else if (!value) {
      this.options_.autoplay = false;

    // any other value (ie truthy) sets autoplay to true
    } else {
      this.options_.autoplay = true;
    }

    techAutoplay = typeof techAutoplay === 'undefined' ? this.options_.autoplay : techAutoplay;

    // if we don't have a tech then we do not queue up
    // a setAutoplay call on tech ready. We do this because the
    // autoplay option will be passed in the constructor and we
    // do not need to set it twice
    if (this.tech_) {
      this.techCall_('setAutoplay', techAutoplay);
    }
  }

  /**
   * Set or unset the playsinline attribute.
   * Playsinline tells the browser that non-fullscreen playback is preferred.
   *
   * @param {boolean} [value]
   *        - true means that we should try to play inline by default
   *        - false means that we should use the browser's default playback mode,
   *          which in most cases is inline. iOS Safari is a notable exception
   *          and plays fullscreen by default.
   *
   * @return {string|Player}
   *         - the current value of playsinline
   *         - the player when setting
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  playsinline(value) {
    if (value !== undefined) {
      this.techCall_('setPlaysinline', value);
      this.options_.playsinline = value;
      return this;
    }
    return this.techGet_('playsinline');
  }

  /**
   * Get or set the loop attribute on the video element.
   *
   * @param {boolean} [value]
   *        - true means that we should loop the video
   *        - false means that we should not loop the video
   *
   * @return {boolean}
   *         The current value of loop when getting
   */
  loop(value) {
    if (value !== undefined) {
      this.techCall_('setLoop', value);
      this.options_.loop = value;
      return;
    }
    return this.techGet_('loop');
  }

  /**
   * Get or set the poster image source url
   *
   * @fires Player#posterchange
   *
   * @param {string} [src]
   *        Poster image source URL
   *
   * @return {string}
   *         The current value of poster when getting
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

    if (src === this.poster_) {
      return;
    }

    // update the internal poster variable
    this.poster_ = src;

    // update the tech's poster
    this.techCall_('setPoster', src);

    this.isPosterFromTech_ = false;

    // alert components that the poster has been set
    /**
     * This event fires when the poster image is changed on the player.
     *
     * @event Player#posterchange
     * @type {EventTarget~Event}
     */
    this.trigger('posterchange');
  }

  /**
   * Some techs (e.g. YouTube) can provide a poster source in an
   * asynchronous way. We want the poster component to use this
   * poster source so that it covers up the tech's controls.
   * (YouTube's play button). However we only want to use this
   * source if the player user hasn't set a poster through
   * the normal APIs.
   *
   * @fires Player#posterchange
   * @listens Tech#posterchange
   * @private
   */
  handleTechPosterChange_() {
    if ((!this.poster_ || this.options_.techCanOverridePoster) && this.tech_ && this.tech_.poster) {
      const newPoster = this.tech_.poster() || '';

      if (newPoster !== this.poster_) {
        this.poster_ = newPoster;
        this.isPosterFromTech_ = true;

        // Let components know the poster has changed
        this.trigger('posterchange');
      }
    }
  }

  /**
   * Get or set whether or not the controls are showing.
   *
   * @fires Player#controlsenabled
   *
   * @param {boolean} [bool]
   *        - true to turn controls on
   *        - false to turn controls off
   *
   * @return {boolean}
   *         The current value of controls when getting
   */
  controls(bool) {
    if (bool === undefined) {
      return !!this.controls_;
    }

    bool = !!bool;

    // Don't trigger a change event unless it actually changed
    if (this.controls_ === bool) {
      return;
    }

    this.controls_ = bool;

    if (this.usingNativeControls()) {
      this.techCall_('setControls', bool);
    }

    if (this.controls_) {
      this.removeClass('vjs-controls-disabled');
      this.addClass('vjs-controls-enabled');
      /**
       * @event Player#controlsenabled
       * @type {EventTarget~Event}
       */
      this.trigger('controlsenabled');
      if (!this.usingNativeControls()) {
        this.addTechControlsListeners_();
      }
    } else {
      this.removeClass('vjs-controls-enabled');
      this.addClass('vjs-controls-disabled');
      /**
       * @event Player#controlsdisabled
       * @type {EventTarget~Event}
       */
      this.trigger('controlsdisabled');
      if (!this.usingNativeControls()) {
        this.removeTechControlsListeners_();
      }
    }
  }

  /**
   * Toggle native controls on/off. Native controls are the controls built into
   * devices (e.g. default iPhone controls) or other techs
   * (e.g. Vimeo Controls)
   * **This should only be set by the current tech, because only the tech knows
   * if it can support native controls**
   *
   * @fires Player#usingnativecontrols
   * @fires Player#usingcustomcontrols
   *
   * @param {boolean} [bool]
   *        - true to turn native controls on
   *        - false to turn native controls off
   *
   * @return {boolean}
   *         The current value of native controls when getting
   */
  usingNativeControls(bool) {
    if (bool === undefined) {
      return !!this.usingNativeControls_;
    }

    bool = !!bool;

    // Don't trigger a change event unless it actually changed
    if (this.usingNativeControls_ === bool) {
      return;
    }

    this.usingNativeControls_ = bool;

    if (this.usingNativeControls_) {
      this.addClass('vjs-using-native-controls');

      /**
       * player is using the native device controls
       *
       * @event Player#usingnativecontrols
       * @type {EventTarget~Event}
       */
      this.trigger('usingnativecontrols');
    } else {
      this.removeClass('vjs-using-native-controls');

      /**
       * player is using the custom HTML controls
       *
       * @event Player#usingcustomcontrols
       * @type {EventTarget~Event}
       */
      this.trigger('usingcustomcontrols');
    }
  }

  /**
   * Set or get the current MediaError
   *
   * @fires Player#error
   *
   * @param  {MediaError|string|number} [err]
   *         A MediaError or a string/number to be turned
   *         into a MediaError
   *
   * @return {MediaError|null}
   *         The current MediaError when getting (or null)
   */
  error(err) {
    if (err === undefined) {
      return this.error_ || null;
    }

    // allow hooks to modify error object
    hooks('beforeerror').forEach((hookFunction) => {
      const newErr = hookFunction(this, err);

      if (!(
        (isObject(newErr) && !Array.isArray(newErr)) ||
        typeof newErr === 'string' ||
        typeof newErr === 'number' ||
        newErr === null
      )) {
        this.log.error('please return a value that MediaError expects in beforeerror hooks');
        return;
      }

      err = newErr;
    });

    // Suppress the first error message for no compatible source until
    // user interaction
    if (this.options_.suppressNotSupportedError &&
        err && err.code === 4
    ) {
      const triggerSuppressedError = function() {
        this.error(err);
      };

      this.options_.suppressNotSupportedError = false;
      this.any(['click', 'touchstart'], triggerSuppressedError);
      this.one('loadstart', function() {
        this.off(['click', 'touchstart'], triggerSuppressedError);
      });
      return;
    }

    // restoring to default
    if (err === null) {
      this.error_ = err;
      this.removeClass('vjs-error');
      if (this.errorDisplay) {
        this.errorDisplay.close();
      }
      return;
    }

    this.error_ = new MediaError(err);

    // add the vjs-error classname to the player
    this.addClass('vjs-error');

    // log the name of the error type and any message
    // IE11 logs "[object object]" and required you to expand message to see error object
    log.error(`(CODE:${this.error_.code} ${MediaError.errorTypes[this.error_.code]})`, this.error_.message, this.error_);

    /**
     * @event Player#error
     * @type {EventTarget~Event}
     */
    this.trigger('error');

    // notify hooks of the per player error
    hooks('error').forEach((hookFunction) => hookFunction(this, this.error_));

    return;
  }

  /**
   * Report user activity
   *
   * @param {Object} event
   *        Event object
   */
  reportUserActivity(event) {
    this.userActivity_ = true;
  }

  /**
   * Get/set if user is active
   *
   * @fires Player#useractive
   * @fires Player#userinactive
   *
   * @param {boolean} [bool]
   *        - true if the user is active
   *        - false if the user is inactive
   *
   * @return {boolean}
   *         The current value of userActive when getting
   */
  userActive(bool) {
    if (bool === undefined) {
      return this.userActive_;
    }

    bool = !!bool;

    if (bool === this.userActive_) {
      return;
    }

    this.userActive_ = bool;

    if (this.userActive_) {
      this.userActivity_ = true;
      this.removeClass('vjs-user-inactive');
      this.addClass('vjs-user-active');
      /**
       * @event Player#useractive
       * @type {EventTarget~Event}
       */
      this.trigger('useractive');
      return;
    }

    // Chrome/Safari/IE have bugs where when you change the cursor it can
    // trigger a mousemove event. This causes an issue when you're hiding
    // the cursor when the user is inactive, and a mousemove signals user
    // activity. Making it impossible to go into inactive mode. Specifically
    // this happens in fullscreen when we really need to hide the cursor.
    //
    // When this gets resolved in ALL browsers it can be removed
    // https://code.google.com/p/chromium/issues/detail?id=103041
    if (this.tech_) {
      this.tech_.one('mousemove', function(e) {
        e.stopPropagation();
        e.preventDefault();
      });
    }

    this.userActivity_ = false;
    this.removeClass('vjs-user-active');
    this.addClass('vjs-user-inactive');
    /**
     * @event Player#userinactive
     * @type {EventTarget~Event}
     */
    this.trigger('userinactive');
  }

  /**
   * Listen for user activity based on timeout value
   *
   * @private
   */
  listenForUserActivity_() {
    let mouseInProgress;
    let lastMoveX;
    let lastMoveY;
    const handleActivity = Fn.bind(this, this.reportUserActivity);

    const handleMouseMove = function(e) {
      // #1068 - Prevent mousemove spamming
      // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
      if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
        lastMoveX = e.screenX;
        lastMoveY = e.screenY;
        handleActivity();
      }
    };

    const handleMouseDown = function() {
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

    const handleMouseUpAndMouseLeave = function(event) {
      handleActivity();
      // Stop the interval that maintains activity if the mouse/touch is down
      this.clearInterval(mouseInProgress);
    };

    // Any mouse movement will be considered user activity
    this.on('mousedown', handleMouseDown);
    this.on('mousemove', handleMouseMove);
    this.on('mouseup', handleMouseUpAndMouseLeave);
    this.on('mouseleave', handleMouseUpAndMouseLeave);

    const controlBar = this.getChild('controlBar');

    // Fixes bug on Android & iOS where when tapping progressBar (when control bar is displayed)
    // controlBar would no longer be hidden by default timeout.
    if (controlBar && !browser.IS_IOS && !browser.IS_ANDROID) {

      controlBar.on('mouseenter', function(event) {
        if (this.player().options_.inactivityTimeout !== 0) {
          this.player().cache_.inactivityTimeout = this.player().options_.inactivityTimeout;
        }
        this.player().options_.inactivityTimeout = 0;
      });

      controlBar.on('mouseleave', function(event) {
        this.player().options_.inactivityTimeout = this.player().cache_.inactivityTimeout;
      });

    }

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

    this.setInterval(function() {
      // Check to see if mouse/touch activity has happened
      if (!this.userActivity_) {
        return;
      }

      // Reset the activity tracker
      this.userActivity_ = false;

      // If the user state was inactive, set the state to active
      this.userActive(true);

      // Clear any existing inactivity timeout to start the timer over
      this.clearTimeout(inactivityTimeout);

      const timeout = this.options_.inactivityTimeout;

      if (timeout <= 0) {
        return;
      }

      // In <timeout> milliseconds, if no more activity has occurred the
      // user will be considered inactive
      inactivityTimeout = this.setTimeout(function() {
        // Protect against the case where the inactivityTimeout can trigger just
        // before the next user activity is picked up by the activity check loop
        // causing a flicker
        if (!this.userActivity_) {
          this.userActive(false);
        }
      }, timeout);

    }, 250);
  }

  /**
   * Gets or sets the current playback rate. A playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed
   * playback, for instance.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
   *
   * @param {number} [rate]
   *       New playback rate to set.
   *
   * @return {number}
   *         The current playback rate when getting or 1.0
   */
  playbackRate(rate) {
    if (rate !== undefined) {
      // NOTE: this.cache_.lastPlaybackRate is set from the tech handler
      // that is registered above
      this.techCall_('setPlaybackRate', rate);
      return;
    }

    if (this.tech_ && this.tech_.featuresPlaybackRate) {
      return this.cache_.lastPlaybackRate || this.techGet_('playbackRate');
    }
    return 1.0;
  }

  /**
   * Gets or sets the current default playback rate. A default playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed playback, for instance.
   * defaultPlaybackRate will only represent what the initial playbackRate of a video was, not
   * not the current playbackRate.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-defaultplaybackrate
   *
   * @param {number} [rate]
   *       New default playback rate to set.
   *
   * @return {number|Player}
   *         - The default playback rate when getting or 1.0
   *         - the player when setting
   */
  defaultPlaybackRate(rate) {
    if (rate !== undefined) {
      return this.techCall_('setDefaultPlaybackRate', rate);
    }

    if (this.tech_ && this.tech_.featuresPlaybackRate) {
      return this.techGet_('defaultPlaybackRate');
    }
    return 1.0;
  }

  /**
   * Gets or sets the audio flag
   *
   * @param {boolean} bool
   *        - true signals that this is an audio player
   *        - false signals that this is not an audio player
   *
   * @return {boolean}
   *         The current value of isAudio when getting
   */
  isAudio(bool) {
    if (bool !== undefined) {
      this.isAudio_ = !!bool;
      return;
    }

    return !!this.isAudio_;
  }

  /**
   * A helper method for adding a {@link TextTrack} to our
   * {@link TextTrackList}.
   *
   * In addition to the W3C settings we allow adding additional info through options.
   *
   * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
   *
   * @param {string} [kind]
   *        the kind of TextTrack you are adding
   *
   * @param {string} [label]
   *        the label to give the TextTrack label
   *
   * @param {string} [language]
   *        the language to set on the TextTrack
   *
   * @return {TextTrack|undefined}
   *         the TextTrack that was added or undefined
   *         if there is no tech
   */
  addTextTrack(kind, label, language) {
    if (this.tech_) {
      return this.tech_.addTextTrack(kind, label, language);
    }
  }

  /**
   * Create a remote {@link TextTrack} and an {@link HTMLTrackElement}.
   * When manualCleanup is set to false, the track will be automatically removed
   * on source changes.
   *
   * @param {Object} options
   *        Options to pass to {@link HTMLTrackElement} during creation. See
   *        {@link HTMLTrackElement} for object properties that you should use.
   *
   * @param {boolean} [manualCleanup=true] if set to false, the TextTrack will be
   *                                       removed on a source change
   *
   * @return {HtmlTrackElement}
   *         the HTMLTrackElement that was created and added
   *         to the HtmlTrackElementList and the remote
   *         TextTrackList
   *
   * @deprecated The default value of the "manualCleanup" parameter will default
   *             to "false" in upcoming versions of Video.js
   */
  addRemoteTextTrack(options, manualCleanup) {
    if (this.tech_) {
      return this.tech_.addRemoteTextTrack(options, manualCleanup);
    }
  }

  /**
   * Remove a remote {@link TextTrack} from the respective
   * {@link TextTrackList} and {@link HtmlTrackElementList}.
   *
   * @param {Object} track
   *        Remote {@link TextTrack} to remove
   *
   * @return {undefined}
   *         does not return anything
   */
  removeRemoteTextTrack(obj = {}) {
    let {track} = obj;

    if (!track) {
      track = obj;
    }

    // destructure the input into an object with a track argument, defaulting to arguments[0]
    // default the whole argument to an empty object if nothing was passed in

    if (this.tech_) {
      return this.tech_.removeRemoteTextTrack(track);
    }
  }

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object|undefined}
   *         An object with supported media playback quality metrics or undefined if there
   *         is no tech or the tech does not support it.
   */
  getVideoPlaybackQuality() {
    return this.techGet_('getVideoPlaybackQuality');
  }

  /**
   * Get video width
   *
   * @return {number}
   *         current video width
   */
  videoWidth() {
    return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
  }

  /**
   * Get video height
   *
   * @return {number}
   *         current video height
   */
  videoHeight() {
    return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
  }

  /**
   * The player's language code.
   *
   * Changing the langauge will trigger
   * [languagechange]{@link Player#event:languagechange}
   * which Components can use to update control text.
   * ClickableComponent will update its control text by default on
   * [languagechange]{@link Player#event:languagechange}.
   *
   * @fires Player#languagechange
   *
   * @param {string} [code]
   *        the language code to set the player to
   *
   * @return {string}
   *         The current language code when getting
   */
  language(code) {
    if (code === undefined) {
      return this.language_;
    }

    if (this.language_ !== String(code).toLowerCase()) {
      this.language_ = String(code).toLowerCase();

      // during first init, it's possible some things won't be evented
      if (isEvented(this)) {
        /**
        * fires when the player language change
        *
        * @event Player#languagechange
        * @type {EventTarget~Event}
        */
        this.trigger('languagechange');
      }
    }
  }

  /**
   * Get the player's language dictionary
   * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
   * Languages specified directly in the player options have precedence
   *
   * @return {Array}
   *         An array of of supported languages
   */
  languages() {
    return mergeOptions(Player.prototype.options_.languages, this.languages_);
  }

  /**
   * returns a JavaScript object reperesenting the current track
   * information. **DOES not return it as JSON**
   *
   * @return {Object}
   *         Object representing the current of track info
   */
  toJSON() {
    const options = mergeOptions(this.options_);
    const tracks = options.tracks;

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
   * Creates a simple modal dialog (an instance of the {@link ModalDialog}
   * component) that immediately overlays the player with arbitrary
   * content and removes itself when closed.
   *
   * @param {string|Function|Element|Array|null} content
   *        Same as {@link ModalDialog#content}'s param of the same name.
   *        The most straight-forward usage is to provide a string or DOM
   *        element.
   *
   * @param {Object} [options]
   *        Extra options which will be passed on to the {@link ModalDialog}.
   *
   * @return {ModalDialog}
   *         the {@link ModalDialog} that was created
   */
  createModal(content, options) {
    options = options || {};
    options.content = content || '';

    const modal = new ModalDialog(this, options);

    this.addChild(modal);
    modal.on('dispose', () => {
      this.removeChild(modal);
    });

    modal.open();
    return modal;
  }

  /**
   * Change breakpoint classes when the player resizes.
   *
   * @private
   */
  updateCurrentBreakpoint_() {
    if (!this.responsive()) {
      return;
    }

    const currentBreakpoint = this.currentBreakpoint();
    const currentWidth = this.currentWidth();

    for (let i = 0; i < BREAKPOINT_ORDER.length; i++) {
      const candidateBreakpoint = BREAKPOINT_ORDER[i];
      const maxWidth = this.breakpoints_[candidateBreakpoint];

      if (currentWidth <= maxWidth) {

        // The current breakpoint did not change, nothing to do.
        if (currentBreakpoint === candidateBreakpoint) {
          return;
        }

        // Only remove a class if there is a current breakpoint.
        if (currentBreakpoint) {
          this.removeClass(BREAKPOINT_CLASSES[currentBreakpoint]);
        }

        this.addClass(BREAKPOINT_CLASSES[candidateBreakpoint]);
        this.breakpoint_ = candidateBreakpoint;
        break;
      }
    }
  }

  /**
   * Removes the current breakpoint.
   *
   * @private
   */
  removeCurrentBreakpoint_() {
    const className = this.currentBreakpointClass();

    this.breakpoint_ = '';

    if (className) {
      this.removeClass(className);
    }
  }

  /**
   * Get or set breakpoints on the player.
   *
   * Calling this method with an object or `true` will remove any previous
   * custom breakpoints and start from the defaults again.
   *
   * @param  {Object|boolean} [breakpoints]
   *         If an object is given, it can be used to provide custom
   *         breakpoints. If `true` is given, will set default breakpoints.
   *         If this argument is not given, will simply return the current
   *         breakpoints.
   *
   * @param  {number} [breakpoints.tiny]
   *         The maximum width for the "vjs-layout-tiny" class.
   *
   * @param  {number} [breakpoints.xsmall]
   *         The maximum width for the "vjs-layout-x-small" class.
   *
   * @param  {number} [breakpoints.small]
   *         The maximum width for the "vjs-layout-small" class.
   *
   * @param  {number} [breakpoints.medium]
   *         The maximum width for the "vjs-layout-medium" class.
   *
   * @param  {number} [breakpoints.large]
   *         The maximum width for the "vjs-layout-large" class.
   *
   * @param  {number} [breakpoints.xlarge]
   *         The maximum width for the "vjs-layout-x-large" class.
   *
   * @param  {number} [breakpoints.huge]
   *         The maximum width for the "vjs-layout-huge" class.
   *
   * @return {Object}
   *         An object mapping breakpoint names to maximum width values.
   */
  breakpoints(breakpoints) {

    // Used as a getter.
    if (breakpoints === undefined) {
      return assign(this.breakpoints_);
    }

    this.breakpoint_ = '';
    this.breakpoints_ = assign({}, DEFAULT_BREAKPOINTS, breakpoints);

    // When breakpoint definitions change, we need to update the currently
    // selected breakpoint.
    this.updateCurrentBreakpoint_();

    // Clone the breakpoints before returning.
    return assign(this.breakpoints_);
  }

  /**
   * Get or set a flag indicating whether or not this player should adjust
   * its UI based on its dimensions.
   *
   * @param  {boolean} value
   *         Should be `true` if the player should adjust its UI based on its
   *         dimensions; otherwise, should be `false`.
   *
   * @return {boolean}
   *         Will be `true` if this player should adjust its UI based on its
   *         dimensions; otherwise, will be `false`.
   */
  responsive(value) {

    // Used as a getter.
    if (value === undefined) {
      return this.responsive_;
    }

    value = Boolean(value);
    const current = this.responsive_;

    // Nothing changed.
    if (value === current) {
      return;
    }

    // The value actually changed, set it.
    this.responsive_ = value;

    // Start listening for breakpoints and set the initial breakpoint if the
    // player is now responsive.
    if (value) {
      this.on('playerresize', this.boundUpdateCurrentBreakpoint_);
      this.updateCurrentBreakpoint_();

    // Stop listening for breakpoints if the player is no longer responsive.
    } else {
      this.off('playerresize', this.boundUpdateCurrentBreakpoint_);
      this.removeCurrentBreakpoint_();
    }

    return value;
  }

  /**
   * Get current breakpoint name, if any.
   *
   * @return {string}
   *         If there is currently a breakpoint set, returns a the key from the
   *         breakpoints object matching it. Otherwise, returns an empty string.
   */
  currentBreakpoint() {
    return this.breakpoint_;
  }

  /**
   * Get the current breakpoint class name.
   *
   * @return {string}
   *         The matching class name (e.g. `"vjs-layout-tiny"` or
   *         `"vjs-layout-large"`) for the current breakpoint. Empty string if
   *         there is no current breakpoint.
   */
  currentBreakpointClass() {
    return BREAKPOINT_CLASSES[this.breakpoint_] || '';
  }

  /**
   * An object that describes a single piece of media.
   *
   * Properties that are not part of this type description will be retained; so,
   * this can be viewed as a generic metadata storage mechanism as well.
   *
   * @see      {@link https://wicg.github.io/mediasession/#the-mediametadata-interface}
   * @typedef  {Object} Player~MediaObject
   *
   * @property {string} [album]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {string} [artist]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {Object[]} [artwork]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API. If not specified, will be populated via the `poster`, if
   *           available.
   *
   * @property {string} [poster]
   *           URL to an image that will display before playback.
   *
   * @property {Tech~SourceObject|Tech~SourceObject[]|string} [src]
   *           A single source object, an array of source objects, or a string
   *           referencing a URL to a media source. It is _highly recommended_
   *           that an object or array of objects is used here, so that source
   *           selection algorithms can take the `type` into account.
   *
   * @property {string} [title]
   *           Unused, except if this object is passed to the `MediaSession`
   *           API.
   *
   * @property {Object[]} [textTracks]
   *           An array of objects to be used to create text tracks, following
   *           the {@link https://www.w3.org/TR/html50/embedded-content-0.html#the-track-element|native track element format}.
   *           For ease of removal, these will be created as "remote" text
   *           tracks and set to automatically clean up on source changes.
   *
   *           These objects may have properties like `src`, `kind`, `label`,
   *           and `language`, see {@link Tech#createRemoteTextTrack}.
   */

  /**
   * Populate the player using a {@link Player~MediaObject|MediaObject}.
   *
   * @param  {Player~MediaObject} media
   *         A media object.
   *
   * @param  {Function} ready
   *         A callback to be called when the player is ready.
   */
  loadMedia(media, ready) {
    if (!media || typeof media !== 'object') {
      return;
    }

    this.reset();

    // Clone the media object so it cannot be mutated from outside.
    this.cache_.media = mergeOptions(media);

    const {artwork, poster, src, textTracks} = this.cache_.media;

    // If `artwork` is not given, create it using `poster`.
    if (!artwork && poster) {
      this.cache_.media.artwork = [{
        src: poster,
        type: getMimetype(poster)
      }];
    }

    if (src) {
      this.src(src);
    }

    if (poster) {
      this.poster(poster);
    }

    if (Array.isArray(textTracks)) {
      textTracks.forEach(tt => this.addRemoteTextTrack(tt, false));
    }

    this.ready(ready);
  }

  /**
   * Get a clone of the current {@link Player~MediaObject} for this player.
   *
   * If the `loadMedia` method has not been used, will attempt to return a
   * {@link Player~MediaObject} based on the current state of the player.
   *
   * @return {Player~MediaObject}
   */
  getMedia() {
    if (!this.cache_.media) {
      const poster = this.poster();
      const src = this.currentSources();
      const textTracks = Array.prototype.map.call(this.remoteTextTracks(), (tt) => ({
        kind: tt.kind,
        label: tt.label,
        language: tt.language,
        src: tt.src
      }));

      const media = {src, textTracks};

      if (poster) {
        media.poster = poster;
        media.artwork = [{
          src: media.poster,
          type: getMimetype(media.poster)
        }];
      }

      return media;
    }

    return mergeOptions(this.cache_.media);
  }

  /**
   * Gets tag settings
   *
   * @param {Element} tag
   *        The player tag
   *
   * @return {Object}
   *         An object containing all of the settings
   *         for a player tag
   */
  static getTagSettings(tag) {
    const baseOptions = {
      sources: [],
      tracks: []
    };

    const tagOptions = Dom.getAttributes(tag);
    const dataSetup = tagOptions['data-setup'];

    if (Dom.hasClass(tag, 'vjs-fill')) {
      tagOptions.fill = true;
    }
    if (Dom.hasClass(tag, 'vjs-fluid')) {
      tagOptions.fluid = true;
    }

    // Check if data-setup attr exists.
    if (dataSetup !== null) {
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

      for (let i = 0, j = children.length; i < j; i++) {
        const child = children[i];
        // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
        const childName = child.nodeName.toLowerCase();

        if (childName === 'source') {
          baseOptions.sources.push(Dom.getAttributes(child));
        } else if (childName === 'track') {
          baseOptions.tracks.push(Dom.getAttributes(child));
        }
      }
    }

    return baseOptions;
  }

  /**
   * Determine whether or not flexbox is supported
   *
   * @return {boolean}
   *         - true if flexbox is supported
   *         - false if flexbox is not supported
   */
  flexNotSupported_() {
    const elem = document.createElement('i');

    // Note: We don't actually use flexBasis (or flexOrder), but it's one of the more
    // common flex features that we can rely on when checking for flex support.
    return !('flexBasis' in elem.style ||
            'webkitFlexBasis' in elem.style ||
            'mozFlexBasis' in elem.style ||
            'msFlexBasis' in elem.style ||
            // IE10-specific (2012 flex spec), available for completeness
            'msFlexOrder' in elem.style);
  }

  /**
   * Set debug mode to enable/disable logs at info level.
   *
   * @param {boolean} enabled
   * @fires Player#debugon
   * @fires Player#debugoff
   */
  debug(enabled) {
    if (enabled === undefined) {
      return this.debugEnabled_;
    }
    if (enabled) {
      this.trigger('debugon');
      this.previousLogLevel_ = this.log.level;
      this.log.level('debug');
      this.debugEnabled_ = true;
    } else {
      this.trigger('debugoff');
      this.log.level(this.previousLogLevel_);
      this.previousLogLevel_ = undefined;
      this.debugEnabled_ = false;
    }

  }

  /**
   * Set or get current playback rates.
   * Takes an array and updates the playback rates menu with the new items.
   * Pass in an empty array to hide the menu.
   * Values other than arrays are ignored.
   *
   * @fires Player#playbackrateschange
   * @param {number[]} newRates
   *                   The new rates that the playback rates menu should update to.
   *                   An empty array will hide the menu
   * @return {number[]} When used as a getter will return the current playback rates
   */
  playbackRates(newRates) {
    if (newRates === undefined) {
      return this.cache_.playbackRates;
    }

    // ignore any value that isn't an array
    if (!Array.isArray(newRates)) {
      return;
    }

    // ignore any arrays that don't only contain numbers
    if (!newRates.every((rate) => typeof rate === 'number')) {
      return;
    }

    this.cache_.playbackRates = newRates;

    /**
    * fires when the playback rates in a player are changed
    *
    * @event Player#playbackrateschange
    * @type {EventTarget~Event}
    */
    this.trigger('playbackrateschange');
  }
}

/**
 * Get the {@link VideoTrackList}
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
 *
 * @return {VideoTrackList}
 *         the current video track list
 *
 * @method Player.prototype.videoTracks
 */

/**
 * Get the {@link AudioTrackList}
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
 *
 * @return {AudioTrackList}
 *         the current audio track list
 *
 * @method Player.prototype.audioTracks
 */

/**
 * Get the {@link TextTrackList}
 *
 * @link http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 *
 * @return {TextTrackList}
 *         the current text track list
 *
 * @method Player.prototype.textTracks
 */

/**
 * Get the remote {@link TextTrackList}
 *
 * @return {TextTrackList}
 *         The current remote text track list
 *
 * @method Player.prototype.remoteTextTracks
 */

/**
 * Get the remote {@link HtmlTrackElementList} tracks.
 *
 * @return {HtmlTrackElementList}
 *         The current remote text track element list
 *
 * @method Player.prototype.remoteTextTrackEls
 */

TRACK_TYPES.names.forEach(function(name) {
  const props = TRACK_TYPES[name];

  Player.prototype[props.getterName] = function() {
    if (this.tech_) {
      return this.tech_[props.getterName]();
    }

    // if we have not yet loadTech_, we create {video,audio,text}Tracks_
    // these will be passed to the tech during loading
    this[props.privateName] = this[props.privateName] || new props.ListClass();
    return this[props.privateName];
  };
});

/**
 * Get or set the `Player`'s crossorigin option. For the HTML5 player, this
 * sets the `crossOrigin` property on the `<video>` tag to control the CORS
 * behavior.
 *
 * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
 *
 * @param {string} [value]
 *        The value to set the `Player`'s crossorigin to. If an argument is
 *        given, must be one of `anonymous` or `use-credentials`.
 *
 * @return {string|undefined}
 *         - The current crossorigin value of the `Player` when getting.
 *         - undefined when setting
 */
Player.prototype.crossorigin = Player.prototype.crossOrigin;

/**
 * Global enumeration of players.
 *
 * The keys are the player IDs and the values are either the {@link Player}
 * instance or `null` for disposed players.
 *
 * @type {Object}
 */
Player.players = {};

const navigator = window.navigator;

/*
 * Player instance options, surfaced using options
 * options = Player.prototype.options_
 * Make changes in options, not here.
 *
 * @type {Object}
 * @private
 */
Player.prototype.options_ = {
  // Default order of fallback technology
  techOrder: Tech.defaultTechOrder_,

  html5: {},

  // default inactivity timeout
  inactivityTimeout: 2000,

  // default playback rates
  playbackRates: [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],
  liveui: false,

  // Included control sets
  children: [
    'mediaLoader',
    'posterImage',
    'textTrackDisplay',
    'loadingSpinner',
    'bigPlayButton',
    'liveTracker',
    'controlBar',
    'errorDisplay',
    'textTrackSettings',
    'resizeManager'
  ],

  language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',

  // locales and their language translations
  languages: {},

  // Default message to show when a video cannot be played.
  notSupportedMessage: 'No compatible source was found for this media.',

  normalizeAutoplay: false,

  fullscreen: {
    options: {
      navigationUI: 'hide'
    }
  },

  breakpoints: {},
  responsive: false
};

[
  /**
   * Returns whether or not the player is in the "ended" state.
   *
   * @return {Boolean} True if the player is in the ended state, false if not.
   * @method Player#ended
   */
  'ended',
  /**
   * Returns whether or not the player is in the "seeking" state.
   *
   * @return {Boolean} True if the player is in the seeking state, false if not.
   * @method Player#seeking
   */
  'seeking',
  /**
   * Returns the TimeRanges of the media that are currently available
   * for seeking to.
   *
   * @return {TimeRanges} the seekable intervals of the media timeline
   * @method Player#seekable
   */
  'seekable',
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
   * @return {number} the current network activity state
   * @method Player#networkState
   */
  'networkState',
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
   * @return {number} the current playback rendering state
   * @method Player#readyState
   */
  'readyState'
].forEach(function(fn) {
  Player.prototype[fn] = function() {
    return this.techGet_(fn);
  };
});

TECH_EVENTS_RETRIGGER.forEach(function(event) {
  Player.prototype[`handleTech${toTitleCase(event)}_`] = function() {
    return this.trigger(event);
  };
});

/**
 * Fired when the player has initial duration and dimension information
 *
 * @event Player#loadedmetadata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the player has downloaded data at the current playback position
 *
 * @event Player#loadeddata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the current playback position has changed *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 *
 * @event Player#timeupdate
 * @type {EventTarget~Event}
 */

/**
 * Fired when the volume changes
 *
 * @event Player#volumechange
 * @type {EventTarget~Event}
 */

/**
 * Reports whether or not a player has a plugin available.
 *
 * This does not report whether or not the plugin has ever been initialized
 * on this player. For that, [usingPlugin]{@link Player#usingPlugin}.
 *
 * @method Player#hasPlugin
 * @param  {string}  name
 *         The name of a plugin.
 *
 * @return {boolean}
 *         Whether or not this player has the requested plugin available.
 */

/**
 * Reports whether or not a player is using a plugin by name.
 *
 * For basic plugins, this only reports whether the plugin has _ever_ been
 * initialized on this player.
 *
 * @method Player#usingPlugin
 * @param  {string} name
 *         The name of a plugin.
 *
 * @return {boolean}
 *         Whether or not this player is using the requested plugin.
 */

Component.registerComponent('Player', Player);
export default Player;
