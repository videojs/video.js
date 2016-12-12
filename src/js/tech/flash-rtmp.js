/**
 * @file flash-rtmp.js
 * @module flash-rtmp
 */

/**
 * Add RTMP properties to the {@link Flash} Tech.
 *
 * @param {Flash} Flash
 *        The flash tech class.
 *
 * @mixin FlashRtmpDecorator
 */
function FlashRtmpDecorator(Flash) {
  Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
  };

  /**
   * Join connection and stream with an ampersand.
   *
   * @param {string} connection
   *        The connection string.
   *
   * @param {string} stream
   *        The stream string.
   */
  Flash.streamFromParts = function(connection, stream) {
    return connection + '&' + stream;
  };

  /**
   * The flash parts object that contains connection and stream info.
   *
   * @typedef {Object} Flash~PartsObject
   *
   * @property {string} connection
   *           The connection string of a source, defaults to an empty string.
   *
   * @property {string} stream
   *           The stream string of the source, defaults to an empty string.
   */

  /**
   * Convert a source url into a stream and connection parts.
   *
   * @param {string} src
   *        the source url
   *
   * @return {Flash~PartsObject}
   *         The parts object that contains a connection and a stream
   */
  Flash.streamToParts = function(src) {
    const parts = {
      connection: '',
      stream: ''
    };

    if (!src) {
      return parts;
    }

    // Look for the normal URL separator we expect, '&'.
    // If found, we split the URL into two pieces around the
    // first '&'.
    let connEnd = src.search(/&(?!\w+=)/);
    let streamBegin;

    if (connEnd !== -1) {
      streamBegin = connEnd + 1;
    } else {
      // If there's not a '&', we use the last '/' as the delimiter.
      connEnd = streamBegin = src.lastIndexOf('/') + 1;
      if (connEnd === 0) {
        // really, there's not a '/'?
        connEnd = streamBegin = src.length;
      }
    }

    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);

    return parts;
  };

  /**
   * Check if the source type is a streaming type.
   *
   * @param {string} srcType
   *        The mime type to check.
   *
   * @return {boolean}
   *          - True if the source type is a streaming type.
   *          - False if the source type is not a streaming type.
   */
  Flash.isStreamingType = function(srcType) {
    return srcType in Flash.streamingFormats;
  };

  // RTMP has four variations, any string starting
  // with one of these protocols should be valid

  /**
   * Regular expression used to check if the source is an rtmp source.
   *
   * @property {RegExp} Flash.RTMP_RE
   */
  Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

  /**
   * Check if the source itself is a streaming type.
   *
   * @param {string} src
   *        The url to the source.
   *
   * @return {boolean}
   *          - True if the source url indicates that the source is streaming.
   *          - False if the shource url indicates that the source url is not streaming.
   */
  Flash.isStreamingSrc = function(src) {
    return Flash.RTMP_RE.test(src);
  };

  /**
   * A source handler for RTMP urls
   * @type {Object}
   */
  Flash.rtmpSourceHandler = {};

  /**
   * Check if Flash can play the given mime type.
   *
   * @param {string} type
   *        The mime type to check
   *
   * @return {string}
   *         'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canPlayType = function(type) {
    if (Flash.isStreamingType(type)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Check if Flash can handle the source natively
   *
   * @param {Object} source
   *        The source object
   *
   * @param {Object} [options]
   *        The options passed to the tech
   *
   * @return {string}
   *         'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canHandleSource = function(source, options) {
    const can = Flash.rtmpSourceHandler.canPlayType(source.type);

    if (can) {
      return can;
    }

    if (Flash.isStreamingSrc(source.src)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Pass the source to the flash object.
   *
   * @param {Object} source
   *        The source object
   *
   * @param {Flash} tech
   *        The instance of the Flash tech
   *
   * @param {Object} [options]
   *        The options to pass to the source
   */
  Flash.rtmpSourceHandler.handleSource = function(source, tech, options) {
    const srcParts = Flash.streamToParts(source.src);

    tech.setRtmpConnection(srcParts.connection);
    tech.setRtmpStream(srcParts.stream);
  };

  // Register the native source handler
  Flash.registerSourceHandler(Flash.rtmpSourceHandler);

  return Flash;
}

export default FlashRtmpDecorator;
