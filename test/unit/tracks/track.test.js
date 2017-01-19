/* eslint-env qunit */
import TechFaker from '../tech/tech-faker';
import TrackBaseline from './track-baseline';
import Track from '../../../src/js/tracks/track.js';
import TextTrackList from '../../../src/js/tracks/text-track-list.js';

const defaultTech = {
  textTracks() {
    return new TextTrackList();
  },
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

QUnit.test('defaults when items not provided', function(assert) {
  const track = new Track({
    tech: defaultTech
  });

  assert.equal(track.kind, '', 'kind defaulted to empty string');
  assert.equal(track.label, '', 'label defaults to empty string');
  assert.equal(track.language, '', 'language defaults to empty string');
  assert.ok(track.id.match(/vjs_track_\d+/), 'id defaults to vjs_track_GUID');
});
