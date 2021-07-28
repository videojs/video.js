/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import sinon from 'sinon';
import log from '../../src/js/utils/log.js';

const clearObj = (obj) => Object.keys(obj).forEach((key) => delete obj[key]);

QUnit.module('video.js:hooks ', {
  beforeEach() {
    clearObj(videojs.hooks_);
  },
  afterEach() {
    clearObj(videojs.hooks_);
  }
});

QUnit.test('should be able to add a hook', function(assert) {
  videojs.hook('foo', function() {});
  assert.equal(Object.keys(videojs.hooks_).length, 1, 'should have 1 hook type');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('bar', function() {});
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hook types');
  assert.equal(videojs.hooks_.bar.length, 1, 'should have 1 bar hook');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('bar', function() {});
  assert.equal(videojs.hooks_.bar.length, 2, 'should have 2 bar hooks');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('foo', [function() {}, function() {}, function() {}]);
  assert.equal(videojs.hooks_.foo.length, 4, 'should have 4 foo hooks');
  assert.equal(videojs.hooks_.bar.length, 2, 'should have 2 bar hooks');
});

QUnit.test('should be able to remove a hook', function(assert) {
  const noop = function() {};

  videojs.hook('foo', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 1, 'should have 1 hook types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('bar', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');
  assert.equal(videojs.hooks_.bar.length, 1, 'should have 1 bar hook');

  const fooRetval = videojs.removeHook('foo', noop);

  assert.equal(fooRetval, true, 'should return true');
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 0, 'should have 0 foo hook');
  assert.equal(videojs.hooks_.bar.length, 1, 'should have 0 bar hook');

  const barRetval = videojs.removeHook('bar', noop);

  assert.equal(barRetval, true, 'should return true');
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 0, 'should have 0 foo hook');
  assert.equal(videojs.hooks_.bar.length, 0, 'should have 0 bar hook');

  const errRetval = videojs.removeHook('bar', noop);

  assert.equal(errRetval, false, 'should return false');
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 0, 'should have 0 foo hook');
  assert.equal(videojs.hooks_.bar.length, 0, 'should have 0 bar hook');
});

QUnit.test('should be able get all hooks for a type', function(assert) {
  const noop = function() {};

  videojs.hook('foo', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 1, 'should have 1 hook types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('bar', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');
  assert.equal(videojs.hooks_.bar.length, 1, 'should have 1 bar hook');

  const fooHooks = videojs.hooks('foo');
  const barHooks = videojs.hooks('bar');

  assert.deepEqual(videojs.hooks_.foo, fooHooks, 'should return the exact foo list from videojs.hooks_');
  assert.deepEqual(videojs.hooks_.bar, barHooks, 'should return the exact bar list from videojs.hooks_');
});

QUnit.test('should be get all hooks for a type and add at the same time', function(assert) {
  const noop = function() {};

  videojs.hook('foo', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 1, 'should have 1 hook types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');

  videojs.hook('bar', noop);
  assert.equal(Object.keys(videojs.hooks_).length, 2, 'should have 2 hooks types');
  assert.equal(videojs.hooks_.foo.length, 1, 'should have 1 foo hook');
  assert.equal(videojs.hooks_.bar.length, 1, 'should have 1 bar hook');

  const fooHooks = videojs.hooks('foo', noop);
  const barHooks = videojs.hooks('bar', noop);

  assert.deepEqual(videojs.hooks_.foo.length, 2, 'foo should have two noop hooks');
  assert.deepEqual(videojs.hooks_.bar.length, 2, 'bar should have two noop hooks');
  assert.deepEqual(videojs.hooks_.foo, fooHooks, 'should return the exact foo list from videojs.hooks_');
  assert.deepEqual(videojs.hooks_.bar, barHooks, 'should return the exact bar list from videojs.hooks_');
});

QUnit.test('should be able to add a hook that runs once', function(assert) {
  const spies = [
    sinon.spy(),
    sinon.spy(),
    sinon.spy()
  ];

  videojs.hookOnce('foo', spies);

  assert.equal(videojs.hooks_.foo.length, 3, 'should have 3 foo hooks');

  videojs.hooks('foo').forEach(fn => fn());

  spies.forEach((spy, i) => {
    assert.ok(spy.calledOnce, `spy #${i + 1} was called`);
  });

  assert.equal(videojs.hooks_.foo.length, 0, 'should have 0 foo hooks');
});

QUnit.test('hooks registered using hookOnce should return the original callback return value', function(assert) {
  let result;

  videojs.hookOnce('foo', () => 'ok');
  videojs.hooks('foo').forEach(fn => {
    result = fn();
  });

  assert.equal(result, 'ok', 'the hookOnce callback returned "ok"');
});

QUnit.test('should trigger beforesetup and setup during videojs setup', function(assert) {
  const vjsOptions = {techOrder: ['techFaker']};
  let setupCalled = false;
  let beforeSetupCalled = false;
  const beforeSetup = function(video, options) {
    beforeSetupCalled = true;
    assert.equal(setupCalled, false, 'setup should be called after beforesetup');
    assert.deepEqual(options, vjsOptions, 'options should be the same');
    assert.equal(video.id, 'test_vid_id', 'video id should be correct');

    return options;
  };
  const setup = function(player) {
    setupCalled = true;

    assert.equal(beforeSetupCalled, true, 'beforesetup should have been called already');
    assert.ok(player, 'created player from tag');
    assert.ok(player.id() === 'test_vid_id');
    assert.ok(
      videojs.getPlayers().test_vid_id === player,
      'added player to global reference'
    );
  };

  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  videojs.hook('beforesetup', beforeSetup);
  videojs.hook('setup', setup);

  const player = videojs(vid, vjsOptions);

  assert.ok(player.options_, 'returning null in beforesetup does not lose options');
  assert.equal(beforeSetupCalled, true, 'beforeSetup was called');
  assert.equal(setupCalled, true, 'setup was called');

  player.dispose();
});

QUnit.test('beforesetup returns dont break videojs options', function(assert) {
  const oldLogError = log.error;
  const vjsOptions = {techOrder: ['techFaker']};
  const fixture = document.getElementById('qunit-fixture');

  log.error = function(err) {
    assert.equal(err, 'please return an object in beforesetup hooks', 'we have the correct error');
  };

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  videojs.hook('beforesetup', function() {
    return null;
  });
  videojs.hook('beforesetup', function() {
    return '';
  });
  videojs.hook('beforesetup', function() {
    return [];
  });

  const player = videojs(vid, vjsOptions);

  assert.ok(player.options_, 'beforesetup should not destory options');
  assert.equal(player.options_.techOrder, vjsOptions.techOrder, 'options set by user should exist');

  log.error = oldLogError;

  player.dispose();
});

QUnit.test('beforesetup options override videojs options', function(assert) {
  const vjsOptions = {techOrder: ['techFaker'], autoplay: false};
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  videojs.hook('beforesetup', function(tag, options) {
    assert.equal(options.autoplay, false, 'false was passed to us');
    return {autoplay: true};
  });

  const player = videojs(vid, vjsOptions);

  assert.ok(player.options_, 'beforesetup should not destory options');
  assert.equal(player.options_.techOrder, vjsOptions.techOrder, 'options set by user should exist');
  assert.equal(player.options_.autoplay, true, 'autoplay should be set to true now');

  player.dispose();
});
