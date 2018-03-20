import {MimetypesKind} from './mimetypes';
import * as Url from '../utils/url.js';

/**
 * Get the mimetype of a given src url if possible
 *
 * @param {string} src
 *        The url to the src
 *
 * @return {string}
 *         return the mimetype if it was known or empty string otherwise
 */
const getMimetype = function(src = '') {
  const ext = Url.getFileExtension(src);
  const mimetype = MimetypesKind[ext.toLowerCase()];

  return mimetype || '';
};

export default getMimetype;
