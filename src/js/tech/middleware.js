import toTitleCase from '../utils/to-title-case.js';
import assign from 'object.assign';

const middlewares = {};

export function use(type, middleware) {
  (middlewares[type] = middlewares[type] || []).push(middleware);
}

export function setSource(src, next) {
  setTimeout(() => ssh(src, middlewares[src.type], next), 1);
}

export function setTech(middleware, tech) {
  middleware.forEach((mw) => mw.setTech && mw.setTech(tech));
}

export function get(middleware, method) {
  return middleware.reduceRight(middlewareIterator(method), undefined);
}

export function set(middleware, method, arg) {
  return middleware.reduce(middlewareIterator(method), arg);
}

export const allowedGetters = {
  currentTime: 1,
  duration: 1
};

export const allowedSetters = {
  setCurrentTime: 1
};

function middlewareIterator(method) {
  return (value, mw) => {
    if (mw[method]) {
      return mw[method](value);
    }

    return value;
  };
}

function ssh(src = {}, middleware = [], next, acc = []) {
  const [mw, ...mwrest] = middleware;

  // if mw is a string, then we're at a fork in the road
  if (typeof mw === 'string') {
    ssh(src, middlewares[mw], next, acc);

  // if we have an mw, call its setSource method
  } else if (mw) {
    mw.setSource(assign({}, src), function(err, _src) {

      // something happened, try the next middleware on the current level
      // make sure to use the old src
      if (err) {
        return ssh(src, mwrest, next, acc);
      }

      // we've succeeded, now we need to go deeper
      acc.push(mw);

      // if it's the same time, continue does the current chain
      // otherwise, we want to go down the new chain
      ssh(_src,
          src.type === _src.type ?  mwrest : middlewares[_src.type],
          next,
          acc);
    });
  } else if (mwrest.length) {
    ssh(src, mwrest, next, acc);
  } else {
    const techs = middlewares['*'];
    const tech = techs.filter((tech) => !!tech.canPlayType(src.type))[0].name;

    next(tech, src, acc);
  }
}
