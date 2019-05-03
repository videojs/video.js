/* eslint-env qunit */
import * as Events from '../../src/js/utils/events.js';
import document from 'global/document';
import log from '../../src/js/utils/log.js';

QUnit.module('Events');

QUnit.test('should add and remove an event listener to an element', function(assert) {
  assert.expect(1);

  const el = document.createElement('div');
  const listener = function() {
    assert.ok(true, 'Click Triggered');
  };

  Events.on(el, 'click', listener);
  // 1 click
  Events.trigger(el, 'click');
  Events.off(el, 'click', listener);
  // No click should happen.
  Events.trigger(el, 'click');
});

QUnit.test('should add and remove multiple event listeners to an element with a single call', function(assert) {
  assert.expect(6);

  const el = document.createElement('div');
  const listener = function() {
    assert.ok(true, 'Callback triggered');
  };

  Events.on(el, ['click', 'event1', 'event2'], listener);

  Events.trigger(el, 'click');
  Events.trigger(el, 'click');
  Events.off(el, 'click', listener);
  // No click should happen.
  Events.trigger(el, 'click');

  Events.trigger(el, 'event1');
  Events.trigger(el, 'event1');
  Events.off(el, 'event1', listener);
  // No event1 should happen.
  Events.trigger(el, 'event1');

  Events.trigger(el, 'event2');
  Events.trigger(el, 'event2');
  Events.off(el, 'event2', listener);
  // No event2 should happen.
  Events.trigger(el, 'event2');

  Events.off(el, ['click', 'event1', 'event2'], listener);
});

QUnit.test('should be possible to pass data when you trigger an event', function(assert) {
  assert.expect(6);
  const el = document.createElement('div');
  const fakeData1 = 'Fake Data 1';
  const fakeData2 = {txt: 'Fake Data 2'};

  const listener = function(evt, hash) {
    assert.ok(true, 'Callback triggered');
    assert.deepEqual(fakeData1, hash.d1, 'Shoulbe be passed to the handler');
    assert.deepEqual(fakeData2, hash.d2, 'Shoulbe be passed to the handler');
  };

  Events.on(el, ['event1', 'event2'], listener);
  Events.trigger(el, 'event1', { d1: fakeData1, d2: fakeData2});
  Events.trigger(el, 'event2', { d1: fakeData1, d2: fakeData2});

  Events.off(el, ['event1', 'event2'], listener);
});

