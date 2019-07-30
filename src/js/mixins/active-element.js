import document from 'global/document';
import {bind} from '../utils/fn.js';

const defaults = {
  liveUpdates: true,
  extraComponents: []
};

const activeElement = function(target, options = {}) {
  const settings = Object.assign({}, defaults, options);

  if (!options.update || !options.startUpdate || !options.stopUpdate) {
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

    return !player.paused() && isActive && !document.hidden;
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
    if (settings.liveUpdates && player.liveTracker) {
      target.on(player.liveTracker, 'liveedgechange', settings.update);
    }
  });
};

export default activeElement;
