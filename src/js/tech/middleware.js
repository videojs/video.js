/**
 * @file middleware.js
 * @module middleware
 */
import { assign } from '../utils/obj.js';
import {toTitleCase} from '../utils/string-cases.js';

const middlewares = {};
const middlewareInstances = {};

export const TERMINATOR = {};

/**
 * A middleware object is a plain JavaScript object that has methods that
 * match the {@link Tech} methods found in the lists of allowed
 * {@link module:middleware.allowedGetters|getters},
 * {@link module:middleware.allowedSetters|setters}, and
 * {@link module:middleware.allowedMediators|mediators}.
 *
 * @typedef {Object} MiddlewareObject
 */

/**
 * A middleware factory function that should return a
 * {@link module:middleware~MiddlewareObject|MiddlewareObject}.
 *
 * This factory will be called for each player when needed, with the player
 * passed in as an argument.
 *
 * @callback MiddlewareFactory
 * @param {Player} player
 *        A Video.js player.
 */

/**
 * Define a middleware that the player should use by way of a factory function
 * that returns a middleware object.
 *
 * @param  {string} type
 *         The MIME type to match or `"*"` for all MIME types.
 *
 * @param  {MiddlewareFactory} middleware
 *         A middleware factory function that will be executed for
 *         matching types.
 */
export function use(type, middleware) {
  middlewares[type] = middlewares[type] || [];
  middlewares[type].push(middleware);
}

/**
 * Gets middlewares by type (or all middlewares).
 *
 * @param  {string} type
 *         The MIME type to match or `"*"` for all MIME types.
 *
 * @return {Function[]|undefined}
 *         An array of middlewares or `undefined` if none exist.
 */
export function getMiddleware(type) {
  if (type) {
    return middlewares[type];
  }

  return middlewares;
}

/**
 * Asynchronously sets a source using middleware by recursing through any
 * matching middlewares and calling `setSource` on each, passing along the
 * previous returned value each time.
 *
 * @param  {Player} player
 *         A {@link Player} instance.
 *
 * @param  {Tech~SourceObject} src
 *         A source object.
 *
 * @param  {Function}
 *         The next middleware to run.
 */
export function setSource(player, src, next) {
  player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
}

/**
 * When the tech is set, passes the tech to each middleware's `setTech` method.
 *
 * @param {Object[]} middleware
 *        An array of middleware instances.
 *
 * @param {Tech} tech
 *        A Video.js tech.
 */
export function setTech(middleware, tech) {
  middleware.forEach((mw) => mw.setTech && mw.setTech(tech));
}

/**
 * Calls a getter on the tech first, through each middleware
 * from right to left to the player.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  {Tech} tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @return {Mixed}
 *         The final value from the tech after middleware has intercepted it.
 */
export function get(middleware, tech, method) {
  return middleware.reduceRight(middlewareIterator(method), tech[method]());
}

/**
 * Takes the argument given to the player and calls the setter method on each
 * middleware from left to right to the tech.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  {Tech} tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @param  {Mixed} arg
 *         The value to set on the tech.
 *
 * @return {Mixed}
 *         The return value of the `method` of the `tech`.
 */
export function set(middleware, tech, method, arg) {
  return tech[method](middleware.reduce(middlewareIterator(method), arg));
}

/**
 * Takes the argument given to the player and calls the `call` version of the
 * method on each middleware from left to right.
 *
 * Then, call the passed in method on the tech and return the result unchanged
 * back to the player, through middleware, this time from right to left.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  {Tech} tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @param  {Mixed} arg
 *         The value to set on the tech.
 *
 * @return {Mixed}
 *         The return value of the `method` of the `tech`, regardless of the
 *         return values of middlewares.
 */
export function mediate(middleware, tech, method, arg = null) {
  const callMethod = 'call' + toTitleCase(method);
  const middlewareValue = middleware.reduce(middlewareIterator(callMethod), arg);
  const terminated = middlewareValue === TERMINATOR;
  // deprecated. The `null` return value should instead return TERMINATOR to
  // prevent confusion if a techs method actually returns null.
  const returnValue = terminated ? null : tech[method](middlewareValue);

  executeRight(middleware, method, returnValue, terminated);

  return returnValue;
}

/**
 * Enumeration of allowed getters where the keys are method names.
 *
 * @type {Object}
 */
export const allowedGetters = {
  buffered: 1,
  currentTime: 1,
  duration: 1,
  muted: 1,
  played: 1,
  paused: 1,
  seekable: 1,
  volume: 1,
  ended: 1
};

/**
 * Enumeration of allowed setters where the keys are method names.
 *
 * @type {Object}
 */
export const allowedSetters = {
  setCurrentTime: 1,
  setMuted: 1,
  setVolume: 1
};

/**
 * Enumeration of allowed mediators where the keys are method names.
 *
 * @type {Object}
 */
export const allowedMediators = {
  play: 1,
  pause: 1
};

function middlewareIterator(method) {
  return (value, mw) => {
    // if the previous middleware terminated, pass along the termination
    if (value === TERMINATOR) {
      return TERMINATOR;
    }

    if (mw[method]) {
      return mw[method](value);
    }

    return value;
  };
}

function executeRight(mws, method, value, terminated) {
  for (let i = mws.length - 1; i >= 0; i--) {
    const mw = mws[i];

    if (mw[method]) {
      mw[method](terminated, value);
    }
  }
}

/**
 * Clear the middleware cache for a player.
 *
 * @param  {Player} player
 *         A {@link Player} instance.
 */
export function clearCacheForPlayer(player) {
  middlewareInstances[player.id()] = null;
}

/**
 * {
 *  [playerId]: [[mwFactory, mwInstance], ...]
 * }
 *
 * @private
 */
function getOrCreateFactory(player, mwFactory) {
  const mws = middlewareInstances[player.id()];
  let mw = null;

  if (mws === undefined || mws === null) {
    mw = mwFactory(player);
    middlewareInstances[player.id()] = [[mwFactory, mw]];
    return mw;
  }

  for (let i = 0; i < mws.length; i++) {
    const [mwf, mwi] = mws[i];

    if (mwf !== mwFactory) {
      continue;
    }

    mw = mwi;
  }

  if (mw === null) {
    mw = mwFactory(player);
    mws.push([mwFactory, mw]);
  }

  return mw;
}

function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
  const [mwFactory, ...mwrest] = middleware;

  // if mwFactory is a string, then we're at a fork in the road
  if (typeof mwFactory === 'string') {
    setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);

  // if we have an mwFactory, call it with the player to get the mw,
  // then call the mw's setSource method
  } else if (mwFactory) {
    const mw = getOrCreateFactory(player, mwFactory);

    // if setSource isn't present, implicitly select this middleware
    if (!mw.setSource) {
      acc.push(mw);
      return setSourceHelper(src, mwrest, next, player, acc, lastRun);
    }

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
      setSourceHelper(
        _src,
        src.type === _src.type ? mwrest : middlewares[_src.type],
        next,
        player,
        acc,
        lastRun
      );
    });

  } else if (mwrest.length) {
    setSourceHelper(src, mwrest, next, player, acc, lastRun);
  } else if (lastRun) {
    next(src, acc);
  } else {
    setSourceHelper(src, middlewares['*'], next, player, acc, true);
  }
}
