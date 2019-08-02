/* eslint-env qunit */
import activeElement from '../../../src/js/mixins/active-element.js';
import Component from '../../../src/js/component.js';

const noop = () => {};

QUnit.module('mixins: activeElement', {
  beforeEach(done) {
    this.userActive = false;
    this.live = false;
    this.paused = true;
    this.keyFocus = false;
    this.mouseFocus = false;
    this.hidden = false;
    this.activeElement = null;

    this.liveTracker = Object.assign(new Component({}), {
      isLive: () => this.live
    });

    this.player = Object.assign(new Component({}), {
      paused: () => this.paused,
      userActive: () => this.userActive,
      liveTracker: this.liveTracker
    });

    this.doc = Object.assign(new Component({}), {visibilityState: true});

    Object.defineProperty(this.doc, 'hidden', {
      get: () => this.hidden,
      set: (v) => {
        this.hidden = v;
      }
    });

    Object.defineProperty(this.doc, 'activeElement', {
      get: () => this.activeElement,
      set: (v) => {
        this.activeElement = v;
      }
    });

    this.comp = new Component(this.player);
    Object.defineProperty(this.comp, 'mouseFocus_', {
      get: () => this.mouseFocus,
      set: (v) => {
        this.mouseFocus = v;
      }
    });

    Object.defineProperty(this.comp, 'keyFocus_', {
      get: () => this.keyFocus,
      set: (v) => {
        this.keyFocus = v;
      }
    });

    this.startUpdates = 0;
    this.stopUpdates = 0;

    activeElement(this.comp, {
      startUpdate: () => this.startUpdates++,
      stopUpdate: () => this.stopUpdates++,
      update: noop,
      doc: this.doc
    });
  },

  afterEach() {
    this.comp.dispose();
    this.doc.dispose();
    this.player.dispose();
    this.liveTracker.dispose();
  }
});

QUnit.test('throws an error without startUpdate/stopUpdate functions', function(assert) {
  const error = new Error('activeElement mixin requires startUpdate, stopUpdate, and update functions');

  assert.throws(() => activeElement(this.comp, {}), error, 'throws an error');
  assert.throws(() => activeElement(this.comp, {startUpdate: noop}), error, 'throws an error');
  assert.throws(() => activeElement(this.comp, {stopUpdate: noop}), error, 'throws an error');
  assert.throws(() => activeElement(this.comp, {update: noop}), error, 'throws an error');
  assert.throws(() => activeElement(this.comp, {startUpdate: noop, update: noop}), error, 'throws an error');
  assert.throws(() => activeElement(this.comp, {stopUpdate: noop, update: noop}), error, 'throws an error');
});

