/* eslint-env qunit */
import SpatialNavigation from '../../src/js/spatial-navigation.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import document from 'global/document';

QUnit.module('SpatialNavigation', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    // Ensure each test starts with a player that has spatial navigation enabled
    this.player = TestHelpers.makePlayer({
      controls: true,
      bigPlayButton: true,
      spatialNavigation: { enabled: true }
    });
    // Directly reference the instantiated SpatialNavigation from the player
    this.spatialNav = this.player.spatialNavigation;
  },
  afterEach() {
    if (this.spatialNav && this.spatialNav.isListening_) {
      this.spatialNav.stop();
    }
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('Initialization sets up initial properties', function(assert) {
  assert.ok(this.spatialNav instanceof SpatialNavigation, 'Instance of SpatialNavigation');
  assert.deepEqual(this.spatialNav.focusableComponents, [], 'Initial focusableComponents is an empty array');
  assert.notOk(this.spatialNav.isListening_, 'isListening_ is initially false');
  assert.notOk(this.spatialNav.isPaused_, 'isPaused_ is initially false');
});

QUnit.test('start method initializes event listeners', function(assert) {
  const onSpy = sinon.spy(this.player, 'on');

  this.spatialNav.start();

  // Check if both keydown and loadedmetadata event listeners are added
  assert.ok(onSpy.calledWith('keydown'), 'keydown event listener added');
  assert.ok(onSpy.calledWith('loadedmetadata'), 'loadedmetadata event listener added');

  // Additionally, check if isListening_ flag is set
  assert.ok(this.spatialNav.isListening_, 'isListening_ flag is set');

  onSpy.restore();
});

QUnit.test('stop method removes event listeners', function(assert) {
  const offSpy = sinon.spy(this.player, 'off');

  this.spatialNav.start();
  this.spatialNav.stop();
  assert.ok(offSpy.calledWith('keydown'), 'keydown event listener removed');
  assert.notOk(this.spatialNav.isListening_, 'isListening_ flag is unset');
  offSpy.restore();
});

QUnit.test('onKeyDown_ handles navigation keys', function(assert) {
  // Ensure onKeyDown_ is bound correctly.
  assert.equal(typeof this.spatialNav.onKeyDown_, 'function', 'onKeyDown_ should be a function');
  assert.equal(this.spatialNav.onKeyDown_.hasOwnProperty('prototype'), false, 'onKeyDown_ should be bound to the instance');

  // Prepare a spy for the move method to track its calls.
  const moveSpy = sinon.spy(this.spatialNav, 'move');

  // Create and dispatch a mock keydown event.
  const event = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    key: 'ArrowRight',
    code: 'ArrowRight',
    keyCode: 39
  });

  // Directly invoke the onKeyDown_ handler to simulate receiving the event.
  this.spatialNav.onKeyDown_(event);

  // Assert that move was called correctly.
  assert.ok(moveSpy.calledOnce, 'move method should be called once on keydown event');
  assert.ok(moveSpy.calledWith('right'), 'move method should be called with "right" argument');

  // Restore the spy to clean up.
  moveSpy.restore();
});

QUnit.test('onKeyDown_ handles media keys', function(assert) {
  const performMediaActionSpy = sinon.spy(this.spatialNav, 'performMediaAction_');

  // Create a mock event for the 'play' key, using the hardcoded keyCode 415.
  const event = new KeyboardEvent('keydown', { // eslint-disable-line no-undef
    keyCode: 415
  });

  // Directly call the onKeyDown_ handler.
  this.spatialNav.onKeyDown_(event);

  // Assert that the performMediaAction_ method was called.
  assert.ok(performMediaActionSpy.calledOnce, 'performMediaAction_ method should be called once for media play key');
  assert.ok(performMediaActionSpy.calledWith('play'), 'performMediaAction_ should be called with "play"');

  performMediaActionSpy.restore();
});

QUnit.test('performMediaAction_ executes play', function(assert) {
  // Spy on the play method to monitor its calls.
  const playSpy = sinon.spy(this.player, 'play');

  // Trigger the performMediaAction_ with 'play'
  this.spatialNav.performMediaAction_('play');

  // Assert the play method was called.
  assert.ok(playSpy.calledOnce, 'play method should be called once for "play" action');

  // Restore the spy.
  playSpy.restore();
});

QUnit.test('focus method sets focus on a real player component', function(assert) {
  this.spatialNav.start();

  const component = this.player.getChild('bigPlayButton');

  assert.ok(component, 'The target component exists.');

  // Mock getIsAvailableToBeFocused to always return true
  component.getIsAvailableToBeFocused = () => true;

  // Spy on the focus method to check if it's called
  const focusSpy = sinon.spy(component, 'focus');

  this.spatialNav.focus(component);

  assert.ok(focusSpy.calledOnce, 'focus method called on component');

  // Clean up
  focusSpy.restore();
});

