/* eslint-env qunit */
import window from 'global/window';
import EventTarget from '../../../src/js/event-target.js';
import TrackBaseline from './track-baseline';
import TechFaker from '../tech/tech-faker';
import TextTrack from '../../../src/js/tracks/text-track.js';
import TestHelpers from '../test-helpers.js';
import sinon from 'sinon';
import log from '../../../src/js/utils/log.js';
import XHR from '@videojs/xhr';

QUnit.module('Text Track', {
  beforeEach() {
    this.tech = new TechFaker();
    this.oldXMLHttpRequest = XHR.XMLHttpRequest;
    this.oldXDomainRequest = XHR.XDomainRequest;
    this.xhr = sinon.useFakeXMLHttpRequest();
    XHR.XMLHttpRequest = this.xhr;
    XHR.XDomainRequest = this.xhr;
  },
  afterEach() {
    this.tech.dispose();
    this.tech = null;
    XHR.XMLHttpRequest = this.oldXMLHttpRequest;
    XHR.XDomainRequest = this.oldXDomainRequest;
    this.xhr.restore();
  }
});

// do baseline track testing
TrackBaseline(TextTrack, {
  id: '1',
  kind: 'subtitles',
  mode: 'disabled',
  label: 'English',
  language: 'en'
  // tech is added in baseline
  // tech: new TechFaker()
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

QUnit.test('non-VTTCue can be used to remove cue from cues list', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  const cue1 = { id: 1, text: 'test' };

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

QUnit.test('does not include past cues in activeCues', function(assert) {
  // Testing for the absence of a previous behaviour, which considered cues with equal
  // start and end times as active 0.5s after ending
  const player = TestHelpers.makePlayer();
  const tt = new TextTrack({
    tech: player.tech_,
    mode: 'showing'
  });
  const expectedCue = {
    id: '2',
    startTime: 2.555,
    endTime: 3
  };

  player.tech_.currentTime = function() {
    return 2.556;
  };

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 2.555
  });
  tt.addCue({
    id: '2',
    startTime: 2.555,
    endTime: 2.555
  });
  // start 2.55
  tt.addCue(expectedCue);

  player.tech_.trigger('playing');

  assert.equal(tt.activeCues_.length, 1, 'only one cue is present');
  assert.equal(tt.activeCues_[0].originalCue_, expectedCue, 'correct active cue is present');
});

QUnit.test('does not fire cuechange before Tech is ready', function(assert) {
  const done = assert.async();
  const clock = sinon.useFakeTimers();
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

  // `playing` would trigger rvfc or raf, `timeupdate` for fallback
  player.tech_.trigger('playing');
  player.tech_.trigger('timeupdate');
  assert.equal(changes, 0, 'a cuechange event is not triggered');

  player.tech_.on('ready', function() {
    player.tech_.currentTime = function() {
      return 0.2;
    };

    player.tech_.trigger('playing');
    clock.tick(1);

    assert.equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange');

    player.tech_.trigger('timeupdate');
    clock.tick(1);

    assert.equal(changes, 2, 'a cuechange event trigger not duplicated by timeupdate');

    tt.off();
    player.dispose();
    clock.restore();
    done();
  });
  player.tech_.triggerReady();
  clock.tick(1);
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
  let fakeCurrentTime = 0;

  player.tech_.currentTime = function() {
    return fakeCurrentTime;
  };

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 5
  });
  tt.addCue({
    id: '2',
    startTime: 11,
    endTime: 14
  });

  tt.oncuechange = cuechangeHandler;
  tt.addEventListener('cuechange', cuechangeHandler);

  fakeCurrentTime = 2;
  player.tech_.trigger('playing');

  assert.equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange (rvfc/raf)');

  fakeCurrentTime = 7;
  player.tech_.trigger('playing');

  assert.equal(changes, 4, 'a cuechange event trigger addEventListener and oncuechange (rvfc/raf)');

  fakeCurrentTime = 12;
  player.tech_.trigger('timeupdate');

  assert.equal(changes, 6, 'a cuechange event trigger addEventListener and oncuechange (timeupdate)');

  fakeCurrentTime = 17;
  player.tech_.trigger('timeupdate');

  assert.equal(changes, 8, 'a cuechange event trigger addEventListener and oncuechange (timeupdate)');

  tt.off();
  player.dispose();
});

