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
  let elAssertions = TestHelpers.assertEl(assert, this.btn.el(), {
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
