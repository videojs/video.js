import PosterImage from '../../src/js/poster-image.js';
import * as browser from '../../src/js/utils/browser.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';

q.module('PosterImage', {
  'setup': function(){
    // Store the original background support so we can test different vals
    this.origVal = browser.BACKGROUND_SIZE_SUPPORTED;
    this.poster1 = 'http://example.com/poster.jpg';
    this.poster2 = 'http://example.com/UPDATED.jpg';

    // Create a mock player object that responds as a player would
    this.mockPlayer = {
      poster_: this.poster1,
      poster: function(){
        return this.poster_;
      },
      handler_: null,
      on: function(type, handler){
        this.handler_ = handler;
      },
      trigger: function(type){
        this.handler_.call();
      }
    };
  },
  'teardown': function(){
    browser.BACKGROUND_SIZE_SUPPORTED = this.origVal;
  }
});

test('should create and update a poster image', function(){
  var posterImage;

  // IE11 adds quotes in the returned background url so need to normalize the result
  function normalizeUrl(url){
    return url.replace(new RegExp('\\"', 'g'),'');
  }

  browser.BACKGROUND_SIZE_SUPPORTED = true;
  posterImage = new PosterImage(this.mockPlayer);
  equal(normalizeUrl(posterImage.el().style.backgroundImage), 'url('+this.poster1+')', 'Background image used');

  // Update with a new poster source and check the new value
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(normalizeUrl(posterImage.el().style.backgroundImage), 'url('+this.poster2+')', 'Background image updated');
});

test('should create and update a fallback image in older browsers', function(){
  var posterImage;

  browser.BACKGROUND_SIZE_SUPPORTED = false;
  posterImage = new PosterImage(this.mockPlayer);
  equal(posterImage.fallbackImg_.src, this.poster1, 'Fallback image created');

  // Update with a new poster source and check the new value
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.fallbackImg_.src, this.poster2, 'Fallback image updated');
});

test('should remove itself from the document flow when there is no poster', function(){
  var posterImage;

  posterImage = new PosterImage(this.mockPlayer);
  equal(posterImage.el().style.display, '', 'Poster image shows by default');

  // Update with an empty string
  this.mockPlayer.poster_ = '';
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.hasClass('vjs-hidden'), true, 'Poster image hides with an empty source');

  // Updated with a valid source
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.hasClass('vjs-hidden'), false, 'Poster image shows again when there is a source');
});

test('should hide the poster in the appropriate player states', function(){
  var posterImage = new PosterImage(this.mockPlayer);
  var playerDiv = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');
  var el = posterImage.el();

  // Remove the source so when we add to the DOM it doesn't throw an error
  // We want to poster to still think it has a real source so it doesn't hide itself
  posterImage.setSrc('');

  // Add the elements to the DOM so styles are computed
  playerDiv.appendChild(el);
  fixture.appendChild(playerDiv);

  playerDiv.className = 'video-js vjs-has-started';
  equal(TestHelpers.getComputedStyle(el, 'display'), 'none', 'The poster hides when the video has started (CSS may not be loaded)');

  playerDiv.className = 'video-js vjs-has-started vjs-audio';
  equal(TestHelpers.getComputedStyle(el, 'display'), 'block', 'The poster continues to show when playing audio');
});
