// /**
//  * @file spatial-navigation-keycode.js
//  */

import * as browser from './browser.js';

// Determine the keycode for the 'back' key based on the platform
const backKeyCode = browser.IS_TIZEN ? 10009 : browser.IS_WEBOS ? 461 : 8;

const SpatialNavKeycode = {
  keyCodes: {
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
    }
  },

  isEventKey(event, keyName) {
    keyName = keyName.toLowerCase();

    if (this.keyCodes.names[event.keyCode] && this.keyCodes.names[event.keyCode] === keyName) {
      return true;
    }
    return false;
  },

  getEventName(event) {
    if (this.keyCodes.names[event.keyCode]) {
      return this.keyCodes.names[event.keyCode];
    } else if (this.keyCodes.codes[event.code]) {
      const code = this.keyCodes.codes[event.code];

      return this.keyCodes.names[code];
    }
    return null;
  }
};

export default SpatialNavKeycode;
