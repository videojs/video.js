/* eslint-env qunit */
import TechFaker from '../tech/tech-faker';

/**
 * Tests baseline functionality for all tracks
 *
 # @param {Track} TrackClass the track class object to use for testing
 # @param {Object} options the options to setup a track with
 */
const TrackBaseline = function(TrackClass, options) {

  QUnit.test('is setup with id, kind, label, and language', function(assert) {
    const tech = new TechFaker();
    const track = new TrackClass(Object.assign({tech}, options));

    assert.equal(track.kind, options.kind, 'we have a kind');
    assert.equal(track.label, options.label, 'we have a label');
    assert.equal(track.language, options.language, 'we have a language');
    assert.equal(track.id, options.id, 'we have a id');

    tech.dispose();
  });

  QUnit.test('kind, language, id, are read only', function(assert) {
    const tech = new TechFaker();
    const track = new TrackClass(Object.assign({tech}, options));

    track.kind = 'subtitles';
    track.language = 'es';
    track.id = '2';

    assert.equal(track.kind, options.kind, 'we have a kind');
    assert.equal(track.language, options.language, 'we have a language');
    assert.equal(track.id, options.id, 'we have an id');

    tech.dispose();
  });

  QUnit.test('returns an instance of itself on non ie8 browsers', function(assert) {
    const tech = new TechFaker();
    const track = new TrackClass(Object.assign({tech}, options));

    assert.ok(track instanceof TrackClass, 'returns an instance');

    tech.dispose();
  });
};

export default TrackBaseline;
