import * as browser from '../utils/browser.js';
import document from 'global/document';
import EventTarget from '../event-target';

export const NONE = 0;
export const LOADING = 1;
export const LOADED = 2;
export const ERROR = 3;

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement
 *
 * interface HTMLTrackElement : HTMLElement {
 *   attribute DOMString kind;
 *   attribute DOMString src;
 *   attribute DOMString srclang;
 *   attribute DOMString label;
 *   attribute boolean default;
 *
 *   const unsigned short NONE = 0;
 *   const unsigned short LOADING = 1;
 *   const unsigned short LOADED = 2;
 *   const unsigned short ERROR = 3;
 *   readonly attribute unsigned short readyState;
 *
 *   readonly attribute TextTrack track;
 * };
 */

class HTMLTrackElement extends EventTarget {
  constructor(track) {
    super();

    let readyState,
        textTrack,
        trackElement = this;

    if (browser.IS_IE8) {
      trackElement = document.createElement('custom');

      for (let prop in HTMLTrackElement.prototype) {
        trackElement[prop] = HTMLTrackElement.prototype[prop];
      }
    }

    trackElement.kind = track.kind;
    trackElement.src = track.src;
    trackElement.srclang = track.srclang;
    trackElement.label = track.label;
    trackElement.default = track.default;

    Object.defineProperty(trackElement, 'readyState', {
      get() {
        return readyState;
      }
    });

    Object.defineProperty(trackElement, 'track', {
      get() {
        return textTrack;
      }
    });

    readyState = NONE;
    textTrack = track;

    textTrack.addEventListener('loadeddata', function() {
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

export default HTMLTrackElement;
