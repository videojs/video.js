/**
 * @file media-error.js
 */
import {assign, isObject} from './utils/obj';

/**
 * A Custom `MediaError` class which mimics the standard HTML5 `MediaError` class.
 *
 * @param {number|string|Object|MediaError} value
 *        This can be of multiple types:
 *        - number: should be a standard error code
 *        - string: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - `MediaError` (native): used to populate a video.js `MediaError` object
 *        - `MediaError` (video.js): will return itself if it's already a
 *          video.js `MediaError` object.
 *
 * @see [MediaError Spec]{@link https://dev.w3.org/html5/spec-author-view/video.html#mediaerror}
 * @see [Encrypted MediaError Spec]{@link https://www.w3.org/TR/2013/WD-encrypted-media-20130510/#error-codes}
 *
 * @class MediaError
 */
function MediaError(value) {

  // Allow redundant calls to this constructor to avoid having `instanceof`
  // checks peppered around the code.
  if (value instanceof MediaError) {
    return value;
  }

  if (typeof value === 'number') {
    this.code = value;
  } else if (typeof value === 'string') {
    // default code is zero, so this is a custom error
    this.message = value;
  } else if (isObject(value)) {

    // We assign the `code` property manually because native `MediaError` objects
    // do not expose it as an own/enumerable property of the object.
    if (typeof value.code === 'number') {
      this.code = value.code;
    }

    assign(this, value);
  }

  if (!this.message) {
    this.message = MediaError.defaultMessages[this.code] || '';
  }
}

/**
 * The error code that refers two one of the defined `MediaError` types
 *
 * @type {Number}
 */
MediaError.prototype.code = 0;

/**
 * An optional message that to show with the error. Message is not part of the HTML5
 * video spec but allows for more informative custom errors.
 *
 * @type {String}
 */
MediaError.prototype.message = '';

/**
 * An optional status code that can be set by plugins to allow even more detail about
 * the error. For example a plugin might provide a specific HTTP status code and an
 * error message for that code. Then when the plugin gets that error this class will
 * know how to display an error message for it. This allows a custom message to show
 * up on the `Player` error overlay.
 *
 * @type {Array}
 */
MediaError.prototype.status = null;

/**
 * Errors indexed by the W3C standard. The order **CANNOT CHANGE**! See the
 * specification listed under {@link MediaError} for more information.
 *
 * @enum {array}
 * @readonly
 * @property {string} 0 - MEDIA_ERR_CUSTOM
 * @property {string} 1 - MEDIA_ERR_ABORTED
 * @property {string} 2 - MEDIA_ERR_NETWORK
 * @property {string} 3 - MEDIA_ERR_DECODE
 * @property {string} 4 - MEDIA_ERR_SRC_NOT_SUPPORTED
 * @property {string} 5 - MEDIA_ERR_ENCRYPTED
 */
MediaError.errorTypes = [
  'MEDIA_ERR_CUSTOM',
  'MEDIA_ERR_ABORTED',
  'MEDIA_ERR_NETWORK',
  'MEDIA_ERR_DECODE',
  'MEDIA_ERR_SRC_NOT_SUPPORTED',
  'MEDIA_ERR_ENCRYPTED'
];

/**
 * The default `MediaError` messages based on the {@link MediaError.errorTypes}.
 *
 * @type {Array}
 * @constant
 */
MediaError.defaultMessages = {
  1: 'You aborted the media playback',
  2: 'A network error caused the media download to fail part-way.',
  3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
  4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
  5: 'The media is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (let errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
  MediaError[MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
}

// jsdocs for instance/static members added above
// instance methods use `#` and static methods use `.`
/**
 * W3C error code for any custom error.
 *
 * @member MediaError#MEDIA_ERR_CUSTOM
 * @constant {number}
 * @default 0
 */
/**
 * W3C error code for any custom error.
 *
 * @member MediaError.MEDIA_ERR_CUSTOM
 * @constant {number}
 * @default 0
 */

/**
 * W3C error code for media error aborted.
 *
 * @member MediaError#MEDIA_ERR_ABORTED
 * @constant {number}
 * @default 1
 */
/**
 * W3C error code for media error aborted.
 *
 * @member MediaError.MEDIA_ERR_ABORTED
 * @constant {number}
 * @default 1
 */

/**
 * W3C error code for any network error.
 *
 * @member MediaError#MEDIA_ERR_NETWORK
 * @constant {number}
 * @default 2
 */
/**
 * W3C error code for any network error.
 *
 * @member MediaError.MEDIA_ERR_NETWORK
 * @constant {number}
 * @default 2
 */

/**
 * W3C error code for any decoding error.
 *
 * @member MediaError#MEDIA_ERR_DECODE
 * @constant {number}
 * @default 3
 */
/**
 * W3C error code for any decoding error.
 *
 * @member MediaError.MEDIA_ERR_DECODE
 * @constant {number}
 * @default 3
 */

/**
 * W3C error code for any time that a source is not supported.
 *
 * @member MediaError#MEDIA_ERR_SRC_NOT_SUPPORTED
 * @constant {number}
 * @default 4
 */
/**
 * W3C error code for any time that a source is not supported.
 *
 * @member MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
 * @constant {number}
 * @default 4
 */

/**
 * W3C error code for any time that a source is encrypted.
 *
 * @member MediaError#MEDIA_ERR_ENCRYPTED
 * @constant {number}
 * @default 5
 */
/**
 * W3C error code for any time that a source is encrypted.
 *
 * @member MediaError.MEDIA_ERR_ENCRYPTED
 * @constant {number}
 * @default 5
 */

export default MediaError;
