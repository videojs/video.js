/* eslint-env qunit */
import Plugin from '../../src/js/plugin';
import Player from '../../src/js/player.js';
import videojs from '../../src/js/video.js';
import * as Dom from '../../src/js/utils/dom.js';
import * as browser from '../../src/js/utils/browser.js';
import log from '../../src/js/utils/log.js';
import MediaError from '../../src/js/media-error.js';
import Html5 from '../../src/js/tech/html5.js';
import Tech from '../../src/js/tech/tech.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';
import sinon from 'sinon';
import window from 'global/window';
import * as middleware from '../../src/js/tech/middleware.js';
import * as Events from '../../src/js/utils/events.js';
import pkg from '../../package.json';
import * as Guid from '../../src/js/utils/guid.js';
import SeekBar from '../../src/js/control-bar/progress-control/seek-bar';

QUnit.module('Player', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    // reset players storage
    for (const playerId in Player.players) {
      if (Player.players[playerId] !== null) {
        Player.players[playerId].dispose();
      }
      delete Player.players[playerId];
    }
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('the default ID of the first player remains "vjs_video_3"', function(assert) {
  Guid.resetGuidInTestsOnly();
  const tag = document.createElement('video');

  tag.className = 'video-js';

  const player = TestHelpers.makePlayer({}, tag);

  assert.strictEqual(player.id(), 'vjs_video_3', 'id is correct');
});

QUnit.test('should create player instance that inherits from component and dispose it', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.ok(player.el().nodeName === 'DIV');
  assert.ok(player.on, 'component function exists');

  player.dispose();
  assert.ok(player.el() === null, 'element disposed');
});

QUnit.test('dispose should not throw if styleEl is missing', function(assert) {
  const player = TestHelpers.makePlayer();

  player.styleEl_.parentNode.removeChild(player.styleEl_);

  player.dispose();
  assert.ok(player.el() === null, 'element disposed');
});

QUnit.test('dispose should not throw if techEl is missing', function(assert) {
  const videoTag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = new Player(videoTag);

  player.tech_.el_.parentNode.removeChild(player.tech_.el_);
  player.tech_.el_ = null;
  let error;

  try {
    player.dispose();
  } catch (e) {
    error = e;
  }

  assert.notOk(error, 'Function did not throw an error on dispose');
});

QUnit.test('dispose should not throw if playerEl is missing', function(assert) {
  const videoTag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = new Player(videoTag);

  player.el_.parentNode.removeChild(player.el_);
  player.el_ = null;
  let error;

  try {
    player.dispose();
  } catch (e) {
    error = e;
  }

  assert.notOk(error, 'Function did not throw an error on dispose');
});

QUnit.test('dispose should replace playerEl with restoreEl', function(assert) {
  const videoTag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');
  const replacement = document.createElement('div');

  fixture.appendChild(videoTag);

  const player = new Player(videoTag, {restoreEl: replacement});

  player.dispose();

  assert.ok(replacement.parentNode, fixture, 'Replacement node present after dispose');
});

// technically, all uses of videojs.options should be replaced with
// Player.prototype.options_ in this file and a equivalent test using
// videojs.options should be made in video.test.js. Keeping this here
// until we make that move.
QUnit.test('should accept options from multiple sources and override in correct order', function(assert) {

  // Set a global option
  videojs.options.attr = 1;

  const tag0 = TestHelpers.makeTag();
  const player0 = new Player(tag0, { techOrder: ['techFaker'] });

  assert.equal(player0.options_.attr, 1, 'global option was set');
  player0.dispose();

  // Set a tag level option
  const tag2 = TestHelpers.makeTag();

  // Attributes must be set as strings
  tag2.setAttribute('attr', 'asdf');

  const player2 = new Player(tag2, { techOrder: ['techFaker'] });

  assert.equal(player2.options_.attr, 'asdf', 'Tag options overrode global options');
  player2.dispose();

  // Set a tag level option
  const tag3 = TestHelpers.makeTag();

  tag3.setAttribute('attr', 'asdf');

  const player3 = new Player(tag3, { techOrder: ['techFaker'], attr: 'fdsa' });

  assert.equal(player3.options_.attr, 'fdsa', 'Init options overrode tag and global options');
  player3.dispose();
});

QUnit.test('should get tag, source, and track settings', function(assert) {
  // Partially tested in lib->getAttributes

  const fixture = document.getElementById('qunit-fixture');

  let html = '<video id="example_1" class="video-js" autoplay preload="none">';

  html += '<source src="http://google.com" type="video/mp4">';
  html += '<source src="http://google.com" type="video/webm">';
  html += '<track kind="captions" attrtest>';
  html += '</video>';

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.options_.autoplay, true, 'autoplay is set to true');
  assert.equal(player.options_.preload, 'none', 'preload is set to none');
  assert.equal(player.options_.id, 'example_1', 'id is set to example_1');
  assert.equal(player.options_.sources.length, 2, 'we have two sources');
  assert.equal(player.options_.sources[0].src, 'http://google.com', 'first source is google.com');
  assert.equal(player.options_.sources[0].type, 'video/mp4', 'first type is video/mp4');
  assert.equal(player.options_.sources[1].type, 'video/webm', 'second type is video/webm');
  assert.equal(player.options_.tracks.length, 1, 'we have one text track');
  assert.equal(player.options_.tracks[0].kind, 'captions', 'the text track is a captions file');
  assert.equal(player.options_.tracks[0].attrtest, '', 'we have an empty attribute called attrtest');

  assert.notEqual(player.el().className.indexOf('video-js'), -1, 'transferred class from tag to player div');
  assert.equal(player.el().id, 'example_1', 'transferred id from tag to player div');

  assert.equal(Player.players[player.id()], player, 'player referenceable from global list');
  assert.notEqual(tag.id, player.id, 'tag ID no longer is the same as player ID');
  assert.notEqual(tag.className, player.el().className, 'tag classname updated');

  player.dispose();

  assert.notEqual(tag.player, player, 'tag player ref killed');
  assert.ok(!Player.players.example_1, 'global player ref killed');
  assert.equal(player.el(), null, 'player el killed');
});

QUnit.test('should get current source from source tag', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const html = [
    '<video id="example_1" class="video-js" preload="none">',
    '<source src="http://google.com" type="video/mp4">',
    '<source src="http://hugo.com" type="video/webm">',
    '</video>'
  ].join('');

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  assert.ok(player.currentSource().src === 'http://google.com');
  assert.ok(player.currentSource().type === 'video/mp4');

  player.dispose();
});

QUnit.test('should get current sources from source tag', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const html = [
    '<video id="example_1" class="video-js" preload="none">',
    '<source src="http://google.com" type="video/mp4">',
    '<source src="http://hugo.com" type="video/webm">',
    '</video>'
  ].join('');

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  assert.ok(player.currentSources()[0].src === 'http://google.com');
  assert.ok(player.currentSources()[0].type === 'video/mp4');
  assert.ok(player.currentSources()[1].src === 'http://hugo.com');
  assert.ok(player.currentSources()[1].type === 'video/webm');

  // when redefining src expect sources to update accordingly
  player.src('http://google.com');

  assert.ok(player.currentSources()[0].src === 'http://google.com');
  assert.ok(player.currentSources()[0].type === undefined);
  assert.ok(player.currentSources()[1] === undefined);

  player.dispose();
});

QUnit.test('should get current source from src set', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const html = '<video id="example_1" class="video-js" preload="none"></video>';

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  player.loadTech_('Html5');

  // check for matching undefined src
  assert.deepEqual(player.currentSource(), {});
  assert.equal(player.src(), '');

  player.src('http://google.com');

  assert.ok(player.currentSource().src === 'http://google.com');
  assert.ok(player.currentSource().type === undefined);

  player.src({
    src: 'http://google.com'
  });

  assert.ok(player.currentSource().src === 'http://google.com');
  assert.ok(player.currentSource().type === undefined);

  player.src({
    src: 'http://google.com',
    type: 'video/mp4'
  });

  assert.ok(player.currentSource().src === 'http://google.com');
  assert.ok(player.currentSource().type === 'video/mp4');
  player.dispose();
});

QUnit.test('should get current sources from src set', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const html = '<video id="example_1" class="video-js" preload="none"></video>';

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  player.loadTech_('Html5');

  // check for matching undefined src
  assert.ok(player.currentSources(), []);

  player.src([{
    src: 'http://google.com'
  }, {
    src: 'http://hugo.com'
  }]);

  assert.ok(player.currentSources()[0].src === 'http://google.com');
  assert.ok(player.currentSources()[0].type === undefined);
  assert.ok(player.currentSources()[1].src === 'http://hugo.com');
  assert.ok(player.currentSources()[1].type === undefined);

  player.src([{
    src: 'http://google.com',
    type: 'video/mp4'
  }, {
    src: 'http://hugo.com',
    type: 'video/webm'
  }]);

  assert.ok(player.currentSources()[0].src === 'http://google.com');
  assert.ok(player.currentSources()[0].type === 'video/mp4');
  assert.ok(player.currentSources()[1].src === 'http://hugo.com');
  assert.ok(player.currentSources()[1].type === 'video/webm');

  // when redefining src expect sources to update accordingly
  player.src('http://hugo.com');

  assert.ok(player.currentSources()[0].src === 'http://hugo.com');
  assert.ok(player.currentSources()[0].type === undefined);
  assert.ok(player.currentSources()[1] === undefined);

  player.dispose();
});

QUnit.test('should remove autoplay attribute when normalizeAutoplay: true', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  let html = '<video id="example_1" class="video-js" autoplay preload="none">';

  html += '<source src="http://google.com" type="video/mp4">';
  html += '<source src="http://google.com" type="video/webm">';
  html += '<track kind="captions" attrtest>';
  html += '</video>';

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({normalizeAutoplay: true}, tag);

  player.loadTech_('Html5');

  assert.equal(player.autoplay(), true, 'autoplay option is set to true');
  assert.equal(tag.getAttribute('autoplay'), null, 'autoplay attribute removed');
});

QUnit.test('should asynchronously fire error events during source selection', function(assert) {
  assert.expect(2);

  sinon.stub(log, 'error');

  const player = TestHelpers.makePlayer({
    techOrder: ['foo'],
    sources: [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' }
    ]
  });

  assert.ok(player.options_.techOrder[0] === 'foo', 'Foo listed as the only tech');

  player.on('error', function(e) {
    assert.ok(player.error().code === 4, 'Source could not be played error thrown');
  });

  // The first one is for player initialization
  // The second one is the setTimeout for triggering the error
  this.clock.tick(1);
  this.clock.tick(1);

  player.dispose();
  log.error.restore();
});

QUnit.test('should retry setting source if error occurs', function(assert) {
  const player = TestHelpers.makePlayer({
    techOrder: ['html5'],
    sources: [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' }
    ]
  });

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
    'first source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
    'second source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' },
    'last source set'
  );

  // No more sources to try so the previous source should remain
  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' },
    'last source remains'
  );

  assert.deepEqual(
    player.currentSources(),
    [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' }
    ],
    'currentSources() correctly returns the full source list'
  );

  player.dispose();
});

QUnit.test('should not retry setting source if error occurs during playback', function(assert) {
  const player = TestHelpers.makePlayer({
    techOrder: ['html5'],
    sources: [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' }
    ]
  });

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
    'first source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
    'second source set'
  );

  // Playback starts then error occurs
  player.trigger('playing');
  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
    'second source remains'
  );

  assert.deepEqual(
    player.currentSources(),
    [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' }
    ],
    'currentSources() correctly returns the full source list'
  );

  player.dispose();
});

QUnit.test('aborts and resets retryOnError behavior if new src() call made during a retry', function(assert) {
  const player = TestHelpers.makePlayer({
    techOrder: ['html5'],
    sources: [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/oceans3.mp4', type: 'video/mp4' }
    ]
  });

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' },
    'first source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' },
    'second source set'
  );

  // Setting a new source list should reset retry behavior and enable it for the new sources
  player.src([
    { src: 'http://vjs.zencdn.net/v/newSource.mp4', type: 'video/mp4' },
    { src: 'http://vjs.zencdn.net/v/newSource2.mp4', type: 'video/mp4' },
    { src: 'http://vjs.zencdn.net/v/newSource3.mp4', type: 'video/mp4' }
  ]);

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/newSource.mp4', type: 'video/mp4' },
    'first new source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/newSource2.mp4', type: 'video/mp4' },
    'second new source set'
  );

  player.trigger('error');

  assert.deepEqual(
    player.currentSource(),
    { src: 'http://vjs.zencdn.net/v/newSource3.mp4', type: 'video/mp4' },
    'third new source set'
  );

  assert.deepEqual(
    player.currentSources(),
    [
      { src: 'http://vjs.zencdn.net/v/newSource.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/newSource2.mp4', type: 'video/mp4' },
      { src: 'http://vjs.zencdn.net/v/newSource3.mp4', type: 'video/mp4' }
    ],
    'currentSources() correctly returns the full new source list'
  );

  player.dispose();
});

QUnit.test('should suppress source error messages', function(assert) {
  sinon.stub(log, 'error');
  const clock = sinon.useFakeTimers();

  const player = TestHelpers.makePlayer({
    techOrder: ['foo'],
    suppressNotSupportedError: true
  });

  let errors = 0;

  player.on('error', function(e) {
    errors++;
  });

  player.src({src: 'http://example.com', type: 'video/mp4'});

  clock.tick(10);

  assert.strictEqual(errors, 0, 'no error on bad source load');

  player.trigger('click');

  clock.tick(10);

  assert.strictEqual(errors, 1, 'error after click');

  player.dispose();

  assert.strictEqual(log.error.callCount, 2, 'two stubbed errors');
  log.error.restore();
});

QUnit.test('should cancel a suppressed error message on loadstart', function(assert) {
  sinon.stub(log, 'error');
  const clock = sinon.useFakeTimers();

  const player = TestHelpers.makePlayer({
    techOrder: ['foo'],
    suppressNotSupportedError: true
  });

  let errors = 0;

  player.on('error', function(e) {
    errors++;
  });

  player.src({src: 'http://example.com', type: 'video/mp4'});

  clock.tick(10);

  assert.strictEqual(errors, 0, 'no error on bad source load');
  assert.strictEqual(
    player.options_.suppressNotSupportedError,
    false,
    'option was unset when error was suppressed'
  );

  player.trigger('loadstart');

  clock.tick(10);

  player.trigger('click');

  clock.tick(10);

  assert.strictEqual(errors, 0, 'no error after click after loadstart');
  assert.strictEqual(log.error.callCount, 3, 'one stubbed errors');

  player.dispose();
  log.error.restore();
});

