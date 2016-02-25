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
  ok(track.id.match(/vjs_generic_track_\d{5}/), 'id defaults to vjs_generic_track_GUID');
});

test('trackType is used in default id, and defaults to generic', function() {
  let track = new Track({
    trackType: 'audio',
    tech: defaultTech
  });
  ok(track.id.match(/vjs_audio_track_\d{5}/), 'id defaults to vjs_audio_track_GUID');

  track = new Track({
    trackType: 'video',
    tech: defaultTech
  });
  ok(track.id.match(/vjs_video_track_\d{5}/), 'id defaults to vjs_video_track_GUID');

  track = new Track({
    trackType: 'text',
    tech: defaultTech
  });
  ok(track.id.match(/vjs_text_track_\d{5}/), 'id defaults to vjs_text_track_GUID');

  track = new Track({
    trackType: 'foo',
    tech: defaultTech
  });
  ok(track.id.match(/vjs_foo_track_\d{5}/), 'id defaults to vjs_foo_track_GUID');

  track = new Track({
    trackType: null,
    tech: defaultTech
  });
  ok(track.id.match(/vjs_generic_track_\d{5}/), 'id defaults to vjs_generic_track_GUID');

  track = new Track({
    tech: defaultTech
  });
  ok(track.id.match(/vjs_generic_track_\d{5}/), 'id defaults to vjs_generic_track_GUID');
});
