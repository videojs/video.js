/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import * as Dom from '../../src/js/utils/dom.js';
import log from '../../src/js/utils/log.js';
import document from 'global/document';
import sinon from 'sinon';

QUnit.module('video.js', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

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

  player.dispose();
  player2.dispose();
});

QUnit.test('should log about already initalized players if options already passed',
function(assert) {
  const origWarnLog = log.warn;
  const fixture = document.getElementById('qunit-fixture');
  const warnLogs = [];

  log.warn = (args) => {
    warnLogs.push(args);
  };

  fixture.innerHTML += '<video id="test_vid_id"></video>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.equal(player.id(), 'test_vid_id', 'player has the right ID');
  assert.equal(warnLogs.length, 0, 'no warn logs');

  const playerAgain = videojs('test_vid_id');

  assert.equal(player, playerAgain, 'did not create a second player from same tag');
  assert.equal(warnLogs.length, 0, 'no warn logs');

  const playerAgainWithOptions = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.equal(player,
               playerAgainWithOptions,
               'did not create a second player from same tag');
  assert.equal(warnLogs.length, 1, 'logged a warning');
  assert.equal(warnLogs[0],
               'Player "test_vid_id" is already initialised. Options will not be applied.',
               'logged the right message');

  log.warn = origWarnLog;

  player.dispose();
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

  player.dispose();
  player2.dispose();
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

  player.dispose();
  player2.dispose();
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

QUnit.test('should expose plugin functions', function(assert) {
  [
    'registerPlugin',
    'plugin',
    'getPlugins',
    'getPlugin',
    'getPluginVersion'
  ].forEach(name => {
    assert.strictEqual(typeof videojs[name], 'function', `videojs.${name} is a function`);
  });
});

QUnit.test('should expose options and players properties for backward-compatibility', function(assert) {
  assert.ok(typeof videojs.options, 'object', 'options should be an object');
  assert.ok(typeof videojs.players, 'object', 'players should be an object');
});

QUnit.test('should expose DOM functions', function(assert) {
  const origWarnLog = log.warn;
  const warnLogs = [];

  log.warn = (args) => {
    warnLogs.push(args);
  };

  const methods = [
    'isEl',
    'isTextNode',
    'createEl',
    'hasClass',
    'addClass',
    'removeClass',
    'toggleClass',
    'setAttributes',
    'getAttributes',
    'emptyEl',
    'insertContent',
    'appendContent'
  ];

  methods.forEach(name => {
    assert.strictEqual(typeof videojs[name], 'function', `function videojs.${name}`);
    assert.strictEqual(typeof Dom[name], 'function', `Dom.${name} function exists`);

    const oldMethod = Dom[name];
    let domCalls = 0;

    Dom[name] = () => domCalls++;

    videojs[name]();

    assert.equal(domCalls, 1, `Dom.${name} was called when videojs.${name} is run.`);
    assert.equal(warnLogs.length, 1, `videojs.${name} logs a deprecation warning`);

    // reset
    warnLogs.length = 0;
    Dom[name] = oldMethod;
  });

  // reset log
  log.warn = origWarnLog;
});

QUnit.test('ingest player div if data-vjs-player attribute is present on video parentNode', function(assert) {
  const fixture = document.querySelector('#qunit-fixture');

  fixture.innerHTML = `
    <div data-vjs-player class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  assert.equal(player.el(), playerDiv, 'we re-used the given div');
  assert.ok(player.hasClass('foo'), 'keeps any classes that were around previously');

  player.dispose();
});

QUnit.test('ingested player div should not create a new tag for movingMediaElementInDOM', function(assert) {
  const Html5 = videojs.getTech('Html5');
  const oldIS = Html5.isSupported;
  const oldMoving = Html5.prototype.movingMediaElementInDOM;
  const oldCPT = Html5.nativeSourceHandler.canPlayType;
  const fixture = document.querySelector('#qunit-fixture');

  fixture.innerHTML = `
    <div data-vjs-player class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;
  Html5.prototype.movingMediaElementInDOM = false;
  Html5.isSupported = () => true;
  Html5.nativeSourceHandler.canPlayType = () => true;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  this.clock.tick(1);

  assert.equal(player.el(), playerDiv, 'we re-used the given div');
  assert.equal(player.tech_.el(), vid, 'we re-used the video element');
  assert.ok(player.hasClass('foo'), 'keeps any classes that were around previously');

  player.dispose();
  Html5.prototype.movingMediaElementInDOM = oldMoving;
  Html5.isSupported = oldIS;
  Html5.nativeSourceHandler.canPlayType = oldCPT;
});

QUnit.test('should create a new tag for movingMediaElementInDOM', function(assert) {
  const Html5 = videojs.getTech('Html5');
  const oldMoving = Html5.prototype.movingMediaElementInDOM;
  const oldCPT = Html5.nativeSourceHandler.canPlayType;
  const fixture = document.querySelector('#qunit-fixture');
  const oldIS = Html5.isSupported;

  fixture.innerHTML = `
    <div class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;
  Html5.prototype.movingMediaElementInDOM = false;
  Html5.isSupported = () => true;
  Html5.nativeSourceHandler.canPlayType = () => true;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  this.clock.tick(1);

  assert.notEqual(player.el(), playerDiv, 'we used a new div');
  assert.notEqual(player.tech_.el(), vid, 'we a new video element');

  player.dispose();
  Html5.prototype.movingMediaElementInDOM = oldMoving;
  Html5.isSupported = oldIS;
  Html5.nativeSourceHandler.canPlayType = oldCPT;
});