QUnit.test('should set the width, height, and aspect ratio via a css class', function(assert) {
  const player = TestHelpers.makePlayer();
  const getStyleText = function(styleEl) {
    return (styleEl.styleSheet && styleEl.styleSheet.cssText) || styleEl.innerHTML;
  };

  // NOTE: was using npm/css to parse the actual CSS ast
  // but the css module doesn't support ie8
  const confirmSetting = function(prop, val) {
    let styleText = getStyleText(player.styleEl_);
    const re = new RegExp(prop + ':\\s?' + val);

    // Lowercase string for IE8
    styleText = styleText.toLowerCase();

    return !!re.test(styleText);
  };

  // Initial state
  assert.ok(!getStyleText(player.styleEl_), 'style element should be empty when the player is given no dimensions');

  // Set only the width
  player.width(100);
  assert.ok(confirmSetting('width', '100px'), 'style width should equal the supplied width in pixels');
  assert.ok(confirmSetting('height', '56.25px'), 'style height should match the default aspect ratio of the width');

  // Set the height
  player.height(200);
  assert.ok(confirmSetting('height', '200px'), 'style height should match the supplied height in pixels');

  // Reset the width and height to defaults
  player.width('');
  player.height('');
  assert.ok(confirmSetting('width', '300px'), 'supplying an empty string should reset the width');
  assert.ok(confirmSetting('height', '168.75px'), 'supplying an empty string should reset the height');

  // Switch to fluid mode
  player.fluid(true);
  assert.ok(player.hasClass('vjs-fluid'), 'the vjs-fluid class should be added to the player');
  assert.ok(confirmSetting('padding-top', '56.25%'), 'fluid aspect ratio should match the default aspect ratio');

  // Change the aspect ratio
  player.aspectRatio('4:1');
  assert.ok(confirmSetting('padding-top', '25%'), 'aspect ratio percent should match the newly set aspect ratio');
  player.dispose();
});

QUnit.test('should default to 16:9 when fluid', function(assert) {
  const player = TestHelpers.makePlayer({fluid: true});
  const ratio = player.currentHeight() / player.currentWidth();

  // account for some rounding of 0.5625 up to 0.563
  assert.ok(((ratio >= 0.562) && (ratio <= 0.563)), 'fluid player without dimensions defaults to 16:9');

  player.dispose();
});

QUnit.test('should resize fluid player on resize', function(assert) {
  const player = TestHelpers.makePlayer({fluid: true});
  let ratio = player.currentHeight() / player.currentWidth();

  // account for some rounding of 0.5625 up to 0.563
  assert.ok(((ratio >= 0.562) && (ratio <= 0.563)), 'fluid player without dimensions defaults to 16:9');

  player.tech_.videoWidth = () => 100;
  player.tech_.videoHeight = () => 50;

  player.trigger('resize');

  this.clock.tick(1);

  ratio = player.currentHeight() / player.currentWidth();

  assert.ok(ratio === 0.5, 'player aspect ratio changed on resize event');

  player.dispose();
});

QUnit.test('should resize fluid player on resize if fluid enabled post initialisation', function(assert) {
  const player = TestHelpers.makePlayer({fluid: false});

  player.tech_.videoWidth = () => 100;
  player.tech_.videoHeight = () => 30;

  player.fluid(true);
  player.trigger('resize');

  this.clock.tick(1);

  const ratio = player.currentHeight() / player.currentWidth();

  assert.ok(ratio === 0.3, 'player aspect ratio changed on resize event');

  player.dispose();
});

QUnit.test('should set fluid to true if element has vjs-fluid class', function(assert) {
  const tag = TestHelpers.makeTag();

  tag.className += ' vjs-fluid';

  const player = TestHelpers.makePlayer({}, tag);

  assert.ok(player.fluid(), 'fluid is true with vjs-fluid class');

  player.dispose();
});

QUnit.test('should set fill to true if element has vjs-fill class', function(assert) {
  const tag = TestHelpers.makeTag();

  tag.className += ' vjs-fill';

  const player = TestHelpers.makePlayer({}, tag);

  assert.ok(player.fill(), 'fill is true with vjs-fill class');

  player.dispose();
});

QUnit.test('fill turns off fluid', function(assert) {
  const tag = TestHelpers.makeTag();

  tag.className += ' vjs-fluid';

  const player = TestHelpers.makePlayer({}, tag);

  assert.notOk(player.fill(), 'fill is false');
  assert.ok(player.fluid(), 'fluid is true');

  player.fill(true);

  assert.ok(player.fill(), 'fill is true');
  assert.notOk(player.fluid(), 'fluid is false');

  player.dispose();
});

QUnit.test('fluid turns off fill', function(assert) {
  const tag = TestHelpers.makeTag();

  tag.className += ' vjs-fill';

  const player = TestHelpers.makePlayer({}, tag);

  assert.ok(player.fill(), 'fill is true');
  assert.notOk(player.fluid(), 'fluid is false');

  player.fluid(true);

  assert.notOk(player.fill(), 'fill is false');
  assert.ok(player.fluid(), 'fluid is true');

  player.dispose();
});

QUnit.test('should use an class name that begins with an alpha character', function(assert) {
  const alphaPlayer = TestHelpers.makePlayer({ id: 'alpha1' });
  const numericPlayer = TestHelpers.makePlayer({ id: '1numeric' });

  const getStyleText = function(styleEl) {
    return (styleEl.styleSheet && styleEl.styleSheet.cssText) || styleEl.innerHTML;
  };

  alphaPlayer.width(100);
  numericPlayer.width(100);

  assert.ok(/\s*\.alpha1-dimensions\s*\{/.test(getStyleText(alphaPlayer.styleEl_)), 'appends -dimensions to an alpha player ID');
  assert.ok(/\s*\.dimensions-1numeric\s*\{/.test(getStyleText(numericPlayer.styleEl_)), 'prepends dimensions- to a numeric player ID');
  alphaPlayer.dispose();
  numericPlayer.dispose();
});

QUnit.test('should wrap the original tag in the player div', function(assert) {
  const tag = TestHelpers.makeTag();
  const container = document.createElement('div');
  const fixture = document.getElementById('qunit-fixture');

  container.appendChild(tag);
  fixture.appendChild(container);

  const player = new Player(tag, { techOrder: ['techFaker'] });
  const el = player.el();

  assert.ok(el.parentNode === container, 'player placed at same level as tag');
  // Tag may be placed inside the player element or it may be removed from the DOM
  assert.ok(tag.parentNode !== container, 'tag removed from original place');

  player.dispose();
});

QUnit.test('should set and update the poster value', function(assert) {
  const poster = '#';
  const updatedPoster = 'http://example.com/updated-poster.jpg';

  const tag = TestHelpers.makeTag();

  tag.setAttribute('poster', poster);

  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.poster(), poster, 'the poster property should equal the tag attribute');

  let pcEmitted = false;

  player.on('posterchange', function() {
    pcEmitted = true;
  });

  player.poster(updatedPoster);
  assert.ok(pcEmitted, 'posterchange event was emitted');
  assert.equal(player.poster(), updatedPoster, 'the updated poster is returned');

  player.dispose();
});

// hasStarted() is equivalent to the "show poster flag" in the
// standard, for the purpose of displaying the poster image
// https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
QUnit.test('should hide the poster when play is called', function(assert) {
  const player = TestHelpers.makePlayer({
    poster: 'https://example.com/poster.jpg'
  });

  assert.equal(player.hasStarted(), false, 'the show poster flag is true before play');
  player.tech_.trigger('play');
  assert.equal(player.hasStarted(), true, 'the show poster flag is false after play');

  player.tech_.trigger('loadstart');
  assert.equal(player.hasStarted(), false, 'the resource selection algorithm sets the show poster flag to true');

  player.tech_.trigger('play');
  assert.equal(player.hasStarted(), true, 'the show poster flag is false after play');
  player.dispose();
});

QUnit.test('should load a media controller', function(assert) {
  const player = TestHelpers.makePlayer({
    preload: 'none',
    sources: [
      { src: 'http://google.com', type: 'video/mp4' },
      { src: 'http://google.com', type: 'video/webm' }
    ]
  });

  assert.ok(player.el().children[0].className.indexOf('vjs-tech') !== -1, 'media controller loaded');

  player.dispose();
});

QUnit.test('should be able to initialize player twice on the same tag using string reference', function(assert) {
  let videoTag = TestHelpers.makeTag();
  const id = videoTag.id;

  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  let player = videojs(videoTag.id, { techOrder: ['techFaker'] });

  assert.ok(player, 'player is created');
  player.dispose();

  assert.ok(!document.getElementById(id), 'element is removed');
  videoTag = TestHelpers.makeTag();
  fixture.appendChild(videoTag);

  // here we receive cached version instead of real
  player = videojs(videoTag.id, { techOrder: ['techFaker'] });
  // here it triggers error, because player was destroyed already after first dispose
  player.dispose();
});

QUnit.test('should set controls and trigger events', function(assert) {
  const player = TestHelpers.makePlayer({ controls: false });

  assert.ok(player.controls() === false, 'controls set through options');
  const hasDisabledClass = player.el().className.indexOf('vjs-controls-disabled');

  assert.ok(hasDisabledClass !== -1, 'Disabled class added to player');

  player.controls(true);
  assert.ok(player.controls() === true, 'controls updated');
  const hasEnabledClass = player.el().className.indexOf('vjs-controls-enabled');

  assert.ok(hasEnabledClass !== -1, 'Disabled class added to player');

  player.on('controlsenabled', function() {
    assert.ok(true, 'enabled fired once');
  });
  player.on('controlsdisabled', function() {
    assert.ok(true, 'disabled fired once');
  });
  player.controls(false);

  player.dispose();
});

QUnit.test('should toggle user the user state between active and inactive', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(9);

  assert.ok(player.userActive(), 'User should be active at player init');

  player.on('userinactive', function() {
    assert.ok(true, 'userinactive event triggered');
  });

  player.on('useractive', function() {
    assert.ok(true, 'useractive event triggered');
  });

  player.userActive(false);
  assert.ok(player.userActive() === false, 'Player state changed to inactive');
  assert.ok(player.el().className.indexOf('vjs-user-active') === -1, 'Active class removed');
  assert.ok(player.el().className.indexOf('vjs-user-inactive') !== -1, 'Inactive class added');

  player.userActive(true);
  assert.ok(player.userActive() === true, 'Player state changed to active');
  assert.ok(player.el().className.indexOf('vjs-user-inactive') === -1, 'Inactive class removed');
  assert.ok(player.el().className.indexOf('vjs-user-active') !== -1, 'Active class added');

  player.dispose();
});

QUnit.test('should add a touch-enabled classname when touch is supported', function(assert) {
  assert.expect(1);

  // Fake touch support. Real touch support isn't needed for this test.
  const origTouch = browser.TOUCH_ENABLED;

  browser.stub_TOUCH_ENABLED(true);

  const player = TestHelpers.makePlayer({});

  assert.notEqual(player.el().className.indexOf('vjs-touch-enabled'), -1, 'touch-enabled classname added');

  browser.stub_TOUCH_ENABLED(origTouch);
  player.dispose();
});

