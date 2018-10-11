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

QUnit.test('getBreakpointClass', function(assert) {
  assert.strictEqual(this.player.getBreakpointClass('tiny'), 'vjs-layout-tiny', 'the tiny breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('xsmall'), 'vjs-layout-x-small', 'the xsmall breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('small'), 'vjs-layout-small', 'the small breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('medium'), 'vjs-layout-medium', 'the medium breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('large'), 'vjs-layout-large', 'the large breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('xlarge'), 'vjs-layout-x-large', 'the xlarge breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('huge'), 'vjs-layout-huge', 'the huge breakpoint has the correct class');
  assert.strictEqual(this.player.getBreakpointClass('asdf'), '', 'there is no asdf breakpoint');
});

QUnit.test('breakpoints are disabled by default', function(assert) {
  assert.deepEqual(this.player.getBreakpoints(), getExpectedBreakpoints(), 'default breakpoints defined');
  assert.notOk(this.player.isResponsive(), 'player is not responsive');
  assert.strictEqual(this.player.currentBreakpoint(), '', 'no current breakpoint set');
  assert.strictEqual(this.player.currentBreakpointClass(), '', 'no current breakpoint set');
});

QUnit.test('enabling responsive mode', function(assert) {
  this.player.setResponsive(true);

  assert.ok(this.player.isResponsive(), 'player is responsive');

  // Player should be 300x150 by default.
  assert.strictEqual(this.player.currentBreakpoint(), 'xsmall', 'current breakpoint set');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-x-small', 'current breakpoint set');
});

QUnit.test('setting custom breakpoints and enabling responsive mode', function(assert) {
  this.player.setBreakpoints({tiny: 300});
  this.player.setResponsive(true);

  assert.deepEqual(this.player.getBreakpoints(), getExpectedBreakpoints({tiny: 300}), 'breakpoints defined');

  // Player should be 300x150 by default.
  assert.strictEqual(this.player.currentBreakpoint(), 'tiny', 'current breakpoint set');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-tiny', 'current breakpoint set');
});

QUnit.test('setting breakpoints/responsive via option', function(assert) {
  const player = TestHelpers.makePlayer({breakpoints: {tiny: 300}, responsive: true});

  assert.deepEqual(player.getBreakpoints(), getExpectedBreakpoints({tiny: 300}), 'breakpoints defined');

  // Player should be 300x150 by default.
  assert.strictEqual(player.currentBreakpoint(), 'tiny', 'current breakpoint set');
  assert.strictEqual(player.currentBreakpointClass(), 'vjs-layout-tiny', 'current breakpoint set');
});

QUnit.test('changing the player size triggers breakpoints', function(assert) {
  let currentWidth;

  this.player.setResponsive(true);
  this.player.currentWidth = () => currentWidth;

  currentWidth = 200;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'tiny', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-tiny', 'current breakpoint set');

  currentWidth = 300;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'xsmall', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-x-small', 'current breakpoint set');

  currentWidth = 400;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'small', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-small', 'current breakpoint set');

  currentWidth = 600;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'medium', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-medium', 'current breakpoint set');

  currentWidth = 900;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'large', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-large', 'current breakpoint set');

  currentWidth = 1600;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'xlarge', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-x-large', 'current breakpoint set');

  currentWidth = 3000;
  this.player.trigger('playerresize');
  assert.strictEqual(this.player.currentBreakpoint(), 'huge', 'current breakpoint is correct');
  assert.strictEqual(this.player.currentBreakpointClass(), 'vjs-layout-huge', 'current breakpoint set');
});
