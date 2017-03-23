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

QUnit.module('Text Track', {
  beforeEach() {
    this.tech = new TechFaker();
  },
  afterEach() {
    this.tech.dispose();
    this.tech = null;
  }
});

// do baseline track testing
TrackBaseline(TextTrack, {
  id: '1',
  kind: 'subtitles',
  mode: 'disabled',
  label: 'English',
  language: 'en',
  tech: new TechFaker()
});

QUnit.test('requires a tech', function(assert) {
  const error = new Error('A tech was not provided.');

  assert.throws(() => new TextTrack({}), error, 'a tech is required');
  assert.throws(() => new TextTrack({tech: null}), error, 'a tech is required');
});

QUnit.test('can create a TextTrack with a mode property', function(assert) {
  const mode = 'disabled';
  const tt = new TextTrack({
    mode,
    tech: this.tech
  });

  assert.equal(tt.mode, mode, 'we have a mode');
});

QUnit.test('defaults when items not provided', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  assert.equal(tt.kind, 'subtitles', 'kind defaulted to subtitles');
  assert.equal(tt.mode, 'disabled', 'mode defaulted to disabled');
  assert.equal(tt.label, '', 'label defaults to empty string');
  assert.equal(tt.language, '', 'language defaults to empty string');
});

QUnit.test('kind can only be one of several options, defaults to subtitles', function(assert) {
  let tt = new TextTrack({
    tech: this.tech,
    kind: 'foo'
  });

  assert.equal(tt.kind, 'subtitles', 'the kind is set to subtitles, not foo');
  assert.notEqual(tt.kind, 'foo', 'the kind is set to subtitles, not foo');

  tt = new TextTrack({
    tech: this.tech,
    kind: 'subtitles'
  });

  assert.equal(tt.kind, 'subtitles', 'the kind is set to subtitles');

  tt = new TextTrack({
    tech: this.tech,
    kind: 'captions'
  });

  assert.equal(tt.kind, 'captions', 'the kind is set to captions');

  tt = new TextTrack({
    tech: this.tech,
    kind: 'descriptions'
  });

  assert.equal(tt.kind, 'descriptions', 'the kind is set to descriptions');

  tt = new TextTrack({
    tech: this.tech,
    kind: 'chapters'
  });

  assert.equal(tt.kind, 'chapters', 'the kind is set to chapters');

  tt = new TextTrack({
    tech: this.tech,
    kind: 'metadata'
  });

  assert.equal(tt.kind, 'metadata', 'the kind is set to metadata');
});

QUnit.test('mode can only be one of several options, defaults to disabled', function(assert) {
  let tt = new TextTrack({
    tech: this.tech,
    mode: 'foo'
  });

  assert.equal(tt.mode, 'disabled', 'the mode is set to disabled, not foo');
  assert.notEqual(tt.mode, 'foo', 'the mode is set to disabld, not foo');

  tt = new TextTrack({
    tech: this.tech,
    mode: 'disabled'
  });

  assert.equal(tt.mode, 'disabled', 'the mode is set to disabled');

  tt = new TextTrack({
    tech: this.tech,
    mode: 'hidden'
  });

  assert.equal(tt.mode, 'hidden', 'the mode is set to hidden');

  tt = new TextTrack({
    tech: this.tech,
    mode: 'showing'
  });

  assert.equal(tt.mode, 'showing', 'the mode is set to showing');
});

QUnit.test('cue and activeCues are read only', function(assert) {
  const mode = 'disabled';
  const tt = new TextTrack({
    mode,
    tech: this.tech
  });

  tt.cues = 'foo';
  tt.activeCues = 'bar';

  assert.notEqual(tt.cues, 'foo', 'cues is still original value');
  assert.notEqual(tt.activeCues, 'bar', 'activeCues is still original value');
});

QUnit.test('mode can only be set to a few options', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  tt.mode = 'foo';

  assert.notEqual(tt.mode, 'foo', 'the mode is still the old value, disabled');
  assert.equal(tt.mode, 'disabled', 'still on the default mode, disabled');

  tt.mode = 'hidden';
  assert.equal(tt.mode, 'hidden', 'mode set to hidden');

  tt.mode = 'bar';
  assert.notEqual(tt.mode, 'bar', 'the mode is still the old value, hidden');
  assert.equal(tt.mode, 'hidden', 'still on the previous mode, hidden');

  tt.mode = 'showing';
  assert.equal(tt.mode, 'showing', 'mode set to showing');

  tt.mode = 'baz';
  assert.notEqual(tt.mode, 'baz', 'the mode is still the old value, showing');
  assert.equal(tt.mode, 'showing', 'still on the previous mode, showing');
});

QUnit.test('cues and activeCues return a TextTrackCueList', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  assert.ok(tt.cues.getCueById, 'cues are a TextTrackCueList');
  assert.ok(tt.activeCues.getCueById, 'activeCues are a TextTrackCueList');
});

