/**
 * @file media-error.js
 */
import assign from 'object.assign';

/*
 * Custom MediaError class which mimics the standard HTML5 MediaError class.
 *
 * @param {Number|String|Object|MediaError} value
 *        This can be of multiple types:
 *        - Number: should be a standard error code
 *        - String: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - MediaError (native): used to populate a video.js MediaError object
 *        - MediaError (video.js): will return itself if it's already a
 *          video.js MediaError object.
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
  } else if (typeof value === 'object') {

    // We assign the `code` property manually because native MediaError objects
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

// These errors are indexed by the W3C standard numeric value. The order
// should not be changed!
MediaError.errorTypes = [
  'MEDIA_ERR_CUSTOM',
  'MEDIA_ERR_ABORTED',
  'MEDIA_ERR_NETWORK',
  'MEDIA_ERR_DECODE',
  'MEDIA_ERR_SRC_NOT_SUPPORTED',
  'MEDIA_ERR_ENCRYPTED'
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
for (let errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
  MediaError[MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
}

export default MediaError;