QUnit.test('should add smart-tv classname when on smart tv', function(assert) {
  assert.expect(1);

  browser.stub_IS_SMART_TV(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-smart-tv'), 'smart-tv classname added');

  browser.reset_IS_SMART_TV();
  player.dispose();
});

QUnit.test('should add webos classname when on webos', function(assert) {
  assert.expect(1);

  browser.stub_IS_WEBOS(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-webos'), 'webos classname added');

  browser.reset_IS_WEBOS();
  player.dispose();
});

QUnit.test('should add tizen classname when on tizen', function(assert) {
  assert.expect(1);

  browser.stub_IS_TIZEN(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-tizen'), 'tizen classname added');

  browser.reset_IS_TIZEN();
  player.dispose();
});

QUnit.test('should add android classname when on android', function(assert) {
  assert.expect(1);

  browser.stub_IS_ANDROID(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-android'), 'android classname added');

  browser.reset_IS_ANDROID();
  player.dispose();
});

QUnit.test('should add ipad classname when on ipad', function(assert) {
  assert.expect(1);

  browser.stub_IS_IPAD(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-ipad'), 'ipad classname added');

  browser.reset_IS_IPAD();
  player.dispose();
});

QUnit.test('should add iphone classname when on iphone', function(assert) {
  assert.expect(1);

  browser.stub_IS_IPHONE(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-iphone'), 'iphone classname added');

  browser.reset_IS_IPHONE();
  player.dispose();
});

QUnit.test('should add chromecast-receiver classname when on chromecast receiver', function(assert) {
  assert.expect(1);

  browser.stub_IS_CHROMECAST_RECEIVER(true);

  const player = TestHelpers.makePlayer({});

  assert.ok(player.hasClass('vjs-device-chromecast-receiver'), 'chromecast-receiver classname added');

  browser.reset_IS_CHROMECAST_RECEIVER();
  player.dispose();
});

QUnit.test('should add a svg-icons-enabled classname when svg icons are supported', function(assert) {
  // Stub a successful parsing of the SVG sprite.
  sinon.stub(window.DOMParser.prototype, 'parseFromString').returns({
    querySelector: () => false,
    documentElement: document.createElement('span')
  });

  assert.expect(1);

  const player = TestHelpers.makePlayer({experimentalSvgIcons: true});

  assert.ok(player.hasClass('vjs-svg-icons-enabled'), 'svg-icons-enabled classname added');

  window.DOMParser.prototype.parseFromString.restore();
  player.dispose();
});

QUnit.test('should revert to font icons if the SVG sprite cannot be loaded', function(assert) {
  // Stub an unsuccessful parsing of the SVG sprite.
  sinon.stub(window.DOMParser.prototype, 'parseFromString').returns({
    querySelector: () => true
  });

  assert.expect(1);

  const player = TestHelpers.makePlayer({experimentalSvgIcons: true});

  assert.ok(!player.hasClass('vjs-svg-icons-enabled'), 'svg-icons-enabled classname was not added');

  window.DOMParser.prototype.parseFromString.restore();
  player.dispose();
});

QUnit.test('should not add a touch-enabled classname when touch is not supported', function(assert) {
  assert.expect(1);

  // Fake not having touch support in case that the browser running the test supports it
  const origTouch = browser.TOUCH_ENABLED;

  browser.stub_TOUCH_ENABLED(false);

  const player = TestHelpers.makePlayer({});

  assert.equal(player.el().className.indexOf('vjs-touch-enabled'), -1, 'touch-enabled classname not added');

  browser.stub_TOUCH_ENABLED(origTouch);
  player.dispose();
});

QUnit.test('should allow for tracking when native controls are used', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(6);

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.on('usingnativecontrols', function() {
    assert.ok(true, 'usingnativecontrols event triggered');
  });

  player.on('usingcustomcontrols', function() {
    assert.ok(true, 'usingcustomcontrols event triggered');
  });

  player.usingNativeControls(true);
  assert.ok(player.usingNativeControls() === true, 'Using native controls is true');
  assert.ok(player.el().className.indexOf('vjs-using-native-controls') !== -1, 'Native controls class added');

  player.usingNativeControls(false);
  assert.ok(player.usingNativeControls() === false, 'Using native controls is false');
  assert.ok(player.el().className.indexOf('vjs-using-native-controls') === -1, 'Native controls class removed');

  player.dispose();
});

QUnit.test('make sure that controls listeners do not get added too many times', function(assert) {
  const player = TestHelpers.makePlayer({});
  let listeners = 0;

  player.addTechControlsListeners_ = function() {
    listeners++;
  };

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.usingNativeControls(true);

  player.controls(true);

  assert.equal(listeners, 0, 'addTechControlsListeners_ should not have gotten called yet');

  player.usingNativeControls(false);
  player.controls(false);

  player.controls(true);
  assert.equal(listeners, 1, 'addTechControlsListeners_ should have gotten called once');

  player.dispose();
});

QUnit.test('should register players with generated ids', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const video = document.createElement('video');

  video.className = 'vjs-default-skin video-js';
  fixture.appendChild(video);

  const player = new Player(video, { techOrder: ['techFaker'] });
  const id = player.el().id;

  assert.equal(player.el().id, player.id(), 'the player and element ids are equal');
  assert.ok(Player.players[id], 'the generated id is registered');
  player.dispose();
});

QUnit.test('should remove vjs-has-started class', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({});

  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  assert.ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added');

  player.tech_.trigger('loadstart');
  assert.ok(player.el().className.indexOf('vjs-has-started') === -1, 'vjs-has-started class removed');

  player.tech_.trigger('play');

  assert.ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added again');
  player.dispose();
});

QUnit.test('should add and remove vjs-ended class', function(assert) {
  assert.expect(4);

  const player = TestHelpers.makePlayer({});

  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  player.tech_.trigger('ended');
  assert.ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class added');

  player.tech_.trigger('play');
  assert.ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');

  player.tech_.trigger('ended');
  assert.ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class re-added');

  player.tech_.trigger('loadstart');
  assert.ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');
  player.dispose();
});

QUnit.test('player should handle different error types', function(assert) {
  assert.expect(8);
  const player = TestHelpers.makePlayer({});
  const testMsg = 'test message';

  // prevent error log messages in the console
  sinon.stub(log, 'error');

  // error code supplied
  function errCode() {
    assert.equal(player.error().code, 1, 'error code is correct');
  }
  player.on('error', errCode);
  player.error(1);
  player.off('error', errCode);

  // error instance supplied
  function errInst() {
    assert.equal(player.error().code, 2, 'MediaError code is correct');
    assert.equal(player.error().message, testMsg, 'MediaError message is correct');
  }
  player.on('error', errInst);
  player.error(new MediaError({ code: 2, message: testMsg }));
  player.off('error', errInst);

  // error message supplied
  function errMsg() {
    assert.equal(player.error().code, 0, 'error message code is correct');
    assert.equal(player.error().message, testMsg, 'error message is correct');
  }
  player.on('error', errMsg);
  player.error(testMsg);
  player.off('error', errMsg);

  // error config supplied
  function errConfig() {
    assert.equal(player.error().code, 3, 'error config code is correct');
    assert.equal(player.error().message, testMsg, 'error config message is correct');
  }
  player.on('error', errConfig);
  player.error({ code: 3, message: testMsg });
  player.off('error', errConfig);

  // check for vjs-error classname
  assert.ok(player.el().className.indexOf('vjs-error') >= 0, 'player does not have vjs-error classname');

  // restore error logging
  log.error.restore();

  player.dispose();
});

QUnit.test('beforeerror hook allows us to modify errors', function(assert) {
  const player = TestHelpers.makePlayer({});
  const beforeerrorHook = function(p, err) {
    assert.equal(player, p, 'the players match');
    assert.equal(err.code, 4, 'we got code 4 in beforeerror hook');
    return { code: 1 };
  };
  const errorHook = function(p, err) {
    assert.equal(player, p, 'the players match');
    assert.equal(err.code, 1, 'we got code 1 in error hook');
  };

  videojs.hook('beforeerror', beforeerrorHook);
  videojs.hook('error', errorHook);

  player.error({code: 4});

  player.dispose();
  videojs.removeHook('beforeerror', beforeerrorHook);
  videojs.removeHook('error', errorHook);
});

QUnit.test('beforeerror hook logs a warning if the incorrect type is returned', function(assert) {
  const player = TestHelpers.makePlayer({});
  const stub = sinon.stub(player.log, 'error');
  let errorReturnValue;

  const beforeerrorHook = function(p, err) {
    return errorReturnValue;
  };

  videojs.hook('beforeerror', beforeerrorHook);

  stub.reset();
  errorReturnValue = {code: 4};
  player.error({code: 4});
  assert.ok(stub.notCalled, '{code: 4} is supported');

  stub.reset();
  errorReturnValue = 1;
  player.error({code: 4});
  assert.ok(stub.notCalled, 'number is supported');

  stub.reset();
  errorReturnValue = null;
  player.error({code: 4});
  assert.ok(stub.notCalled, 'null is supported');

  stub.reset();
  errorReturnValue = 'hello';
  player.error({code: 4});
  assert.ok(stub.notCalled, 'string is supported');

  stub.reset();
  errorReturnValue = new Error('hello');
  player.error({code: 4});
  assert.ok(stub.notCalled, 'Error object is supported');

  stub.reset();
  errorReturnValue = [1, 2, 3];
  player.error({code: 4});
  assert.ok(stub.called, 'array is not supported');

  stub.reset();
  errorReturnValue = undefined;
  player.error({code: 4});
  assert.ok(stub.called, 'undefined is not supported');

  stub.reset();
  errorReturnValue = true;
  player.error({code: 4});
  assert.ok(stub.called, 'booleans are not supported');

  videojs.removeHook('beforeerror', beforeerrorHook);
  player.dispose();
});

QUnit.test('player should trigger error related hooks', function(assert) {
  const player = TestHelpers.makePlayer({});
  const beforeerrorHook = function(p, err) {
    assert.equal(player, p, 'the players match');
    assert.equal(err.code, 4, 'we got code 4 in beforeerror hook');
    return err;
  };
  const errorHook = function(p, err) {
    assert.equal(player, p, 'the players match');
    assert.equal(err.code, 4, 'we got code 4 in error hook');
  };

  videojs.hook('beforeerror', beforeerrorHook);
  videojs.hook('error', errorHook);

  player.error({code: 4});

  player.dispose();
  videojs.removeHook('beforeerror', beforeerrorHook);
  videojs.removeHook('error', errorHook);
});

QUnit.test('Data attributes on the video element should persist in the new wrapper element', function(assert) {
  const dataId = 123;

  const tag = TestHelpers.makeTag();

  tag.setAttribute('data-id', dataId);

  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.el().getAttribute('data-id'), dataId, 'data-id should be available on the new player element after creation');

  player.dispose();
});

QUnit.test('should restore attributes from the original video tag when creating a new element', function(assert) {
  // simulate attributes stored from the original tag
  const tag = Dom.createEl('video');

  tag.setAttribute('preload', 'auto');
  tag.setAttribute('autoplay', '');
  tag.setAttribute('webkit-playsinline', '');

  const html5Mock = { options_: {tag} };

  // set options that should override tag attributes
  html5Mock.options_.preload = 'none';

  // create the element
  const el = Html5.prototype.createEl.call(html5Mock);

  assert.equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  assert.equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  assert.equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');
});

if (Html5.isSupported()) {
  QUnit.test('player.playsinline() should be able to get/set playsinline attribute', function(assert) {
    assert.expect(5);

    const video = document.createElement('video');
    const player = TestHelpers.makePlayer({techOrder: ['html5']}, video);

    // test setter
    assert.ok(!player.tech_.el().hasAttribute('playsinline'), 'playsinline has not yet been added');

    player.playsinline(true);

    assert.ok(player.tech_.el().hasAttribute('playsinline'), 'playsinline attribute added');

    player.playsinline(false);

    assert.ok(!player.tech_.el().hasAttribute('playsinline'), 'playsinline attribute removed');

    // test getter
    player.tech_.el().setAttribute('playsinline', 'playsinline');

    assert.ok(player.playsinline(), 'correctly detects playsinline attribute');

    player.tech_.el().removeAttribute('playsinline');

    assert.ok(!player.playsinline(), 'correctly detects absence of playsinline attribute');
  });
}

QUnit.test('if tag exists and movingMediaElementInDOM, re-use the tag', function(assert) {
  // simulate attributes stored from the original tag
  const tag = Dom.createEl('video');

  tag.setAttribute('preload', 'auto');
  tag.setAttribute('autoplay', '');
  tag.setAttribute('webkit-playsinline', '');

  const html5Mock = {
    options_: {
      tag,
      playerElIngest: false
    },
    movingMediaElementInDOM: true
  };

  // set options that should override tag attributes
  html5Mock.options_.preload = 'none';

  // create the element
  const el = Html5.prototype.createEl.call(html5Mock);

  assert.equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  assert.equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  assert.equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');

  assert.equal(el, tag, 'we have re-used the tag as expected');
});

QUnit.test('if tag exists and *not* movingMediaElementInDOM, create a new tag', function(assert) {
  // simulate attributes stored from the original tag
  const tag = Dom.createEl('video');

  tag.setAttribute('preload', 'auto');
  tag.setAttribute('autoplay', '');
  tag.setAttribute('webkit-playsinline', '');

  const html5Mock = {
    options_: {
      tag,
      playerElIngest: false
    },
    movingMediaElementInDOM: false
  };

  // set options that should override tag attributes
  html5Mock.options_.preload = 'none';

  // create the element
  const el = Html5.prototype.createEl.call(html5Mock);

  assert.equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  assert.equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  assert.equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');

  assert.notEqual(el, tag, 'we have not re-used the tag as expected');
});

QUnit.test('if tag exists and *not* movingMediaElementInDOM, but playerElIngest re-use tag', function(assert) {
  // simulate attributes stored from the original tag
  const tag = Dom.createEl('video');

  tag.setAttribute('preload', 'auto');
  tag.setAttribute('autoplay', '');
  tag.setAttribute('webkit-playsinline', '');

  const html5Mock = {
    options_: {
      tag,
      playerElIngest: true
    },
    movingMediaElementInDOM: false
  };

  // set options that should override tag attributes
  html5Mock.options_.preload = 'none';

  // create the element
  const el = Html5.prototype.createEl.call(html5Mock);

  assert.equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  assert.equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  assert.equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');

  assert.equal(el, tag, 'we have re-used the tag as expected');
});

QUnit.test('should honor default inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms
  const player = TestHelpers.makePlayer({});

  player.trigger('play');

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(1800);
  assert.equal(player.userActive(), true, 'User is still active');
  clock.tick(500);
  assert.equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
  player.dispose();
});

QUnit.test('should honor configured inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms, set to shorter 200ms
  const player = TestHelpers.makePlayer({
    inactivityTimeout: 200
  });

  player.trigger('play');

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(150);
  assert.equal(player.userActive(), true, 'User is still active');
  clock.tick(350);
  // make sure user is now inactive after 500ms
  assert.equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
  player.dispose();
});

QUnit.test('should honor disabled inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms, disable by setting to zero
  const player = TestHelpers.makePlayer({
    inactivityTimeout: 0
  });

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(5000);
  assert.equal(player.userActive(), true, 'User is still active');

  clock.restore();
  player.dispose();
});

QUnit.test('should clear pending errors on disposal', function(assert) {
  const clock = sinon.useFakeTimers();

  const player = TestHelpers.makePlayer();

  clock.tick(1);

  player.src({
    src: 'http://example.com/movie.unsupported-format',
    type: 'video/unsupported-format'
  });

  clock.tick(1);

  player.dispose();

  try {
    clock.tick(5000);
  } catch (e) {
    return assert.ok(!e, 'threw an error: ' + e.message);
  }
  assert.ok(true, 'did not throw an error after disposal');
});

QUnit.test('pause is called when player ended event is fired and player is not paused', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);
  let pauses = 0;

  player.paused = function() {
    return false;
  };
  player.pause = function() {
    pauses++;
  };
  player.tech_.trigger('ended');
  assert.equal(pauses, 1, 'pause was called');
  player.dispose();
});

QUnit.test('pause is not called if the player is paused and ended is fired', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);
  let pauses = 0;

  player.paused = function() {
    return true;
  };
  player.pause = function() {
    pauses++;
  };
  player.tech_.trigger('ended');

  assert.equal(pauses, 0, 'pause was not called when ended fired');
  player.dispose();
});

QUnit.test('should add an audio class if an audio el is used', function(assert) {
  const audio = document.createElement('audio');
  const player = TestHelpers.makePlayer({}, audio);
  const audioClass = 'vjs-audio';

  assert.ok(player.el().className.indexOf(audioClass) !== -1, 'added ' + audioClass + ' css class');
  player.dispose();
});

QUnit.test('should add a video player region if a video el is used', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);

  assert.ok(player.el().getAttribute('role') === 'region', 'region role is present');
  assert.ok(player.el().getAttribute('aria-label') === 'Video Player', 'Video Player label present');
  player.dispose();
});

