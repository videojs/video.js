/* eslint-env qunit */
import TechFaker from '../tech/tech-faker';
import TrackBaseline from './track-baseline';
import Track from '../../../src/js/tracks/track.js';

const defaultTech = {
  textTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

// do baseline track testing
QUnit.module('Track');

TrackBaseline(Track, {
  id: '1',
  kind: 'subtitles',
  mode: 'disabled',
  label: 'English',
  language: 'en',
  tech: new TechFaker()
});

QUnit.test('defaults when items not provided', function() {
  const track = new Track({
    tech: defaultTech
  });

  QUnit.equal(track.kind, '', 'kind defaulted to empty string');
  QUnit.equal(track.label, '', 'label defaults to empty string');
  QUnit.equal(track.language, '', 'language defaults to empty string');
  QUnit.ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});
