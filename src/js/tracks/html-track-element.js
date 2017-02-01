/**
 * @file html-track-element.js
 */

import * as browser from '../utils/browser.js';
import document from 'global/document';
import EventTarget from '../event-target';
import TextTrack from '../tracks/text-track';

/**
 * @memberof HTMLTrackElement
 * @typedef {HTMLTrackElement~ReadyState}
 * @enum {number}
 */
const NONE = 0;
const LOADING = 1;
const LOADED = 2;
const ERROR = 3;

/**
 * A single track represented in the DOM.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement}
 * @extends EventTarget
 */
class HTMLTrackElement extends EventTarget {

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this HTMLTrackElement.
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
   *        vesion of `options.language`
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   */
  constructor(options = {}) {
    super();

    let readyState;
    let trackElement = this; // eslint-disable-line

    if (browser.IS_IE8) {
      trackElement = document.createElement('custom');

      for (const prop in HTMLTrackElement.prototype) {
        if (prop !== 'constructor') {
          trackElement[prop] = HTMLTrackElement.prototype[prop];
        }
      }
    }

    const track = new TextTrack(options);

    trackElement.kind = track.kind;
    trackElement.src = track.src;
    trackElement.srclang = track.language;
    trackElement.label = track.label;
    trackElement.default = track.default;

    /**
     * @memberof HTMLTrackElement
     * @member {HTMLTrackElement~ReadyState} readyState
     *         The current ready state of the track element.
     * @instance
     */
    Object.defineProperty(trackElement, 'readyState', {
      get() {
        return readyState;
      }
    });

    /**
     * @memberof HTMLTrackElement
     * @member {TextTrack} track
     *         The underlying TextTrack object.
     * @instance
     *
     */
    Object.defineProperty(trackElement, 'track', {
      get() {
        return track;
      }
    });

    readyState = NONE;

    /**
     * @listens TextTrack#loadeddata
     * @fires HTMLTrackElement#load
     */
    track.addEventListener('loadeddata', function() {
      readyState = LOADED;

      trackElement.trigger({
        type: 'load',
        target: trackElement
      });
    });

    if (browser.IS_IE8) {
      return trackElement;
    }
  }
}

HTMLTrackElement.prototype.allowedEvents_ = {
  load: 'load'
};

HTMLTrackElement.NONE = NONE;
HTMLTrackElement.LOADING = LOADING;
HTMLTrackElement.LOADED = LOADED;
HTMLTrackElement.ERROR = ERROR;

export default HTMLTrackElement;
