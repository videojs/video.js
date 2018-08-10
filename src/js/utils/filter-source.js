/**
 * @module filter-source
 */
import {isPlain} from './obj';
import {getMimetype} from './mimetypes';
import window from 'global/window';

/**
 * Filter out single bad source objects or multiple source objects in an
 * array. Also flattens nested source object arrays into a 1 dimensional
 * array of source objects.
 *
 * @param {Tech~SourceObject|Tech~SourceObject[]} src
 *        The src object to filter
 *
 * @return {Tech~SourceObject[]}
 *         An array of sourceobjects containing only valid sources
 *
 * @private
 */
const filterSource = window.filterSource = function(src) {
  // convert string src into object src
  if (src && typeof src === 'string' && src.trim()) {
    return [fixSource({src})];
  }

  // if src is a valid object, use it
  if (src && isPlain(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
    return [fixSource(src)];
  }

  // traverse array and filter each entry
  if (src && Array.isArray(src)) {
    let newsrc = [];

    src.forEach((srcobj) => {
      srcobj = window.filterSource(srcobj);

      if (!srcobj.length) {
        return;
      }

      newsrc = newsrc.concat(srcobj);
    });

    return newsrc;
  }

  // source is invalid return empty array
  return [];
};

/**
 * Checks src mimetype, adding it when possible
 *
 * @param {Tech~SourceObject} src
 *        The src object to check
 * @return {Tech~SourceObject}
 *        src Object with known type
 */
function fixSource(src) {
  const mimetype = getMimetype(src.src);

  if (!src.type && mimetype) {
    src.type = mimetype;
  }

  return src;
}

export default filterSource;