QUnit.test('should add an audio player region if an audio el is used', function(assert) {
  const audio = document.createElement('audio');
  const player = TestHelpers.makePlayer({}, audio);

  assert.ok(player.el().getAttribute('role') === 'region', 'region role is present');
  assert.ok(player.el().getAttribute('aria-label') === 'Audio Player', 'Audio Player label present');
  player.dispose();
});

QUnit.test('default audioPosterMode value at player creation', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');
  assert.ok(player.audioPosterMode() === false, 'audioPosterMode is false by default');

  const player2 = TestHelpers.makePlayer({
    audioPosterMode: true
  });
  const done = assert.async();

  player2.trigger('ready');
  player2.one('audiopostermodechange', () => {
    assert.ok(player2.audioPosterMode(), 'audioPosterMode can be set to true when the player is created');
    done();
  });
});

QUnit.test('get and set audioPosterMode value', function(assert) {
  const player = TestHelpers.makePlayer({});

  return player.audioPosterMode(true)
    .then(() => {
      assert.ok(player.audioPosterMode(), 'audioPosterMode is set to true');
    });
});

QUnit.test('vjs-audio-poster-mode class and video element visibility when audioPosterMode is true', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');

  assert.ok(player.el().className.indexOf('vjs-audio-poster-mode') === -1, 'vjs-audio-poster-mode class is not present initially');
  assert.ok(player.tech_.el().className.indexOf('vjs-hidden') === -1, 'video element is visible');

  return player.audioPosterMode(true)
    .then(() => {
      assert.ok(player.el().className.indexOf('vjs-audio-poster-mode') !== -1, 'vjs-audio-poster-mode class is present');
      assert.ok(player.tech_.el().className.indexOf('vjs-hidden') !== -1, 'video element is hidden');
    });
});

QUnit.test('setting audioPosterMode() should trigger audiopostermodechange event', function(assert) {
  const player = TestHelpers.makePlayer({
    audioPosterMode: true
  });
  const done = assert.async();

  player.trigger('ready');
  player.one('audiopostermodechange', () => {
    assert.ok(true, 'audiopostermodechange event was triggered');
    assert.ok(player.audioPosterMode(), 'audioPosterMode is set to true');
    done();
  });
});

QUnit.test('should setScrubbing when seeking or not seeking', function(assert) {
  const player = TestHelpers.makePlayer();
  let isScrubbing;

  player.tech_.setScrubbing = (_isScrubbing) => {
    isScrubbing = _isScrubbing;
  };

  assert.equal(player.scrubbing(), false, 'player is not scrubbing');

  player.scrubbing(true);
  assert.ok(isScrubbing, "tech's setScrubbing was called with true");

  player.scrubbing(false);
  assert.notOk(isScrubbing, "tech's setScrubbing was called with false");
});

QUnit.test('should not be scrubbing while not seeking', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.equal(player.scrubbing(), false, 'player is not scrubbing');
  assert.ok(player.el().className.indexOf('scrubbing') === -1, 'scrubbing class is not present');
  player.scrubbing(false);

  assert.equal(player.scrubbing(), false, 'player is not scrubbing');
  player.dispose();
});

QUnit.test('should be scrubbing while seeking', function(assert) {
  const player = TestHelpers.makePlayer();

  player.scrubbing(true);
  assert.equal(player.scrubbing(), true, 'player is scrubbing');
  assert.ok(player.el().className.indexOf('scrubbing') !== -1, 'scrubbing class is present');
  player.dispose();
});

QUnit.test('should throw on startup no techs are specified', function(assert) {
  const techOrder = videojs.options.techOrder;
  const fixture = document.getElementById('qunit-fixture');

  videojs.options.techOrder = null;
  assert.throws(function() {
    const tag = TestHelpers.makeTag();

    fixture.appendChild(tag);

    videojs(tag);
  }, 'a falsey techOrder should throw');

  videojs.options.techOrder = techOrder;
});

QUnit.test('should have a sensible toJSON that is equivalent to player.options', function(assert) {
  const playerOptions = {
    html5: {
      nativeTextTracks: false
    }
  };

  const player = TestHelpers.makePlayer(playerOptions);

  assert.deepEqual(player.toJSON(), player.options_, 'simple player options toJSON produces output equivalent to player.options_');

  const playerOptions2 = {
    tracks: [{
      label: 'English',
      srclang: 'en',
      src: '../docs/examples/shared/example-captions.vtt',
      kind: 'captions'
    }]
  };

  const player2 = TestHelpers.makePlayer(playerOptions2);

  playerOptions2.tracks[0].player = player2;

  const popts = player2.options_;

  popts.tracks[0].player = undefined;

  assert.deepEqual(player2.toJSON(), popts, 'no circular references');

  player.dispose();
  player2.dispose();
});

QUnit.test('should ignore case in language codes and try primary code', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({
    languages: {
      'en-gb': {
        Good: 'Brilliant'
      },
      'EN': {
        Good: 'Awesome',
        Error: 'Problem'
      }
    }
  });

  player.language('en-gb');
  assert.strictEqual(player.localize('Good'), 'Brilliant', 'Used subcode specific localisation');
  assert.strictEqual(player.localize('Error'), 'Problem', 'Used primary code localisation');
  player.language('en-GB');
  assert.strictEqual(player.localize('Good'), 'Brilliant', 'Ignored case');
  player.dispose();
});

QUnit.test('inherits language from parent element', function(assert) {
  const fixture = document.getElementById('qunit-fixture');
  const oldLang = fixture.getAttribute('lang');

  fixture.setAttribute('lang', 'x-test');
  const player = TestHelpers.makePlayer();

  assert.equal(player.language(), 'x-test', 'player inherits parent element language');

  player.dispose();
  if (oldLang) {
    fixture.setAttribute('lang', oldLang);
  } else {
    fixture.removeAttribute('lang');
  }
});

QUnit.test('sets lang attribute on player el', function(assert) {
  const fixture = document.getElementById('qunit-fixture');
  const oldLang = fixture.getAttribute('lang');

  fixture.setAttribute('lang', 'x-attr-test');
  const player = TestHelpers.makePlayer();

  assert.equal(player.el().getAttribute('lang'), 'x-attr-test', 'player sets lang attribute on self');

  player.dispose();
  if (oldLang) {
    fixture.setAttribute('lang', oldLang);
  } else {
    fixture.removeAttribute('lang');
  }
});

QUnit.test('language changed should trigger languagechange event', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(1);

  player.on('languagechange', function() {
    assert.ok(true, 'languagechange event triggered');
  });
  player.language('es-MX');
  player.dispose();
});

QUnit.test('language changed should not trigger languagechange event if language is the same', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(1);
  let triggered = false;

  player.language('es-MX');
  player.on('languagechange', function() {
    triggered = true;
  });
  player.language('es-MX');

  assert.equal(triggered, false, 'languagechange event was not triggered');
  player.dispose();
});

QUnit.test('change language multiple times should trigger languagechange event', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(3);

  player.on('languagechange', function() {
    assert.ok(true, 'languagechange event triggered');
  });
  player.language('es-MX');
  player.language('en-EU');
  // set same language should not trigger the event so we expect 3 asserts not 4.
  player.language('en-EU');
  player.language('es-ES');
  player.dispose();
});

QUnit.test('should return correct values for canPlayType', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.equal(player.canPlayType('video/mp4'), 'maybe', 'player can play mp4 files');
  assert.equal(player.canPlayType('video/unsupported-format'), '', 'player can not play unsupported files');

  player.dispose();
});

QUnit.test('createModal()', function(assert) {
  const player = TestHelpers.makePlayer();
  const modal = player.createModal('foo');
  const spy = sinon.spy();

  modal.on('dispose', spy);

  assert.expect(5);
  assert.strictEqual(modal.el().parentNode, player.el(), 'the modal is injected into the player');
  assert.strictEqual(modal.content(), 'foo', 'content is set properly');
  assert.ok(modal.opened(), 'modal is opened by default');
  modal.close();

  assert.ok(spy.called, 'modal was disposed when closed');
  assert.strictEqual(player.children().indexOf(modal), -1, 'modal was removed from player\'s children');
  player.dispose();
});

QUnit.test('createModal() options object', function(assert) {
  const player = TestHelpers.makePlayer();
  const modal = player.createModal('foo', {content: 'bar', label: 'boo'});

  assert.expect(2);
  assert.strictEqual(modal.content(), 'foo', 'content argument takes precedence');
  assert.strictEqual(modal.options_.label, 'boo', 'modal options are set properly');
  modal.close();
  player.dispose();
});

QUnit.test('you can clear error in the error event', function(assert) {
  const player = TestHelpers.makePlayer();

  sinon.stub(log, 'error');

  player.error({code: 4});
  assert.ok(player.error(), 'we have an error');
  player.error(null);

  player.one('error', function() {
    player.error(null);
  });
  player.error({code: 4});
  assert.ok(!player.error(), 'we no longer have an error');

  log.error.restore();
  player.dispose();
});

QUnit.test('Player#tech will return tech given the appropriate input', function(assert) {
  const oldLogWarn = log.warn;
  let warning;

  log.warn = function(_warning) {
    warning = _warning;
  };

  const tech_ = {};
  const returnedTech = Player.prototype.tech.call({tech_}, true);

  assert.equal(returnedTech, tech_, 'We got back the tech we wanted');
  assert.notOk(warning, 'no warning was logged');

  log.warn = oldLogWarn;
});

QUnit.test('Player#tech logs a warning when called without a safety argument', function(assert) {
  const oldLogWarn = log.warn;
  const warningRegex = new RegExp('https://github.com/videojs/video.js/issues/2617');
  let warning;

  log.warn = function(_warning) {
    warning = _warning;
  };

  const tech_ = {};

  Player.prototype.tech.call({tech_});

  assert.ok(warningRegex.test(warning), 'we logged a warning');

  log.warn = oldLogWarn;
});

QUnit.test('player#version will return an object with video.js version', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.strictEqual(player.version()['video.js'], pkg.version, 'version is correct');
});

QUnit.test('player#reset loads the Html5 tech and then techCalls reset', function(assert) {
  let loadedTech;
  let loadedSource;
  let techCallMethod;

  const testPlayer = {
    options_: {
      techOrder: ['html5', 'youtube']
    },
    error() {},
    addClass() {},
    removeClass() {},
    resetCache_() {},
    loadTech_(tech, source) {
      loadedTech = tech;
      loadedSource = source;
    },
    techCall_(method) {
      techCallMethod = method;
    },
    resetControlBarUI_() {},
    poster() {},
    paused() {
      return true;
    },
    doReset_: Player.prototype.doReset_
  };

  Player.prototype.reset.call(testPlayer);

  assert.equal(loadedTech, 'html5', 'we loaded the html5 tech');
  assert.equal(loadedSource, null, 'with a null source');
  assert.equal(techCallMethod, 'reset', 'we then reset the tech');
});

QUnit.test('player#reset loads the first item in the techOrder and then techCalls reset', function(assert) {
  let loadedTech;
  let loadedSource;
  let techCallMethod;

  const testPlayer = {
    options_: {
      techOrder: ['youtube', 'html5']
    },
    error() {},
    addClass() {},
    removeClass() {},
    resetCache_() {},
    loadTech_(tech, source) {
      loadedTech = tech;
      loadedSource = source;
    },
    techCall_(method) {
      techCallMethod = method;
    },
    resetControlBarUI_() {},
    poster() {},
    paused() {
      return true;
    },
    doReset_: Player.prototype.doReset_
  };

  Player.prototype.reset.call(testPlayer);

  assert.equal(loadedTech, 'youtube', 'we loaded the Youtube tech');
  assert.equal(loadedSource, null, 'with a null source');
  assert.equal(techCallMethod, 'reset', 'we then reset the tech');
});

QUnit.test('player#reset clears the player cache', function(assert) {
  const player = TestHelpers.makePlayer();
  const sources = [{
    src: '//vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  }, {
    src: '//vjs.zencdn.net/v/oceans.webm',
    type: 'video/webm'
  }];

  this.clock.tick(1);

  player.src(sources);
  player.duration(10);
  player.playbackRate(0.5);
  player.playbackRates([1, 2, 3]);
  player.volume(0.2);

  assert.strictEqual(player.currentSrc(), sources[0].src, 'currentSrc is correct');
  assert.deepEqual(player.currentSource(), sources[0], 'currentSource is correct');
  assert.deepEqual(player.currentSources(), sources, 'currentSources is correct');
  assert.strictEqual(player.duration(), 10, 'duration is correct');
  assert.strictEqual(player.playbackRate(), 0.5, 'playbackRate is correct');
  assert.deepEqual(player.playbackRates(), [1, 2, 3], 'playbackRates is correct');
  assert.strictEqual(player.volume(), 0.2, 'volume is correct');
  assert.strictEqual(player.lastVolume_(), 0.2, 'lastVolume_ is correct');

  player.reset();

  assert.strictEqual(player.currentSrc(), '', 'currentSrc is correct');
  assert.deepEqual(player.currentSource(), {}, 'currentSource is correct');
  assert.deepEqual(player.currentSources(), [], 'currentSources is correct');

  // Right now, the currentTime is not _really_ cached because it is always
  // retrieved from the tech. However, for completeness, we set it to zero in
  // the `resetCache_` method to ensure that if we do start actually caching it,
  // we reset it along with everything else.
  assert.strictEqual(player.getCache().currentTime, 0, 'currentTime is correct');
  assert.ok(isNaN(player.duration()), 'duration is correct');
  assert.strictEqual(player.playbackRate(), 1, 'playbackRate is correct');
  assert.deepEqual(player.playbackRates(), [], 'playbackRates is correct');
  assert.strictEqual(player.volume(), 1, 'volume is correct');
  assert.strictEqual(player.lastVolume_(), 1, 'lastVolume_ is correct');
});

QUnit.test('player#reset removes the poster', function(assert) {
  const player = TestHelpers.makePlayer();

  this.clock.tick(1);

  player.poster('foo.jpg');
  assert.strictEqual(player.poster(), 'foo.jpg', 'the poster was set');
  player.reset();
  assert.strictEqual(player.poster(), '', 'the poster was reset');
});

QUnit.test('player#reset removes remote text tracks', function(assert) {
  const player = TestHelpers.makePlayer();

  this.clock.tick(1);

  player.addRemoteTextTrack({
    kind: 'captions',
    src: 'foo.vtt',
    language: 'en',
    label: 'English'
  });

  assert.strictEqual(player.remoteTextTracks().length, 1, 'there is one RTT');
  player.reset();
  assert.strictEqual(player.remoteTextTracks().length, 0, 'there are zero RTTs');
});

