// /**
//  * @file spatial-navigation-keycode.js
//  */

import * as browser from './browser.js';

// Determine the keycode for the 'back' key based on the platform
const backKeyCode = browser.IS_TIZEN ? 10009 : browser.IS_WEBOS ? 461 : 8;

const SpatialNavKeyCodes = {
  codes: {
    play: 415,
    pause: 19,
    ff: 417,
    rw: 412,
    back: backKeyCode
  },
  names: {
    415: 'play',
    19: 'pause',
    417: 'ff',
    412: 'rw',
    [backKeyCode]: 'back'
  },

  isEventKey(event, keyName) {
    keyName = keyName.toLowerCase();

    if (this.names[event.keyCode] && this.names[event.keyCode] === keyName) {
      return true;
    }
    return false;
  },

  getEventName(event) {
    if (this.names[event.keyCode]) {
      return this.names[event.keyCode];
    } else if (this.codes[event.code]) {
      const code = this.codes[event.code];

      return this.names[code];
    }
    return null;
  }
};

export default SpatialNavKeyCodes;
