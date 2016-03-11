/**
 * @file audio-track.js
 */
import * as Fn from '../../utils/fn.js';
import * as Guid from '../../utils/guid.js';
import * as browser from '../../utils/browser.js';
import * as AudioTrackEnum from './audio-track-enums';
import EventTarget from '../../event-target';
import document from 'global/document';

/**
 * A single text track as defined in:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack
 *
 * interface AudioTrack : EventTarget {
 *   readonly attribute DOMString kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *
 *   readonly attribute DOMString id;
 *
 *   attribute boolean enabled;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @extends EventTarget
 * @class AudioTrack
 */
class AudioTrack extends EventTarget {
  constructor(options = {}) {
    super();
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    let tt = this;

    if (browser.IS_IE8) {
      tt = document.createElement('custom');

      for (let prop in AudioTrack.prototype) {
        if (prop !== 'constructor') {
          tt[prop] = AudioTrack.prototype[prop];
        }
      }
    }

    tt.tech_ = options.tech;
    let enabled = false;
    let kind = AudioTrackEnum.AudioTrackKind[options.kind] || 'translation';
    let label = options.label || '';
    let language = options.language || options.srclang || '';
    let id = options.id || 'vjs_audio_track_' + Guid.newGUID();

    Object.defineProperty(tt, 'kind', {
      get() {
        return kind;
      },
      set() {
      }
    });

    Object.defineProperty(tt, 'label', {
      get() {
        return label;
      },
      set() {
      }
    });

    Object.defineProperty(tt, 'language', {
      get() {
        return language;
      },
      set() {
      }
    });

    Object.defineProperty(tt, 'id', {
      get() {
        return id;
      },
      set() {
      }
    });

    Object.defineProperty(tt, 'enabled', {
      get() {
        return enabled;
      },
      set(value) {
        enabled = value;
        this.trigger('enabledchange');
      }
    });

    if (browser.IS_IE8) {
      return tt;
    }
  }

}

/**
 * cuechange - One or more cues in the track have become active or stopped being active.
 */
AudioTrack.prototype.allowedEvents_ = {
  enabledchange: 'enabledchange'
};

export default AudioTrack;
