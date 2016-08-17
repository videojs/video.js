/* eslint-env qunit */
import * as browser from '../../../src/js/utils/browser.js';

/**
 * Tests baseline functionality for all tracks
 *
 # @param {Track} TrackClass the track class object to use for testing
 # @param {Object} options the options to setup a track with
 */
const TrackBaseline = function(TrackClass, options) {

  QUnit.test('is setup with id, kind, label, and language', function(assert) {
    const track = new TrackClass(options);

    assert.equal(track.kind, options.kind, 'we have a kind');
    assert.equal(track.label, options.label, 'we have a label');
    assert.equal(track.language, options.language, 'we have a language');
    assert.equal(track.id, options.id, 'we have a id');
  });

  QUnit.test('kind, label, language, id, are read only', function(assert) {
    const track = new TrackClass(options);

    track.kind = 'subtitles';
    track.label = 'Spanish';
    track.language = 'es';
    track.id = '2';

    assert.equal(track.kind, options.kind, 'we have a kind');
    assert.equal(track.label, options.label, 'we have a label');
    assert.equal(track.language, options.language, 'we have a language');
    assert.equal(track.id, options.id, 'we have an id');
  });

  QUnit.test('returns an instance of itself on non ie8 browsers', function(assert) {
    const track = new TrackClass(options);

    if (browser.IS_IE8) {
      assert.ok(track, 'returns an object on ie8');
      return;
    }
    assert.ok(track instanceof TrackClass, 'returns an instance');
  });
};

export default TrackBaseline;
