/* eslint-env qunit */
import EventTarget from '../../src/js/event-target.js';
import sinon from 'sinon';

const { test } = QUnit;

QUnit.module('EventTarget', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

test('EventTarget queueTrigger queues the event', function(t) {
  const et = new EventTarget();
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  et.on('change', changeHandler);

  et.queueTrigger('change');
  t.equal(changes, 0, 'EventTarget did not trigger a change event yet');

  this.clock.tick(1);
  t.equal(changes, 1, 'EventTarget triggered a change event once the clock ticked');
  et.off('change', changeHandler);
});

test('EventTarget will only trigger event once with queueTrigger', function(t) {
  const et = new EventTarget();
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  et.on('change', changeHandler);

  et.queueTrigger('change');
  t.equal(changes, 0, 'EventTarget did not trigger a change event yet');
  et.queueTrigger('change');
  t.equal(changes, 0, 'EventTarget did not trigger a change event yet');
  et.queueTrigger('change');
  t.equal(changes, 0, 'EventTarget did not trigger a change event yet');
  et.queueTrigger('change');

  this.clock.tick(100);
  t.equal(changes, 1, 'EventTarget *only* triggered a change event once');

  et.off('change', changeHandler);
});
