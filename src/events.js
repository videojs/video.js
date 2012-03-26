// Event System (J.Resig - Secrets of a JS Ninja http://jsninja.com/ [Go read it, really])
// (Book version isn't completely usable, so fixed some things and borrowed from jQuery where it's working)
// 
// This should work very similarly to jQuery's events, however it's based off the book version which isn't as
// robust as jquery's, so there's probably some differences.
// 
// When you add an event listener using _V_.addEvent, 
//   it stores the handler function in seperate cache object, 
//   and adds a generic handler to the element's event,
//   along with a unique id (guid) to the element.

_V_.extend({

  // Add an event listener to element
  // It stores the handler function in a separate cache object
  // and adds a generic handler to the element's event,
  // along with a unique id (guid) to the element.
  on: function(elem, type, fn){
    var data = _V_.getData(elem), handlers;

    // We only need to generate one handler per element
    if (data && !data.handler) {
      // Our new meta-handler that fixes the event object and the context
      data.handler = function(event){
        event = _V_.fixEvent(event);
        var handlers = _V_.getData(elem).events[event.type];
        // Go through and call all the real bound handlers
        if (handlers) {
          
          // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
          var handlersCopy = [];
          _V_.each(handlers, function(handler, i){
            handlersCopy[i] = handler;
          })
          
          for (var i = 0, l = handlersCopy.length; i < l; i++) {
            handlersCopy[i].call(elem, event);
          }
        }
      };
    }

    // We need a place to store all our event data
    if (!data.events) { data.events = {}; }

    // And a place to store the handlers for this event type
    handlers = data.events[type];

    if (!handlers) {
      handlers = data.events[ type ] = [];

      // Attach our meta-handler to the element, since one doesn't exist
      if (document.addEventListener) {
        elem.addEventListener(type, data.handler, false);
      } else if (document.attachEvent) {
        elem.attachEvent("on" + type, data.handler);
      }
    }

    if (!fn.guid) { fn.guid = _V_.guid++; }

    handlers.push(fn);
  },
  // Deprecated name for 'on' function
  addEvent: function(){ return _V_.on.apply(this, arguments); },

  off: function(elem, type, fn) {
    var data = _V_.getData(elem), handlers;
    // If no events exist, nothing to unbind
    if (!data.events) { return; }

    // Are we removing all bound events?
    if (!type) {
      for (type in data.events) {
        _V_.cleanUpEvents(elem, type);
      }
      return;
    }

    // And a place to store the handlers for this event type
    handlers = data.events[type];

    // If no handlers exist, nothing to unbind
    if (!handlers) { return; }

    // See if we're only removing a single handler
    if (fn && fn.guid) {
      for (var i = 0; i < handlers.length; i++) {
        // We found a match (don't stop here, there could be a couple bound)
        if (handlers[i].guid === fn.guid) {
          // Remove the handler from the array of handlers
          handlers.splice(i--, 1);
        }
      }
    }

    _V_.cleanUpEvents(elem, type);
  },
  // Deprecated name for 'on' function
  removeEvent: function(){ return _V_.off.apply(this, arguments); },

  cleanUpEvents: function(elem, type) {
    var data = _V_.getData(elem);
    // Remove the events of a particular type if there are none left

    if (data.events[type].length === 0) {
      delete data.events[type];

      // Remove the meta-handler from the element
      if (document.removeEventListener) {
        elem.removeEventListener(type, data.handler, false);
      } else if (document.detachEvent) {
        elem.detachEvent("on" + type, data.handler);
      }
    }

    // Remove the events object if there are no types left
    if (_V_.isEmpty(data.events)) {
      delete data.events;
      delete data.handler;
    }

    // Finally remove the expando if there is no data left
    if (_V_.isEmpty(data)) {
      _V_.removeData(elem);
    }
  },

  fixEvent: function(event) {
    if (event[_V_.expando]) { return event; }
    // store a copy of the original event object
    // and "clone" to set read-only properties
    var originalEvent = event;
    event = new _V_.Event(originalEvent);

    for ( var i = _V_.Event.props.length, prop; i; ) {
      prop = _V_.Event.props[ --i ];
      event[prop] = originalEvent[prop];
    }

    // Fix target property, if necessary
    if (!event.target) { event.target = event.srcElement || document; }

    // check if target is a textnode (safari)
    if (event.target.nodeType === 3) { event.target = event.target.parentNode; }

    // Add relatedTarget, if necessary
    if (!event.relatedTarget && event.fromElement) {
      event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
    }

    // Calculate pageX/Y if missing and clientX/Y available
    if ( event.pageX == null && event.clientX != null ) {
      var eventDocument = event.target.ownerDocument || document,
        doc = eventDocument.documentElement,
        body = eventDocument.body;

      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
    }

    // Add which for key events
    if (event.which == null && (event.charCode != null || event.keyCode != null)) {
      event.which = event.charCode != null ? event.charCode : event.keyCode;
    }

    // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
    if ( !event.metaKey && event.ctrlKey ) {
      event.metaKey = event.ctrlKey;
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if ( !event.which && event.button !== undefined ) {
      event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
    }

    return event;
  },

  trigger: function(elem, event) {
    var data = _V_.getData(elem),
        parent = elem.parentNode || elem.ownerDocument,
        type = event.type || event,
        handler;

    if (data) { handler = data.handler }

    // Added in attion to book. Book code was broke.
    event = typeof event === "object" ?
      event[_V_.expando] ? 
        event :
        new _V_.Event(type, event) :
      new _V_.Event(type);

    event.type = type;
    if (handler) {
      handler.call(elem, event);
    }

    // Clean up the event in case it is being reused
    event.result = undefined;
    event.target = elem;

    // Bubble the event up the tree to the document,
    // Unless it's been explicitly stopped
    // if (parent && !event.isPropagationStopped()) {
    //   _V_.triggerEvent(parent, event);
    // 
    // // We're at the top document so trigger the default action
    // } else if (!parent && !event.isDefaultPrevented()) {
    //   // log(type);
    //   var targetData = _V_.getData(event.target);
    //   // log(targetData);
    //   var targetHandler = targetData.handler;
    //   // log("2");
    //   if (event.target[event.type]) {
    //     // Temporarily disable the bound handler,
    //     // don't want to execute it twice
    //     if (targetHandler) {
    //       targetData.handler = function(){};
    //     }
    // 
    //     // Trigger the native event (click, focus, blur)
    //     event.target[event.type]();
    // 
    //     // Restore the handler
    //     if (targetHandler) {
    //       targetData.handler = targetHandler;
    //     }
    //   }
    // }
  },
  // Deprecated name for 'on' function
  triggerEvent: function(){ return _V_.trigger.apply(this, arguments); },

  one: function(elem, type, fn) {
    _V_.on(elem, type, function(){
      _V_.off(elem, type, arguments.callee)
      fn.apply(this, arguments);
    });
  }
});

// Custom Event object for standardizing event objects between browsers.
_V_.Event = function(src, props){
  // Event object
  if (src && src.type) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = (src.defaultPrevented || src.returnValue === false ||
      src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;

  // Event type
  } else {
    this.type = src;
  }

  // Put explicitly provided properties onto the event object
  if (props) { _V_.merge(this, props); }

  this.timeStamp = (new Date).getTime();

  // Mark it as fixed
  this[_V_.expando] = true;
};

_V_.Event.prototype = {
  preventDefault: function() {
    this.isDefaultPrevented = returnTrue;

    var e = this.originalEvent;
    if (!e) { return; }

    // if preventDefault exists run it on the original event
    if (e.preventDefault) { 
      e.preventDefault();
    // otherwise set the returnValue property of the original event to false (IE)
    } else {
      e.returnValue = false;
    }
  },
  stopPropagation: function() {
    this.isPropagationStopped = returnTrue;

    var e = this.originalEvent;
    if (!e) { return; }
    // if stopPropagation exists run it on the original event
    if (e.stopPropagation) { e.stopPropagation(); }
    // otherwise set the cancelBubble property of the original event to true (IE)
    e.cancelBubble = true;
  },
  stopImmediatePropagation: function() {
    this.isImmediatePropagationStopped = returnTrue;
    this.stopPropagation();
  },
  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse
};
_V_.Event.props = "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" ");

function returnTrue(){ return true; }
function returnFalse(){ return false; }

