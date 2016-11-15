import Tech from './tech.js';
import toTitleCase from '../utils/to-title-case.js';

const middlewares = {};

export function use (type, middleware) {
  (middlewares[type] = middlewares[type] || []).push(middleware);
}

export function setSource (src, next) {
  setTimeout(()=>ssh(src, middlewares[src.type] || [], next), 1);
}


function ssh(src, middleware, next) {
  const mw = middleware[0];
  if (typeof mw === 'string') {
    const split = mw.split('/');
    let tech;
    if (split[0] === 'videojs') {
      tech = Tech.getTech(toTitleCase(split[1]));
      next(tech, src);
    } else {
      ssh(src, middlewares[mw] || [], next);
    }
  } else if (mw) {
    mw.setSource(src, function(err, _src) {
      if (err) {
        return ssh(src, middleware.slice(1), next);
      }
      ssh(_src, middlewares[_src.type] || [], next);
    })
  } else if (middleware.length > 1) {
    ssh(src, middleware.slice(1), next);
  }
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
