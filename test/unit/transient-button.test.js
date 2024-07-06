/* eslint-env qunit */
import TransientButton from '../../src/js/transient-button.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';

QUnit.module('TransientButton');

QUnit.test('show and hide should add and remove force-display class', function(assert) {
  const player = TestHelpers.makePlayer();

  const testButton = new TransientButton(player, {});

  player.addChild(testButton);

  assert.false(testButton.hasClass('force-display'), 'button is initially hidden');

  testButton.show();
  assert.true(testButton.hasClass('force-display'), 'button has force-display after show()');

  testButton.hide();
  assert.false(testButton.hasClass('force-display'), 'button no longer has force-display after hide()');

  player.dispose();
});

QUnit.test('show and hide should add and remove force-display class', function(assert) {
  this.clock = sinon.useFakeTimers();

  const player = TestHelpers.makePlayer();

  const testButton = new TransientButton(player, {});

  player.hasStarted(true);
  player.userActive(false);

  player.addChild(testButton);

  assert.false(testButton.hasClass('force-display'), 'button is initially hidden');

  testButton.show();
  assert.true(testButton.hasClass('force-display'), 'button has force-display after show()');

  this.clock.tick(2000);
  assert.true(testButton.hasClass('force-display'), 'button still has force-display until timeout');

  this.clock.tick(2500);
  assert.false(testButton.hasClass('force-display'), 'button no longer has force-display until timeout');

  player.dispose();

  this.clock.restore();
});

QUnit.test('applies posiiton classes', function(assert) {
  const player = TestHelpers.makePlayer();
  const testButton1 = new TransientButton(player, { position: ['top', 'left']});
  const testButton2 = new TransientButton(player, { position: ['bottom', 'right']});
  const testButton3 = new TransientButton(player, {});

  assert.ok(testButton1.hasClass('vjs-top'), 'position top yields vjs-top class');
  assert.ok(testButton1.hasClass('vjs-left'), 'position left yields vjs-left class');
  assert.ok(testButton2.hasClass('vjs-bottom'), 'position bottom yields vjs-bottom class');
  assert.ok(testButton2.hasClass('vjs-right'), 'position right yields vjs-right class');
  ['vjs-top', 'vjs-neartop', 'vjs-bottom', 'vjs-left', 'vjs-right'].forEach(positionClass => {
    assert.false(testButton3.hasClass(positionClass), `with no options should be no ${positionClass} class`);
  });

  player.dispose();
});

QUnit.test('takes focus only when specified', function(assert) {

  const player = TestHelpers.makePlayer();
  const testButton1 = new TransientButton(player, {});
  const testButton2 = new TransientButton(player, {takeFocus: true});

  const spy1 = sinon.spy(testButton1.el_, 'focus');
  const spy2 = sinon.spy(testButton2.el_, 'focus');

  player.addChild(testButton1);
  testButton1.show();
  assert.false(spy1.called, 'by default a button should not take focus');

  player.addChild(testButton2);
  testButton2.show();
  assert.true(spy2.called, 'when enabled button should take focus');

  player.dispose();
});
