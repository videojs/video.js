import { assign } from '../utils/obj.js';

const middlewares = {};

export const TERMINATOR = 'TERMINATOR';

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

// returns value from tech or TERMINATOR
export function get(middleware, tech, method) {
  const reversedMiddleware = middleware.reverse();
  const getFromTech = exitableReducer(reversedMiddleware, middlewareIterator(method), tech[method]());

  return getFromTech;
}

// returns results if any of calling the method on the tech or TERMINATOR
export function set(middleware, tech, method, arg) {
  const middlewareValue = exitableReducer(middleware, middlewareIterator(method), arg);
  let setFromPlayer;

  if (middlewareValue === TERMINATOR) {
    return TERMINATOR;
  }

  setFromPlayer = tech[method](middlewareValue);

  return setFromPlayer;
}

// Runs the middleware from the player to the tech, and a 2nd time back up to the player
export function mediate(middleware, tech, method, arg = null) {
  const reversedMiddleware = middleware.reverse();
  const iterator = middlewareIterator(method);
  let middlewareValue = exitableReducer(middleware, iterator, arg);
  let mediateToTech;
  let mediateToPlayer;

  if (middlewareValue === TERMINATOR) {
    return TERMINATOR;
  }

  mediateToTech = tech[method](middlewareValue);
  mediateToPlayer = exitableReducer(reversedMiddleware, iterator, mediateToTech);

  return mediateToPlayer;
}

export const allowedGetters = {
  buffered: 1,
  currentTime: 1,
  duration: 1,
  seekable: 1,
  played: 1,
  paused: 1
};

export const allowedSetters = {
  setCurrentTime: 1
};

export const allowedMediators = {
  play: 1
};

function middlewareIterator(method) {
  return (value, mw) => {
    if (mw[method]) {
      return mw[method](value);
    }

    return value;
  };
}

function exitableReducer(mws, iterator, acc) {
  for (let i = 0; i < mws.length; i++) {
    const mw = mws[i];

    if (acc === TERMINATOR) {
      return TERMINATOR;
    }

    acc = iterator(acc, mw);
  }

  return acc;
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

      // if it's the same type, continue down the current chain
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
