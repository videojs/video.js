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
const testSrc = {
  src: 'http://vjs.zencdn.net/v/oceans.mp4',
  type: 'video/mp4'
};
const sourceOne = {src: 'http://example.com/one.mp4', type: 'video/mp4'};
const sourceTwo = {src: 'http://example.com/two.mp4', type: 'video/mp4'};

if (!Html5.canOverrideAttributes()) {
  qunitFn = 'skip';
}

const oldMovingMedia = Html5.prototype.movingMediaElementInDOM;
const validateSource = function(assert, player, event, expectedSources, srcOverrides = {}) {
  expectedSources = Array.isArray(expectedSources) ? expectedSources : [expectedSources];
  const mediaEl = player.tech_.el();
  const expected = {
    // player cache checks
    currentSources: expectedSources, currentSource: expectedSources[0], src: expectedSources[0].src,
    // tech checks
    event: expectedSources[0].src, attr: expectedSources[0].src, prop: expectedSources[0].src
  };

  Object.keys(srcOverrides).forEach((k) => {
    // only override known properties
    if (!expected.hasOwnProperty(k)) {
      return;
    }

    expected[k] = srcOverrides[k];
  });

  assert.deepEqual(player.currentSource(), expected.currentSource, 'player.currentSource() is correct');
  assert.deepEqual(player.currentSources(), expected.currentSources, 'player.currentSources() is correct');
  assert.equal(player.src(), expected.src, 'player.src() is correct');

  assert.equal(event.src, expected.event, 'event src is correct');

  // if we expect a blank attr it will be null instead
  assert.equal(mediaEl.getAttribute('src'), expected.attrSrc || null, 'mediaEl attribute is correct');

  // mediaEl.src source is always absolute, but can be empty string
  // getAbsoluteURL would return the current url of the page for empty string
  // so we have to check
  expected.prop = expected.prop ? getAbsoluteURL(expected.prop) : expected.prop;
  assert.equal(mediaEl.src, expected.prop, 'mediaEl src property is correct');

};

const setupEnv = function(env, testName) {
  env.fixture = document.getElementById('qunit-fixture');

  if (testName === 'change video el' || testName === 'change audio el') {
    Html5.prototype.movingMediaElementInDOM = false;
  }

  env.sourcesets = 0;
  env.hook = (player) => player.on('sourceset', () => env.sourcesets++);
  videojs.hook('setup', env.hook);

  if ((/audio/i).test(testName)) {
    env.mediaEl = document.createElement('audio');
  } else {
    env.mediaEl = document.createElement('video');
  }
  env.testSrc = testSrc;
  env.sourceOne = sourceOne;
  env.sourceTwo = sourceTwo;

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
      assert.equal(this.sourcesets, this.totalSourcesets, 'no additional sourcesets');

      this.player.dispose();
      assert.equal(this.sourcesets, this.totalSourcesets, 'no source set on dispose');

      videojs.removeHook('setup', this.hook);
      Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
      log.error.restore();
      done();
    }, wait);
  };
};