QUnit.test('enabled and disabled cuechange handler when changing mode to hidden', function(assert) {
  const player = TestHelpers.makePlayer();
  let changes = 0;
  const tt = new TextTrack({
    tech: player.tech_
  });
  const cuechangeHandler = function() {
    changes++;
  };

  tt.mode = 'hidden';

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 5
  });

  tt.addEventListener('cuechange', cuechangeHandler);

  player.tech_.currentTime = function() {
    return 2;
  };
  player.tech_.trigger('playing');
  player.tech_.trigger('timeupdate');

  assert.equal(changes, 1, 'a cuechange event trigger');

  changes = 0;
  // debugger;
  tt.mode = 'disabled';

  player.tech_.currentTime = function() {
    return 7;
  };
  player.tech_.trigger('playing');
  player.tech_.trigger('timeupdate');

  assert.equal(changes, 0, 'NO cuechange event trigger');

  tt.off();
  player.dispose();
});

QUnit.test('enabled and disabled cuechange handler when changing mode to showing', function(assert) {
  const clock = sinon.useFakeTimers();
  const player = TestHelpers.makePlayer();
  let changes = 0;
  const tt = new TextTrack({
    tech: player.tech_
  });
  const cuechangeHandler = function() {
    changes++;
  };

  tt.mode = 'showing';

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 5
  });

  tt.addEventListener('cuechange', cuechangeHandler);

  player.tech_.currentTime = function() {
    return 2;
  };
  player.tech_.trigger('playing');
  clock.tick(10);

  assert.equal(changes, 1, 'a cuechange event trigger');

  changes = 0;
  tt.mode = 'disabled';

  player.tech_.currentTime = function() {
    return 7;
  };
  player.tech_.trigger('playing');

  assert.equal(changes, 0, 'NO cuechange event trigger');

  tt.off();
  player.dispose();
  clock.restore();
});

QUnit.test('if preloadTextTracks is false, default tracks are not parsed until mode is showing', function(assert) {
  this.tech.preloadTextTracks = false;
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;
  const reqs = [];

  this.xhr.onCreate = function(req) {
    reqs.push(req);
  };

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};

  // This needs to be function expression rather than arrow function so it is constructable
  window.WebVTT.Parser = function() {
    parserCreated = true;
    return {
      oncue() {},
      onparsingerror() {},
      onflush() {},
      parse() {},
      flush() {}
    };
  };

  const tt = new TextTrack({
    tech: this.tech,
    src: 'http://example.com',
    default: true
  });

  assert.notOk(reqs.length, 'Default track is not requested');
  assert.notOk(parserCreated, 'Parser is not created');

  tt.mode = 'showing';

  const req = reqs.pop();

  req.respond(200, null, 'WEBVTT\n');

  assert.ok(parserCreated, 'Parser is created after track is showing');

  clock.restore();
  tt.off();
  window.WebVTT = oldVTT;
});

QUnit.test('tracks are parsed if vttjs is loaded', function(assert) {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;
  const reqs = [];

  this.xhr.onCreate = function(req) {
    reqs.push(req);
  };

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};

  // This needs to be function expression rather than arrow function so it is constructable
  window.WebVTT.Parser = function() {
    parserCreated = true;
    return {
      oncue() {},
      onparsingerror() {},
      onflush() {},
      parse() {},
      flush() {}
    };
  };

  const tt = new TextTrack({
    tech: this.tech,
    src: 'http://example.com'
  });

  const req = reqs.pop();

  req.respond(200, null, 'WEBVTT\n');

  assert.ok(parserCreated, 'WebVTT is loaded, so we can just parse');
  assert.notOk(req.withCredentials, 'the request defaults not to send credentials');

  clock.restore();
  tt.off();
  window.WebVTT = oldVTT;
});

QUnit.test('tracks are loaded withCredentials is crossorigin is set to use-credentials', function(assert) {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  const reqs = [];

  this.xhr.onCreate = function(req) {
    reqs.push(req);
  };

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};

  // This needs to be function expression rather than arrow function so it is constructable
  window.WebVTT.Parser = function() {
    return {
      oncue() {},
      onparsingerror() {},
      onflush() {},
      parse() {},
      flush() {}
    };
  };

  this.tech.crossOrigin = () => 'use-credentials';

  const tt = new TextTrack({
    tech: this.tech,
    src: 'http://example.com'
  });

  const req = reqs.pop();

  assert.ok(req.withCredentials, 'the request was made withCredentials');

  this.tech.crossOrigin = () => 'anonymous';

  const tt2 = new TextTrack({
    tech: this.tech,
    src: 'http://example.com'
  });

  const req2 = reqs.pop();

  assert.notOk(req2.withCredentials, 'the request was not made withCredentials');

  req.abort();
  req2.abort();
  clock.restore();
  tt.off();
  tt2.off();
  window.WebVTT = oldVTT;
});

