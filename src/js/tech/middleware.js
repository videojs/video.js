import { assign } from '../utils/obj.js';

const middlewares = {};

export function use(type, middleware) {
  middlewares[type] = middlewares[type] || [];
  middlewares[type].push(middleware);
}

export function getMiddleware(type) {
  if (type) {
    return middlewares[type];
  }

  return middlewares;
}

export function setSource(player, src, next) {
  player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
}

export function setTech(middleware, tech) {
  middleware.forEach((mw) => mw.setTech && mw.setTech(tech));
}

export function get(middleware, tech, method) {
  return middleware.reduceRight(middlewareIterator(method), tech[method]());
}

export function set(middleware, tech, method, arg) {
  return tech[method](middleware.reduce(middlewareIterator(method), arg));
}

export const allowedGetters = {
  buffered: 1,
  currentTime: 1,
  duration: 1,
  seekable: 1,
  played: 1
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

function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
  const [mwFactory, ...mwrest] = middleware;

  // if mwFactory is a string, then we're at a fork in the road
  if (typeof mwFactory === 'string') {
    setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);

  // if we have an mwFactory, call it with the player to get the mw,
  // then call the mw's setSource method
  } else if (mwFactory) {
    const mw = mwFactory(player);

    mw.setSource(assign({}, src), function(err, _src) {

      // something happened, try the next middleware on the current level
      // make sure to use the old src
      if (err) {
        return setSourceHelper(src, mwrest, next, player, acc, lastRun);
      }

      // we've succeeded, now we need to go deeper
      acc.push(mw);

      // if it's the same time, continue does the current chain
      // otherwise, we want to go down the new chain
      setSourceHelper(_src,
          src.type === _src.type ? mwrest : middlewares[_src.type],
          next,
          player,
          acc,
          lastRun);
    });
  } else if (mwrest.length) {
    setSourceHelper(src, mwrest, next, player, acc, lastRun);
  } else if (lastRun) {
    next(src, acc);
  } else {
    setSourceHelper(src, middlewares['*'], next, player, acc, true);
  }
}
