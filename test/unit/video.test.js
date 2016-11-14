/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';
import * as Dom from '../../src/js/utils/dom.js';
import document from 'global/document';

QUnit.module('video.js');

QUnit.test('should create a video tag and have access children in old IE', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  assert.ok(vid.childNodes.length === 1);
  assert.ok(vid.childNodes[0].getAttribute('type') === 'video/mp4');
});

QUnit.test('should return a video player instance', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs('test_vid_id');

  assert.ok(player === playerAgain, 'did not create a second player from same tag');

  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el html5 tech', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid);

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el techfaker', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');
  const player = videojs(vid, {techOrder: ['techFaker']});

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should add the value to the languages object', function(assert) {
  const code = 'es';
  const data = {Hello: 'Hola'};
  const result = videojs.addLanguage(code, data);

  assert.ok(videojs.options.languages[code], 'should exist');
  assert.equal(videojs.options.languages.es.Hello, 'Hola', 'should match');
  assert.deepEqual(result.Hello, videojs.options.languages.es.Hello, 'should also match');
});

QUnit.test('should add the value to the languages object with lower case lang code', function(assert) {
  const code = 'DE';
  const data = {Hello: 'Guten Tag'};
  const result = videojs.addLanguage(code, data);

  assert.ok(videojs.options.languages[code.toLowerCase()], 'should exist');
  assert.equal(videojs.options.languages[code.toLowerCase()].Hello,
              'Guten Tag',
              'should match');
  assert.deepEqual(result,
                  videojs.options.languages[code.toLowerCase()],
                  'should also match');
});

QUnit.test('should expose plugin registry function', function(assert) {
  const pluginName = 'foo';
  const pluginFunction = function(options) {};

  assert.ok(videojs.plugin, 'should exist');

  videojs.plugin(pluginName, pluginFunction);

  const player = TestHelpers.makePlayer();

  assert.ok(player.foo, 'should exist');
  assert.equal(player.foo, pluginFunction, 'should be equal');
  player.dispose();
});

QUnit.test('should expose options and players properties for backward-compatibility', function(assert) {
  assert.ok(typeof videojs.options, 'object', 'options should be an object');
  assert.ok(typeof videojs.players, 'object', 'players should be an object');
});

QUnit.test('should expose DOM functions', function(assert) {

  // Keys are videojs methods, values are Dom methods.
  const methods = {
    isEl: 'isEl',
    isTextNode: 'isTextNode',
    createEl: 'createEl',
    hasClass: 'hasElClass',
    addClass: 'addElClass',
    removeClass: 'removeElClass',
    toggleClass: 'toggleElClass',
    setAttributes: 'setElAttributes',
    getAttributes: 'getElAttributes',
    emptyEl: 'emptyEl',
    insertContent: 'insertContent',
    appendContent: 'appendContent'
  };

  const keys = Object.keys(methods);

  assert.expect(keys.length);
  keys.forEach(function(vjsName) {
    const domName = methods[vjsName];

    assert.strictEqual(videojs[vjsName],
                      Dom[domName],
                      `videojs.${vjsName} is a reference to Dom.${domName}`);
  });
});

QUnit.module('video.js:hooks ', {
  beforeEach() {
    videojs.hooks_ = {};
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

  videojs.hook('foo', function() {});
  videojs.hook('foo', function() {});
  videojs.hook('foo', function() {});
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

QUnit.test('should trigger beforesetup and setup during videojs setup', function(assert) {
  const vjsOptions = {techOrder: ['techFaker']};
  let setupCalled = false;
  let beforeSetupCalled = false;
  const beforeSetup = function(video, options) {
    beforeSetupCalled = true;
    assert.equal(setupCalled, false, 'setup should be called after beforesetup');
    assert.deepEqual(options, vjsOptions, 'options should be the same');
    assert.equal(video.id, 'test_vid_id', 'video id should be correct');
  };
  const setup = function(player) {
    setupCalled = true;

    assert.equal(beforeSetupCalled, true, 'beforesetup should have been called already');
    assert.ok(player, 'created player from tag');
    assert.ok(player.id() === 'test_vid_id');
    assert.ok(videojs.getPlayers().test_vid_id === player,
              'added player to global reference');
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
});

QUnit.test('beforesetup returns dont break videojs options', function(assert) {
  const vjsOptions = {techOrder: ['techFaker']};
  const fixture = document.getElementById('qunit-fixture');

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
});
