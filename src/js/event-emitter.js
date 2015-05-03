import * as Events from './utils/events.js';

var EventEmitter = function() {};

EventEmitter.prototype.allowedEvents_ = {};

EventEmitter.prototype.on = function(type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  let ael = this.addEventListener;
  this.addEventListener = Function.prototype;
  Events.on(this, type, fn);
  this.addEventListener = ael;
};
EventEmitter.prototype.addEventListener = EventEmitter.prototype.on;

EventEmitter.prototype.off = function(type, fn) {
  Events.off(this, type, fn);
};
EventEmitter.prototype.removeEventListener = EventEmitter.prototype.off;

EventEmitter.prototype.one = function(type, fn) {
  Events.one(this, type, fn);
};

EventEmitter.prototype.trigger = function(event) {
  let type = event.type || event;

  if (typeof event === 'string') {
    event = {
      type: type
    };
  }
  event = Events.fixEvent(event);

  if (this.allowedEvents_[type] && this['on' + type]) {
    this['on' + type](event);
  }

  Events.trigger(this, event);
};
// The standard DOM EventTarget.dispatchEvent() is aliased to trigger()
EventEmitter.prototype.dispatchEvent = EventEmitter.prototype.trigger;

export default EventEmitter;
