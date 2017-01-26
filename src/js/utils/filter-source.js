import {isObject} from './obj';

export const filterSource = function(src) {
  if (Array.isArray(src)) {
    let i = src.length;

    while (i--) {
      src[i] = filterSource(src[i]);

      if (!isObject(src[i])) {
        src.splice(i, 1);
      }
    }
    if (src.length === 0) {
      src = null;
    }
  } else if (typeof src === 'string' && src) {
    src = {src};
  } else if (isObject(src) && typeof src.src === 'string' && src.src) {
    src = src;
  } else {
    // invalid source
    src = null;
  }

  return src;
};