QUnit.test('player#reset progress bar', function(assert) {

  let error;

  const player = TestHelpers.makePlayer();

  player.removeChild('controlBar');
  player.controlBar = null;

  try {
    player.resetProgressBar_();
  } catch (e) {
    error = e;
  }

  assert.notOk(error, 'Function did not throw an error on resetProgressBar');
});

QUnit.test('Remove waiting class after tech waiting when timeupdate shows a time change', function(assert) {
  const player = TestHelpers.makePlayer();

  player.currentTime = () => 1;
  player.tech_.trigger('waiting');
  assert.ok(
    /vjs-waiting/.test(player.el().className),
    'vjs-waiting is added to the player el on tech waiting'
  );
  player.trigger('timeupdate');
  assert.ok(
    /vjs-waiting/.test(player.el().className),
    'vjs-waiting still exists on the player el when time hasn\'t changed on timeupdate'
  );
  player.currentTime = () => 2;
  player.trigger('timeupdate');
  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el when time has changed on timeupdate'
  );
  player.dispose();
});

QUnit.test('Queues playing events when playback rate is zero while seeking', function(assert) {
  const player = TestHelpers.makePlayer({techOrder: ['html5']});

  let canPlayCount = 0;
  let canPlayThroughCount = 0;
  let playingCount = 0;
  let seekedCount = 0;
  let seeking = false;

  player.on('canplay', () => canPlayCount++);
  player.on('canplaythrough', () => canPlayThroughCount++);
  player.on('playing', () => playingCount++);
  player.on('seeked', () => seekedCount++);

  player.tech_.seeking = () => {
    return seeking;
  };

  player.tech_.setPlaybackRate(0);
  player.tech_.trigger('ratechange');

  player.tech_.trigger('canplay');
  player.tech_.trigger('canplaythrough');
  player.tech_.trigger('playing');
  player.tech_.trigger('seeked');

  assert.equal(canPlayCount, 1, 'canplay event dispatched when not seeking');
  assert.equal(canPlayThroughCount, 1, 'canplaythrough event dispatched when not seeking');
  assert.equal(playingCount, 1, 'playing event dispatched when not seeking');
  assert.equal(seekedCount, 1, 'seeked event dispatched when not seeking');

  seeking = true;
  player.tech_.trigger('canplay');
  player.tech_.trigger('canplaythrough');
  player.tech_.trigger('playing');
  player.tech_.trigger('seeked');

  assert.equal(canPlayCount, 1, 'canplay event not dispatched');
  assert.equal(canPlayThroughCount, 1, 'canplaythrough event not dispatched');
  assert.equal(playingCount, 1, 'playing event not dispatched');
  assert.equal(seekedCount, 1, 'seeked event not dispatched');

  seeking = false;
  player.tech_.setPlaybackRate(1);
  player.tech_.trigger('ratechange');

  assert.equal(canPlayCount, 2, 'canplay event dispatched after playback rate restore');
  assert.equal(canPlayThroughCount, 2, 'canplaythrough event dispatched after playback rate restore');
  assert.equal(playingCount, 2, 'playing event dispatched after playback rate restore');
  assert.equal(seekedCount, 2, 'seeked event dispatched after playback rate restore');

});

QUnit.test('Make sure that player\'s style el respects VIDEOJS_NO_DYNAMIC_STYLE option', function(assert) {
  // clear the HEAD before running this test
  let styles = document.querySelectorAll('style');
  let i = styles.length;

  while (i--) {
    const style = styles[i];

    style.parentNode.removeChild(style);
  }

  let tag = TestHelpers.makeTag();

  tag.id = 'vjs-no-base-theme-tag';
  tag.width = 600;
  tag.height = 300;

  window.VIDEOJS_NO_DYNAMIC_STYLE = true;
  TestHelpers.makePlayer({}, tag);

  styles = document.querySelectorAll('style');
  assert.equal(styles.length, 0, 'we should not get any style elements included in the DOM');

  window.VIDEOJS_NO_DYNAMIC_STYLE = false;
  tag = TestHelpers.makeTag();
  TestHelpers.makePlayer({}, tag);
  styles = document.querySelectorAll('style');
  assert.equal(styles.length, 1, 'we should have one style element in the DOM');
  assert.equal(styles[0].className, 'vjs-styles-dimensions', 'the class name is the one we expected');
});

QUnit.test('When VIDEOJS_NO_DYNAMIC_STYLE is set, apply sizing directly to the tech el', function(assert) {
  // clear the HEAD before running this test
  const originalVjsNoDynamicStyling = window.VIDEOJS_NO_DYNAMIC_STYLE;
  const styles = document.querySelectorAll('style');
  let i = styles.length;

  while (i--) {
    const style = styles[i];

    style.parentNode.removeChild(style);
  }

  const tag = TestHelpers.makeTag();

  tag.id = 'vjs-no-base-theme-tag';
  tag.width = 600;
  tag.height = 300;

  window.VIDEOJS_NO_DYNAMIC_STYLE = true;
  const player = TestHelpers.makePlayer({}, tag);

  player.width(300);
  player.height(600);
  assert.equal(player.tech_.el().width, 300, 'the width is equal to 300');
  assert.equal(player.tech_.el().height, 600, 'the height is equal 600');

  player.width(600);
  player.height(300);

  assert.equal(player.tech_.el().width, 600, 'the width is equal to 600');
  assert.equal(player.tech_.el().height, 300, 'the height is equal 300');
  player.dispose();
  window.VIDEOJS_NO_DYNAMIC_STYLE = originalVjsNoDynamicStyling;
});

QUnit.test('should return the registered component', function(assert) {
  class CustomPlayer extends Player {}

  assert.strictEqual(videojs.registerComponent('CustomPlayer', CustomPlayer), CustomPlayer, 'the component is returned');
});

QUnit.test('should allow to register custom player when any player has not been created', function(assert) {
  class CustomPlayer extends Player {}
  videojs.registerComponent('Player', CustomPlayer);

  const tag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);

  const player = videojs(tag);

  assert.equal(player instanceof CustomPlayer, true, 'player is custom');
  player.dispose();

  // reset the Player to the original value;
  videojs.registerComponent('Player', Player);
});

QUnit.test('should not allow to register custom player when any player has been created', function(assert) {
  const tag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);

  const player = videojs(tag);

  class CustomPlayer extends Player {}

  assert.throws(function() {
    videojs.registerComponent('Player', CustomPlayer);
  }, 'Can not register Player component after player has been created');

  player.dispose();

  // reset the Player to the original value;
  videojs.registerComponent('Player', Player);
});

QUnit.test('should not allow to register custom player when any player still exists', function(assert) {
  const videoTag1 = document.createElement('video');
  const videoTag2 = document.createElement('video');

  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag1);
  fixture.appendChild(videoTag2);

  const player1 = videojs(videoTag1);
  const player2 = videojs(videoTag2);

  class CustomPlayer extends Player {}

  assert.throws(function() {
    videojs.registerComponent('Player', CustomPlayer);
  }, 'Can not register Player component after player has been created');

  player1.dispose();

  // still throws, because player2 still exists
  assert.throws(function() {
    videojs.registerComponent('Player', CustomPlayer);
  }, 'Can not register Player component after player has been created');

  player2.dispose();

  // successfully registers, because no player exists anymore
  // should not throw
  videojs.registerComponent('Player', CustomPlayer);

  // reset the Player to the original value;
  videojs.registerComponent('Player', Player);
});

QUnit.test('setters getters passed to tech', function(assert) {
  const tag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);

  const player = videojs(tag, {
    techOrder: ['techFaker']
  });

  const setSpy = sinon.spy(player.tech_, 'setDefaultMuted');
  const getSpy = sinon.spy(player.tech_, 'defaultMuted');

  player.defaultMuted(true);
  player.defaultMuted();

  assert.ok(setSpy.calledWith(true), 'setSpy called');
  assert.ok(getSpy.called);

  setSpy.restore();
  getSpy.restore();
});

QUnit.test('techGet runs through middleware if allowedGetter', function(assert) {
  let cts = 0;
  let muts = 0;
  let vols = 0;
  let durs = 0;
  let lps = 0;

  videojs.use('video/foo', () => ({
    currentTime() {
      cts++;
    },
    duration() {
      durs++;
    },
    loop() {
      lps++;
    },
    muted() {
      muts++;
    },
    volume() {
      vols++;
    }
  }));

  const tag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);

  const player = videojs(tag, {
    techOrder: ['techFaker']
  });

  player.middleware_ = [middleware.getMiddleware('video/foo')[0](player)];

  player.techGet_('currentTime');
  player.techGet_('volume');
  player.techGet_('duration');
  player.techGet_('loop');
  player.techGet_('muted');

  assert.equal(cts, 1, 'currentTime is allowed');
  assert.equal(vols, 1, 'volume is allowed');
  assert.equal(durs, 1, 'duration is allowed');
  assert.equal(muts, 1, 'muted is allowed');
  assert.equal(lps, 0, 'loop is not allowed');

  middleware.getMiddleware('video/foo').pop();
  player.dispose();
});

QUnit.test('techCall runs through middleware if allowedSetter', function(assert) {
  let cts = 0;
  let muts = false;
  let vols = 0;
  let prs = 0;

  videojs.use('video/foo', () => ({
    setCurrentTime(ct) {
      cts++;
      return ct;
    },
    setVolume() {
      vols++;
      return vols;
    },
    setMuted() {
      muts = true;
      return muts;
    },
    setPlaybackRate() {
      prs++;
      return prs;
    }
  }));

  const tag = TestHelpers.makeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);

  const player = videojs(tag, {
    techOrder: ['techFaker']
  });

  player.middleware_ = [middleware.getMiddleware('video/foo')[0](player)];

  this.clock.tick(1);

  player.techCall_('setCurrentTime', 10);
  player.techCall_('setVolume', 0.5);
  player.techCall_('setMuted', true);
  player.techCall_('setPlaybackRate', 0.75);

  this.clock.tick(1);

  assert.equal(cts, 1, 'setCurrentTime is allowed');
  assert.equal(vols, 1, 'setVolume is allowed');
  assert.equal(muts, true, 'setMuted is allowed');
  assert.equal(prs, 0, 'setPlaybackRate is not allowed');

  middleware.getMiddleware('video/foo').pop();
  player.dispose();
});

