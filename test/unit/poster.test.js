/* eslint-env qunit */
import PosterImage from '../../src/js/poster-image.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';

QUnit.module('PosterImage', {
  beforeEach() {
    // Store the original background support so we can test different vals
    this.poster1 = '#poster1';
    this.poster2 = '#poster2';

    // Create a mock player object that responds as a player would
    this.mockPlayer = {
      poster_: this.poster1,
      poster() {
        return this.poster_;
      },
      handler_: null,
      off() {},
      on(type, handler) {
        this.handler_ = handler;
      },
      trigger(type) {
        this.handler_.call();
      }
    };
  },
  afterEach() {}
});

QUnit.test('should create and update a poster image', function(assert) {
  const posterImage = new PosterImage(this.mockPlayer);
  let backgroundImage = posterImage.el().style.backgroundImage;

  assert.notEqual(backgroundImage.indexOf(this.poster1), -1, 'Background image used');

  // Update with a new poster source and check the new value
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  backgroundImage = posterImage.el().style.backgroundImage;
  assert.notEqual(backgroundImage.indexOf(this.poster2), -1, 'Background image updated');

  posterImage.dispose();
});

QUnit.test('should remove itself from the document flow when there is no poster', function(assert) {
  const posterImage = new PosterImage(this.mockPlayer);

  assert.equal(posterImage.el().style.display, '', 'Poster image shows by default');

  // Update with an empty string
  this.mockPlayer.poster_ = '';
  this.mockPlayer.trigger('posterchange');
  assert.equal(
    posterImage.hasClass('vjs-hidden'),
    true,
    'Poster image hides with an empty source'
  );

  // Updated with a valid source
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  assert.equal(
    posterImage.hasClass('vjs-hidden'),
    false,
    'Poster image shows again when there is a source'
  );

  posterImage.dispose();
});

QUnit.test('should hide the poster in the appropriate player states', function(assert) {
  const posterImage = new PosterImage(this.mockPlayer);
  const playerDiv = document.createElement('div');
  const fixture = document.getElementById('qunit-fixture');
  const el = posterImage.el();

  // Remove the source so when we add to the DOM it doesn't throw an error
  // We want to poster to still think it has a real source so it doesn't hide itself
  posterImage.setSrc('');

  // Add the elements to the DOM so styles are computed
  playerDiv.appendChild(el);
  fixture.appendChild(playerDiv);

  playerDiv.className = 'video-js vjs-has-started';
  assert.equal(
    TestHelpers.getComputedStyle(el, 'display'),
    'none',
    'The poster hides when the video has started (CSS may not be loaded)'
  );

  playerDiv.className = 'video-js vjs-has-started vjs-audio';
  assert.equal(
    TestHelpers.getComputedStyle(el, 'display'),
    'block',
    'The poster continues to show when playing audio'
  );

  posterImage.dispose();
});
