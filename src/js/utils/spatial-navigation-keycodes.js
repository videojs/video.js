/**
 * @file spatial-navigation-keycodes.js
 */

import keycode from 'keycode';
import * as browser from './browser.js';

// Extend the `codes` object for forward lookup
keycode.codes.play = 415;
keycode.codes.pause = 19;
keycode.codes.ff = 417;
keycode.codes.rw = 412;

// Extend the `names` object for reverse lookup
keycode.names[415] = 'play';
keycode.names[19] = 'pause';
keycode.names[417] = 'ff';
keycode.names[412] = 'rw';

// Determine the keycode for the 'back' key based on the platform
const backKeyCode = browser.IS_TIZEN ? 10009 : browser.IS_WEBOS ? 461 : 8;

// Extend the `codes` object for forward lookup with the 'back' key
keycode.codes.back = backKeyCode;

// Extend the `names` object for reverse lookup with the 'back' key
keycode.names[backKeyCode] = 'back';

// Export the extended keycode
export default keycode;
