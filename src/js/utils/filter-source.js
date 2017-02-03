import {isObject} from './obj';

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

    if (newsrc.length === 0) {
      src = null;
    } else {
      src = newsrc;
    }
  } else if (typeof src === 'string' && src) {
    // convert string into object
    src = {src};
  } else if (isObject(src) && typeof src.src === 'string' && src.src) {
    // do nothing, src is already valid
  } else {
    // invalid source
    src = null;
  }

  return src;
};
