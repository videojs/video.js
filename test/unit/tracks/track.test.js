/* eslint-env qunit */
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
  language: 'en'
  // tech is added in baseline
  // tech: new TechFaker()
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

QUnit.test('label is updated and labelchange event is fired when label is changed', function(assert) {
  const track = new Track({
    tech: defaultTech
  });
  let eventsTriggered = 0;

  track.addEventListener('labelchange', () => {
    eventsTriggered++;
  });

  track.label = 'English (auto)';
  assert.equal(eventsTriggered, 1, 'one label change');
  assert.equal(track.label, 'English (auto)');

  track.label = 'English (auto)';
  assert.equal(eventsTriggered, 1, 'additional label change not fired when new label is the same as old');
  assert.equal(track.label, 'English (auto)');

  track.off();
});