QUnit.test('should remove all listeners of a type', function(assert) {
  const el = document.createElement('div');
  let clicks = 0;
  const listener = function() {
    clicks++;
  };
  const listener2 = function() {
    clicks++;
  };

  Events.on(el, 'click', listener);
  Events.on(el, 'click', listener2);
  // 2 clicks
  Events.trigger(el, 'click');

  assert.ok(clicks === 2, 'both click listeners fired');

  Events.off(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');

  assert.ok(clicks === 2, 'no click listeners fired');
});

QUnit.test('should remove all listeners of an array of types', function(assert) {
  const el = document.createElement('div');
  let calls = 0;
  const listener = function() {
    calls++;
  };
  const listener2 = function() {
    calls++;
  };

  Events.on(el, ['click', 'event1'], listener);
  Events.on(el, ['click', 'event1'], listener2);
  // 2 calls
  Events.trigger(el, 'click');
  // 2 calls
  Events.trigger(el, 'event1');

  assert.ok(calls === 4, 'both click listeners fired');

  Events.off(el, ['click', 'event1']);
  // No click should happen.
  Events.trigger(el, 'click');
  // No event1 should happen.
  Events.trigger(el, 'event1');

  assert.ok(calls === 4, 'no event listeners fired');
});

QUnit.test('should remove all listeners from an element', function(assert) {
  assert.expect(2);

  const el = document.createElement('div');
  const listener = function() {
    assert.ok(true, 'Fake1 Triggered');
  };
  const listener2 = function() {
    assert.ok(true, 'Fake2 Triggered');
  };

  Events.on(el, 'fake1', listener);
  Events.on(el, 'fake2', listener2);

  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');

  Events.off(el);

  // No listener should happen.
  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');

  Events.off(el, 'fake1', listener);
  Events.off(el, 'fake2', listener2);
});

QUnit.test('should listen only once', function(assert) {
  assert.expect(1);

  const el = document.createElement('div');
  const listener = function() {
    assert.ok(true, 'Click Triggered');
  };

  Events.one(el, 'click', listener);
  // 1 click
  Events.trigger(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');
});

QUnit.test('should listen only once in multiple events from a single call', function(assert) {
  assert.expect(3);

  const el = document.createElement('div');
  const listener = function() {
    assert.ok(true, 'Callback Triggered');
  };

  Events.one(el, ['click', 'event1', 'event2'], listener);
  // 1 click
  Events.trigger(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');
  // event1 must be handled.
  Events.trigger(el, 'event1');
  // No event1 should be handled.
  Events.trigger(el, 'event1');
  // event2 must be handled.
  Events.trigger(el, 'event2');
  // No event2 should be handled.
  Events.trigger(el, 'event2');
});

QUnit.test('should stop immediate propagtion', function(assert) {
  assert.expect(1);

  const el = document.createElement('div');

  Events.on(el, 'test', function(e) {
    assert.ok(true, 'First listener fired');
    e.stopImmediatePropagation();
  });

  Events.on(el, 'test', function(e) {
    assert.ok(false, 'Second listener fired');
  });

  Events.trigger(el, 'test');
  Events.off(el, 'test');
});

QUnit.test('should bubble up DOM unless bubbles == false', function(assert) {
  assert.expect(3);

  const outer = document.createElement('div');
  const inner = outer.appendChild(document.createElement('div'));

  // Verify that if bubbles === true, event bubbles up dom.
  Events.on(inner, 'bubbles', function(e) {
    assert.ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'bubbles', function(e) {
    assert.ok(true, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'bubbles', target: inner, bubbles: true });

  // Only change 'bubbles' to false, and verify only inner handler is called.
  Events.on(inner, 'nobub', function(e) {
    assert.ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'nobub', function(e) {
    assert.ok(false, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'nobub', target: inner, bubbles: false });

  Events.off(inner, 'bubbles');
  Events.off(outer, 'bubbles');
  Events.off(inner, 'nobub');
  Events.off(outer, 'nobub');
});

QUnit.test('should have a defaultPrevented property on an event that was prevent from doing default action', function(assert) {
  assert.expect(2);

  const el = document.createElement('div');

  Events.on(el, 'test', function(e) {
    assert.ok(true, 'First listener fired');
    e.preventDefault();
  });

  Events.on(el, 'test', function(e) {
    assert.ok(e.defaultPrevented, 'Should have `defaultPrevented` to signify preventDefault being called');
  });

  Events.trigger(el, 'test');
  Events.off(el, 'test');
});

QUnit.test('should have relatedTarget correctly set on the event', function(assert) {
  assert.expect(2);

  const el1 = document.createElement('div');
  const el2 = document.createElement('div');
  const relatedEl = document.createElement('div');

  Events.on(el1, 'click', function(e) {
    assert.equal(e.relatedTarget, relatedEl, 'relatedTarget is set for all browsers when related element is set on the event');
  });

  Events.trigger(el1, { type: 'click', relatedTarget: relatedEl });

  Events.on(el2, 'click', function(e) {
    assert.equal(e.relatedTarget, null, 'relatedTarget is null when none is provided');
  });

  Events.trigger(el2, { type: 'click', relatedTarget: undefined });

  Events.off(el1, 'click');
  Events.off(el2, 'click');
});

QUnit.test('should execute remaining handlers after an exception in an event handler', function(assert) {
  assert.expect(1);

  const oldLogError = log.error;

  log.error = function() {};

  const el = document.createElement('div');
  const listener1 = function() {
    throw new Error('GURU MEDITATION ERROR');
  };
  const listener2 = function() {
    assert.ok(true, 'Click Triggered');
  };

  Events.on(el, 'click', listener1);
  Events.on(el, 'click', listener2);

  // 1 click
  Events.trigger(el, 'click');

  log.error = oldLogError;

  Events.off(el, 'click');
});

QUnit.test('trigger with an object should set the correct target property', function(assert) {
  const el = document.createElement('div');

  Events.on(el, 'click', function(e) {
    assert.equal(e.target, el, 'the event object target should be our element');
  });
  Events.trigger(el, { type: 'click'});

  Events.off(el, 'click');
});

QUnit.test('retrigger with a string should use the new element as target', function(assert) {
  const el1 = document.createElement('div');
  const el2 = document.createElement('div');

  Events.on(el2, 'click', function(e) {
    assert.equal(e.target, el2, 'the event object target should be the new element');
  });
  Events.on(el1, 'click', function(e) {
    Events.trigger(el2, 'click');
  });
  Events.trigger(el1, 'click');
  Events.trigger(el1, {type: 'click'});

  Events.off(el1, 'click');
  Events.off(el2, 'click');
});

QUnit.test('retrigger with an object should use the old element as target', function(assert) {
  const el1 = document.createElement('div');
  const el2 = document.createElement('div');

  Events.on(el2, 'click', function(e) {
    assert.equal(e.target, el1, 'the event object target should be the old element');
  });
  Events.on(el1, 'click', function(e) {
    Events.trigger(el2, e);
  });
  Events.trigger(el1, 'click');
  Events.trigger(el1, {type: 'click'});

  Events.off(el1, 'click');
  Events.off(el2, 'click');
});

QUnit.test('should listen only once for race', function(assert) {
  const el = document.createElement('div');
  let triggered = 0;
  const listener = () => triggered++;

  Events.race(el, 'click', listener);
  assert.equal(triggered, 0, 'listener was not yet triggered');
  // 1 click
  Events.trigger(el, 'click');

  assert.equal(triggered, 1, 'listener was triggered');
  // No click should happen.
  Events.trigger(el, 'click');
  assert.equal(triggered, 1, 'listener was not triggered again');
});

QUnit.test('only the first event should call listener via race', function(assert) {
  const el = document.createElement('div');
  let triggered = 0;
  const listener = () => triggered++;

  Events.race(el, ['click', 'event1', 'event2'], listener);
  assert.equal(triggered, 0, 'listener was not yet triggered');

  // 1 click
  Events.trigger(el, 'click');
  assert.equal(triggered, 1, 'listener was triggered');
  // nothing below here should trigger the Callback
  Events.trigger(el, 'click');
  Events.trigger(el, 'event1');
  Events.trigger(el, 'event1');
  Events.trigger(el, 'event2');
  Events.trigger(el, 'event2');
  assert.equal(triggered, 1, 'listener was not triggered again');
});
