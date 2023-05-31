/* eslint-env qunit */
import LoadingSpinner from '../../src/js/loading-spinner.js';
import TestHelpers from './test-helpers.js';
import videojs from '../../src/js/video.js';

QUnit.module('Loading Spinner', {});

QUnit.test('should localize on languagechange', function(assert) {
  const player = TestHelpers.makePlayer({});
  const spinner = new LoadingSpinner(player);

  videojs.addLanguage('test', {'{1} is loading.': '{1} LOADING'});
  player.language('test');

  assert.equal(spinner.$('.vjs-control-text').textContent, 'Video Player LOADING', 'loading spinner text is localized');
});