QUnit.test('src selects tech based on middleware', function(assert) {
  const oldTechs = Tech.techs_;
  const oldDefaultTechOrder = Tech.defaultTechOrder_;

  class FooTech extends Html5 {}
  class BarTech extends Html5 {}

  FooTech.isSupported = () => true;
  FooTech.canPlayType = (type) => type === 'video/mp4';
  FooTech.canPlaySource = (src) => FooTech.canPlayType(src.type);

  BarTech.isSupported = () => true;
  BarTech.canPlayType = (type) => type === 'video/youtube';
  BarTech.canPlaySource = (src) => BarTech.canPlayType(src.type);

  videojs.registerTech('FooTech', FooTech);
  videojs.registerTech('BarTech', BarTech);

  videojs.use('video/foo', () => ({
    setSource(src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  }));

  videojs.use('video/bar', () => ({
    setSource(src, next) {
      next(null, {
        src: 'https://www.youtube.com/watch?v=C0DPdy98e4c',
        type: 'video/youtube'
      });
    }
  }));

  const fixture = document.getElementById('qunit-fixture');
  const tag = TestHelpers.makeTag();

  fixture.appendChild(tag);

  const player = videojs(tag, {
    techOrder: ['fooTech', 'barTech']
  });

  player.src({
    src: 'foo',
    type: 'video/foo'
  });

  this.clock.tick(1);

  assert.equal(player.techName_, 'FooTech', 'the FooTech (html5) tech is chosen');

  player.src({
    src: 'bar',
    type: 'video/bar'
  });

  this.clock.tick(1);

  assert.equal(player.techName_, 'BarTech', 'the BarTech (Youtube) tech is chosen');

  middleware.getMiddleware('video/foo').pop();
  middleware.getMiddleware('video/bar').pop();
  player.dispose();
  delete Tech.techs_.FooTech;
  delete Tech.techs_.BarTech;

  Tech.defaultTechOrder_ = oldDefaultTechOrder;
  Tech.techs_ = oldTechs;

});

QUnit.test('src_ does not call loadTech is name is titleCaseEquals', function(assert) {
  let loadTechCalled = 0;
  const playerProxy = {
    selectSource() {
      return {
        tech: 'html5'
      };
    },
    techName_: 'Html5',
    ready() {},
    loadTech_() {
      loadTechCalled++;
    }
  };

  Player.prototype.src_.call(playerProxy);

  assert.equal(loadTechCalled, 0, 'loadTech was not called');
});

QUnit.test('options: plugins', function(assert) {
  const optionsSpy = sinon.spy();

  Plugin.registerPlugin('foo', (options) => {
    optionsSpy(options);
  });

  const player = TestHelpers.makePlayer({
    plugins: {
      foo: {
        bar: 1
      }
    }
  });

  assert.strictEqual(optionsSpy.callCount, 1, 'the plugin was set up');
  assert.deepEqual(optionsSpy.getCall(0).args[0], {bar: 1}, 'the plugin got the expected options');

  assert.throws(
    () => {
      TestHelpers.makePlayer({
        plugins: {
          nope: {}
        }
      });
    },
    new Error('plugin "nope" does not exist'),
    'plugins that do not exist cause the player to throw'
  );

  player.dispose();
  Plugin.deregisterPlugin('foo');
});

QUnit.test('should add a class with major version', function(assert) {
  const majorVersion = pkg.version.split('.')[0];
  const player = TestHelpers.makePlayer();

  assert.ok(player.hasClass('vjs-v' + majorVersion), 'the version class should be added to the player');

  player.dispose();
});

QUnit.test('player.duration() returns NaN if player.cache_.duration is undefined', function(assert) {
  const player = TestHelpers.makePlayer();

  player.cache_.duration = undefined;
  assert.ok(Number.isNaN(player.duration()), 'returned NaN for unknown duration');
});

QUnit.test('player.duration() returns player.cache_.duration if it is defined', function(assert) {
  const player = TestHelpers.makePlayer();

  player.cache_.duration = 200;
  assert.equal(player.duration(), 200, 'returned correct integer duration');
  player.cache_.duration = 942;
  assert.equal(player.duration(), 942, 'returned correct integer duration');
});

QUnit.test('player.duration() sets the value of player.cache_.duration', function(assert) {
  const player = TestHelpers.makePlayer();

  // set an arbitrary initial cached duration value for testing the setter functionality
  player.cache_.duration = 1;

  player.duration(NaN);
  assert.ok(Number.isNaN(player.duration()), 'duration() set and get NaN duration value');
  player.duration(200);
  assert.equal(player.duration(), 200, 'duration() set and get integer duration value');
});

QUnit.test('setPoster in tech with `techCanOverridePoster` in player should override poster', function(assert) {
  const player = TestHelpers.makePlayer({
    techCanOverridePoster: true
  });
  const posterchangeSpy = sinon.spy();
  const firstPosterUrl = 'https://wherever.test/test.jpg';
  const techPosterUrl = 'https://somewhere.text/my/image.png';

  assert.equal(player.options_.techCanOverridePoster, true, 'make sure player option was passed correctly');
  assert.equal(player.tech_.options_.canOverridePoster, true, 'make sure tech option was passed correctly');

  player.on('posterchange', posterchangeSpy);

  player.poster('');
  assert.ok(posterchangeSpy.notCalled, 'posterchangeSpy not called when no change of poster');
  assert.equal(player.isPosterFromTech_, false, "ensure tech didn't change poster after empty call from player");

  player.poster(firstPosterUrl);
  assert.ok(posterchangeSpy.calledOnce, 'posterchangeSpy only called once on update');
  assert.equal(player.poster(), firstPosterUrl, "ensure tech didn't change poster after setting from player");
  assert.equal(player.isPosterFromTech_, false, "ensure player didn't mark poster as changed by the tech");

  posterchangeSpy.resetHistory();

  player.tech_.setPoster(techPosterUrl);
  assert.ok(posterchangeSpy.calledOnce, "posterchangeSpy should've been called");
  assert.equal(player.isPosterFromTech_, true, 'ensure player marked poster as set by tech after the fact');

  player.dispose();
});

QUnit.test('setPoster in tech WITHOUT `techCanOverridePoster` in player should NOT override poster', function(assert) {
  const player = TestHelpers.makePlayer();
  const posterchangeSpy = sinon.spy();
  const firstPosterUrl = 'https://wherever.test/test.jpg';
  const techPosterUrl = 'https://somewhere.test/my/image.png';

  assert.equal(player.options_.techCanOverridePoster, undefined, "ensure player option wasn't unwittingly set");
  assert.equal(player.tech_.options_.canOverridePoster, false, "ensure tech option wasn't unwittinyly set");

  player.on('posterchange', posterchangeSpy);

  player.poster(firstPosterUrl);
  assert.ok(posterchangeSpy.calledOnce, 'posterchangeSpy only called once on update');
  assert.equal(player.poster(), firstPosterUrl, "ensure tech didn't change poster after setting from player");
  assert.equal(player.isPosterFromTech_, false, "ensure player didn't mark poster as changed by the tech");

  posterchangeSpy.resetHistory();

  player.tech_.setPoster(techPosterUrl);
  assert.ok(posterchangeSpy.notCalled, "posterchangeSpy shouldn't have been called");
  assert.equal(player.isPosterFromTech_, false, "ensure tech didn't change poster because player option was false");

  player.dispose();
});

QUnit.test('disposing a tech that set a poster, should unset the poster', function(assert) {
  const player = TestHelpers.makePlayer({
    techCanOverridePoster: true
  });
  const techPosterUrl = 'https://somewhere.test/my/image.png';

  assert.equal(player.options_.techCanOverridePoster, true, 'make sure player option was passed correctly');
  assert.equal(player.tech_.options_.canOverridePoster, true, 'make sure tech option was passed correctly');

  player.tech_.setPoster(techPosterUrl);
  assert.equal(player.poster(), techPosterUrl, 'player poster should equal tech poster');
  assert.equal(player.isPosterFromTech_, true, 'setting the poster with the tech should be remembered in the player');

  player.unloadTech_();

  assert.equal(player.poster(), '', 'ensure poster set by poster is unset after tech disposal');

  player.dispose();
});

QUnit.test('disposing a tech that dit NOT set a poster, should keep the poster', function(assert) {
  const player = TestHelpers.makePlayer({
    techCanOverridePoster: true
  });
  const posterUrl = 'https://myposter.test/lol.jpg';

  assert.equal(player.options_.techCanOverridePoster, true, 'make sure player option was passed correctly');
  assert.equal(player.tech_.options_.canOverridePoster, true, 'make sure tech option was passed correctly');

  player.poster(posterUrl);
  assert.equal(player.poster(), posterUrl, 'player poster should NOT have changed');
  assert.equal(player.isPosterFromTech_, false, 'player should mark poster as set by itself');

  player.unloadTech_();

  assert.equal(player.poster(), posterUrl, 'player poster should stay the same after unloading / dispoing tech');

  player.dispose();
});

QUnit.test('source options are retained', function(assert) {
  const player = TestHelpers.makePlayer();

  const source = {
    src: 'https://some.url',
    type: 'someType',
    sourceOption: 'someOption'
  };

  player.src(source);

  assert.equal(player.currentSource().sourceOption, 'someOption', 'source option retained');
});

QUnit.test('setting children to false individually, does not cause an assertion', function(assert) {
  const defaultChildren = Player.prototype.options_.children;

  defaultChildren.forEach((childName) => {
    const options = {};

    options[childName] = false;

    const player = TestHelpers.makePlayer(options);

    this.clock.tick(1000);

    player.triggerReady();
    player.dispose();
    assert.ok(true, `${childName}: false. did not cause an assertion`);
  });
});

QUnit.test('setting all children to false, does not cause an assertion', function(assert) {
  const defaultChildren = Player.prototype.options_.children;
  const options = {};

  defaultChildren.forEach((childName) => {
    options[childName] = false;
  });

  const player = TestHelpers.makePlayer(options);

  this.clock.tick(1000);
  player.triggerReady();

  player.dispose();
  assert.ok(true, 'did not cause an assertion');
});

QUnit.test('controlBar behaviour with mouseenter and mouseleave events', function(assert) {

  const player = TestHelpers.makePlayer();

  player.listenForUserActivity_();

  assert.equal(player.options_.inactivityTimeout, 2000, 'inactivityTimeout default value is 2000');

  const el = player.getChild('controlBar').el();

  // move mouse to controlBar
  Events.trigger(el, 'mouseenter');

  assert.equal(player.options_.inactivityTimeout, 0, 'mouseenter on control-bar, inactivityTimeout is set to 0');

  // move mouse out of controlBar bounds
  Events.trigger(el, 'mouseleave');

  assert.equal(player.options_.inactivityTimeout, player.cache_.inactivityTimeout, 'mouse leaves control-bar, inactivityTimeout is set to default value (2000)');

  player.dispose();
});

QUnit.test('Should be able to set a currentTime after player initialization as soon the canplay event is fired', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.src('xyz.mp4');
  player.currentTime(500);
  assert.strictEqual(player.currentTime(), 0, 'currentTime value was not changed');
  this.clock.tick(100);
  player.trigger('canplay');
  assert.strictEqual(player.currentTime(), 500, 'currentTime value is the one passed after initialization');
});

QUnit.test('Should accept multiple calls to currentTime after player initialization and apply the last value as soon the canplay event is fired', function(assert) {
  const player = TestHelpers.makePlayer({});
  const spyInitTime = sinon.spy(player, 'applyInitTime_');
  const spyCurrentTime = sinon.spy(player, 'currentTime');

  player.src('xyz.mp4');
  player.currentTime(500);
  player.currentTime(600);
  player.currentTime(700);
  player.currentTime(800);
  this.clock.tick(100);
  player.trigger('canplay');
  assert.equal(spyInitTime.callCount, 1, 'After multiple calls to currentTime just apply the last one');
  assert.ok(spyCurrentTime.calledAfter(spyInitTime), 'currentTime was called on canplay event listener');
  assert.equal(player.currentTime(), 800, 'The last value passed is stored as the currentTime value');
});

QUnit.test('Should be able to set the cache currentTime after player initialization as soon the canplay event is fired', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.src('xyz.mp4');
  player.currentTime(500);

  assert.strictEqual(player.getCache().currentTime, 0, 'cache currentTime value was not changed');

  this.clock.tick(100);
  player.trigger('canplay');

  assert.strictEqual(player.getCache().currentTime, 500, 'cache currentTime value is the one passed after initialization');
});

QUnit.test('Should fire debugon event when debug mode is enabled', function(assert) {
  const player = TestHelpers.makePlayer({});
  const debugOnSpy = sinon.spy();

  player.on('debugon', debugOnSpy);
  player.debug(true);

  assert.ok(debugOnSpy.calledOnce, 'debugon event was fired');
  player.dispose();
});

QUnit.test('Should fire debugoff event when debug mode is disabled', function(assert) {
  const player = TestHelpers.makePlayer({});
  const debugOffSpy = sinon.spy();

  player.on('debugoff', debugOffSpy);
  player.debug(false);

  assert.ok(debugOffSpy.calledOnce, 'debugoff event was fired');
  player.dispose();
});

QUnit.test('Should enable debug mode and store log level when calling options', function(assert) {
  const player = TestHelpers.makePlayer({debug: true});

  assert.ok(player.previousLogLevel_, 'debug', 'previous log level is stored when enabling debug');
  player.dispose();
});

QUnit.test('Should restore previous log level when disabling debug mode', function(assert) {
  const player = TestHelpers.makePlayer();

  player.log.level('error');
  player.debug(true);
  assert.ok(player.log.level(), 'debug', 'log level is debug when debug is enabled');

  player.debug(false);
  assert.ok(player.log.level(), 'error', 'previous log level was restored');
  player.dispose();
});

QUnit.test('Should return if debug is enabled or disabled', function(assert) {
  const player = TestHelpers.makePlayer();

  player.debug(true);
  const enabled = player.debug();

  assert.ok(enabled);

  player.debug(false);
  const disabled = player.debug();

  assert.notOk(disabled);
  player.dispose();
});

const testOrSkip = 'pictureInPictureEnabled' in document ? 'test' : 'skip';

QUnit[testOrSkip]('Should only allow requestPictureInPicture if the tech supports it', function(assert) {
  const player = TestHelpers.makePlayer({});
  let count = 0;

  player.tech_.el_ = {
    disablePictureInPicture: false,
    requestPictureInPicture() {
      count++;
    }
  };

  player.tech_.requestPictureInPicture = function() {
    return player.tech_.el_.requestPictureInPicture();
  };
  player.tech_.disablePictureInPicture = function() {
    return this.el_.disablePictureInPicture;
  };

  player.requestPictureInPicture();
  assert.equal(count, 1, 'requestPictureInPicture passed through to supporting tech');

  player.tech_.el_.disablePictureInPicture = true;
  player.requestPictureInPicture().catch(_ => {});
  assert.equal(count, 1, 'requestPictureInPicture not passed through when disabled on tech');

  delete player.tech_.el_.disablePictureInPicture;
  player.requestPictureInPicture().catch(_ => {});
  assert.equal(count, 1, 'requestPictureInPicture not passed through when tech does not support');
});

QUnit.test('document pictureinpicture is opt-in', function(assert) {
  const done = assert.async();
  const player = TestHelpers.makePlayer({
    disablePictureInPicture: true
  });

  const testPiPObj = {};

  if (!window.documentPictureInPicture) {
    window.documentPictureInPicture = testPiPObj;
  }

  player.requestPictureInPicture().catch(e => {
    assert.equal(e, 'No PiP mode is available', 'docPiP not used when not enabled');
  }).then(_ => {
    if (window.documentPictureInPicture === testPiPObj) {
      delete window.documentPictureInPicture;
    }
    done();
  });

});

QUnit.test('docPiP is used in preference to winPiP', function(assert) {
  assert.expect(2);

  const done = assert.async();
  const player = TestHelpers.makePlayer({
    enableDocumentPictureInPicture: true
  });
  let count = 0;

  player.tech_.el_ = {
    disablePictureInPicture: false,
    requestPictureInPicture() {
      count++;
    }
  };

  const testPiPObj = {
    requestWindow() {
      return Promise.resolve({});
    }
  };

  if (!window.documentPictureInPicture) {
    window.documentPictureInPicture = testPiPObj;
  }

  // Test isn't concerned with whether the browser allows the request,
  player.requestPictureInPicture().then(_ => {
    assert.ok(true, 'docPiP was called');
  }).catch(_ => {
    assert.ok(true, 'docPiP was called');
  }).then(_ => {
    assert.equal(0, count, 'requestPictureInPicture not passed to tech');
    if (window.documentPictureInPicture === testPiPObj) {
      delete window.documentPictureInPicture;
    }
    done();
  });
});

QUnit.test('docPiP moves player and triggers events', function(assert) {
  const done = assert.async();
  const player = TestHelpers.makePlayer({
    enableDocumentPictureInPicture: true
  });
  const playerParent = player.el().parentElement;

  player.videoHeight = () => 9;
  player.videoWidth = () => 16;

  const counts = {
    enterpictureinpicture: 0,
    leavepictureinpicture: 0
  };

  player.on(Object.keys(counts), function(e) {
    counts[e.type]++;
  });

  const fakePiPWindow = document.createElement('div');

  fakePiPWindow.document = {
    head: document.createElement('div'),
    body: document.createElement('div')
  };
  fakePiPWindow.querySelector = function(sel) {
    return fakePiPWindow.document.body.querySelector(sel);
  };
  fakePiPWindow.close = function() {
    fakePiPWindow.dispatchEvent(new Event('pagehide'));
    delete window.documentPictureInPicture.window;
  };

  const testPiPObj = {
    requestWindow() {
      window.documentPictureInPicture.window = fakePiPWindow;
      return Promise.resolve(fakePiPWindow);
    }
  };

  if (!window.documentPictureInPicture) {
    window.documentPictureInPicture = testPiPObj;
  }

  player.requestPictureInPicture().then(win => {
    assert.ok(player.el().parentElement === win.document.body, 'player el was moved');
    assert.ok(playerParent.querySelector('.vjs-pip-container'), 'placeholder el was added');
    assert.ok(player.isInPictureInPicture(), 'player is in pip state');
    assert.equal(counts.enterpictureinpicture, 1, '`enterpictureinpicture` triggered');

    player.exitPictureInPicture().then(_ => {
      assert.ok(player.el().parentElement === playerParent, 'player el was restored');
      assert.notOk(playerParent.querySelector('.vjs-pip-container'), 'placeholder el was removed');
      assert.notOk(player.isInPictureInPicture(), 'player is not in pip state');
      assert.equal(counts.leavepictureinpicture, 1, '`leavepictureinpicture` triggered');

      if (window.documentPictureInPicture === testPiPObj) {
        delete window.documentPictureInPicture;
      }
      done();
    });
  }).catch(e => {
    if (e === 'No PiP mode is available') {
      assert.ok(true, 'Test skipped because PiP not available');
    } else if (e.name && e.name === 'NotAllowedError') {
      assert.ok(true, 'Test skipped because PiP not allowed');
    } else {
      assert.notOk(true, 'An unexpected error occurred');
    }
    if (window.documentPictureInPicture === testPiPObj) {
      delete window.documentPictureInPicture;
    }
    done();
  });
});

