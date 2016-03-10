/**
 * @file track.js
 */
import * as browser from '../utils/browser.js';
import document from 'global/document';
import * as Guid from '../utils/guid.js';
import EventTarget from '../event-target';

/**
 * setup the common parts of an audio, video, or text track
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html
 *
 * @param {String} type The type of track we are dealing with audio|video|text
 * @param {Object=} options Object of option names and values
 * @extends EventTarget
 * @class Track
 */
class Track extends EventTarget {
  constructor(options = {}) {
    super();
    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    let track = this;
    let type = options.trackType || 'generic';
    if (browser.IS_IE8) {
      track = document.createElement('custom_' + type);

      for (let prop in track.prototype) {
        if (prop !== 'constructor') {
          track[prop] = track.prototype[prop];
        }
      }
    }
    track.tech_ = options.tech;

    let id = options.id || 'vjs_' + type + '_track_' + Guid.newGUID();
    let kind = options.kind || '';
    let label = options.label || '';
    let language = options.language || '';

    Object.defineProperties(track, {
      kind: {
        get() { return kind; },
        set() {}
      },
      label: {
        get() { return label; },
        set() {}
      },
      language: {
        get() { return language; },
        set() {}
      },
      id: {
        get() { return id; },
        set() {}
      }
    });

    if (browser.IS_IE8) {
      return track;
    }
  }
}

export default Track;