QUnit.test('tracks are parsed once vttjs is loaded', function(assert) {
  const clock = sinon.useFakeTimers();
  const oldVTT = window.WebVTT;
  let parserCreated = false;
  const reqs = [];

  this.xhr.onCreate = function(req) {
    reqs.push(req);
  };

  window.WebVTT = true;

  const testTech = new EventTarget();

  testTech.textTracks = () => {};
  testTech.currentTime = () => {};
  testTech.crossOrigin = () => null;

  const tt = new TextTrack({
    tech: testTech,
    src: 'http://example.com'
  });

  reqs.pop().respond(200, null, 'WEBVTT\n');

  assert.ok(!parserCreated, 'WebVTT is not loaded, do not try to parse yet');

  clock.tick(100);
  assert.ok(!parserCreated, 'WebVTT still not loaded, do not try to parse yet');

  window.WebVTT = () => {};
  window.WebVTT.StringDecoder = () => {};

  // This needs to be function expression rather than arrow function so it is constructable
  window.WebVTT.Parser = function() {
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
  tt.off();
  testTech.off();
  window.WebVTT = oldVTT;
});

QUnit.test('stops processing if vttjs loading errored out', function(assert) {
  const clock = sinon.useFakeTimers();
  const errorSpy = sinon.spy();
  const oldVTT = window.WebVTT;
  const oldLogError = log.error;
  const reqs = [];

  this.xhr.onCreate = function(req) {
    reqs.push(req);
  };

  log.error = errorSpy;

  window.WebVTT = true;

  const testTech = new EventTarget();

  testTech.textTracks = () => {};
  testTech.currentTime = () => {};
  testTech.crossOrigin = () => null;

  sinon.stub(testTech, 'off');
  testTech.off.withArgs('vttjsloaded');

  const tt = new TextTrack({
    tech: testTech,
    src: 'http://example.com'
  });

  reqs.pop().respond(200, null, 'WEBVTT\n');

  testTech.trigger('vttjserror');

  assert.equal(errorSpy.callCount, 1, 'vttjs failed to load, so log.error was called');

  testTech.trigger('vttjserror');

  // vttjserror not called again
  assert.equal(errorSpy.callCount, 1, 'vttjserror handler not called again');

  clock.restore();
  window.WebVTT = oldVTT;
  tt.off();
  testTech.off.restore();
  testTech.off();
  log.error = oldLogError;
});

QUnit.test('toJSON', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 2.555
  });
  tt.addCue({
    id: '2',
    startTime: 2.555,
    endTime: 2.555
  });

  const jsonTrack = tt.toJSON();

  // Properties we want copied are copied correctly
  assert.equal(tt.id, jsonTrack.id, 'the id for the copied track stayed the same');
  assert.equal(tt.mode, jsonTrack.mode, 'the mode for the copied track stayed the same');
  assert.equal(tt.kind, jsonTrack.kind, 'the kind for the copied track stayed the same');

  // The tech_ property stays on the original track, but is removed from the copy
  assert.ok(tt.tech_, 'the tech exists on the original track');
  assert.notOk(jsonTrack.tech_, 'the tech does not exist on the copied track');
});

QUnit.test('serialize', function(assert) {
  const tt = new TextTrack({
    tech: this.tech
  });

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 2.555
  });
  tt.addCue({
    id: '2',
    startTime: 2.555,
    endTime: 2.555
  });

  const serializedTrack = JSON.stringify(tt);

  // Ensure tech was not removed from the actual track
  assert.ok(tt.tech_, 'the tech exists on the original track');

  // Values from the track should be found in the serialized string
  assert.ok(serializedTrack.includes(`"id":"${tt.id}"`), 'serialized data should include id');
  assert.ok(serializedTrack.includes(`"mode":"${tt.mode}"`), 'serialized data should include mode');
  assert.ok(serializedTrack.includes(`"kind":"${tt.kind}"`), 'serialized data should include cues');

  // tech_ should not be found in the serialized string
  assert.notOk(serializedTrack.includes('"tech_":'), 'serialized data should not include tech_');
});
