/**
 * @file media-error.js
 */
import assign from 'object.assign';

/*
 * Custom MediaError to mimic the HTML5 MediaError
 *
 * @param {Number} code The media error code
 */
let MediaError = function(code){
  if (typeof code === 'number') {
    this.code = code;
  } else if (typeof code === 'string') {
    // default code is zero, so this is a custom error
    this.message = code;
  } else if (typeof code === 'object') { // object
    assign(this, code);
  }

  if (!this.message) {
    this.message = MediaError.defaultMessages[this.code] || '';
  }
};

/*
 * The error code that refers two one of the defined
 * MediaError types
 *
 * @type {Number}
 */
MediaError.prototype.code = 0;

/*
 * An optional message to be shown with the error.
 * Message is not part of the HTML5 video spec
 * but allows for more informative custom errors.
 *
 * @type {String}
 */
MediaError.prototype.message = '';

/*
 * An optional status code that can be set by plugins
 * to allow even more detail about the error.
 * For example the HLS plugin might provide the specific
 * HTTP status code that was returned when the error
 * occurred, then allowing a custom error overlay
 * to display more information.
 *
 * @type {Array}
 */
MediaError.prototype.status = null;

MediaError.errorTypes = [
  'MEDIA_ERR_CUSTOM',            // = 0
  'MEDIA_ERR_ABORTED',           // = 1
  'MEDIA_ERR_NETWORK',           // = 2
  'MEDIA_ERR_DECODE',            // = 3
  'MEDIA_ERR_SRC_NOT_SUPPORTED', // = 4
  'MEDIA_ERR_ENCRYPTED'          // = 5
];

MediaError.defaultMessages = {
  1: 'You aborted the media playback',
  2: 'A network error caused the media download to fail part-way.',
  3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
  4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
  5: 'The media is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (var errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
  MediaError[MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
}

export default MediaError;
