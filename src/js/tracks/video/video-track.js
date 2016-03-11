/**
 * @file video-track.js
 */
import * as Fn from '../../utils/fn.js';
import * as Guid from '../../utils/guid.js';
import * as browser from '../../utils/browser.js';
import * as VideoTrackEnum from './video-track-enums';
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
class VideoTrack extends EventTarget {
  constructor(options = {}) {
    super();
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    let tt = this;

    if (browser.IS_IE8) {
      tt = document.createElement('custom');

      for (let prop in VideoTrack.prototype) {
        if (prop !== 'constructor') {
          tt[prop] = VideoTrack.prototype[prop];
        }
      }
    }

    tt.tech_ = options.tech;
    let selected = false;
    let kind = VideoTrackEnum.VideoTrackKind[options.kind] || 'translation';
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

    Object.defineProperty(tt, 'selected', {
      get() {
        return selected;
      },
      set(value) {
        selected = value;
        this.trigger('change');
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
VideoTrack.prototype.allowedEvents_ = {
  change: 'change'
};

export default VideoTrack;
