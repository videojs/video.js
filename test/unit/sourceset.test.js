/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import window from 'global/window';
import log from '../../src/js/utils/log.js';
import sinon from 'sinon';
import {getAbsoluteURL} from '../../src/js/utils/url.js';

const Html5 = videojs.getTech('Html5');
const wait = 1;
let qunitFn = 'module';
const testSrc = {src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4'};
const sourceOne = {src: 'http://example.com/one.mp4', type: 'video/mp4'};
const sourceTwo = {src: 'http://example.com/two.mp4', type: 'video/mp4'};
const sourceThree = {src: 'http://example.com/three.mp4', type: 'video/mp4'};
const flashSrc = {src: 'http://example.com/oceans.flv', type: 'video/flv'};

if (!Html5.canOverrideAttributes()) {
  qunitFn = 'skip';
}

const oldMovingMedia = Html5.prototype.movingMediaElementInDOM;
const validateSource = function(player, expectedSources, event, srcOverrides = {}) {
  if (!Array.isArray(expectedSources)) {
    expectedSources = [expectedSources];
  }
  const assert = QUnit.assert;
  const tech = player.tech_;
  const mediaEl = tech.el();

  if (typeof srcOverrides.currentSource !== 'undefined') {
    assert.deepEqual(player.currentSource(), srcOverrides.currentSource, 'currentSource is correct');
  } else {
    assert.deepEqual(player.currentSource(), expectedSources[0], 'currentSource is correct');
  }

  if (typeof srcOverrides.src !== 'undefined') {
    assert.equal(player.src(), srcOverrides.src, 'src is correct');
  } else {
    assert.equal(player.src(), expectedSources[0].src, 'src is correct');
  }

  if (typeof srcOverrides.event !== 'undefined') {
    assert.equal(event.src, srcOverrides.event, 'event src is correct');
  } else {
    assert.equal(event.src, expectedSources[0].src, 'event src is correct');
  }

  const currentSources = player.currentSources();
  const expected = srcOverrides.currentSources || expectedSources;

  assert.equal(expected.length, currentSources.length, 'same number of sources');

  for (let i = 0; i < expected.length; i++) {
    assert.deepEqual(currentSources[i], expected[i], `currentSources ${i} is the same as we expect`);
  }

  let attrSrc = expectedSources[0].src;
  let techSrc = expectedSources[0].src;
  let elSrc = expectedSources[0].src;

  if (typeof srcOverrides.attr !== 'undefined') {
    attrSrc = srcOverrides.attr;
  }

  if (typeof srcOverrides.tech !== 'undefined') {
    techSrc = srcOverrides.tech;
  }

  if (typeof srcOverrides.el !== 'undefined') {
    elSrc = srcOverrides.el;
  }

  // if we expect a blank attr it will be null instead
  if (!attrSrc) {
    assert.notOk(mediaEl.getAttribute('src'), 'mediaEl attribute is correct');
  } else {
    assert.equal(mediaEl.getAttribute('src'), attrSrc, 'mediaEl attribute is correct');
  }

  // tech source is always absolute, but can be empty string
  // getAbsoluteURL would return the current url of the page for empty string
  // so we have to check
  if (!techSrc) {
    assert.equal(mediaEl.src, techSrc, 'mediaEl.src is correct');
  } else {
    assert.equal(tech.src(), getAbsoluteURL(techSrc), 'tech is correct');
  }

  // mediaEl.src source is always absolute, but can be empty string
  // getAbsoluteURL would return the current url of the page for empty string
  // so we have to check
  if (!elSrc) {
    assert.equal(mediaEl.src, elSrc, 'mediaEl.src is correct');
  } else {
    assert.equal(mediaEl.src, getAbsoluteURL(elSrc), 'mediaEl.src is correct');
  }
};

const setupEnv = function(env, testName) {

  videojs.players = {};
  env.fixture = document.getElementById('qunit-fixture');

  if (testName === 'change video el' || testName === 'change audio el') {
    Html5.prototype.movingMediaElementInDOM = false;
  }

  env.sourcesets = [];
  env.sourcesetHook = (player) => player.on('sourceset', (e) => env.sourcesets.push(e));
  videojs.hook('setup', env.sourcesetHook);

  if ((/video-js/i).test(testName)) {
    env.mediaEl = document.createElement('video-js');
  } else if ((/audio/i).test(testName)) {
    env.mediaEl = document.createElement('audio');
  } else {
    env.mediaEl = document.createElement('video');
  }

  env.elHook = (player) => player.ready(() => {
    env.mediaEl = player.tech_.el_;
  });

  videojs.hook('setup', env.elHook);
  env.testSrc = testSrc;
  env.sourceOne = sourceOne;
  env.sourceTwo = sourceTwo;
  env.sourceThree = sourceThree;

  env.mediaEl.className = 'video-js';
  env.fixture.appendChild(env.mediaEl);
};

const setupAfterEach = function(totalSourcesets) {
  return function(assert) {
    const done = assert.async();

    if (typeof this.totalSourcesets === 'undefined') {
      this.totalSourcesets = totalSourcesets;
    }

    window.setTimeout(() => {
      assert.equal(this.sourcesets.length, this.totalSourcesets, 'no additional sourcesets');

      this.player.dispose();
      assert.equal(this.sourcesets.length, this.totalSourcesets, 'no source set on dispose');

      videojs.removeHook('setup', this.elHook);
      videojs.removeHook('setup', this.sourcesetHook);

      Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
      log.error.restore();

      done();
    }, wait);
  };
};

const testTypes = ['video el', 'change video el', 'audio el', 'change audio el', 'video-js', 'change video el'];

QUnit[qunitFn]('sourceset', function(hooks) {
  QUnit.module('source before player', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach() {
        sinon.stub(log, 'error');

        setupEnv(this, testName);
      },
      afterEach: setupAfterEach(1)
    });

    QUnit.test('data-setup one source', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.testSrc]}));
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    // TODO: unskip when https://github.com/videojs/video.js/pull/4861 is merged
    QUnit.skip('data-setup preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.testSrc]}));
      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    QUnit.test('data-setup two sources', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.sourceOne, this.sourceTwo]}));
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [this.sourceOne, this.sourceTwo], e);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {sources: [this.testSrc]});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {sources: [this.sourceOne, this.sourceTwo]});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [this.sourceOne, this.sourceTwo], e);
        done();
      });
    });

    QUnit.test('player.src({...}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);
      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });

      this.player.src(this.testSrc);
    });

    // TODO: unskip when https://github.com/videojs/video.js/pull/4861 is merged
    QUnit.skip('player.src({...}) preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });

      this.player.src(this.testSrc);
    });

    QUnit.test('player.src({...}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [this.sourceOne, this.sourceTwo], e);
        done();
      });

      this.player.src([this.sourceOne, this.sourceTwo]);
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.mediaEl.src = this.testSrc.src;
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('src', this.testSrc.src);
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    QUnit.test('<source> one source', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = this.testSrc.src;
      this.source.type = this.testSrc.type;

      this.mediaEl.appendChild(this.source);

      this.player = videojs(this.mediaEl);
      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });
    });

    QUnit.test('<source> two sources', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = this.sourceOne.src;
      this.source.type = this.sourceOne.type;

      this.source2 = document.createElement('source');
      this.source2.src = this.sourceTwo.src;
      this.source2.type = this.sourceTwo.type;

      this.mediaEl.appendChild(this.source);
      this.mediaEl.appendChild(this.source2);

      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [this.sourceOne, this.sourceTwo], e);
        done();
      });
    });

    QUnit.test('no source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);

      this.totalSourcesets = 0;

      window.setTimeout(() => {
        assert.equal(this.sourcesets.length, 0, 'no sourceset');
        done();
      }, wait);
    });

    QUnit.test('relative sources are handled correctly', function(assert) {
      const done = assert.async();
      const one = {src: 'relative-one.mp4', type: 'video/mp4'};
      const two = {src: '../relative-two.mp4', type: 'video/mp4'};
      const three = {src: './relative-three.mp4?test=test', type: 'video/mp4'};

      const source = document.createElement('source');

      source.src = one.src;
      source.type = one.type;

      this.mediaEl.appendChild(source);
      this.player = videojs(this.mediaEl);

      // mediaEl changes on ready
      this.player.ready(() => {
        this.mediaEl = this.player.tech_.el();
      });

      this.totalSourcesets = 3;
      this.player.one('sourceset', (e) => {
        assert.ok(true, '** sourceset with relative source and <source> el');
        // mediaEl attr is relative
        validateSource(this.player, {src: getAbsoluteURL(one.src), type: one.type}, e, {attr: one.src});

        this.player.one('sourceset', (e2) => {
          assert.ok(true, '** sourceset with relative source and mediaEl.src');
          // mediaEl attr is relative
          validateSource(this.player, {src: getAbsoluteURL(two.src), type: two.type}, e2, {attr: two.src});

          // setAttribute makes the source absolute
          this.player.one('sourceset', (e3) => {
            assert.ok(true, '** sourceset with relative source and mediaEl.setAttribute');
            validateSource(this.player, three, e3);
            done();
          });

          this.mediaEl.setAttribute('src', three.src);
        });

        this.mediaEl.src = two.src;
      });

    });
  }));

  QUnit.module('source change', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach(assert) {
        sinon.stub(log, 'error');
        const done = assert.async();

        setupEnv(this, testName);

        this.mediaEl.src = this.testSrc.src;
        this.player = videojs(this.mediaEl);

        this.player.ready(() => {
          this.mediaEl = this.player.tech_.el();
        });

        // intial sourceset should happen on player.ready
        this.player.one('sourceset', (e) => {
          validateSource(this.player, this.testSrc, e);
          done();
        });
      },
      afterEach: setupAfterEach(3)
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });

        this.player.src(this.sourceTwo);
      });

      this.player.src(this.sourceOne);
    });

    QUnit.test('player.src({...}) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });
      });

      this.player.src(this.sourceOne);
      this.player.src(this.sourceTwo);
    });

    // player.src has a special case here because we are messing with
    // the source cache directly, so we test x3 to verify
    // that everything works
    QUnit.test('player.src({...}) x3 at the same time', function(assert) {
      const done = assert.async();

      // we have one more sourceset then other tests
      this.totalSourcesets = 4;

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);

          this.player.one('sourceset', (e3) => {
            validateSource(this.player, this.sourceThree, e3);
            done();
          });
        });
      });

      this.player.src(this.sourceOne);
      this.player.src(this.sourceTwo);
      this.player.src(this.sourceThree);
    });

    QUnit.test('mediaEl.src = ...', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });

        this.mediaEl.src = this.sourceTwo.src;
      });

      this.mediaEl.src = this.sourceOne.src;
    });

    QUnit.test('mediaEl.src = ... x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });
      });

      this.mediaEl.src = this.sourceOne.src;
      this.mediaEl.src = this.sourceTwo.src;
    });

    QUnit.test('mediaEl.setAttribute("src", ...)', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });

        this.mediaEl.setAttribute('src', this.sourceTwo.src);
      });

      this.mediaEl.setAttribute('src', this.sourceOne.src);
    });

    QUnit.test('mediaEl.setAttribute("src", ...) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, this.sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, this.sourceTwo, e2);
          done();
        });
      });

      this.mediaEl.setAttribute('src', this.sourceOne.src);
      this.mediaEl.setAttribute('src', this.sourceTwo.src);
    });

    QUnit.test('mediaEl.load() with a src attribute', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);

      this.totalSourcesets = 2;

      this.player.one('sourceset', (e) => {
        validateSource(this.player, this.testSrc, e);
        done();
      });

      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() no attribute', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.sourceOne.src;
      source.type = this.sourceOne.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      this.player.one('sourceset', (e1) => {
        // we know the source here since there is only one
        // source element, but the media element does not know it yet
        validateSource(this.player, sourceOne, e1, {tech: '', el: '', attr: ''});

        this.player.one('sourceset', (e2) => {
          // we know the source here since there is only one
          // source element
          validateSource(this.player, sourceTwo, e2, {tech: '', el: '', attr: ''});
          done();
        });

        source.src = this.sourceTwo.src;
        source.type = this.sourceTwo.type;

        this.mediaEl.load();
      });

      this.mediaEl.appendChild(source);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() no attribute, two <source>', function(assert) {
      const done = assert.async();

      this.totalSourcesets = 2;
      this.mediaEl.removeAttribute('src');

      const elOne = document.createElement('source');
      const elTwo = document.createElement('source');

      elOne.src = this.sourceOne.src;
      elOne.type = this.sourceOne.type;

      elTwo.src = this.sourceTwo.src;
      elTwo.type = this.sourceTwo.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      this.player.one('sourceset', (e1) => {
        // we know the source here since there is only one
        // source element, but the media element does not know it yet
        validateSource(this.player, {src: '', type: ''}, e1);

        // after loadstart we will have source set correctly
        this.player.tech_.src = () => this.sourceOne.src;
        this.player.trigger('loadstart');

        // validate that the caches have updated
        // el, and attr will not be up to date as this wasn't a real loadstart
        validateSource(this.player, [this.sourceOne, this.sourceTwo], e1, {event: '', el: '', attr: ''});
        done();
      });

      this.mediaEl.appendChild(elOne);
      this.mediaEl.appendChild(elTwo);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() no attribute, two duplicate <source>', function(assert) {
      const done = assert.async();

      this.totalSourcesets = 2;
      this.mediaEl.removeAttribute('src');

      const elOne = document.createElement('source');
      const elTwo = document.createElement('source');

      elOne.src = this.sourceOne.src;
      elOne.type = this.sourceOne.type;

      elTwo.src = this.sourceOne.src;
      elTwo.type = this.sourceOne.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      // since we only have one valid source, even though their are two elements
      // this should show the correct source
      this.player.one('sourceset', (e1) => {
        // validate that the caches have updated
        // el, and attr will not be up to date as this wasn't a real loadstart
        validateSource(this.player, [this.sourceOne, this.sourceOne], e1, {tech: '', el: '', attr: ''});
        done();
      });

      this.mediaEl.appendChild(elOne);
      this.mediaEl.appendChild(elTwo);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() no attribute x2 at the same time', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.sourceOne.src;
      source.type = this.sourceOne.type;

      this.player.one('sourceset', (e1) => {
        // we know the source here since there is only one
        // source element, but the media element does not know it yet
        validateSource(this.player, sourceOne, e1, {tech: '', el: '', attr: ''});

        this.player.one('sourceset', (e2) => {
          // we know the source here since there is only one
          // source element, but the media element does not know it yet
          validateSource(this.player, sourceTwo, e2, {tech: '', el: '', attr: ''});
          done();
        });
      });

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');
      this.mediaEl.appendChild(source);
      this.mediaEl.load();

      source.src = this.sourceTwo.src;
      source.type = this.sourceTwo.type;
      this.mediaEl.load();
    });

    QUnit.test('adding a <source> without load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.testSrc.src;
      source.type = this.testSrc.type;

      this.mediaEl.appendChild(source);

      this.totalSourcesets = 1;

      window.setTimeout(() => {
        assert.equal(this.sourcesets.length, 1, 'does not trigger sourceset');
        done();
      }, wait);
    });

    QUnit.test('changing a <source>s src without load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.testSrc.src;
      source.type = this.testSrc.type;

      this.mediaEl.appendChild(source);

      source.src = this.testSrc.src;

      this.totalSourcesets = 1;

      window.setTimeout(() => {
        assert.equal(this.sourcesets.length, 1, 'does not trigger sourceset');
        done();
      }, wait);
    });

    QUnit.test('unplayable source still triggers sourceset', function(assert) {
      const done = assert.async();
      const badSource = {src: 'http://example.com/some-bad-url', type: ''};

      this.totalSourcesets = 2;

      this.player.one('sourceset', (e) => {
        validateSource(this.player, badSource, e);
        done();
      });

      this.mediaEl.src = badSource.src;
    });

  }));

  QUnit.test('sourceset event object has a src property', function(assert) {
    const done = assert.async();
    const fixture = document.querySelector('#qunit-fixture');
    const vid = document.createElement('video');
    const Tech = videojs.getTech('Tech');
    let sourcesets = 0;

    class FakeFlash extends Html5 {
      static isSupported() {
        return true;
      }

      static canPlayType(type) {
        return type === 'video/flv' ? 'maybe' : '';
      }

      static canPlaySource(srcObj) {
        return srcObj.type === 'video/flv';
      }
    }

    videojs.registerTech('FakeFlash', FakeFlash);

    fixture.appendChild(vid);

    const player = videojs(vid, {
      techOrder: ['fakeFlash', 'html5']
    });

    player.src(flashSrc);

    player.ready(function() {
      // the first sourceset comes from our FakeFlash because it extends Html5 tech
      // which calls load() on dispose for various reasons
      player.one('sourceset', function(e1) {
        // ignore the first sourceset that gets called when disposing the original tech

        // the second sourceset ends up being the second source because when the first source is set
        // the tech isn't ready so we delay it, then the second source comes and the tech is ready
        // so it ends up being triggered immediately.
        player.one('sourceset', function(e2) {
          assert.equal(e2.src, sourceTwo.src, 'the second sourceset ends up being the second source');
          sourcesets++;

          // now that the tech is ready, we will re-trigger the original sourceset event
          // and get the first source
          player.one('sourceset', function(e3) {
            assert.equal(e3.src, sourceOne.src, 'the third sourceset is the first source');
            sourcesets++;

            assert.equal(sourcesets, 2, 'two sourcesets');
            player.dispose();
            delete Tech.techs_.FakeFlash;
            done();
          });
        });
      });

      player.src(sourceOne);
      player.src(sourceTwo);
    });

  });
});
