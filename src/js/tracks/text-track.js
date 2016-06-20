/**
 * @file text-track.js
 */
import TextTrackCueList from './text-track-cue-list';
import * as Fn from '../utils/fn.js';
import {TextTrackKind, TextTrackMode} from './track-enums';
import log from '../utils/log.js';
import document from 'global/document';
import window from 'global/window';
import Track from './track.js';
import { isCrossOrigin } from '../utils/url.js';
import XHR from 'xhr';
import merge from '../utils/merge-options';
import * as browser from '../utils/browser.js';

/**
 * takes a webvtt file contents and parses it into cues
 *
 * @param {String} srcContent webVTT file contents
 * @param {Track} track track to addcues to
 */
const parseCues = function(srcContent, track) {
  let parser = new window.WebVTT.Parser(window,
                                        window.vttjs,
                                        window.WebVTT.StringDecoder());
  let errors = [];

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
    if (console.groupCollapsed) {
      console.groupCollapsed(`Text Track parsing errors for ${track.src}`);
    }
    errors.forEach((error) => log.error(error));
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * load a track from a  specifed url
 *
 * @param {String} src url to load track from
 * @param {Track} track track to addcues to
 */
const loadTrack = function(src, track) {
  let opts = {
    uri: src
  };
  let crossOrigin = isCrossOrigin(src);

  if (crossOrigin) {
    opts.cors = crossOrigin;
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
        let loadHandler = () => parseCues(responseBody, track);
        track.tech_.on('vttjsloaded', loadHandler);
        track.tech_.on('vttjserror', () => {
          log.error(`vttjs failed to load, stopping trying to process ${track.src}`);
          track.tech_.off('vttjsloaded', loadHandler);
        });

      }
    } else {
      parseCues(responseBody, track);
    }

  }));
};

/**
 * A single text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack
 *
 * interface TextTrack : EventTarget {
 *   readonly attribute TextTrackKind kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString inBandMetadataTrackDispatchType;
 *
 *   attribute TextTrackMode mode;
 *
 *   readonly attribute TextTrackCueList? cues;
 *   readonly attribute TextTrackCueList? activeCues;
 *
 *   void addCue(TextTrackCue cue);
 *   void removeCue(TextTrackCue cue);
 *
 *   attribute EventHandler oncuechange;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @extends Track
 * @class TextTrack
 */
class TextTrack extends Track {
  constructor(options = {}) {
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    let settings = merge(options, {
      kind: TextTrackKind[options.kind] || 'subtitles',
      language: options.language || options.srclang || ''
    });
    let mode = TextTrackMode[settings.mode] || 'disabled';
    let default_ = settings.default;

    if (settings.kind === 'metadata' || settings.kind === 'chapters') {
      mode = 'hidden';
    }
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let tt = super(settings);
    tt.tech_ = settings.tech;

    if (browser.IS_IE8) {
      for (let prop in TextTrack.prototype) {
        if (prop !== 'constructor') {
          tt[prop] = TextTrack.prototype[prop];
        }
      }
    }

    tt.cues_ = [];
    tt.activeCues_ = [];

    let cues = new TextTrackCueList(tt.cues_);
    let activeCues = new TextTrackCueList(tt.activeCues_);
    let changed = false;
    let timeupdateHandler = Fn.bind(tt, function() {
      this.activeCues;
      if (changed) {
        this.trigger('cuechange');
        changed = false;
      }
    });

    if (mode !== 'disabled') {
      tt.tech_.on('timeupdate', timeupdateHandler);
    }

    Object.defineProperty(tt, 'default', {
      get() {
        return default_;
      },
      set() {}
    });

    Object.defineProperty(tt, 'mode', {
      get() {
        return mode;
      },
      set(newMode) {
        if (!TextTrackMode[newMode]) {
          return;
        }
        mode = newMode;
        if (mode === 'showing') {
          this.tech_.on('timeupdate', timeupdateHandler);
        }
        this.trigger('modechange');
      }
    });

    Object.defineProperty(tt, 'cues', {
      get() {
        if (!this.loaded_) {
          return null;
        }

        return cues;
      },
      set() {}
    });

    Object.defineProperty(tt, 'activeCues', {
      get() {
        if (!this.loaded_) {
          return null;
        }

        // nothing to do
        if (this.cues.length === 0) {
          return activeCues;
        }

        let ct = this.tech_.currentTime();
        let active = [];

        for (let i = 0, l = this.cues.length; i < l; i++) {
          let cue = this.cues[i];

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
      set() {}
    });

    if (settings.src) {
      tt.src = settings.src;
      loadTrack(settings.src, tt);
    } else {
      tt.loaded_ = true;
    }

    return tt;
  }

  /**
   * add a cue to the internal list of cues
   *
   * @param {Object} cue the cue to add to our internal list
   * @method addCue
   */
  addCue(cue) {
    let tracks = this.tech_.textTracks();

    if (tracks) {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i] !== this) {
          tracks[i].removeCue(cue);
        }
      }
    }

    this.cues_.push(cue);
    this.cues.setCues_(this.cues_);
  }

  /**
   * remvoe a cue from our internal list
   *
   * @param {Object} removeCue the cue to remove from our internal list
   * @method removeCue
   */
  removeCue(removeCue) {
    let removed = false;

    for (let i = 0, l = this.cues_.length; i < l; i++) {
      let cue = this.cues_[i];

      if (cue === removeCue) {
        this.cues_.splice(i, 1);
        removed = true;
      }
    }

    if (removed) {
      this.cues.setCues_(this.cues_);
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
