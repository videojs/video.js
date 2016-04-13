/**
 * @file flash-rtmp.js
 */
function FlashRtmpDecorator(Flash) {
  Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
  };

  Flash.streamFromParts = function(connection, stream) {
    return connection + '&' + stream;
  };

  Flash.streamToParts = function(src) {
    let parts = {
      connection: '',
      stream: ''
    };

    if (!src) return parts;

    // Look for the normal URL separator we expect, '&'.
    // If found, we split the URL into two pieces around the
    // first '&'.
    let connEnd = src.search(/&(?!\w+=)/);
    let streamBegin;
    if (connEnd !== -1) {
      streamBegin = connEnd + 1;
    }
    else {
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

  Flash.isStreamingType = function(srcType) {
    return srcType in Flash.streamingFormats;
  };

  // RTMP has four variations, any string starting
  // with one of these protocols should be valid
  Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

  Flash.isStreamingSrc = function(src) {
    return Flash.RTMP_RE.test(src);
  };

  /**
   * A source handler for RTMP urls
   * @type {Object}
   */
  Flash.rtmpSourceHandler = {};

  /**
   * Check if Flash can play the given videotype
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canPlayType = function(type){
    if (Flash.isStreamingType(type)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Check if Flash can handle the source natively
   * @param  {Object} source  The source object
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canHandleSource = function(source){
    let can = Flash.rtmpSourceHandler.canPlayType(source.type);

    if (can) {
      return can;
    }

    if (Flash.isStreamingSrc(source.src)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Pass the source to the flash object
   * Adaptive source handlers will have more complicated workflows before passing
   * video data to the video element
   * @param  {Object} source   The source object
   * @param  {Flash}  tech     The instance of the Flash tech
   * @param  {Object} options  The options to pass to the source
   */
  Flash.rtmpSourceHandler.handleSource = function(source, tech, options){
    let srcParts = Flash.streamToParts(source.src);

    tech['setRtmpConnection'](srcParts.connection);
    tech['setRtmpStream'](srcParts.stream);
  };

  // Register the native source handler
  Flash.registerSourceHandler(Flash.rtmpSourceHandler);

  return Flash;
}

export default FlashRtmpDecorator;
