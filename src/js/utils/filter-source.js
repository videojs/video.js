/**
 * @module filter-source
 */
import {isObject} from './obj';
import {getMimetype} from './mimetypes';

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
const filterSource = function(src, baseUrl) {
  // traverse array

  if (Array.isArray(src)) {
    let newsrc = [];

    src.forEach(function(srcobj) {
      srcobj = filterSource(srcobj, baseUrl);

      if (Array.isArray(srcobj)) {
        newsrc = newsrc.concat(srcobj);
      } else if (isObject(srcobj)) {
        newsrc.push(srcobj);
      }
    });

    src = newsrc;
  } else if (typeof src === 'string' && src.trim()) {
    // convert string into object
    src = [fixSource({src}, baseUrl)];
  } else if (isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
    // src is already valid
    src = [fixSource(src, baseUrl)];
  } else {
    // invalid source, turn it into an empty array
    src = [];
  }

  return src;
};

/**
 * Checks src mimetype, adding it when possible
 *
 * @param {Tech~SourceObject} src
 *        The src object to check
 * @return {Tech~SourceObject}
 *        src Object with known type
 */
function fixSource(src, baseUrl) {
  const mimetype = getMimetype(src.src);

  if (!src.type && mimetype) {
    src.type = mimetype;
  }

  src.src = baseUrl + src.src;
  return src;
}

export default filterSource;
