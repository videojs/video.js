/**
 * @file spatial-navigation-keycodes.js
 */

import keycode from 'keycode';
import * as browser from './browser.js';

// Extend keycode with custom codes for media controls
keycode.codes.play = 415;
keycode.codes.pause = 19;
keycode.codes.ff = 417;
keycode.codes.rw = 412;

// Conditional assignment for keycode.codes.back based on platform
keycode.codes.back = browser.IS_TIZEN ? 10009 : browser.IS_WEBOS ? 461 : 8;

// Export the extended keycode
export default keycode;
