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
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  caf: 'audio/x-caf',
  flac: 'audio/flac',
  oga: 'audio/ogg',
  wav: 'audio/wav',
  m3u8: 'application/x-mpegURL',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp'
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

/**
 * Find the mime type of a given source string if possible. Uses the player
 * source cache.
 *
 * @param {Player} player
 *        The player object
 *
 * @param {string} src
 *        The source string
 *
 * @return {string}
 *         The type that was found
 */
export const findMimetype = (player, src) => {
  if (!src) {
    return '';
  }

  // 1. check for the type in the `source` cache
  if (player.cache_.source.src === src && player.cache_.source.type) {
    return player.cache_.source.type;
  }

  // 2. see if we have this source in our `currentSources` cache
  const matchingSources = player.cache_.sources.filter((s) => s.src === src);

  if (matchingSources.length) {
    return matchingSources[0].type;
  }

  // 3. look for the src url in source elements and use the type there
  const sources = player.$$('source');

  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];

    if (s.type && s.src && s.src === src) {
      return s.type;
    }
  }

  // 4. finally fallback to our list of mime types based on src url extension
  return getMimetype(src);
};
