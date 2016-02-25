/**
 * Tests baseline functionality for all tracks
 *
 # @param {Track} TrackClass the track class object to use for testing
 # @param {Object} options the options to setup a track with
 */
const TrackBaseline = function(TrackClass, options) {
  test('requires a tech', function() {
    let error = new Error('A tech was not provided.');

    q.throws(() => new TrackClass({}), error, 'a tech is required');
    q.throws(() => new TrackClass({tech: null}), error, 'a tech is required');
  });

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

  test('returns an instance of of itself on all browsers', function() {
    let track = new TrackClass(options);
    ok(track instanceof TrackClass, 'object is returned');
  });
};

export default TrackBaseline;
