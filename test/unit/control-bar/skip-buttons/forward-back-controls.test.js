/* eslint-env qunit */
import TestHelpers from '../../test-helpers';

QUnit.module('ForwardBackControls', {
  beforeEach(assert) {
    this.player = TestHelpers.makePlayer({
      jumpForwardAndBack: 5
    });
    this.button = this.player.controlBar.forwardBackControls;
  },
  afterEach(assert) {
    this.player.dispose();
  }
});

QUnit.test('is not visible if `jumpForwardAndBack` option not set', function(assert) {
  assert.expect(1);
  // TODO -> need to create a player for each test so that I can passs the options through it
  this.player.options_.jumpForwardAndBack = 2;
  assert.ok(this.button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});
