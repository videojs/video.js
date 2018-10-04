/* eslint-env qunit */
import sinon from 'sinon';
import TestHelpers from './test-helpers';
import {assign} from '../../src/js/utils/obj';

const getExpectedBreakpoints = (o) => assign({}, {
  tiny: 210,
  xsmall: 320,
  small: 425,
  medium: 768,
  large: 1440,
  xlarge: 2560,
  huge: Infinity
}, o);

QUnit.module('Player: Breakpoints', {

  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer({});
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('breakpoints are disabled by default', function(assert) {
  assert.strictEqual(this.player.getBreakpoints(), null, 'no breakpoints defined');
  assert.strictEqual(this.player.currentBreakpoint(), null, 'no current breakpoint set');
});

QUnit.test('setting default breakpoints', function(assert) {
  this.player.setBreakpoints(true);
  assert.deepEqual(this.player.getBreakpoints(), getExpectedBreakpoints(), 'breakpoints defined');

  // Player should be 300x150 by default.
  assert.strictEqual(this.player.currentBreakpoint(), 'xsmall', 'current breakpoint set');
});

QUnit.test('setting custom breakpoints', function(assert) {
  this.player.setBreakpoints({tiny: 300});
  assert.deepEqual(this.player.getBreakpoints(), getExpectedBreakpoints({tiny: 300}), 'breakpoints defined');

  // Player should be 300x150 by default.
  assert.strictEqual(this.player.currentBreakpoint(), 'tiny', 'current breakpoint set');
});

QUnit.test('setting breakpoints via option', function(assert) {
  const player = TestHelpers.makePlayer({breakpoints: {tiny: 300}});

  assert.deepEqual(player.getBreakpoints(), getExpectedBreakpoints({tiny: 300}), 'breakpoints defined');

  // Player should be 300x150 by default.
  assert.strictEqual(player.currentBreakpoint(), 'tiny', 'current breakpoint set');
});

QUnit.test('changing the player size triggers breakpoints', function(assert) {
  let currentWidth;

  this.player.setBreakpoints(true);
  this.player.currentWidth = () => currentWidth;

  currentWidth = 200;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'tiny', 'current breakpoint is correct');

  currentWidth = 300;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'xsmall', 'current breakpoint is correct');

  currentWidth = 400;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'small', 'current breakpoint is correct');

  currentWidth = 600;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'medium', 'current breakpoint is correct');

  currentWidth = 900;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'large', 'current breakpoint is correct');

  currentWidth = 1600;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'xlarge', 'current breakpoint is correct');

  currentWidth = 3000;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'huge', 'current breakpoint is correct');
});