QUnit.test('cues can be added and removed from a TextTrack', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });
  const cues = tt.cues;

  assert.equal(cues.length, 0, 'start with zero cues');

  tt.addCue({id: '1'});

  assert.equal(cues.length, 1, 'we have one cue');

  tt.removeCue(cues.getCueById('1'));

  assert.equal(cues.length, 0, 'we have removed our one cue');

  tt.addCue({id: '1'});
  tt.addCue({id: '2'});
  tt.addCue({id: '3'});

  assert.equal(cues.length, 3, 'we now have 3 cues');
});

QUnit.test('original cue can be used to remove cue from cues list', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });
  const Cue = window.VTTCue ||
              window.vttjs && window.vttjs.VTTCue ||
              window.TextTrackCue;

  const cue1 = new Cue(0, 1, 'some-cue');

  assert.equal(tt.cues.length, 0, 'start with zero cues');
  tt.addCue(cue1);
  assert.equal(tt.cues.length, 1, 'we have one cue');

  tt.removeCue(cue1);
  assert.equal(tt.cues.length, 0, 'we have removed cue1');
});

QUnit.test('can only remove one cue at a time', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });
  const Cue = window.VTTCue ||
              window.vttjs && window.vttjs.VTTCue ||
              window.TextTrackCue;

  const cue1 = new Cue(0, 1, 'some-cue');

  assert.equal(tt.cues.length, 0, 'start with zero cues');
  tt.addCue(cue1);
  tt.addCue(cue1);
  assert.equal(tt.cues.length, 2, 'we have two cues');

  tt.removeCue(cue1);
  assert.equal(tt.cues.length, 1, 'we have removed one instance of cue1');

  tt.removeCue(cue1);
  assert.equal(tt.cues.length, 0, 'we have removed the other instance of cue1');
});

QUnit.test('does not fire cuechange before Tech is ready', function(assert) {
  const done = assert.async();
  const player = TestHelpers.makePlayer({techfaker: {autoReady: false}});
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
    startTime: 0,
    endTime: 5
  });

  tt.oncuechange = cuechangeHandler;
  tt.addEventListener('cuechange', cuechangeHandler);

  player.tech_.currentTime = function() {
    return 0;
  };

  player.tech_.trigger('timeupdate');
  assert.equal(changes, 0, 'a cuechange event is not triggered');

  player.tech_.on('ready', function() {
    player.tech_.currentTime = function() {
      return 0.2;
    };

    player.tech_.trigger('timeupdate');

    assert.equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange');

    player.dispose();
    done();
  });
  player.tech_.triggerReady();
});

QUnit.test('fires cuechange when cues become active and inactive', function(assert) {
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

  assert.equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange');

  player.tech_.currentTime = function() {
    return 7;
  };

  player.tech_.trigger('timeupdate');

  assert.equal(changes, 4, 'a cuechange event trigger addEventListener and oncuechange');

  player.dispose();
});

QUnit.test('tracks are parsed if vttjs is loaded', function(assert) {
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
  }).default;

  /* eslint-disable no-unused-vars */
  const tt = new TextTrack_({
    tech: this.tech,
    src: 'http://example.com'
  });
  /* eslint-enable no-unused-vars */

  xhrHandler(null, {}, 'WEBVTT\n');

  assert.ok(parserCreated, 'WebVTT is loaded, so we can just parse');

  clock.restore();
  window.WebVTT = oldVTT;
});

QUnit.test('tracks are parsed once vttjs is loaded', function(assert) {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;

  // use proxyquire to stub xhr module because IE8s XDomainRequest usage
  let xhrHandler;
  const TextTrack_ = proxyquire('../../../src/js/tracks/text-track.js', {
    xhr(options, fn) {
      xhrHandler = fn;
    }
  }).default;

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

  assert.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');

  clock.tick(100);
  assert.ok(!parserCreated, 'WebVTT still not loaded, do not try to parse yet');

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
  assert.ok(parserCreated, 'WebVTT is loaded, so we can parse now');

  clock.restore();
  window.WebVTT = oldVTT;
});

QUnit.test('stops processing if vttjs loading errored out', function(assert) {
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
  }).default;

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

  assert.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');

  testTech.trigger('vttjserror');
  const offSpyCall = testTech.off.getCall(0);

  assert.ok(errorSpy.called, 'vttjs failed to load, so log.error was called');
  if (errorSpy.called) {
    assert.ok(/^vttjs failed to load, stopping trying to process/.test(errorSpy.getCall(0).args[0]),
       'log.error was called with the expected message');
  }
  assert.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');
  assert.ok(offSpyCall, 'tech.off was called');

  clock.restore();
  window.WebVTT = oldVTT;
});
