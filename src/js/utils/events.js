/**
 * @file events.js. An Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 *
 * @file events.js
 * @module events
 */
import DomData from './dom-data';
import * as Guid from './guid.js';
import log from './log.js';
import window from 'global/window';
import document from 'global/document';

/**
 * Clean up the listener cache and dispatchers
 *
 * @param {Element|Object} elem
 *        Element to clean up
 *
 * @param {string} type
 *        Type of event to clean up
 */
function _cleanUpEvents(elem, type) {
  if (!DomData.has(elem)) {
    return;
  }
  const data = DomData.get(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (elem.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;
  }

  // Finally remove the element data if there is no data left
  if (Object.getOwnPropertyNames(data).length === 0) {
    DomData.delete(elem);
  }
}

/**
 * Loops through an array of event types and calls the requested method for each type.
 *
 * @param {Function} fn
 *        The event method we want to use.
 *
 * @param {Element|Object} elem
 *        Element or object to bind listeners to
 *
 * @param {string} type
 *        Type of event to bind to.
 *
 * @param {EventTarget~EventListener} callback
 *        Event listener.
 */
function _handleMultipleEvents(fn, elem, types, callback) {
  types.forEach(function(type) {
    // Call the event method for each one of the types
    fn(elem, type, callback);
  });
}

/**
 * Fix a native event to have standard property values
 *
 * @param {Object} event
 *        Event object to fix.
 *
 * @return {Object}
 *         Fixed event object.
 */
export function fixEvent(event) {
  if (event.fixed_) {
    return event;
  }

  function returnTrue() {
    return true;
  }

  function returnFalse() {
    return false;
  }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped || !event.isImmediatePropagationStopped) {
    const old = event || window.event;

    event = {};
    // Clone the old object so that we can modify the values event = {};
    // IE8 Doesn't like when you mess with native event properties
    // Firefox returns false for event.hasOwnProperty('type') and other props
    //  which makes copying more difficult.
    // TODO: Probably best to create a whitelist of event props
    for (const key in old) {
      // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
      // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
      // and webkitMovementX/Y
      if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' &&
          key !== 'webkitMovementX' && key !== 'webkitMovementY') {
        // Chrome 32+ warns if you try to copy deprecated returnValue, but
        // we still want to if preventDefault isn't supported (IE8).
        if (!(key === 'returnValue' && old.preventDefault)) {
          event[key] = old[key];
        }
      }
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || document;
    }

    // Handle which other element the event is related to
    if (!event.relatedTarget) {
      event.relatedTarget = event.fromElement === event.target ?
        event.toElement :
        event.fromElement;
    }

    // Stop the default browser action
    event.preventDefault = function() {
      if (old.preventDefault) {
        old.preventDefault();
      }
      event.returnValue = false;
      old.returnValue = false;
      event.defaultPrevented = true;
    };

    event.defaultPrevented = false;

    // Stop the event from bubbling
    event.stopPropagation = function() {
      if (old.stopPropagation) {
        old.stopPropagation();
      }
      event.cancelBubble = true;
      old.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function() {
      if (old.stopImmediatePropagation) {
        old.stopImmediatePropagation();
      }
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX !== null && event.clientX !== undefined) {
      const doc = document.documentElement;
      const body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button !== null && event.button !== undefined) {

      // The following is disabled because it does not pass videojs-standard
      // and... yikes.
      /* eslint-disable */
      event.button = (event.button & 1 ? 0 :
        (event.button & 4 ? 1 :
          (event.button & 2 ? 2 : 0)));
      /* eslint-enable */
    }
  }

  event.fixed_ = true;
  // Returns fixed-up instance
  return event;
}

/**
 * Whether passive event listeners are supported
 */
let _supportsPassive;

const supportsPassive = function() {
  if (typeof _supportsPassive !== 'boolean') {
    _supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get() {
          _supportsPassive = true;
        }
      });

      window.addEventListener('test', null, opts);
      window.removeEventListener('test', null, opts);
    } catch (e) {
      // disregard
    }
  }

  return _supportsPassive;
};

/**
 * Touch events Chrome expects to be passive
 */
const passiveEvents = [
  'touchstart',
  'touchmove'
];

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param {Element|Object} elem
 *        Element or object to bind listeners to
 *
 * @param {string|string[]} type
 *        Type of event to bind to.
 *
 * @param {EventTarget~EventListener} fn
 *        Event listener.
 */
