/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import * as browser from '../../src/js/utils/browser.js';

QUnit.module('BigPlayButton', {
  beforeEach() {
    this.player = TestHelpers.makePlayer();
    this.bigPlayButton = this.player.getChild('BigPlayButton');
    this.playToggle = this.player.getChild('ControlBar').getChild('PlayToggle');
    this.tech = this.player.tech(true);

    // Focus-only tests: avoid real play() promises/side effects.
    this.player.play = () => {};

    // Count focus targets instead of relying on document.activeElement.
    this.techFocus = 0;
    this.toggleFocus = 0;
    this.tech.focus = () => {
      this.techFocus++;
    };
    this.playToggle.focus = () => {
      this.toggleFocus++;
    };

    this.origEdge = browser.IS_EDGE;
  },
  afterEach() {
    browser.stub_IS_EDGE(this.origEdge);
    this.player.dispose();
  }
});

QUnit.test('mouse/tap click focuses the tech on non-Edge browsers', function(assert) {
  browser.stub_IS_EDGE(false);

  this.bigPlayButton.handleClick({type: 'tap'});

  assert.strictEqual(this.techFocus, 1, 'the tech (video element) is focused');
  assert.strictEqual(this.toggleFocus, 0, 'the play toggle is not focused');
});

// Regression guard for videojs/video.js#6270: focusing the <video> element as
// playback starts on Edge leaves protected (DRM/EME) video as a black frame.
QUnit.test('mouse/tap click focuses the play toggle, not the tech, on Edge', function(assert) {
  browser.stub_IS_EDGE(true);

  this.bigPlayButton.handleClick({type: 'tap'});

  assert.strictEqual(this.toggleFocus, 1, 'the play toggle is focused on Edge');
  assert.strictEqual(this.techFocus, 0, 'the tech is NOT focused on Edge');
});
