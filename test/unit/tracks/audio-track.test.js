import AudioTrack from '../../../src/js/tracks/audio-track.js';
import {AudioTrackKind} from '../../../src/js/tracks/track-enums.js';
import TrackBaseline from './track-baseline';

q.module('Audio Track');

// do baseline track testing
TrackBaseline(AudioTrack, {
  id: '1',
  language: 'en',
  label: 'English',
  kind: 'main',
});

test('can create an enabled propert on an AudioTrack', function() {
  let enabled = true;
  let track = new AudioTrack({
    enabled,
  });
  equal(track.enabled, enabled, 'enabled value matches what we passed in');
});

test('defaults when items not provided', function() {
  let track = new AudioTrack();

  equal(track.kind, '', 'kind defaulted to empty string');
  equal(track.enabled, false, 'enabled defaulted to true since there is one track');
  equal(track.label, '', 'label defaults to empty string');
  equal(track.language, '', 'language defaults to empty string');
  ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});

test('kind can only be one of several options, defaults to empty string', function() {
  let track = new AudioTrack({
    kind: 'foo'
  });

  equal(track.kind, '', 'the kind is set to empty string, not foo');
  notEqual(track.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (let key in AudioTrackKind) {
    let currentKind = AudioTrackKind[key];
    let track = new AudioTrack({
      kind: currentKind,
    });
    equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

test('enabled can only be instantiated to true or false, defaults to false', function() {
  let track = new AudioTrack({
    enabled: 'foo'
  });

  equal(track.enabled, false, 'the enabled value is set to false, not foo');
  notEqual(track.enabled, 'foo', 'the enabled value is not set to foo');

  track = new AudioTrack({
    enabled: true
  });

  equal(track.enabled, true, 'the enabled value is set to true');

  track = new AudioTrack({
    enabled: false
  });

  equal(track.enabled, false, 'the enabled value is set to false');
});

test('enabled can only be changed to true or false', function() {
  let track = new AudioTrack();

  track.enabled = 'foo';
  notEqual(track.enabled, 'foo', 'enabled not set to invalid value, foo');
  equal(track.enabled, false, 'enabled remains on the old value, false');

  track.enabled = true;
  equal(track.enabled, true, 'enabled was set to true');

  track.enabled = 'baz';
  notEqual(track.enabled, 'baz', 'enabled not set to invalid value, baz');
  equal(track.enabled, true, 'enabled remains on the old value, true');

  track.enabled = false;
  equal(track.enabled, false, 'enabled was set to false');
});

test('when enabled is changed enabledchange event is fired', function() {
  let track = new AudioTrack({
    tech: this.tech,
    enabled: false
  });
  let eventsTriggered = 0;
  track.addEventListener('enabledchange', () => {
    eventsTriggered++;
  });

  // two events
  track.enabled = true;
  track.enabled = false;
  equal(eventsTriggered, 2, 'two enabled changes');

  // no event here
  track.enabled = false;
  track.enabled = false;
  equal(eventsTriggered, 2, 'still two enabled changes');

  // one event
  track.enabled = true;
  equal(eventsTriggered, 3, 'three enabled changes');

  // no events
  track.enabled = true;
  track.enabled = true;
  equal(eventsTriggered, 3, 'still three enabled changes');
});
