/**
 * @file text-track.js
 */
import TextTrackCueList from './text-track-cue-list';
import * as Fn from '../utils/fn.js';
import {TextTrackKind, TextTrackMode} from './track-enums';
import log from '../utils/log.js';
import window from 'global/window';
import Track from './track.js';
import { isCrossOrigin } from '../utils/url.js';
import XHR from '@videojs/xhr';
import merge from '../utils/merge-options';

/**
 * Takes a webvtt file contents and parses it into cues
 *
 * @param {string} srcContent
 *        webVTT file contents
 *
 * @param {TextTrack} track
 *        TextTrack to add cues to. Cues come from the srcContent.
 *
 * @private
 */
const parseCues = function(srcContent, track) {
  const parser = new window.WebVTT.Parser(
    window,
    window.vttjs,
    window.WebVTT.StringDecoder()
  );
  const errors = [];

  parser.oncue = function(cue) {
    track.addCue(cue);
  };

  parser.onparsingerror = function(error) {
    errors.push(error);
  };

  parser.onflush = function() {
    track.trigger({
      type: 'loadeddata',
      target: track
    });
  };

  parser.parse(srcContent);
  if (errors.length > 0) {
    if (window.console && window.console.groupCollapsed) {
      window.console.groupCollapsed(`Text Track parsing errors for ${track.src}`);
    }
    errors.forEach((error) => log.error(error));
    if (window.console && window.console.groupEnd) {
      window.console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * Load a `TextTrack` from a specified url.
 *
 * @param {string} src
 *        Url to load track from.
 *
 * @param {TextTrack} track
 *        Track to add cues to. Comes from the content at the end of `url`.
 *
 * @private
 */
const loadTrack = function(src, track) {
  const opts = {
    uri: src
  };
  const crossOrigin = isCrossOrigin(src);

  if (crossOrigin) {
    opts.cors = crossOrigin;
  }

  const withCredentials = track.tech_.crossOrigin() === 'use-credentials';

  if (withCredentials) {
    opts.withCredentials = withCredentials;
  }

  XHR(opts, Fn.bind(this, function(err, response, responseBody) {
    if (err) {
      return log.error(err, response);
    }

    track.loaded_ = true;

    // Make sure that vttjs has loaded, otherwise, wait till it finished loading
    // NOTE: this is only used for the alt/video.novtt.js build
    if (typeof window.WebVTT !== 'function') {
      if (track.tech_) {
        // to prevent use before define eslint error, we define loadHandler
        // as a let here
        track.tech_.any(['vttjsloaded', 'vttjserror'], (event) => {
          if (event.type === 'vttjserror') {
            log.error(`vttjs failed to load, stopping trying to process ${track.src}`);
            return;
          }
          return parseCues(responseBody, track);
        });
      }
    } else {
      parseCues(responseBody, track);
    }

  }));
};

/**
 * A representation of a single `TextTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
 * @extends Track
 */
class TextTrack extends Track {

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this TextTrack.
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {string} [options.srclang='']
   *        A valid two character language code. An alternative, but deprioritized
   *        version of `options.language`
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   */
  constructor(options = {}) {
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    const settings = merge(options, {
      kind: TextTrackKind[options.kind] || 'subtitles',
      language: options.language || options.srclang || ''
    });
    let mode = TextTrackMode[settings.mode] || 'disabled';
    const default_ = settings.default;

    if (settings.kind === 'metadata' || settings.kind === 'chapters') {
      mode = 'hidden';
    }
    super(settings);

    this.tech_ = settings.tech;

    this.cues_ = [];
    this.activeCues_ = [];

    this.preload_ = this.tech_.preloadTextTracks !== false;

    const cues = new TextTrackCueList(this.cues_);
    const activeCues = new TextTrackCueList(this.activeCues_);
    let changed = false;
    const timeupdateHandler = Fn.bind(this, function() {
      if (!this.tech_.isReady_ || this.tech_.isDisposed()) {
        return;

      }
      // Accessing this.activeCues for the side-effects of updating itself
      // due to its nature as a getter function. Do not remove or cues will
      // stop updating!
      // Use the setter to prevent deletion from uglify (pure_getters rule)
      this.activeCues = this.activeCues;
      if (changed) {
        this.trigger('cuechange');
        changed = false;
      }
    });

    const disposeHandler = () => {
      this.tech_.off('timeupdate', timeupdateHandler);
    };

    this.tech_.one('dispose', disposeHandler);
    if (mode !== 'disabled') {
      this.tech_.on('timeupdate', timeupdateHandler);
    }

    Object.defineProperties(this, {
      /**
       * @memberof TextTrack
       * @member {boolean} default
       *         If this track was set to be on or off by default. Cannot be changed after
       *         creation.
       * @instance
       *
       * @readonly
       */
      default: {
        get() {
          return default_;
        },
        set() {}
      },

      /**
       * @memberof TextTrack
       * @member {string} mode
       *         Set the mode of this TextTrack to a valid {@link TextTrack~Mode}. Will
       *         not be set if setting to an invalid mode.
       * @instance
       *
       * @fires TextTrack#modechange
       */
      mode: {
        get() {
          return mode;
        },
        set(newMode) {
          if (!TextTrackMode[newMode]) {
            return;
          }
          if (mode === newMode) {
            return;
          }

          mode = newMode;
          if (!this.preload_ && mode !== 'disabled' && this.cues.length === 0) {
            // On-demand load.
            loadTrack(this.src, this);
          }
          this.tech_.off('timeupdate', timeupdateHandler);

          if (mode !== 'disabled') {
            this.tech_.on('timeupdate', timeupdateHandler);
          }
          /**
           * An event that fires when mode changes on this track. This allows
           * the TextTrackList that holds this track to act accordingly.
           *
           * > Note: This is not part of the spec!
           *
           * @event TextTrack#modechange
           * @type {EventTarget~Event}
           */
          this.trigger('modechange');

        }
      },

      /**
       * @memberof TextTrack
       * @member {TextTrackCueList} cues
       *         The text track cue list for this TextTrack.
       * @instance
       */
      cues: {
        get() {
          if (!this.loaded_) {
            return null;
          }

          return cues;
        },
        set() {}
      },

      /**
       * @memberof TextTrack
       * @member {TextTrackCueList} activeCues
       *         The list text track cues that are currently active for this TextTrack.
       * @instance
       */
      activeCues: {
        get() {
          if (!this.loaded_) {
            return null;
          }

          // nothing to do
          if (this.cues.length === 0) {
            return activeCues;
          }

          const ct = this.tech_.currentTime();
          const active = [];

          for (let i = 0, l = this.cues.length; i < l; i++) {
            const cue = this.cues[i];

            if (cue.startTime <= ct && cue.endTime >= ct) {
              active.push(cue);
            } else if (cue.startTime === cue.endTime &&
                       cue.startTime <= ct &&
                       cue.startTime + 0.5 >= ct) {
              active.push(cue);
            }
          }

          changed = false;

          if (active.length !== this.activeCues_.length) {
            changed = true;
          } else {
            for (let i = 0; i < active.length; i++) {
              if (this.activeCues_.indexOf(active[i]) === -1) {
                changed = true;
              }
            }
          }

          this.activeCues_ = active;
          activeCues.setCues_(this.activeCues_);

          return activeCues;
        },

        // /!\ Keep this setter empty (see the timeupdate handler above)
        set() {}
      }
    });

    if (settings.src) {
      this.src = settings.src;
      if (!this.preload_) {
        // Tracks will load on-demand.
        // Act like we're loaded for other purposes.
        this.loaded_ = true;
      }
      if (this.preload_ || (settings.kind !== 'subtitles' && settings.kind !== 'captions')) {
        loadTrack(this.src, this);
      }
    } else {
      this.loaded_ = true;
    }
  }

  /**
   * Add a cue to the internal list of cues.
   *
   * @param {TextTrack~Cue} cue
   *        The cue to add to our internal list
   */
  addCue(originalCue) {
    let cue = originalCue;

    if (window.vttjs && !(originalCue instanceof window.vttjs.VTTCue)) {
      cue = new window.vttjs.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);

      for (const prop in originalCue) {
        if (!(prop in cue)) {
          cue[prop] = originalCue[prop];
        }
      }

      // make sure that `id` is copied over
      cue.id = originalCue.id;
      cue.originalCue_ = originalCue;
    }

    const tracks = this.tech_.textTracks();

    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i] !== this) {
        tracks[i].removeCue(cue);
      }
    }

    this.cues_.push(cue);
    this.cues.setCues_(this.cues_);
  }

  /**
   * Remove a cue from our internal list
   *
   * @param {TextTrack~Cue} removeCue
   *        The cue to remove from our internal list
   */
  removeCue(removeCue) {
    let i = this.cues_.length;

    while (i--) {
      const cue = this.cues_[i];

      if (cue === removeCue || (cue.originalCue_ && cue.originalCue_ === removeCue)) {
        this.cues_.splice(i, 1);
        this.cues.setCues_(this.cues_);
        break;
      }
    }
  }
}

/**
 * cuechange - One or more cues in the track have become active or stopped being active.
 */
TextTrack.prototype.allowedEvents_ = {
  cuechange: 'cuechange'
};

export default TextTrack;