QUnit.test('playbackRates should trigger a playbackrateschange event', function(assert) {
  const player = TestHelpers.makePlayer({});
  const rates = [];
  let rateschangeCount = 0;

  player.on('playbackrateschange', function() {
    rates.push(player.playbackRates());
    rateschangeCount++;
  });

  player.playbackRates([1, 2, 3]);
  player.playbackRates([]);
  player.playbackRates([1, 4]);

  assert.equal(rateschangeCount, 3, 'we got 3 playbackrateschange events');
  assert.deepEqual(rates[0], [1, 2, 3], 'first rates is 1,2,3');
  assert.deepEqual(rates[1], [], 'second rates is empty');
  assert.deepEqual(rates[2], [1, 4], 'third rates is 1,4');

  player.dispose();
});

QUnit.test('playbackRates only accepts arrays of numbers', function(assert) {
  const player = TestHelpers.makePlayer();
  let rateschangeCount = 0;

  player.on('playbackrateschange', function() {
    rateschangeCount++;
  });

  player.playbackRates([1, 2, 3]);
  assert.equal(rateschangeCount, 1, 'we got a playbackrateschange event');

  player.playbackRates('hello');
  assert.equal(rateschangeCount, 1, 'we did not get a playbackrateschange event');

  player.playbackRates([1, 4]);
  assert.equal(rateschangeCount, 2, 'we got a playbackrateschange event');

  player.playbackRates(5);
  assert.equal(rateschangeCount, 2, 'we did not get a playbackrateschange event');

  player.playbackRates(['hello', '2', 'why?']);
  assert.equal(rateschangeCount, 2, 'we did not get a playbackrateschange event');

  player.dispose();
});

QUnit.test('audioOnlyMode can be set by option', function(assert) {
  assert.expect(3);

  const done = assert.async();
  const player = TestHelpers.makePlayer({audioOnlyMode: true});

  player.trigger('ready');
  player.one('audioonlymodechange', () => {
    assert.equal(player.audioOnlyMode(), true, 'asynchronously set via option');
    assert.equal(player.hasClass('vjs-audio-only-mode'), true, 'class added asynchronously');
    done();
  });
  assert.equal(player.hasClass('vjs-audio-only-mode'), false, 'initially does not have class');
});

QUnit.test('audioOnlyMode(true) returns Promise when promises are supported', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');
  const returnValTrue = player.audioOnlyMode(true);

  if (window.Promise) {
    assert.ok(returnValTrue instanceof window.Promise, 'audioOnlyMode(true) returns Promise when supported');
  }
});

QUnit.test('audioOnlyMode(false) returns Promise when promises are supported', function(assert) {
  const done = assert.async();
  const player = TestHelpers.makePlayer({audioOnlyMode: true});

  player.trigger('ready');
  player.one('audioonlymodechange', () => {
    const returnValFalse = player.audioOnlyMode(false);

    if (window.Promise) {
      assert.ok(returnValFalse instanceof window.Promise, 'audioOnlyMode(false) returns Promise when supported');
      done();
    }
  });
});

QUnit.test('audioOnlyMode() getter returns Boolean', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');
  assert.ok(typeof player.audioOnlyMode() === 'boolean', 'getter correctly returns boolean');
});

