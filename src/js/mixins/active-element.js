import document from 'global/document';
import {bind} from '../utils/fn.js';

const defaults = {
  extraComponents: []
};

/**
 * A mixin to start and stop an update function when depending on:
 * 1. If the tab is in the background or not
 * 2. If the player is paused or playing
 * 3. If the component itself or any components passed as `extraComponents`
 *    has mouse/keyboard focus
 * 4. If the player reports that the is active via `userActive`
 *
 * @param {Component} target
 *        the component to target
 * @param {Object} options
 *        the options for this activeElement
 * @param {Function} options.startUpdate
 *        The Function to run when updates should be started
 * @param {Function} options.stopUpdate
 *        The function to run when updates should be stopped
 * @param {Array} options.extraComponents
 *        Extra components to watch for keyboard focus.
 */
const activeElement = function(target, options = {}) {
  const settings = Object.assign({}, defaults, options);

  if (!options.startUpdate || !options.stopUpdate) {
    throw new Error('activeElement mixin requires update, startUpdate, and stopUpdate functions');
  }

  const els = [target.el_].concat(settings.extraComponents.map((c) => c.el_));
  const player = target.player_;

  target.mouseFocus_ = false;
  target.keyFocus_ = false;

  let started = false;

  const shouldUpdate = bind(target, function() {
    const isActive = target.keyFocus_ || target.mouseFocus_ || player.userActive() ||
      els.some((el) => document.activeElement === el);
    const isLive = settings.liveUpdates && player.liveTracker && player.liveTracker.isLive;

    return (!player.paused() || isLive) && isActive && !document.hidden;
  });

  const startOrStopUpdate = bind(target, function() {
    const _shouldUpdate = shouldUpdate();

    if (!started && _shouldUpdate) {
      settings.startUpdate();
      started = true;
    } else if (started && !_shouldUpdate) {
      settings.stopUpdate();
      started = false;
    }
  });

  if ('hidden' in document && 'visibilityState' in document) {
    target.on(document, 'visibilitychange', startOrStopUpdate);
    target.on('dispose', function() {
      target.off(document, 'visibilitychange', startOrStopUpdate);
    });
  }

  target.on(player, ['playing', 'pause'], startOrStopUpdate);

  target.on(['mouseenter', 'mouseleave', 'focus', 'blur'], function(e) {
    if ((/^mouse/).test(e.type)) {
      target.mouseFocus_ = e.type === 'mouseenter' ? true : false;
    } else {
      target.keyFocus_ = e.type === 'focus' ? true : false;
    }
  });

  // do not start updaing the ui until playback starts
  target.one(player, 'playing', function() {
    target.on(player, ['useractive', 'userinactive'], startOrStopUpdate);
    target.on(['mouseenter', 'mouseleave', 'focus', 'blur'], startOrStopUpdate);
    if (player.liveTracker) {
      target.on(player.liveTracker, 'liveedgechange', startOrStopUpdate);
    }
  });
};

export default activeElement;
