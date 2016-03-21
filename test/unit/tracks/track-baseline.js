import * as browser from '../../../src/js/utils/browser.js';
import document from 'global/document';

/**
 * Tests baseline functionality for all tracks
 *
 # @param {Track} TrackClass the track class object to use for testing
 # @param {Object} options the options to setup a track with
 */
const TrackBaseline = function(TrackClass, options) {

  test('is setup with id, kind, label, and language', function() {
    let track = new TrackClass(options);
    equal(track.kind, options.kind, 'we have a kind');
    equal(track.label, options.label, 'we have a label');
    equal(track.language, options.language, 'we have a language');
    equal(track.id, options.id, 'we have a id');
  });

  test('kind, label, language, id, are read only', function() {
    let track = new TrackClass(options);
    track.kind = 'subtitles';
    track.label = 'Spanish';
    track.language = 'es';
    track.id = '2';

    equal(track.kind, options.kind, 'we have a kind');
    equal(track.label, options.label, 'we have a label');
    equal(track.language, options.language, 'we have a language');
    equal(track.id, options.id, 'we have an id');
  });

  test('returns an instance of itself on non ie8 browsers', function() {
    let track = new TrackClass(options);
    if (browser.IS_IE8) {
      ok(track, 'returns an object on ie8');
      return;
    }
    ok(track instanceof TrackClass, 'returns an instance');
  });
};

export default TrackBaseline;
