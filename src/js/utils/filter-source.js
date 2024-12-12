/**
 * @module filter-source
 */
import {isObject} from './obj';
import {getMimetype} from './mimetypes';

/** @import { SourceObject } from '../tech/tech' */

/**
 * Filter out single bad source objects or multiple source objects in an
 * array. Also flattens nested source object arrays into a 1 dimensional
 * array of source objects.
 *
 * @param {string|SourceObject|Array.<SourceObject|string>} src
 *        The src object to filter
 *
 * @return {SourceObject[]}
 *         An array of sourceobjects containing only valid sources
 *
 * @private
 */
const filterSource = function(src) {
  // traverse array
  if (Array.isArray(src)) {
    let newsrc = [];

    src.forEach(function(srcobj) {
      srcobj = filterSource(srcobj);

      if (Array.isArray(srcobj)) {
        newsrc = newsrc.concat(srcobj);
      } else if (isObject(srcobj)) {
        newsrc.push(srcobj);
      }
    });

    src = newsrc;
  } else if (typeof src === 'string' && src.trim()) {
    // convert string into object
    src = [fixSource({src})];
  } else if (isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
    // src is already valid
    src = [fixSource(src)];
  } else {
    // invalid source, turn it into an empty array
    src = [];
  }

  return src;
};

/**
 * Checks src mimetype, adding it when possible
 *
 * @param {SourceObject} src
 *        The src object to check
 * @return {SourceObject}
 *        src Object with known type
 */
function fixSource(src) {
  if (!src.type) {
    const mimetype = getMimetype(src.src);

    if (mimetype) {
      src.type = mimetype;
    }
  }

  return src;
}

export default filterSource;
