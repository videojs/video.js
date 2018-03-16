/**
 * @module filter-source
 */
import {isObject} from './obj';
import getMimetype from './get-mime-type';

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
export const filterSource = function(src) {
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
    src = [{src: src.src, type: getMimetype(src.src)}];
  } else if (isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
    // src is already valid
    src = [{src: src.src, type: getMimetype(src.src)}];
  } else {
    // invalid source, turn it into an empty array
    src = [];
  }

  return src;
};

export default filterSource;
