import Tech from './tech.js';
import toTitleCase from '../utils/to-title-case.js';

const middlewares = {};

export function use (type, middleware) {
  (middlewares[type] = middlewares[type] || []).push(middleware);
}

export function setSource (src, next) {
  setTimeout(()=>ssh(src, middlewares[src.type] || [], next), 1);
}

export function set (type, method, arg) {
  var value = arg;

  (middlewares[type] || [])
  .forEach((mw) => {
    if (typeof mw === 'string') {
      var ov = value;
      value = set(mw, method, value, tech);
    } else {
      value = mw[method](value)
    }
  });

  return tech[method](value);
}

export function get (type, method, tech) {
  var value = tech[method]();

  (middlewares[type] || [])
  .reverse()
  .forEach((mw) => {
    if (typeof mw === 'string') {
      var ov = value;
      value = get(mw, method, tech);
    } else {
      value = mw[method](value)
    }
  });

  return value;
}

function ssh(src, middleware, next, acc) {
  const mw = middleware[0];

  // Either we've reached a leaf or we've reached a fork
  if (typeof mw === 'string') {
    const split = mw.split('/');

    // we've reached the end, so, we need to get a tech and return.
    if (split[0] === 'videojs') {
      const tech = Tech.getTech(toTitleCase(split[1]));
      next(tech, src);

    // we've reached a fork, so, we need go deeper
    } else {
      ssh(src, middlewares[mw] || [], next);
    }

  // try the current middleware
  } else if (mw) {
    mw.setSource(src, function(err, _src) {

      // something happened, try the next middleware on the current level
      if (err) {
        return ssh(src, middleware.slice(1), next);
      }

      // we've succeeded, now we need to go deeper
      ssh(_src, middlewares[_src.type] || [], next);
    })

  // something weird happened, try the next middleware on the current level
  } else if (middleware.length > 1) {
    ssh(src, middleware.slice(1), next);
  }
}
