/**
 * @file spatial-navigation-keycodes.js
 */

import keycode from 'keycode';

// Extend keycode with custom codes for media controls
keycode.codes.play = 415;
keycode.codes.pause = 19;
keycode.codes.ff = 417;
keycode.codes.rw = 412;

// Export the extended keycode
export default keycode;
