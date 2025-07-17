/* global document */

import QUnit from 'qunit';
import videojs from '../../../../src/js/video.js';
import InfoButton from '../../../../src/js/control-bar/custom-buttons/info-button.js';

QUnit.module('InfoButton', {
  beforeEach(assert) {
    this.fixture = document.getElementById('qunit-fixture');
    this.videoEl = document.createElement('video');
    this.videoEl.className = 'video-js';

    this.fixture.appendChild(this.videoEl);
    this.player = videojs(this.videoEl);
  },

  afterEach() {
    this.player.dispose();
  }
});

QUnit.test('should create the InfoButton component', function(assert) {
  const infoButton = new InfoButton(this.player, {});

  this.player.controlBar.addChild(infoButton);

  assert.ok(infoButton, 'InfoButton instance was created');
  assert.equal(infoButton.controlText(), 'Show video info', 'Has correct control text');
});

QUnit.test('should be registered as a component', function(assert) {
  const Component = videojs.getComponent('InfoButton');

  assert.ok(Component, 'InfoButton is registered');
});