export function on(elem, type, fn) {
  if (Array.isArray(type)) {
    return _handleMultipleEvents(on, elem, type, fn);
  }

  if (!DomData.has(elem)) {
    DomData.set(elem, {});
  }

  const data = DomData.get(elem);

  // We need a place to store all our handler data
  if (!data.handlers) {
    data.handlers = {};
  }

  if (!data.handlers[type]) {
    data.handlers[type] = [];
  }

  if (!fn.guid) {
    fn.guid = Guid.newGUID();
  }

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function(event, hash) {

      if (data.disabled) {
        return;
      }

      event = fixEvent(event);

      const handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        const handlersCopy = handlers.slice(0);

        for (let m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            try {
              handlersCopy[m].call(elem, event, hash);
            } catch (e) {
              log.error(e);
            }
          }
        }
      }
    };
  }

  if (data.handlers[type].length === 1) {
    if (elem.addEventListener) {
      let options = false;

      if (supportsPassive() &&
        passiveEvents.indexOf(type) > -1) {
        options = {passive: true};
      }
      elem.addEventListener(type, data.dispatcher, options);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
}

/**
 * Removes event listeners from an element
 *
 * @param {Element|Object} elem
 *        Object to remove listeners from.
 *
 * @param {string|string[]} [type]
 *        Type of listener to remove. Don't include to remove all events from element.
 *
 * @param {EventTarget~EventListener} [fn]
 *        Specific listener to remove. Don't include to remove listeners for an event
 *        type.
 */
export function off(elem, type, fn) {
  // Don't want to add a cache object through getElData if not needed
  if (!DomData.has(elem)) {
    return;
  }

  const data = DomData.get(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) {
    return;
  }

  if (Array.isArray(type)) {
    return _handleMultipleEvents(off, elem, type, fn);
  }

  // Utility function
  const removeType = function(el, t) {
    data.handlers[t] = [];
    _cleanUpEvents(el, t);
  };

  // Are we removing all bound events?
  if (type === undefined) {
    for (const t in data.handlers) {
      if (Object.prototype.hasOwnProperty.call(data.handlers || {}, t)) {
        removeType(elem, t);
      }
    }
    return;
  }

  const handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) {
    return;
  }

  // If no listener was provided, remove all listeners for type
  if (!fn) {
    removeType(elem, type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (let n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  _cleanUpEvents(elem, type);
}

/**
 * Trigger an event for an element
 *
 * @param {Element|Object} elem
 *        Element to trigger an event on
 *
 * @param {EventTarget~Event|string} event
 *        A string (the type) or an event object with a type attribute
 *
 * @param {Object} [hash]
 *        data hash to pass along with the event
 *
 * @return {boolean|undefined}
 *         Returns the opposite of `defaultPrevented` if default was
 *         prevented. Otherwise, returns `undefined`
 */
export function trigger(elem, event, hash) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasElData first.
  const elemData = DomData.has(elem) ? DomData.get(elem) : {};
  const parent = elem.parentNode || elem.ownerDocument;
  // type = event.type || event,
  // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = {type: event, target: elem};
  } else if (!event.target) {
    event.target = elem;
  }

  // Normalizes the event properties.
  event = fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event, hash);
  }

  // Unless explicitly stopped or the event does not bubble (e.g. media events)
  // recursively calls this function to bubble the event up the DOM.
  if (parent && !event.isPropagationStopped() && event.bubbles === true) {
    trigger.call(null, parent, event, hash);

  // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.defaultPrevented && event.target && event.target[event.type]) {
    if (!DomData.has(event.target)) {
      DomData.set(event.target, {});
    }
    const targetData = DomData.get(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.defaultPrevented;
}

/**
 * Trigger a listener only once for an event.
 *
 * @param {Element|Object} elem
 *        Element or object to bind to.
 *
 * @param {string|string[]} type
 *        Name/type of event
 *
 * @param {Event~EventListener} fn
 *        Event listener function
 */
export function one(elem, type, fn) {
  if (Array.isArray(type)) {
    return _handleMultipleEvents(one, elem, type, fn);
  }
  const func = function() {
    off(elem, type, func);
    fn.apply(this, arguments);
  };

  // copy the guid to the new function so it can removed using the original function's ID
  func.guid = fn.guid = fn.guid || Guid.newGUID();
  on(elem, type, func);
}

/**
 * Trigger a listener only once and then turn if off for all
 * configured events
 *
 * @param {Element|Object} elem
 *        Element or object to bind to.
 *
 * @param {string|string[]} type
 *        Name/type of event
 *
 * @param {Event~EventListener} fn
 *        Event listener function
 */
export function any(elem, type, fn) {
  const func = function() {
    off(elem, type, func);
    fn.apply(this, arguments);
  };

  // copy the guid to the new function so it can removed using the original function's ID
  func.guid = fn.guid = fn.guid || Guid.newGUID();

  // multiple ons, but one off for everything
  on(elem, type, func);
}
