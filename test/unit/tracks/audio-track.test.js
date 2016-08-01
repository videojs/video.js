/* eslint-env qunit */
import AudioTrack from '../../../src/js/tracks/audio-track.js';
import {AudioTrackKind} from '../../../src/js/tracks/track-enums.js';
import TrackBaseline from './track-baseline';

QUnit.module('Audio Track');

// do baseline track testing
TrackBaseline(AudioTrack, {
  id: '1',
  language: 'en',
  label: 'English',
  kind: 'main'
});

QUnit.test('can create an enabled propert on an AudioTrack', function() {
  const enabled = true;
  const track = new AudioTrack({
    enabled
  });

  QUnit.equal(track.enabled, enabled, 'enabled value matches what we passed in');
});

QUnit.test('defaults when items not provided', function() {
  const track = new AudioTrack();

  QUnit.equal(track.kind, '', 'kind defaulted to empty string');
  QUnit.equal(track.enabled, false, 'enabled defaulted to true since there is one track');
  QUnit.equal(track.label, '', 'label defaults to empty string');
  QUnit.equal(track.language, '', 'language defaults to empty string');
  QUnit.ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});

QUnit.test('kind can only be one of several options, defaults to empty string', function() {
  const track1 = new AudioTrack({
    kind: 'foo'
  });

  QUnit.equal(track1.kind, '', 'the kind is set to empty string, not foo');
  QUnit.notEqual(track1.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (const key in AudioTrackKind) {
    const currentKind = AudioTrackKind[key];
    const track = new AudioTrack({
      kind: currentKind
    });

    QUnit.equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

QUnit.test('enabled can only be instantiated to true or false, defaults to false', function() {
  let track = new AudioTrack({
    enabled: 'foo'
  });

  QUnit.equal(track.enabled, false, 'the enabled value is set to false, not foo');
  QUnit.notEqual(track.enabled, 'foo', 'the enabled value is not set to foo');

  track = new AudioTrack({
    enabled: true
  });

  QUnit.equal(track.enabled, true, 'the enabled value is set to true');

  track = new AudioTrack({
    enabled: false
  });

  QUnit.equal(track.enabled, false, 'the enabled value is set to false');
});

QUnit.test('enabled can only be changed to true or false', function() {
  const track = new AudioTrack();

  track.enabled = 'foo';
  QUnit.notEqual(track.enabled, 'foo', 'enabled not set to invalid value, foo');
  QUnit.equal(track.enabled, false, 'enabled remains on the old value, false');

  track.enabled = true;
  QUnit.equal(track.enabled, true, 'enabled was set to true');

  track.enabled = 'baz';
  QUnit.notEqual(track.enabled, 'baz', 'enabled not set to invalid value, baz');
  QUnit.equal(track.enabled, true, 'enabled remains on the old value, true');

  track.enabled = false;
  QUnit.equal(track.enabled, false, 'enabled was set to false');
});

QUnit.test('when enabled is changed enabledchange event is fired', function() {
  const track = new AudioTrack({
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
  QUnit.equal(eventsTriggered, 2, 'two enabled changes');

  // no event here
  track.enabled = false;
  track.enabled = false;
  QUnit.equal(eventsTriggered, 2, 'still two enabled changes');

  // one event
  track.enabled = true;
  QUnit.equal(eventsTriggered, 3, 'three enabled changes');

  // no events
  track.enabled = true;
  track.enabled = true;
  QUnit.equal(eventsTriggered, 3, 'still three enabled changes');
});
