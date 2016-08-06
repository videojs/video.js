/* eslint-env qunit */
import window from 'global/window';
import EventTarget from '../../../src/js/event-target.js';
import TrackBaseline from './track-baseline';
import TechFaker from '../tech/tech-faker';
import TextTrack from '../../../src/js/tracks/text-track.js';
import TestHelpers from '../test-helpers.js';
import proxyquireify from 'proxyquireify';
import sinon from 'sinon';

const proxyquire = proxyquireify(require);
const defaultTech = {
  textTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

QUnit.module('Text Track');

// do baseline track testing
TrackBaseline(TextTrack, {
  id: '1',
  kind: 'subtitles',
  mode: 'disabled',
  label: 'English',
  language: 'en',
  tech: defaultTech
});

QUnit.test('requires a tech', function() {
  const error = new Error('A tech was not provided.');

  QUnit.throws(() => new TextTrack({}), error, 'a tech is required');
  QUnit.throws(() => new TextTrack({tech: null}), error, 'a tech is required');
});

QUnit.test('can create a TextTrack with a mode property', function() {
  const mode = 'disabled';
  const tt = new TextTrack({
    mode,
    tech: defaultTech
  });

  QUnit.equal(tt.mode, mode, 'we have a mode');
});

QUnit.test('defaults when items not provided', function() {
  const tt = new TextTrack({
    tech: TechFaker
  });

  QUnit.equal(tt.kind, 'subtitles', 'kind defaulted to subtitles');
  QUnit.equal(tt.mode, 'disabled', 'mode defaulted to disabled');
  QUnit.equal(tt.label, '', 'label defaults to empty string');
  QUnit.equal(tt.language, '', 'language defaults to empty string');
});

QUnit.test('kind can only be one of several options, defaults to subtitles', function() {
  let tt = new TextTrack({
    tech: defaultTech,
    kind: 'foo'
  });

  QUnit.equal(tt.kind, 'subtitles', 'the kind is set to subtitles, not foo');
  QUnit.notEqual(tt.kind, 'foo', 'the kind is set to subtitles, not foo');

  tt = new TextTrack({
    tech: defaultTech,
    kind: 'subtitles'
  });

  QUnit.equal(tt.kind, 'subtitles', 'the kind is set to subtitles');

  tt = new TextTrack({
    tech: defaultTech,
    kind: 'captions'
  });

  QUnit.equal(tt.kind, 'captions', 'the kind is set to captions');

  tt = new TextTrack({
    tech: defaultTech,
    kind: 'descriptions'
  });

  QUnit.equal(tt.kind, 'descriptions', 'the kind is set to descriptions');

  tt = new TextTrack({
    tech: defaultTech,
    kind: 'chapters'
  });

  QUnit.equal(tt.kind, 'chapters', 'the kind is set to chapters');

  tt = new TextTrack({
    tech: defaultTech,
    kind: 'metadata'
  });

  QUnit.equal(tt.kind, 'metadata', 'the kind is set to metadata');
});

QUnit.test('mode can only be one of several options, defaults to disabled', function() {
  let tt = new TextTrack({
    tech: defaultTech,
    mode: 'foo'
  });

  QUnit.equal(tt.mode, 'disabled', 'the mode is set to disabled, not foo');
  QUnit.notEqual(tt.mode, 'foo', 'the mode is set to disabld, not foo');

  tt = new TextTrack({
    tech: defaultTech,
    mode: 'disabled'
  });

  QUnit.equal(tt.mode, 'disabled', 'the mode is set to disabled');

  tt = new TextTrack({
    tech: defaultTech,
    mode: 'hidden'
  });

  QUnit.equal(tt.mode, 'hidden', 'the mode is set to hidden');

  tt = new TextTrack({
    tech: defaultTech,
    mode: 'showing'
  });

  QUnit.equal(tt.mode, 'showing', 'the mode is set to showing');
});

QUnit.test('cue and activeCues are read only', function() {
  const mode = 'disabled';
  const tt = new TextTrack({
    mode,
    tech: defaultTech
  });

  tt.cues = 'foo';
  tt.activeCues = 'bar';

  QUnit.notEqual(tt.cues, 'foo', 'cues is still original value');
  QUnit.notEqual(tt.activeCues, 'bar', 'activeCues is still original value');
});

QUnit.test('mode can only be set to a few options', function() {
  const tt = new TextTrack({
    tech: defaultTech
  });

  tt.mode = 'foo';

  QUnit.notEqual(tt.mode, 'foo', 'the mode is still the old value, disabled');
  QUnit.equal(tt.mode, 'disabled', 'still on the default mode, disabled');

  tt.mode = 'hidden';
  QUnit.equal(tt.mode, 'hidden', 'mode set to hidden');

  tt.mode = 'bar';
  QUnit.notEqual(tt.mode, 'bar', 'the mode is still the old value, hidden');
  QUnit.equal(tt.mode, 'hidden', 'still on the previous mode, hidden');

  tt.mode = 'showing';
  QUnit.equal(tt.mode, 'showing', 'mode set to showing');

  tt.mode = 'baz';
  QUnit.notEqual(tt.mode, 'baz', 'the mode is still the old value, showing');
  QUnit.equal(tt.mode, 'showing', 'still on the previous mode, showing');
});

QUnit.test('cues and activeCues return a TextTrackCueList', function() {
  const tt = new TextTrack({
    tech: defaultTech
  });

  QUnit.ok(tt.cues.getCueById, 'cues are a TextTrackCueList');
  QUnit.ok(tt.activeCues.getCueById, 'activeCues are a TextTrackCueList');
});

QUnit.test('cues can be added and removed from a TextTrack', function() {
  const tt = new TextTrack({
    tech: defaultTech
  });
  const cues = tt.cues;

  QUnit.equal(cues.length, 0, 'start with zero cues');

  tt.addCue({id: '1'});

  QUnit.equal(cues.length, 1, 'we have one cue');

  tt.removeCue(cues.getCueById('1'));

  QUnit.equal(cues.length, 0, 'we have removed our one cue');

  tt.addCue({id: '1'});
  tt.addCue({id: '2'});
  tt.addCue({id: '3'});

  QUnit.equal(cues.length, 3, 'we now have 3 cues');
});

QUnit.test('fires cuechange when cues become active and inactive', function() {
  const player = TestHelpers.makePlayer();
  let changes = 0;
  const tt = new TextTrack({
    tech: player.tech_,
    mode: 'showing'
  });
  const cuechangeHandler = function() {
    changes++;
  };

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 5
  });

  tt.oncuechange = cuechangeHandler;
  tt.addEventListener('cuechange', cuechangeHandler);

  player.tech_.currentTime = function() {
    return 2;
  };

  player.tech_.trigger('timeupdate');

  QUnit.equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange');

  player.tech_.currentTime = function() {
    return 7;
  };

  player.tech_.trigger('timeupdate');

  QUnit.equal(changes, 4, 'a cuechange event trigger addEventListener and oncuechange');

  player.dispose();
});

