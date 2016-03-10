import AudioTrack from '../../../src/js/tracks/audio/audio-track.js';
import TestHelpers from '../test-helpers.js';

const defaultTech = {
  audioTrack() {},
  on() {},
  off() {},
  currentTime() {}
};

q.module('Audio Track');

test('audio-track requires a tech', function() {
  let error = new Error('A tech was not provided.');

  q.throws(() => new AudioTrack(), error, 'a tech is required for audio track');
});

test('can create a AudioTrack with various properties', function() {
  let kind = 'main';
  let label = 'English';
  let language = 'en';
  let id = '1';
  let enabled = false;
  let tt = new AudioTrack({
    kind,
    language,
    id,
    enabled,
    tech: defaultTech
  });

  equal(tt.kind, kind, 'we have a kind');
  equal(tt.language, language, 'we have a language');
  equal(tt.id, id, 'we have a id');
  equal(tt.enabled, enabled, 'we have a enabled');
});

test('defaults when items not provided', function() {
  let tt = new AudioTrack({
    tech: defaultTech
  });

  equal(tt.kind, 'translation', 'kind defaulted to subtitles');
  equal(tt.enabled, false, 'enabled defaulted to false');
  equal(tt.language, '', 'language defaults to empty string');
});

test('kind can only be one of several options, defaults to translation', function() {
  let tt = new AudioTrack({
    tech: defaultTech,
    kind: 'foo'
  });

  equal(tt.kind, 'translation', 'the kind is set to main, not foo');
  notEqual(tt.kind, 'foo', 'the kind is set to main, not foo');

  tt = new AudioTrack({
    tech: defaultTech,
    kind: 'main'
  });

  equal(tt.kind, 'main', 'the kind is set to main');

  tt = new AudioTrack({
    tech: defaultTech,
    kind: 'alternative'
  });

  equal(tt.kind, 'alternative', 'the kind is set to alternative');

  tt = new AudioTrack({
    tech: defaultTech,
    kind: 'descriptions'
  });

  equal(tt.kind, 'descriptions', 'the kind is set to descriptions');

  tt = new AudioTrack({
    tech: defaultTech,
    kind: 'translation'
  });

  equal(tt.kind, 'translation', 'the kind is set to translation');

  tt = new AudioTrack({
    tech: defaultTech,
    kind: 'commentary'
  });

  equal(tt.kind, 'commentary', 'the kind is set to commentary');
});

test('mode can only be one of several options, defaults to false', function() {
  let tt = new AudioTrack({
    tech: defaultTech,
    enabled: true
  });

  equal(tt.enabled, false, 'the mode is set to false, not true');
  notEqual(tt.enabled, true, 'the mode is set to false, not true');

  tt = new AudioTrack({
    tech: defaultTech,
    enabled: false
  });

  equal(tt.enabled, false, 'the mode is set to false');

});

test('kind, language, id, are read only', function() {
  let kind = 'main';
  let language = 'en';
  let id = '1';
  let enabled = false;
  let tt = new AudioTrack({
    kind,
    language,
    id,
    enabled,
    tech: defaultTech
  });

  tt.kind = 'descriptions';
  tt.language = 'es';
  tt.id = '2';

  equal(tt.kind, kind, 'kind is still set to main');
  equal(tt.language, language, 'language is still set to en');
  equal(tt.id, id, 'id is still set to \'1\'');
});

