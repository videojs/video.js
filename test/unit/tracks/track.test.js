import TechFaker from '../tech/tech-faker';
import TrackBaseline from './track-baseline';
import Track from '../../../src/js/tracks/track.js';
import * as browser from '../../../src/js/utils/browser.js';

const defaultTech = {
  textTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

// do baseline track testing
q.module('Track');

TrackBaseline(Track, {
  id: '1',
  kind: 'subtitles',
  mode: 'disabled',
  label: 'English',
  language: 'en',
  tech: new TechFaker()
});

test('defaults when items not provided', function() {
  let track = new Track({
    tech: defaultTech
  });

  equal(track.kind, '', 'kind defaulted to empty string');
  equal(track.label, '', 'label defaults to empty string');
  equal(track.language, '', 'language defaults to empty string');
  ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});