QUnit.test('tracks are parsed if vttjs is loaded', function() {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};
  window.WebVTT.Parser = () => {
    parserCreated = true;
    return {
      oncue() {},
      onparsingerror() {},
      onflush() {},
      parse() {},
      flush() {}
    };
  };

  // use proxyquire to stub xhr module because IE8s XDomainRequest usage
  let xhrHandler;
  const TextTrack_ = proxyquire('../../../src/js/tracks/text-track.js', {
    xhr(options, fn) {
      xhrHandler = fn;
    }
  });

  /* eslint-disable no-unused-vars */
  const tt = new TextTrack_({
    tech: defaultTech,
    src: 'http://example.com'
  });
  /* eslint-enable no-unused-vars */

  xhrHandler(null, {}, 'WEBVTT\n');

  QUnit.ok(parserCreated, 'WebVTT is loaded, so we can just parse');

  clock.restore();
  window.WebVTT = oldVTT;
});

QUnit.test('tracks are parsed once vttjs is loaded', function() {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;

  // use proxyquire to stub xhr module because IE8s XDomainRequest usage
  let xhrHandler;
  const TextTrack_ = proxyquire('../../../src/js/tracks/text-track.js', {
    xhr(options, fn) {
      xhrHandler = fn;
    }
  });

  window.WebVTT = true;

  const testTech = new EventTarget();

  testTech.textTracks = () => {};
  testTech.currentTime = () => {};

  /* eslint-disable no-unused-vars */
  const tt = new TextTrack_({
    tech: testTech,
    src: 'http://example.com'
  });
  /* eslint-enable no-unused-vars */

  xhrHandler(null, {}, 'WEBVTT\n');

  QUnit.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');

  clock.tick(100);
  QUnit.ok(!parserCreated, 'WebVTT still not loaded, do not try to parse yet');

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};
  window.WebVTT.Parser = () => {
    parserCreated = true;
    return {
      oncue() {},
      onparsingerror() {},
      onflush() {},
      parse() {},
      flush() {}
    };
  };

  testTech.trigger('vttjsloaded');
  QUnit.ok(parserCreated, 'WebVTT is loaded, so we can parse now');

  clock.restore();
  window.WebVTT = oldVTT;
});

QUnit.test('stops processing if vttjs loading errored out', function() {
  const clock = sinon.useFakeTimers();
  const errorSpy = sinon.spy();
  const oldVTT = window.WebVTT;
  const parserCreated = false;

  window.WebVTT = true;

  // use proxyquire to stub xhr module because IE8s XDomainRequest usage
  let xhrHandler;
  const TextTrack_ = proxyquire('../../../src/js/tracks/text-track.js', {
    xhr(options, fn) {
      xhrHandler = fn;
    },
    '../utils/log.js': {
      default: {
        error: errorSpy
      }
    }
  });

  const testTech = new EventTarget();

  testTech.textTracks = () => {};
  testTech.currentTime = () => {};

  sinon.stub(testTech, 'off');
  testTech.off.withArgs('vttjsloaded');

  /* eslint-disable no-unused-vars */
  const tt = new TextTrack_({
    tech: testTech,
    src: 'http://example.com'
  });
  /* eslint-enable no-unused-vars */

  xhrHandler(null, {}, 'WEBVTT\n');

  QUnit.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');

  testTech.trigger('vttjserror');
  const offSpyCall = testTech.off.getCall(0);

  QUnit.ok(errorSpy.called, 'vttjs failed to load, so log.error was called');
  if (errorSpy.called) {
    QUnit.ok(/^vttjs failed to load, stopping trying to process/.test(errorSpy.getCall(0).args[0]),
       'log.error was called with the expected message');
  }
  QUnit.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');
  QUnit.ok(offSpyCall, 'tech.off was called');

  clock.restore();
  window.WebVTT = oldVTT;
});
