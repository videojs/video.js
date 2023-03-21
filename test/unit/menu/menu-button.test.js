/* eslint-env qunit */
import TestHelpers from '../test-helpers.js';

QUnit.module('MenuButton', {
  beforeEach(assert) {
    this.player = TestHelpers.makePlayer({

    });
  },
  afterEach(assert) {
    this.player.dispose();
  }
});
