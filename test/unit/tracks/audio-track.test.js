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

QUnit.test('can create an enabled propert on an AudioTrack', function(assert) {
  const enabled = true;
  const track = new AudioTrack({
    enabled
  });

  assert.equal(track.enabled, enabled, 'enabled value matches what we passed in');
});

QUnit.test('defaults when items not provided', function(assert) {
  const track = new AudioTrack();

  assert.equal(track.kind, '', 'kind defaulted to empty string');
  assert.equal(track.enabled, false, 'enabled defaulted to true since there is one track');
  assert.equal(track.label, '', 'label defaults to empty string');
  assert.equal(track.language, '', 'language defaults to empty string');
  assert.ok(track.id.match(/vjs_track_\d+/), 'id defaults to vjs_track_GUID');
});

QUnit.test('kind can only be one of several options, defaults to empty string', function(assert) {
  const track1 = new AudioTrack({
    kind: 'foo'
  });

  assert.equal(track1.kind, '', 'the kind is set to empty string, not foo');
  assert.notEqual(track1.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (const key in AudioTrackKind) {
    const currentKind = AudioTrackKind[key];
    const track = new AudioTrack({
      kind: currentKind
    });

    assert.equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

QUnit.test('enabled can only be instantiated to true or false, defaults to false', function(assert) {
  let track = new AudioTrack({
    enabled: 'foo'
  });

  assert.equal(track.enabled, false, 'the enabled value is set to false, not foo');
  assert.notEqual(track.enabled, 'foo', 'the enabled value is not set to foo');

  track = new AudioTrack({
    enabled: true
  });

  assert.equal(track.enabled, true, 'the enabled value is set to true');

  track = new AudioTrack({
    enabled: false
  });

  assert.equal(track.enabled, false, 'the enabled value is set to false');
});

QUnit.test('enabled can only be changed to true or false', function(assert) {
  const track = new AudioTrack();

  track.enabled = 'foo';
  assert.notEqual(track.enabled, 'foo', 'enabled not set to invalid value, foo');
  assert.equal(track.enabled, false, 'enabled remains on the old value, false');

  track.enabled = true;
  assert.equal(track.enabled, true, 'enabled was set to true');

  track.enabled = 'baz';
  assert.notEqual(track.enabled, 'baz', 'enabled not set to invalid value, baz');
  assert.equal(track.enabled, true, 'enabled remains on the old value, true');

  track.enabled = false;
  assert.equal(track.enabled, false, 'enabled was set to false');
});

QUnit.test('when enabled is changed enabledchange event is fired', function(assert) {
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
  assert.equal(eventsTriggered, 2, 'two enabled changes');

  // no event here
  track.enabled = false;
  track.enabled = false;
  assert.equal(eventsTriggered, 2, 'still two enabled changes');

  // one event
  track.enabled = true;
  assert.equal(eventsTriggered, 3, 'three enabled changes');

  // no events
  track.enabled = true;
  track.enabled = true;
  assert.equal(eventsTriggered, 3, 'still three enabled changes');
});
