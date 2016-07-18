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

    let track = this;
    if (browser.IS_IE8) {
      track = document.createElement('custom');
      for (let prop in Track.prototype) {
        if (prop !== 'constructor') {
          track[prop] = Track.prototype[prop];
        }
      }
    }

    let trackProps = {
      id: options.id || 'vjs_track_' + Guid.newGUID(),
      kind: options.kind || '',
      label: options.label || '',
      language: options.language || ''
    };

    for (let key in trackProps) {
      Object.defineProperty(track, key, {
        get() { return trackProps[key]; },
        set() {}
      });
    }

    return track;
  }
}

export default Track;
