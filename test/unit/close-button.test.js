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
  var classes = ['button', 'close', 'control'];

  assert.expect(2 + classes.length);
  assert.strictEqual(this.btn.el().tagName.toLowerCase(), 'button', 'is a <button>');
  assert.strictEqual(this.btn.el().textContent, 'Close');

  classes.forEach(function(s) {
    var c = 'vjs-' + s;
    assert.ok(this.btn.hasClass(c), 'has the "' + c + '" class');
  }, this);
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
