import document from 'global/document';
import {bind} from '../utils/fn.js';

const defaults = {
  doc: document
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
 * @param {Function} options.update
 *        The actual update function that is being started and stopped.
 * @param {Object} options.doc
 *        pass in the document browser object, mostly for tests
 */
const activeElement = function(target, options = {}) {
  const settings = Object.assign({}, defaults, options);

  if (!options.update || !options.startUpdate || !options.stopUpdate) {
    throw new Error('activeElement mixin requires startUpdate, stopUpdate, and update functions');
  }

  const player = target.player_;

  target.mouseFocus_ = false;
  target.keyFocus_ = false;
  target.activeElementStarted_ = false;

  target.shouldUpdate = bind(target, function() {
    const isActive = target.keyFocus_ || target.mouseFocus_ || player.userActive() ||
      target.el_.contains(settings.doc.activeElement);
    const isLive = player.liveTracker && player.liveTracker.isLive();

    return Boolean((!player.paused() || isLive) && isActive && !settings.doc.hidden);
  });

  target.startOrStopUpdate = bind(target, function(e) {
    const _shouldUpdate = target.shouldUpdate();

    if (!target.activeElementStarted_ && _shouldUpdate) {
      settings.startUpdate();
      target.activeElementStarted_ = true;
    } else if (target.activeElementStarted_ && !_shouldUpdate) {
      settings.stopUpdate();
      target.activeElementStarted_ = false;
    }
  });

  // startUpdate right away on pause, then toggle it off if neccessary in
  // startOrStopUpdate. This prevents cases were pause happens, the controls come up
  // and the ui is out of date and not going to update.
  target.on(player, ['pause'], settings.startUpdate);
  target.on(player, ['playing', 'pause'], target.startOrStopUpdate);

  target.on(['mouseenter', 'mouseleave', 'focusin', 'focusout'], function(e) {
    if (e.type.indexOf('mouse') !== -1) {
      target.mouseFocus_ = e.type === 'mouseenter' ? true : false;
    } else {
      target.keyFocus_ = e.type === 'focusin' ? true : false;
    }
  });

  // do not start updaing the ui until playback starts
  target.one(player, 'playing', function() {
    if ('hidden' in settings.doc && 'visibilityState' in settings.doc) {
      target.on(settings.doc, 'visibilitychange', target.startOrStopUpdate);
      target.on('dispose', function() {
        target.off(settings.doc, 'visibilitychange', target.startOrStopUpdate);
      });
    }
    target.on(player, ['useractive', 'userinactive'], target.startOrStopUpdate);
    target.on(['mouseenter', 'mouseleave', 'focus', 'blur'], target.startOrStopUpdate);
    if (player.liveTracker) {
      target.on(player.liveTracker, 'liveedgechange', target.startOrStopUpdate);
    }
  });
};

export default activeElement;