QUnit.test('audioOnlyMode() gets the correct audioOnlyMode state', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');
  assert.equal(player.audioOnlyMode(), false, 'defaults to false');

  return player.audioOnlyMode(true)
    .then(() => assert.equal(player.audioOnlyMode(), true, 'returns updated state after enabled'))
    .then(() => player.audioOnlyMode(false))
    .then(() => assert.equal(player.audioOnlyMode(), false, 'returns updated state after disabled'))
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('audioOnlyMode(true/false) adds or removes vjs-audio-only-mode class to player', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.trigger('ready');
  assert.equal(player.hasClass('vjs-audio-only-mode'), false, 'class not initially present');

  return player.audioOnlyMode(true)
    .then(() => assert.equal(player.hasClass('vjs-audio-only-mode'), true, 'class was added'))
    .then(() => player.audioOnlyMode(false))
    .then(() => assert.equal(player.hasClass('vjs-audio-only-mode'), false, 'class was removed'))
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('setting audioOnlyMode() triggers audioonlymodechange event', function(assert) {
  const player = TestHelpers.makePlayer({});
  let audioOnlyModeState = false;
  let audioOnlyModeChangeEvents = 0;

  player.trigger('ready');
  player.on('audioonlymodechange', () => {
    audioOnlyModeChangeEvents++;
    audioOnlyModeState = player.audioOnlyMode();
  });

  return player.audioOnlyMode(true)
    .then(() => {
      assert.equal(audioOnlyModeState, true, 'state is correct');
      assert.equal(audioOnlyModeChangeEvents, 1, 'event fired once');
    })
    .then(() => player.audioOnlyMode(false))
    .then(() => {
      assert.equal(audioOnlyModeState, false, 'state is correct');
      assert.equal(audioOnlyModeChangeEvents, 2, 'event fired again');
    })
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('audioOnlyMode(true/false) changes player height', function(assert) {
  const player = TestHelpers.makePlayer({controls: true, height: 600});

  player.trigger('ready');
  player.hasStarted(true);

  const controlBarHeight = player.getChild('ControlBar').currentHeight();
  const playerHeight = player.currentHeight();

  assert.notEqual(playerHeight, controlBarHeight, 'heights are not the same');
  assert.equal(player.currentHeight(), playerHeight, 'player initial height is correct');

  return player.audioOnlyMode(true)
    .then(() => assert.equal(player.currentHeight(), controlBarHeight, 'player height set to height of control bar in audioOnlyMode'))
    .then(() => player.audioOnlyMode(false))
    .then(() => assert.equal(player.currentHeight(), playerHeight, 'player reset to original height when disabling audioOnlyMode'))
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('audioOnlyMode(true/false) hides/shows player components except control bar', function(assert) {
  const player = TestHelpers.makePlayer({controls: true});

  player.trigger('ready');
  player.hasStarted(true);

  assert.equal(TestHelpers.getComputedStyle(player.getChild('TextTrackDisplay').el_, 'display'), 'block', 'TextTrackDisplay is initially visible');
  assert.equal(TestHelpers.getComputedStyle(player.tech(true).el_, 'display'), 'block', 'Tech is initially visible');
  assert.equal(TestHelpers.getComputedStyle(player.getChild('ControlBar').el_, 'display'), 'flex', 'ControlBar is initially visible');

  return player.audioOnlyMode(true)
    .then(() => {
      assert.equal(TestHelpers.getComputedStyle(player.getChild('TextTrackDisplay').el_, 'display'), 'none', 'TextTrackDisplay is hidden');
      assert.equal(TestHelpers.getComputedStyle(player.tech(true).el_, 'display'), 'none', 'Tech is hidden');
      assert.equal(TestHelpers.getComputedStyle(player.getChild('ControlBar').el_, 'display'), 'flex', 'ControlBar is still visible');

      // Sanity check that all non-ControlBar player children are hidden
      player.children().forEach(child => {
        const el = child.el_;

        if (el) {
          if (child.name_ !== 'ControlBar') {
            assert.equal(TestHelpers.getComputedStyle(child.el_, 'display') === 'none', true, 'non-controlBar component is hidden');
          }
        }
      });
    })
    .then(() => player.audioOnlyMode(false))
    .then(() => {
      assert.equal(TestHelpers.getComputedStyle(player.getChild('TextTrackDisplay').el_, 'display'), 'block', 'TextTrackDisplay is visible again');
      assert.equal(TestHelpers.getComputedStyle(player.tech(true).el_, 'display'), 'block', 'Tech is visible again');
      assert.equal(TestHelpers.getComputedStyle(player.getChild('ControlBar').el_, 'display'), 'flex', 'ControlBar is still visible');
    })
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('audioOnlyMode(true/false) hides/shows video-specific control bar components', function(assert) {
  const tracks = ['captions', 'subtitles', 'descriptions', 'chapters'].map(kind => {
    return {
      kind,
      label: 'English'
    };
  });
  const player = TestHelpers.makePlayer({controls: true, tracks, playbackRates: [1, 2]});

  this.clock.tick(1000);

  const controlBar = player.getChild('ControlBar');
  const childrenShownInAudioOnlyMode = [
    'PlayToggle',
    'VolumePanel',
    'ProgressControl',
    'PlaybackRateMenuButton',
    'ChaptersButton',
    'RemainingTimeDisplay'
  ];
  const childrenHiddenInAudioOnlyMode = [
    'CaptionsButton',
    'DescriptionsButton',
    'FullscreenToggle',
    'PictureInPictureToggle',
    'SubsCapsButton'
  ];

  const allChildren = childrenShownInAudioOnlyMode.concat(childrenHiddenInAudioOnlyMode);

  const chapters = player.textTracks()[3];

  chapters.addCue({
    startTime: 0,
    endTime: 2,
    text: 'Chapter 1'
  });
  chapters.addCue({
    startTime: 2,
    endTime: 4,
    text: 'Chapter 2'
  });

  // ChaptersButton only shows once cues added and update() called
  controlBar.getChild('ChaptersButton').update();

  player.trigger('ready');
  player.trigger('loadedmetadata');
  player.hasStarted(true);

  // Show all control bar children
  allChildren.forEach(child => {
    const el = controlBar.getChild(child) && controlBar.getChild(child).el_;

    if (el) {
      if (!document.exitPictureInPicture && child === 'PictureInPictureToggle') {
        assert.equal(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is not visible if PiP is not supported`);
      } else {
        // Sanity check that component is showing
        assert.notEqual(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is initially visible`);
      }
    }
  });

  return player.audioOnlyMode(true)
    .then(() => {
      childrenHiddenInAudioOnlyMode.forEach(child => {
        const el = controlBar.getChild(child) && controlBar.getChild(child).el_;

        if (el) {
          assert.equal(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is hidden`);
        }
      });

      childrenShownInAudioOnlyMode.forEach(child => {
        const el = controlBar.getChild(child) && controlBar.getChild(child).el_;

        if (el) {
          assert.notEqual(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is still shown`);
        }
      });
    })
    .then(() => player.audioOnlyMode(false))
    .then(() => {
      // Check that all are showing again
      allChildren.concat(childrenHiddenInAudioOnlyMode).forEach(child => {
        const el = controlBar.getChild(child) && controlBar.getChild(child).el_;

        if (el) {
          if (!document.exitPictureInPicture && child === 'PictureInPictureToggle') {
            assert.equal(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is not visible if PiP is not supported`);
          } else {
            assert.notEqual(TestHelpers.getComputedStyle(el, 'display'), 'none', `${child} is shown`);
          }
        }
      });
    })
    .catch(() => assert.ok(false, 'test error'));
});

QUnit.test('setting both audioOnlyMode and audioPosterMode options to true will only turn audioOnlyMode', function(assert) {
  const player = TestHelpers.makePlayer({audioOnlyMode: true, audioPosterMode: true});
  const done = assert.async();

  player.trigger('ready');

  player.one('audioonlymodechange', () => {
    assert.ok(player.audioOnlyMode(), 'audioOnlyMode is true');
    assert.notOk(player.audioPosterMode(), 'audioPosterMode is false');
    done();
  });
});

QUnit.test('turning on audioOnlyMode when audioPosterMode is already on will turn off audioPosterMode', function(assert) {
  const player = TestHelpers.makePlayer({audioPosterMode: true});

  player.trigger('ready');
  assert.ok(player.audioPosterMode(), 'audioPosterMode is true');
  return player.audioOnlyMode(true)
    .then(() => {
      assert.notOk(player.audioPosterMode(), 'audioPosterMode is false');
      assert.ok(player.audioOnlyMode(), 'audioOnlyMode is true');
    });
});

QUnit.test('turning on audioPosterMode when audioOnlyMode is already on will turn off audioOnlyMode', function(assert) {
  const player = TestHelpers.makePlayer({audioOnlyMode: true});

  player.trigger('ready');
  assert.ok(player.audioOnlyMode(), 'audioOnlyMode is true');
  return player.audioPosterMode(true)
    .then(() => {
      assert.ok(player.audioPosterMode(), 'audioPosterMode is true');
      assert.notOk(player.audioOnlyMode(), 'audioOnlyMode is false');
    });
});

QUnit.test('player height should match control bar height when audioOnlyMode is enabled', function(assert) {
  const player = TestHelpers.makePlayer({ responsive: true, width: 320, height: 240 });

  player.trigger('ready');

  player.audioOnlyMode(true).then(() => {
    const initialPlayerHeight = player.currentHeight();

    player.width(768);
    player.el().style.fontSize = '20px';
    player.trigger('playerresize');

    assert.ok(initialPlayerHeight !== player.currentHeight(), 'player height is updated');
  })
    .then(() => player.audioOnlyMode(false))
    .then(() => {
      const initialPlayerHeight = player.currentHeight();

      player.width(768);
      player.el().style.fontSize = '20px';
      player.trigger('playerresize');

      assert.equal(player.currentHeight(), initialPlayerHeight, 'player height remains unchanged');
      assert.ok(initialPlayerHeight !== player.controlBar.currentHeight(), 'player height is different from control bar height');
    });
});

QUnit.test('player#load resets the media element to its initial state', function(assert) {
  const player = TestHelpers.makePlayer({});

  player.src({ src: 'http://vjs.zencdn.net/v/oceans2.mp4', type: 'video/mp4' });

  // Declaring spies here avoids spying on previous calls
  const techGet_ = sinon.spy(player, 'techCall_');
  const src = sinon.spy(player, 'src');

  player.load();

  // Case when the VHS tech is not used
  assert.ok(techGet_.calledOnce, 'techCall_ was called once');
  assert.ok(src.notCalled, 'src was not called');

  // Simulate the VHS tech
  player.tech_.vhs = true;
  player.load();

  // Case when the VHS tech is used
  assert.ok(techGet_.calledOnce, 'techCall_ remains the same');
  assert.ok(src.calledOnce, 'src was called');

  techGet_.restore();
  src.restore();
  player.dispose();
});

QUnit.test('crossOrigin value should be maintained after loadMedia is called', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const example1 = '<video id="example_1" class="video-js" preload="none"></video>';
  const example2 = '<video id="example_2" class="video-js" preload="none"></video>';
  const example3 = '<video id="example_3" class="video-js" crossorigin="anonymous" preload="none"></video>';

  fixture.innerHTML += example1;
  fixture.innerHTML += example2;
  fixture.innerHTML += example3;

  const tagExample1 = document.getElementById('example_1');
  const tagExample2 = document.getElementById('example_2');
  const tagExample3 = document.getElementById('example_3');
  const playerExample1 = TestHelpers.makePlayer({techOrder: ['Html5']}, tagExample1);
  const playerExample2 = TestHelpers.makePlayer({techOrder: ['Html5'], crossOrigin: 'use-credentials'}, tagExample2);
  const playerExample3 = TestHelpers.makePlayer({techOrder: ['Html5']}, tagExample3);

  this.clock.tick(1000);

  playerExample1.crossOrigin('anonymous');
  playerExample1.loadMedia({
    src: 'foo.mp4'
  });
  playerExample2.loadMedia({
    src: 'foo.mp4'
  });
  playerExample3.loadMedia({
    src: 'foo.mp4'
  });

  assert.strictEqual(playerExample1.crossOrigin(), 'anonymous', 'crossOrigin value remains correct when assigned by the crossOrigin method and loadMedia is called');
  assert.ok(tagExample1.crossOrigin === 'anonymous');

  assert.strictEqual(playerExample2.crossOrigin(), 'use-credentials', 'crossOrigin value remains correct when passed through the options and loadMedia is called');
  assert.ok(tagExample2.crossOrigin === 'use-credentials');

  assert.strictEqual(playerExample3.crossOrigin(), 'anonymous', 'crossOrigin value remains correct when passed via the html property and loadMedia is called');
  assert.ok(tagExample3.crossOrigin === 'anonymous');

  playerExample1.dispose();
  playerExample2.dispose();
  playerExample3.dispose();
});

QUnit.test('should not reset the error when the tech triggers an error that is null', function(assert) {
  sinon.stub(log, 'error');

  const player = TestHelpers.makePlayer();

  player.src({
    src: 'http://example.com/movie.unsupported-format',
    type: 'video/unsupported-format'
  });

  this.clock.tick(60);

  // Simulates Chromium's behavior when the poster is invalid

  // is only there for context, but does nothing
  player.poster('invalid');

  const spyError = sinon.spy(player, 'error');
  // Chromium behavior produced by the video element
  const errorStub = sinon.stub(player.tech(true), 'error').callsFake(() => null);

  player.tech(true).trigger('error');
  // End

  assert.ok(player.hasClass('vjs-error'), 'player has vjs-error class');
  assert.ok(spyError.notCalled, 'error was not called');
  assert.ok(player.error(), 'error is retained');

  player.dispose();
  spyError.restore();
  errorStub.restore();
  log.error.restore();
});

QUnit.test('smooth seeking set to false should not update the display time components or the seek bar', function(assert) {
  const player = TestHelpers.makePlayer({});
  const {
    currentTimeDisplay,
    remainingTimeDisplay,
    progressControl: {
      seekBar
    }
  } = player.controlBar;
  const currentTimeDisplayUpdateContent = sinon.spy(currentTimeDisplay, 'updateContent');
  const remainingTimeDisplayUpdateContent = sinon.spy(remainingTimeDisplay, 'updateContent');
  const seekBarUpdate = sinon.spy(seekBar, 'update');

  assert.false(player.options().enableSmoothSeeking, 'enableSmoothSeeking is false by default');

  player.trigger('seeking');

  assert.ok(currentTimeDisplayUpdateContent.notCalled, 'currentTimeDisplay updateContent was not called');
  assert.ok(remainingTimeDisplayUpdateContent.notCalled, 'remainingTimeDisplay updateContent was not called');

  seekBar.trigger('mousedown');
  seekBar.trigger('mousemove');

  assert.ok(seekBarUpdate.notCalled, 'seekBar update was not called');

  currentTimeDisplayUpdateContent.restore();
  remainingTimeDisplayUpdateContent.restore();
  seekBarUpdate.restore();
  player.dispose();
});

QUnit.test('smooth seeking set to true should update the display time components and the seek bar', function(assert) {
  const player = TestHelpers.makePlayer({enableSmoothSeeking: true});
  const {
    currentTimeDisplay,
    remainingTimeDisplay,
    progressControl: {
      seekBar
    }
  } = player.controlBar;
  const currentTimeDisplayUpdateContent = sinon.spy(currentTimeDisplay, 'updateContent');
  const remainingTimeDisplayUpdateContent = sinon.spy(remainingTimeDisplay, 'updateContent');
  const seekBarUpdate = sinon.spy(seekBar, 'update');

  assert.true(player.options().enableSmoothSeeking, 'enableSmoothSeeking is true');

  player.duration(1);
  player.trigger('seeking');

  assert.ok(currentTimeDisplayUpdateContent.called, 'currentTimeDisplay updateContent was called');
  assert.ok(remainingTimeDisplayUpdateContent.called, 'remainingTimeDisplay updateContent was called');

  seekBar.trigger('mousedown');
  seekBar.trigger('mousemove');

  assert.ok(seekBarUpdate.called, 'seekBar update was called');

  currentTimeDisplayUpdateContent.restore();
  remainingTimeDisplayUpdateContent.restore();
  seekBarUpdate.restore();
  player.dispose();
});

QUnit.test('mouseTimeDisplay should be added as child when disableSeekWhileScrubbingOnMobile is true on mobile', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: true });
  const seekBar = player.controlBar.progressControl.seekBar;
  const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');

  assert.ok(mouseTimeDisplay, 'mouseTimeDisplay added as a child');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('mouseTimeDisplay should not be added as child on mobile when disableSeekWhileScrubbingOnMobile is false', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: false });
  const seekBar = player.controlBar.progressControl.seekBar;
  const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');

  assert.notOk(mouseTimeDisplay, 'mouseTimeDisplay not added as a child');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('Seeking should occur while scrubbing on mobile when disableSeekWhileScrubbingOnMobile is false', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: false });
  const seekBar = player.controlBar.progressControl.seekBar;
  const userSeekSpy = sinon.spy(seekBar, 'userSeek_');

  // Simulate a source loaded
  player.duration(10);

  // Simulate scrub
  seekBar.handleMouseMove({ pageX: 200 });

  assert.ok(userSeekSpy.calledOnce, 'Seek initiated while scrubbing');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('Seeking should not occur while scrubbing on mobile when disableSeekWhileScrubbingOnMobile is true', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: true });
  const seekBar = player.controlBar.progressControl.seekBar;
  const userSeekSpy = sinon.spy(seekBar, 'userSeek_');

  // Simulate a source loaded
  player.duration(10);

  // Simulate scrub
  seekBar.handleMouseMove({ pageX: 200 });

  assert.ok(userSeekSpy.notCalled, 'Seek not initiated while scrubbing');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('Seek should occur when scrubbing completes on mobile when disableSeekWhileScrubbingOnMobile is true', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: true });
  const seekBar = player.controlBar.progressControl.seekBar;
  const userSeekSpy = sinon.spy(seekBar, 'userSeek_');
  const targetSeekTime = 5;

  // Simulate a source loaded
  player.duration(10);

  seekBar.pendingSeekTime(targetSeekTime);

  // Simulate scrubbing completion
  seekBar.handleMouseUp();

  assert.ok(userSeekSpy.calledWith(targetSeekTime), 'Seeks to correct location when scrubbing completes');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('Player should pause while scrubbing on mobile when disableSeekWhileScrubbingOnMobile is false', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: false });
  const seekBar = player.controlBar.progressControl.seekBar;
  const pauseSpy = sinon.spy(player, 'pause');

  // Simulate start playing
  player.play();

  const mockMouseDownEvent = {
    pageX: 200,
    stopPropagation: () => {}
  };

  // Simulate scrubbing start
  seekBar.handleMouseDown(mockMouseDownEvent);

  assert.ok(pauseSpy.calledOnce, 'Player paused');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('Player should not pause while scrubbing on mobile when disableSeekWhileScrubbingOnMobile is true', function(assert) {
  const originalIsIos = browser.IS_IOS;

  browser.stub_IS_IOS(true);

  const player = TestHelpers.makePlayer({ disableSeekWhileScrubbingOnMobile: true });
  const seekBar = player.controlBar.progressControl.seekBar;
  const pauseSpy = sinon.spy(player, 'pause');

  // Simulate start playing
  player.play();

  const mockMouseDownEvent = {
    pageX: 200,
    stopPropagation: () => { }
  };

  // Simulate scrubbing start
  seekBar.handleMouseDown(mockMouseDownEvent);

  assert.ok(pauseSpy.notCalled, 'Player not paused');

  player.dispose();
  browser.stub_IS_IOS(originalIsIos);
});

QUnit.test('addSourceElement calls tech method with correct args', function(assert) {
  const player = TestHelpers.makePlayer();
  const addSourceElementSpy = sinon.spy(player.tech_, 'addSourceElement');
  const srcUrl = 'http://example.com/video.mp4';
  const mimeType = 'video/mp4';

  player.addSourceElement(srcUrl, mimeType);

  assert.ok(addSourceElementSpy.calledOnce, 'addSourceElement method called');
  assert.ok(addSourceElementSpy.calledWith(srcUrl, mimeType), 'addSourceElement called with correct arguments');

  addSourceElementSpy.restore();
  player.dispose();
});

QUnit.test('addSourceElement returns false if no tech', function(assert) {
  const player = TestHelpers.makePlayer();
  const srcUrl = 'http://example.com/video.mp4';
  const mimeType = 'video/mp4';

  player.tech_ = undefined;

  const added = player.addSourceElement(srcUrl, mimeType);

  assert.notOk(added, 'Returned false');
  player.dispose();
});

QUnit.test('removeSourceElement calls tech method with correct args', function(assert) {
  const player = TestHelpers.makePlayer();
  const removeSourceElementSpy = sinon.spy(player.tech_, 'removeSourceElement');
  const srcUrl = 'http://example.com/video.mp4';

  player.removeSourceElement(srcUrl);

  assert.ok(removeSourceElementSpy.calledOnce, 'removeSourceElement method called');
  assert.ok(removeSourceElementSpy.calledWith(srcUrl), 'removeSourceElement called with correct arguments');

  removeSourceElementSpy.restore();
  player.dispose();
});

QUnit.test('removeSourceElement returns false if no tech', function(assert) {
  const player = TestHelpers.makePlayer();
  const srcUrl = 'http://example.com/video.mp4';
  const mimeType = 'video/mp4';

  player.tech_ = undefined;

  const removed = player.removeSourceElement(srcUrl, mimeType);

  assert.notOk(removed, 'Returned false');
  player.dispose();
});

QUnit.module('SmartTV Seek Logic', function(hooks) {
  let player;
  let seekBar;

  hooks.beforeEach(function() {
    player = TestHelpers.makePlayer({
      disableSeekWhileScrubbingOnSTV: true,
      controlBar: {
        progressControl: {
          seekBar: {
            stepSeconds: 5
          }
        }
      }
    });

    seekBar = player.controlBar.progressControl.seekBar;
    player.duration(100);
  });

  hooks.afterEach(function() {
    player.dispose();
  });

  QUnit.test('Step forward updates pendingSeekTime but does not seek immediately', function(assert) {
    player.currentTime(40);
    seekBar.stepForward();

    assert.equal(
      seekBar.pendingSeekTime(),
      45,
      'pendingSeekTime should be 45 (40 + 5) after stepForward'
    );

    assert.equal(
      player.currentTime(),
      40,
      'Player currentTime remains unchanged (no immediate seek)'
    );
  });

  QUnit.test('Step back updates pendingSeekTime but does not seek immediately', function(assert) {
    player.currentTime(40);
    seekBar.stepBack();

    assert.equal(
      seekBar.pendingSeekTime(),
      35,
      'pendingSeekTime should be 35 (40 - 5) after stepBack'
    );

    assert.equal(
      player.currentTime(),
      40,
      'Player currentTime remains unchanged (no immediate seek)'
    );
  });

  QUnit.test('Pressing Enter seeks to pendingSeekTime and resets it', function(assert) {
    seekBar.pendingSeekTime(50);

    const userSeekSpy = sinon.spy(seekBar, 'userSeek_');

    seekBar.handleAction();

    assert.ok(
      userSeekSpy.calledWith(50),
      'Pressing Enter should trigger seek to pendingSeekTime (50)'
    );

    assert.equal(
      seekBar.pendingSeekTime(),
      null,
      'pendingSeekTime should be reset to null after seeking'
    );

    assert.equal(
      player.currentTime(),
      50,
      'Player currentTime should be updated to 50 after pressing Enter'
    );
  });

  QUnit.test('Step forward/back seeks immediately when disableSeekWhileScrubbingOnSTV is false', function(assert) {
    player.options_.disableSeekWhileScrubbingOnSTV = false;
    seekBar = new SeekBar(player);
    player.currentTime(40);

    seekBar.stepForward();

    assert.equal(
      player.currentTime(),
      45,
      'Player currentTime should update immediately when stepping forward'
    );

    seekBar.stepBack();

    assert.equal(
      player.currentTime(),
      40,
      'Player currentTime should update immediately when stepping back'
    );
  });
});
