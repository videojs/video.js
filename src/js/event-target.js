/**
 * @file event-target.js
 */
import * as Events from './utils/events.js';

var EventTarget = function() {};

EventTarget.prototype.allowedEvents_ = {};

EventTarget.prototype.on = function(type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  let ael = this.addEventListener;
  this.addEventListener = () => {};
  Events.on(this, type, fn);
  this.addEventListener = ael;
};
EventTarget.prototype.addEventListener = EventTarget.prototype.on;

EventTarget.prototype.off = function(type, fn) {
  Events.off(this, type, fn);
};
EventTarget.prototype.removeEventListener = EventTarget.prototype.off;

EventTarget.prototype.one = function(type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  let ael = this.addEventListener;
  this.addEventListener = () => {};
  Events.one(this, type, fn);
  this.addEventListener = ael;
};

EventTarget.prototype.trigger = function(event) {
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
EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

export default EventTarget;