QUnit.test('shouldUpdate is correct by default', function(assert) {

  assert.strictEqual(this.comp.shouldUpdate(), false, 'false by default');

  const setters = {
    userActive: () => true,
    mouseFocus: () => true,
    keyFocus: () => true,
    activeElement: () => this.comp.el_
  };

  const runTest = (state, trueOrFalse) => {
    let runActiveTests = false;

    if (state.active) {
      runActiveTests = true;
    }

    delete state.active;
    Object.assign(this, state);
    if (runActiveTests) {
      Object.keys(setters).forEach((k) => {
        const oldValue = this[k];

        this[k] = setters[k]();
        assert.strictEqual(this.comp.shouldUpdate(), trueOrFalse, `${trueOrFalse} when ${k} is set and ${JSON.stringify(state)}`);
        this[k] = oldValue;
      });
    } else {
      assert.strictEqual(this.comp.shouldUpdate(), trueOrFalse, `${trueOrFalse} when ${JSON.stringify(state)}`);
    }

    this.live = false;
    this.hidden = false;
    this.paused = false;
  };

  // active permutations
  runTest({active: true, paused: false, live: false, hidden: false}, true);
  runTest({active: true, paused: true, live: false, hidden: false}, false);
  runTest({active: true, paused: true, live: true, hidden: false}, true);
  runTest({active: true, paused: true, live: true, hidden: true}, false);
  runTest({active: true, paused: false, live: true, hidden: true}, false);
  runTest({active: true, paused: false, live: false, hidden: true}, false);
  runTest({active: true, paused: false, live: true, hidden: false}, true);

  // paused permutations
  runTest({paused: true, active: false, live: false, hidden: false}, false);
  runTest({paused: true, active: true, live: false, hidden: false}, false);
  runTest({paused: true, active: true, live: true, hidden: false}, true);
  runTest({paused: true, active: true, live: true, hidden: true}, false);
  runTest({paused: true, active: false, live: true, hidden: true}, false);
  runTest({paused: true, active: false, live: false, hidden: true}, false);
  runTest({paused: true, active: false, live: true, hidden: false}, false);

  // live permutations
  runTest({live: true, active: false, paused: false, hidden: false}, false);
  runTest({live: true, active: true, paused: false, hidden: false}, true);
  runTest({live: true, active: true, paused: true, hidden: false}, true);
  runTest({live: true, active: true, paused: true, hidden: true}, false);
  runTest({live: true, active: false, paused: true, hidden: true}, false);
  runTest({live: true, active: false, paused: false, hidden: true}, false);
  runTest({live: true, active: false, paused: true, hidden: false}, false);

  // live permutations
  runTest({hidden: true, active: false, paused: false, live: false}, false);
  runTest({hidden: true, active: true, paused: false, live: false}, false);
  runTest({hidden: true, active: true, paused: true, live: false}, false);
  runTest({hidden: true, active: true, paused: true, live: true}, false);
  runTest({hidden: true, active: false, paused: true, live: true}, false);
  runTest({hidden: true, active: false, paused: false, live: true}, false);
  runTest({hidden: true, active: false, paused: true, live: false}, false);
});

QUnit.test('startUpdate and stopUpdate run correctly run for events', function(assert) {

  ['mouseenter', 'mouseleave', 'focus', 'blur'].forEach((event) => {
    this.comp.trigger(event);
  });
  ['useractive', 'userinactive'].forEach((event) => {
    this.userActive = event === 'useractive' ? true : false;
    this.player.trigger(event);
  });
  this.hidden = true;
  this.doc.trigger('visibilitychange');

  this.hidden = false;
  this.doc.trigger('visibilitychange');

  this.live = true;
  this.liveTracker.trigger('liveedgechange');

  assert.equal(this.startUpdates, 0, 'no start updates for events before playing');
  assert.equal(this.stopUpdates, 0, 'no stop updates for events before playing');

  // reset everything
  this.live = false;
  this.userActive = false;
  this.keyFocus = false;
  this.mouseFocus = false;
  this.paused = true;
  this.hidden = false;

  // set into an active state
  this.paused = false;
  this.userActive = true;

  this.player.trigger('playing');
  assert.equal(this.startUpdates, 1, 'playing runs startUpdate');

  this.paused = true;
  this.player.trigger('pause');
  assert.equal(this.stopUpdates, 1, 'pause runs stopUpdate');

  // reset paused
  this.paused = false;

  this.doc.trigger('visibilitychange');
  assert.equal(this.startUpdates, 2, 'visibilitychange without hidden runs startUpdate');

  this.hidden = true;
  this.doc.trigger('visibilitychange');
  assert.equal(this.stopUpdates, 2, 'visibilitychange with hidden runs stopUpdate');

  // reset hidden
  this.hidden = false;

  this.userActive = true;
  this.player.trigger('useractive');
  assert.equal(this.startUpdates, 3, 'useractive runs startUpdate');

  this.userActive = false;
  this.player.trigger('userinactive');
  assert.equal(this.stopUpdates, 3, 'userinactive runs stopUpdate');

  this.comp.trigger('mouseenter');
  assert.equal(this.startUpdates, 4, 'mouseenter runs startUpdate');

  this.comp.trigger('mouseleave');
  assert.equal(this.stopUpdates, 4, 'mouseleave runs stopUpdate');

  this.comp.trigger('focus');
  assert.equal(this.startUpdates, 5, 'focus runs startUpdate');

  this.comp.trigger('blur');
  assert.equal(this.stopUpdates, 5, 'blur runs stopUpdate');

  this.userActive = true;
  this.paused = false;
  this.live = true;
  this.liveTracker.trigger('liveedgechange');
  assert.equal(this.startUpdates, 6, 'liveedgechange runs startUpdate');
});
