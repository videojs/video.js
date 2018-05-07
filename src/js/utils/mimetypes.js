import * as Url from '../utils/url.js';

/**
 * Mimetypes
 *
 * @see http://hul.harvard.edu/ois/////systems/wax/wax-public-help/mimetypes.htm
 * @typedef Mimetypes~Kind
 * @enum
 */
export const MimetypesKind = {
  opus: 'video/ogg',
  ogv: 'video/ogg',
  mp4: 'video/mp4',
  mov: 'video/mp4',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  oga: 'audio/ogg',
  m3u8: 'application/x-mpegURL'
};

/**
 * Get the mimetype of a given src url if possible
 *
 * @param {string} src
 *        The url to the src
 *
 * @return {string}
 *         return the mimetype if it was known or empty string otherwise
 */
export const getMimetype = function(src = '') {
  const ext = Url.getFileExtension(src);
  const mimetype = MimetypesKind[ext.toLowerCase()];

  return mimetype || '';
};