QUnit.test('refocusComponent method refocuses the last focused component after losing focus', function(assert) {
  this.spatialNav.start();

  // Get the bigPlayButton component from the player
  const bigPlayButton = this.player.getChild('bigPlayButton');

  // Mock getIsAvailableToBeFocused to always return true for testing
  bigPlayButton.getIsAvailableToBeFocused = () => true;

  // Focus the bigPlayButton and set it as the last focused component
  this.spatialNav.focus(bigPlayButton);

  // Simulate losing focus
  bigPlayButton.el().blur();

  // Call refocusComponent to attempt to refocus the last focused component
  this.spatialNav.refocusComponent();

  // Check if the bigPlayButton is focused again
  assert.strictEqual(this.spatialNav.lastFocusedComponent_, bigPlayButton, 'lastFocusedComponent_ should be set to the blurred component');
});

QUnit.test('move method changes focus based on direction', function(assert) {
  this.spatialNav.start();

  // Create mock components that mimic the necessary properties and methods.
  const button1 = {
    name: () => 'button1',
    el: () => document.createElement('div'),
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 0, y: 0 }, boundingClientRect: { top: 0, left: 0, bottom: 100, right: 100 } }),
    getIsAvailableToBeFocused: () => true
  };

  const button2 = {
    name: () => 'button2',
    el: () => document.createElement('div'),
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 200, y: 200 }, boundingClientRect: { top: 200, left: 200, bottom: 300, right: 300 } }),
    getIsAvailableToBeFocused: () => true
  };

  // Simulate adding these mock components to the list of focusable components.
  this.spatialNav.focusableComponents = [button1, button2];
  this.spatialNav.getCurrentComponent = () => button1;

  // Execute the move method to simulate focus change.
  this.spatialNav.move('right');

  // Assert the focus method was called on button2 but not on button1.
  assert.notOk(button1.focus.called, 'Focus should not be called on button1');
  assert.ok(button2.focus.calledOnce, 'Focus should move to button2');
});

QUnit.test('getCurrentComponent method returns the current focused component', function(assert) {
  this.spatialNav.start();

  // Get the bigPlayButton component from the player
  const bigPlayButton = this.player.getChild('bigPlayButton');

  // Mock getIsAvailableToBeFocused to always return true for testing
  bigPlayButton.getIsAvailableToBeFocused = () => true;

  // Focus the bigPlayButton
  this.spatialNav.focus(bigPlayButton);

  // Call getCurrentComponent to get the current focused component
  const currentComponent = this.spatialNav.getCurrentComponent();

  // Check if the currentComponent is the bigPlayButton
  assert.strictEqual(currentComponent, bigPlayButton, 'getCurrentComponent should return the focused component');
});

QUnit.test('add method adds a new focusable component', function(assert) {
  this.spatialNav.start();

  // Create a mock component with an 'el_' property and 'el' method
  const newComponent = {
    name: () => 'newComponent',
    el_: document.createElement('div'),
    el() {
      return this.el_;
    },
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 100, y: 100 }, boundingClientRect: { top: 100, left: 100, bottom: 200, right: 200 } }),
    getIsAvailableToBeFocused: () => true,
    getIsFocusable: () => true
  };

  // Add the new component
  this.spatialNav.add(newComponent);

  // Check if the new component is added to the list of focusable components
  assert.strictEqual(this.spatialNav.focusableComponents.includes(newComponent), true, 'New component should be added');
});

QUnit.test('remove method removes a focusable component', function(assert) {
  this.spatialNav.start();

  // Create a mock component
  const componentToRemove = {
    name: () => 'componentToRemove',
    el_: document.createElement('div'),
    el() {
      return this.el_;
    },
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 100, y: 100 }, boundingClientRect: { top: 100, left: 100, bottom: 200, right: 200 } }),
    getIsAvailableToBeFocused: () => true,
    getIsFocusable: () => true
  };

  // Add the component to be removed
  this.spatialNav.add(componentToRemove);

  // Remove the component
  this.spatialNav.remove(componentToRemove);

  // Check if the component is removed from the list of focusable components
  assert.strictEqual(this.spatialNav.focusableComponents.includes(componentToRemove), false, 'Component should be removed');
});

QUnit.test('clear method removes all focusable components', function(assert) {
  this.spatialNav.start();

  // Create mock components
  const component1 = {
    name: () => 'component1',
    el_: document.createElement('div'),
    el() {
      return this.el_;
    },
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 100, y: 100 }, boundingClientRect: { top: 100, left: 100, bottom: 200, right: 200 } }),
    getIsAvailableToBeFocused: () => true,
    getIsFocusable: () => true
  };

  const component2 = {
    name: () => 'component2',
    el_: document.createElement('div'),
    el() {
      return this.el_;
    },
    focus: sinon.spy(),
    getPositions: () => ({ center: { x: 100, y: 100 }, boundingClientRect: { top: 100, left: 100, bottom: 200, right: 200 } }),
    getIsAvailableToBeFocused: () => true,
    getIsFocusable: () => true
  };

  // Add the components
  this.spatialNav.add(component1);
  this.spatialNav.add(component2);

  // Clear all components
  this.spatialNav.clear();

  // Check if the focusableComponents array is empty after clearing
  assert.strictEqual(this.spatialNav.focusableComponents.length, 0, 'All components should be cleared');
});
