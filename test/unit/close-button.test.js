import CloseButton from '../../src/js/close-button';
import TestHelpers from './test-helpers';

q.module('CloseButton', {

  beforeEach: function() {
    this.player = TestHelpers.makePlayer();
    this.btn = new CloseButton(this.player);
  },

  afterEach: function() {
    this.player.dispose();
    this.btn.dispose();
  }
});

q.test('should create the expected element', function(assert) {
  let classes = [
    'vjs-button',
    'vjs-close-button',
    'vjs-control'
  ];

  assert.expect(2 + classes.length);
  assert.strictEqual(this.btn.el().tagName.toLowerCase(), 'button', 'is a <button>');
  assert.strictEqual(this.btn.el().querySelector('.vjs-control-text').innerHTML, 'Close');
  TestHelpers.assertElHasClasses(assert, this.btn, classes);
});

q.test('should allow setting the controlText_ property as an option', function(assert) {
  var text = 'OK!';
  var btn = new CloseButton(this.player, {controlText: text});

  assert.expect(1);
  assert.strictEqual(btn.controlText_, text, 'set the controlText_ property');
});

q.test('should trigger an event on activation', function(assert) {
  var spy = sinon.spy();

  this.btn.on('close', spy);
  this.btn.trigger('click');
  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'the "close" event was triggered');
});
