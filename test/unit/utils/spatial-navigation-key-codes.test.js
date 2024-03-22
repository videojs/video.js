/* eslint-env qunit */
import SpatialNavKeyCodes from '../../../src/js/utils/spatial-navigation-key-codes.js';
import TestHelpers from '../test-helpers.js';

QUnit.module('SpatialNavigationKeys', {
  beforeEach() {
    // Ensure each test starts with a player that has spatial navigation enabled
    this.player = TestHelpers.makePlayer({
      controls: true,
      bigPlayButton: true,
      spatialNavigation: { enabled: true }
    });
    // Directly reference the instantiated SpatialNavigation from the player
    this.spatialNav = this.player.spatialNavigation;
    this.spatialNav.start();
  },
  afterEach() {
    if (this.spatialNav && this.spatialNav.isListening_) {
      this.spatialNav.stop();
    }
    this.player.dispose();
  }
});

QUnit.test('should interpret control Keydowns succesfully', function(assert) {
  // Create and dispatch a mock keydown event.
  const playKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    key: 'play',
    code: 'play',
    keyCode: 415
  });

  const isPlayEvent = SpatialNavKeyCodes.isEventKey(playKeydown, 'play');

  // Create and dispatch a mock keydown event.
  const pauseKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    key: 'pause',
    code: 'pause',
    keyCode: 19
  });

  const isPauseEvent = SpatialNavKeyCodes.isEventKey(pauseKeydown, 'pause');

  assert.equal(isPlayEvent, true, 'should return true if key pressed was play & play was the expected key');
  assert.equal(isPauseEvent, true, 'should return true if key pressed was pause & pause was the expected key');
});

QUnit.test('should return event name type when given a keycode', function(assert) {
  // Create and dispatch a mock keydown event.
  const ffKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    keyCode: 417
  });

  const isffEvent = SpatialNavKeyCodes.getEventName(ffKeydown);

  // Create and dispatch a mock keydown event.
  const rwKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    keyCode: 412
  });

  const isrwEvent = SpatialNavKeyCodes.getEventName(rwKeydown);

  assert.equal(isffEvent, 'ff', 'should return `ff` when passed keycode `417`');
  assert.equal(isrwEvent, 'rw', 'should return `rw` when passed keycode `412`');
});

QUnit.test('should return event name if keyCode is not available', function(assert) {
  // Create and dispatch a mock keydown event.
  const ffKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    keyCode: null,
    code: 'ff'
  });

  const isffEvent = SpatialNavKeyCodes.getEventName(ffKeydown);

  // Create and dispatch a mock keydown event.
  const rwKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    keyCode: null,
    code: 'rw'
  });

  const isrwEvent = SpatialNavKeyCodes.getEventName(rwKeydown);

  assert.equal(isffEvent, 'ff', 'should return `ff` when passed code `ff`');
  assert.equal(isrwEvent, 'rw', 'should return `rw` when passed code `rw`');
});

QUnit.test('should return `null` when  keycode && code are not passed as parameters', function(assert) {
  // Create and dispatch a mock keydown event.
  const ffKeydown = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
  });

  const isffEvent = SpatialNavKeyCodes.getEventName(ffKeydown);

  assert.equal(isffEvent, null, 'should return `null` when not passed required parameters');
});
