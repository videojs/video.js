/* eslint-env qunit */
import CloseButton from '../../src/js/close-button';
import sinon from 'sinon';
import TestHelpers from './test-helpers';

const getMockEscapeEvent = () => ({
  which: 27,
  preventDefault() {},
  stopPropagation() {}
});

QUnit.module('CloseButton', {

  beforeEach() {
    this.player = TestHelpers.makePlayer();
    this.btn = new CloseButton(this.player);
  },

  afterEach() {
    this.player.dispose();
    this.btn.dispose();
  }
});

QUnit.test('should create the expected element', function(assert) {
  const elAssertions = TestHelpers.assertEl(assert, this.btn.el(), {
    tagName: 'button',
    classes: [
      'vjs-button',
      'vjs-close-button',
      'vjs-control'
    ]
  });

  assert.expect(elAssertions.count + 1);
  elAssertions();
  assert.strictEqual(this.btn.el().querySelector('.vjs-control-text').innerHTML, 'Close');
});

QUnit.test('should allow setting the controlText_ property as an option', function(assert) {
  const text = 'OK!';
  const btn = new CloseButton(this.player, {controlText: text});

  assert.expect(1);
  assert.strictEqual(btn.controlText_, text, 'set the controlText_ property');

  btn.dispose();
});

QUnit.test('should trigger an event on activation', function(assert) {
  const spy = sinon.spy();

  this.btn.on('close', spy);
  this.btn.trigger('click');
  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'the "close" event was triggered');
});

QUnit.test('pressing ESC triggers close()', function(assert) {
  const spy = sinon.spy();

  this.btn.on('close', spy);
  this.btn.handleKeyDown(getMockEscapeEvent());
  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'ESC closed the modal');
});