const testTypes = ['video el', 'change video el', 'audio el', 'change audio el'];

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
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('data-setup preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.testSrc]}));
      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('data-setup two sources', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.sourceOne, this.sourceTwo]}));
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true,
        sources: [this.testSrc]
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true,
        sources: [this.sourceOne, this.sourceTwo]
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.mediaEl.src = this.testSrc.src;
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('src', this.testSrc.src);
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('<source> one source', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = this.testSrc.src;
      this.source.type = this.testSrc.type;

      this.mediaEl.appendChild(this.source);

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });
      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
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

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('no source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.totalSourcesets = 0;

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 0, 'no sourceset');
        done();
      }, wait);
    });
  }));

  QUnit.module('source after player', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach() {
        sinon.stub(log, 'error');

        setupEnv(this, testName);
      },
      afterEach: setupAfterEach(1)
    });

    QUnit.test('player.src({...}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });
      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });

      this.player.src(this.testSrc);
    });

    QUnit.test('player.src({...}) preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });

      this.player.src(this.testSrc);
    });

    QUnit.test('player.src({...}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });

      this.player.src([this.sourceOne, this.sourceTwo]);
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });

      this.player.tech_.el_.src = this.testSrc.src;
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });

      this.player.tech_.el_.setAttribute('src', this.testSrc.src);
    });

    const appendTypes = [
      {name: 'appendChild', fn: (el, obj) => el.appendChild(obj)},
      {name: 'innerHTML', fn: (el, obj) => {el.innerHTML = obj.outerHTML;}}, // eslint-disable-line
    ];

    // ie does not support this and safari < 10 does not either
    if (window.Element.prototype.append) {
      appendTypes.push({name: 'append', fn: (el, obj) => el.append(obj)});
    }

    if (window.Element.prototype.insertAdjacentHTML) {
      appendTypes.push({name: 'insertAdjacentHTML', fn: (el, obj) => el.insertAdjacentHTML('afterbegin', obj.outerHTML)});
    }

    appendTypes.forEach((appendObj) => {

      QUnit.test(`<source> one source through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          assert.equal(e.src, this.testSrc.src, 'source is as expected');
          done();
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);
      });

      QUnit.test(`<source> one source through ${appendObj.name} and load`, function(assert) {
        const done = assert.async();

        this.totalSourcesets = 2;
        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          assert.equal(e1.src, this.testSrc.src, 'event has expected source');

          this.player.one('sourceset', (e2) => {
            assert.equal(e2.src, this.testSrc.src, 'second event has expected source');
            done();
          });
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // should fire an additional sourceset
        this.player.tech_.el_.load();
      });

      QUnit.test(`one <source> through ${appendObj.name} and then mediaEl.src`, function(assert) {
        const done = assert.async();

        this.totalSourcesets = 2;
        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          assert.equal(e.src, this.testSrc.src, 'source is as expected');

          this.player.one('sourceset', (e2) => {
            validateSource(assert, this.player, [this.sourceOne]);

            done();
          });
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // should fire an additional sourceset
        this.player.tech_.el_.src = this.sourceOne.src;
      });

      QUnit.test(`one <source> through ${appendObj.name} and then mediaEl.setAttribute`, function(assert) {
        const done = assert.async();

        this.totalSourcesets = 2;
        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          assert.equal(e.src, this.testSrc.src, 'source is as expected');

          this.player.one('sourceset', (e2) => {
            validateSource(assert, this.player, [this.sourceOne]);

            done();
          });
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // should fire an additional sourceset
        this.player.tech_.el_.setAttribute('src', this.sourceOne.src);
      });

      QUnit.test(`mediaEl.src and then <source> through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(assert, this.player, [this.sourceOne]);

          done();
        });

        this.player.tech_.el_.src = this.sourceOne.src;

        // should not fire sourceset
        appendObj.fn(this.player.tech_.el_, this.source);
      });

      QUnit.test(`mediaEl.setAttribute and then <source> through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = this.testSrc.src;
        this.source.type = this.testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(assert, this.player, [this.sourceOne]);

          done();
        });

        this.player.tech_.el_.setAttribute('src', this.sourceOne.src);

        // should not fire sourceset
        appendObj.fn(this.player.tech_.el_, this.source);
      });

      QUnit.test(`<source> two sources through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = this.sourceOne.src;
        this.source.type = this.sourceOne.type;

        this.source2 = document.createElement('source');
        this.source2.src = this.sourceTwo.src;
        this.source2.type = this.sourceTwo.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          assert.equal(e.src, this.sourceOne.src, 'source is as expected');
          done();
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // this should not be in the source list or fire a sourceset
        appendObj.fn(this.player.tech_.el_, this.source2);
      });

      QUnit.test(`set, remove, load, and set again through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.totalSourcesets = 2;
        this.source = document.createElement('source');
        this.source.src = this.sourceTwo.src;
        this.source.type = this.sourceTwo.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          validateSource(assert, this.player, [this.sourceOne]);

          this.player.one('sourceset', (e2) => {
            validateSource(assert, this.player, [this.sourceTwo], false);
            done();
          });

          // reset to no source
          this.player.tech_.el_.removeAttribute('src');
          this.player.tech_.el_.load();

          // since the media el has no source, just appending will
          // change the source without calling load
          appendObj.fn(this.player.tech_.el_, this.source);

        });

        this.player.tech_.el_.setAttribute('src', this.sourceOne.src);
      });
    });

    QUnit.test('no source and load', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});
      this.player.tech_.el_.load();

      this.totalSourcesets = 0;

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 0, 'no sourceset');
        done();
      }, wait);
    });
  }));

  QUnit.module('source change', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach(assert) {
        sinon.stub(log, 'error');
        const done = assert.async();

        setupEnv(this, testName);

        this.mediaEl.src = this.testSrc.src;
        this.player = videojs(this.mediaEl, {
          enableSourceset: true
        });

        this.player.ready(() => {
          this.mediaEl = this.player.tech_.el();
        });

        // intial sourceset should happen on player.ready
        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.testSrc]);
          done();
        });
      },
      afterEach: setupAfterEach(3)
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceOne]);
          done();
        });

        this.player.src(this.sourceOne);
      });

      this.player.src(this.testSrc);
    });

    QUnit.test('player.src({...}) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceTwo]);
          done();
        });
      });

      this.player.src(this.sourceOne);
      this.player.src(this.sourceTwo);
    });

    QUnit.test('mediaEl.src = ...', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceOne]);
          done();
        });

        this.mediaEl.src = this.sourceOne.src;
      });

      this.mediaEl.src = this.testSrc.src;
    });

    QUnit.test('mediaEl.src = ... x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceTwo]);
          done();
        });
      });

      this.mediaEl.src = this.sourceOne.src;
      this.mediaEl.src = this.sourceTwo.src;
    });

    QUnit.test('mediaEl.setAttribute("src", ...)', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceOne]);
          done();
        });

        this.mediaEl.setAttribute('src', this.sourceOne.src);
      });

      this.mediaEl.setAttribute('src', this.testSrc.src);
    });

    QUnit.test('mediaEl.setAttribute("src", ...) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceTwo]);
          done();
        });
      });

      this.mediaEl.setAttribute('src', this.sourceOne.src);
      this.mediaEl.setAttribute('src', this.sourceTwo.src);
    });

    QUnit.test('load() with a src attribute', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.totalSourcesets = 1;

      window.setTimeout(() => {
        this.sourcesets = 0;
        this.totalSourcesets = 1;

        this.player.one('sourceset', (e) => {
          assert.equal(e.src, this.mediaEl.src, "the sourceset event's src matches the src attribute");

          done();
        });

        this.player.load();
      }, wait);
    });

    QUnit.test('mediaEl.load()', function(assert) {
      const source = document.createElement('source');

      source.src = this.testSrc.src;
      source.type = this.testSrc.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      this.player.one('sourceset', (e1) => {
        assert.equal(e1.src, this.testSrc.src, 'we got a sourceset with the expected src');

        this.player.one('sourceset', (e2) => {
          assert.equal(e2.src, this.sourceOne.src, 'we got a sourceset with the expected src');
        });

        source.src = this.sourceOne.src;
        source.type = this.sourceOne.type;

        this.mediaEl.load();
      });

      this.mediaEl.appendChild(source);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() x2 at the same time', function(assert) {
      const source = document.createElement('source');

      source.src = this.sourceOne.src;
      source.type = this.sourceOne.type;

      this.player.one('sourceset', (e1) => {
        assert.equal(e1.src, this.sourceOne.src, 'we got a sourceset with the expected src');

        this.player.one('sourceset', (e2) => {
          assert.equal(e2.src, this.sourceTwo.src, 'we got a sourceset with the expected src');
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
        assert.equal(this.sourcesets, 1, 'does not trigger sourceset');
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
        assert.equal(this.sourcesets, 1, 'does not trigger sourceset');
        done();
      }, wait);
    });
  }));

  QUnit.test('sourceset event object has a src property', function(assert) {
    const done = assert.async();
    const fixture = document.querySelector('#qunit-fixture');
    const vid = document.createElement('video');
    const Tech = videojs.getTech('Tech');
    const flashSrc = {
      src: 'http://example.com/oceans.flv',
      type: 'video/flv'
    };
    const sourcesets = [];

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
      enableSourceset: true,
      techOrder: ['fakeFlash', 'html5']
    });

    player.ready(function() {
      // the first sourceset ends up being the second source because when the first source is set
      // the tech isn't ready so we delay it, then the second source comes and the tech is ready
      // so it ends up being triggered immediately.
      player.on('sourceset', (e) => {
        sourcesets.push(e.src);

        if (sourcesets.length === 3) {
          assert.deepEqual([flashSrc.src, sourceTwo.src, sourceOne.src], sourcesets, 'sourceset as expected');

          player.dispose();
          delete Tech.techs_.FakeFlash;
          done();
        }
      });

      player.src(sourceOne);
      player.src(sourceTwo);
    });

    player.src(flashSrc);

  });
});
