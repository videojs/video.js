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
const blobSrc = {
  src: 'blob:something',
  type: 'video/mp4'
};
const testSrc = {
  src: 'http://example.com/testSrc.mp4',
  type: 'video/mp4'
};
const sourceOne = {src: 'http://example.com/one.mp4', type: 'video/mp4'};
const sourceTwo = {src: 'http://example.com/two.mp4', type: 'video/mp4'};
const sourceThree = {src: 'http://example.com/three.mp4', type: 'video/mp4'};

if (!Html5.canOverrideAttributes()) {
  qunitFn = 'skip';
}

const oldMovingMedia = Html5.prototype.movingMediaElementInDOM;
const validateSource = function(player, expectedSources, event, srcOverrides = {}) {
  expectedSources = Array.isArray(expectedSources) ? expectedSources : [expectedSources];
  const mediaEl = player.tech_.el();
  const assert = QUnit.assert;
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
  assert.equal(mediaEl.getAttribute('src'), expected.attr || null, 'mediaEl attribute is correct');

  // mediaEl.src source is always absolute, but can be empty string
  // getAbsoluteURL would return the current url of the page for empty string
  // so we have to check
  expected.prop = expected.prop ? getAbsoluteURL(expected.prop) : expected.prop;
  assert.equal(mediaEl.src, expected.prop, 'mediaEl src property is correct');

};

const setupEnv = function(env, testName) {
  sinon.stub(log, 'error');
  env.fixture = document.getElementById('qunit-fixture');

  if ((/^change/i).test(testName)) {
    Html5.prototype.movingMediaElementInDOM = false;
  }

  env.sourcesets = 0;
  env.hook = (player) => player.on('sourceset', (e) => {
    env.sourcesets++;
  });
  videojs.hook('setup', env.hook);

  if ((/video-js/i).test(testName)) {
    env.mediaEl = document.createElement('video-js');
  } else if ((/audio/i).test(testName)) {
    env.mediaEl = document.createElement('audio');
  } else {
    env.mediaEl = document.createElement('video');
  }
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

const testTypes = ['video el', 'change video el', 'audio el', 'change audio el', 'video-js', 'change video-js el'];

QUnit[qunitFn]('sourceset', function(hooks) {
  QUnit.module('source before player', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach() {

        setupEnv(this, testName);
      },
      afterEach: setupAfterEach(1)
    });

    QUnit.test('data-setup one source', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [testSrc]}));
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('data-setup one blob', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [blobSrc]}));
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [blobSrc], e);
        done();
      });
    });

    QUnit.test('data-setup preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [testSrc]}));
      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('data-setup two sources', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [sourceOne, sourceTwo]}));
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [sourceOne, sourceTwo], e);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true,
        sources: [testSrc]
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) one blob', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true,
        sources: [blobSrc]
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [blobSrc], e);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true,
        sources: [sourceOne, sourceTwo]
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [sourceOne, sourceTwo], e);
        done();
      });
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.mediaEl.src = testSrc.src;
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('mediaEl.src = blob;', function(assert) {
      const done = assert.async();

      this.mediaEl.src = blobSrc.src;
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [{src: blobSrc.src, type: ''}], e);
        done();
      });
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('src', testSrc.src);
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('mediaEl.setAttribute("src", blob)', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('src', blobSrc.src);
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [{src: blobSrc.src, type: ''}], e);
        done();
      });
    });

    QUnit.test('<source> one source', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = testSrc.src;
      this.source.type = testSrc.type;

      this.mediaEl.appendChild(this.source);

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });
      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });
    });

    QUnit.test('<source> two sources', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = sourceOne.src;
      this.source.type = sourceOne.type;

      this.source2 = document.createElement('source');
      this.source2.src = sourceTwo.src;
      this.source2.type = sourceTwo.type;

      this.mediaEl.appendChild(this.source);
      this.mediaEl.appendChild(this.source2);

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [sourceOne, sourceTwo], e);
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

    QUnit.test('relative sources are handled correctly', function(assert) {
      const done = assert.async();
      const one = {src: 'relative-one.mp4', type: 'video/mp4'};
      const two = {src: '../relative-two.mp4', type: 'video/mp4'};
      const three = {src: './relative-three.mp4?test=test', type: 'video/mp4'};

      const source = document.createElement('source');

      source.src = one.src;
      source.type = one.type;

      this.mediaEl.appendChild(source);
      this.player = videojs(this.mediaEl, {enableSourceset: true});

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
            validateSource(this.player, {src: getAbsoluteURL(three.src), type: three.type}, e3, {attr: three.src});
            done();
          });

          this.mediaEl.setAttribute('src', three.src);
        });

        this.mediaEl.src = two.src;
      });

    });
  }));

  QUnit.module('source after player', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach() {

        setupEnv(this, testName);
      },
      afterEach: setupAfterEach(1)
    });

    QUnit.test('player.src({...}) one source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });
      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });

      this.player.src(testSrc);
    });

    QUnit.test('player.src({...}) one blob', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });
      this.player.one('sourceset', (e) => {
        validateSource(this.player, [blobSrc], e);
        done();
      });

      this.player.src(blobSrc);
    });

    QUnit.test('player.src({...}) preload auto', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('preload', 'auto');
      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });

      this.player.src(testSrc);
    });

    QUnit.test('player.src({...}) two sources', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {
        enableSourceset: true
      });

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [sourceOne, sourceTwo], e);
        done();
      });

      this.player.src([sourceOne, sourceTwo]);
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });

      this.player.tech_.el_.src = testSrc.src;
    });

    QUnit.test('mediaEl.src = blob', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [{src: blobSrc.src, type: ''}], e);
        done();
      });

      this.player.tech_.el_.src = blobSrc.src;
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [testSrc], e);
        done();
      });

      this.player.tech_.el_.setAttribute('src', testSrc.src);
    });

    QUnit.test('mediaEl.setAttribute("src", blob)"', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {enableSourceset: true});

      this.player.one('sourceset', (e) => {
        validateSource(this.player, [{src: blobSrc.src, type: ''}], e);
        done();
      });

      this.player.tech_.el_.setAttribute('src', blobSrc.src);
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
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(this.player, testSrc, e, {prop: '', attr: ''});
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
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          validateSource(this.player, testSrc, e1, {prop: '', attr: ''});

          this.player.one('sourceset', (e2) => {
            validateSource(this.player, testSrc, e2, {prop: '', attr: ''});
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
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          validateSource(this.player, testSrc, e1, {prop: '', attr: ''});

          this.player.one('sourceset', (e2) => {
            validateSource(this.player, [sourceOne], e2);

            done();
          });
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // should fire an additional sourceset
        this.player.tech_.el_.src = sourceOne.src;
      });

      QUnit.test(`one <source> through ${appendObj.name} and then mediaEl.setAttribute`, function(assert) {
        const done = assert.async();

        this.totalSourcesets = 2;
        this.source = document.createElement('source');
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          validateSource(this.player, testSrc, e1, {prop: '', attr: ''});

          this.player.one('sourceset', (e2) => {
            validateSource(this.player, [sourceOne], e2);

            done();
          });
        });

        // since the media el has no source, just appending will
        // change the source without calling load
        appendObj.fn(this.player.tech_.el_, this.source);

        // should fire an additional sourceset
        this.player.tech_.el_.setAttribute('src', sourceOne.src);
      });

      QUnit.test(`mediaEl.src and then <source> through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(this.player, [sourceOne], e);

          done();
        });

        this.player.tech_.el_.src = sourceOne.src;

        // should not fire sourceset
        appendObj.fn(this.player.tech_.el_, this.source);
      });

      QUnit.test(`mediaEl.setAttribute and then <source> through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(this.player, [sourceOne], e);

          done();
        });

        this.player.tech_.el_.setAttribute('src', sourceOne.src);

        // should not fire sourceset
        appendObj.fn(this.player.tech_.el_, this.source);
      });

      QUnit.test(`<source> two sources through ${appendObj.name}`, function(assert) {
        const done = assert.async();

        this.source = document.createElement('source');
        this.source.src = sourceOne.src;
        this.source.type = sourceOne.type;

        this.source2 = document.createElement('source');
        this.source2.src = sourceTwo.src;
        this.source2.type = sourceTwo.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e) => {
          validateSource(this.player, sourceOne, e, {prop: '', attr: ''});
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

        this.totalSourcesets = 3;
        this.source = document.createElement('source');
        this.source.src = sourceTwo.src;
        this.source.type = sourceTwo.type;

        this.player = videojs(this.mediaEl, {enableSourceset: true});

        this.player.one('sourceset', (e1) => {
          validateSource(this.player, [sourceOne], e1);

          this.player.one('sourceset', (e2) => {
            validateSource(this.player, [{src: '', type: ''}], e2);

            this.player.one('sourceset', (e3) => {
              validateSource(this.player, sourceTwo, e3, {prop: '', attr: ''});
              done();
            });
          });

          // reset to no source
          this.player.tech_.el_.removeAttribute('src');
          this.player.tech_.el_.load();

          // since the media el has no source, just appending will
          // change the source without calling load
          appendObj.fn(this.player.tech_.el_, this.source);

        });

        this.player.tech_.el_.setAttribute('src', sourceOne.src);
      });
    });

    QUnit.test('no source and load', function(assert) {
      this.player = videojs(this.mediaEl, {enableSourceset: true});
      this.player.tech_.el_.load();

      this.totalSourcesets = 1;
    });
  }));

  QUnit.module('source change', (subhooks) => testTypes.forEach((testName) => {
    QUnit.module(testName, {
      beforeEach(assert) {
        const done = assert.async();

        setupEnv(this, testName);

        this.mediaEl.src = testSrc.src;
        this.player = videojs(this.mediaEl, {
          enableSourceset: true
        });

        this.player.ready(() => {
          this.mediaEl = this.player.tech_.el();
        });

        // initial sourceset should happen on player.ready
        this.player.one('sourceset', (e) => {
          validateSource(this.player, [testSrc], e);
          done();
        });
      },
      afterEach: setupAfterEach(3)
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [testSrc], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceOne], e2);
          done();
        });

        this.player.src(sourceOne);
      });

      this.player.src(testSrc);
    });

    QUnit.test('hls -> hls -> blob -> hls', function(assert) {
      this.totalSourcesets = 5;
      // we have to force techFaker here as some browsers, ie edge/safari support
      // native HLS.
      this.player.options_.techOrder = ['techFaker'];
      this.player.options_.techFaker = this.player.options_.techFaker || {};
      const done = assert.async();
      const m3u8One = {
        src: 'http://vjs.zencdn.net/v/oceans.m3u8',
        type: 'application/x-mpegURL'
      };
      const blobOne = 'blob:one';
      const m3u8Two = {
        src: 'http://vjs.zencdn.net/v/oceans-two.m3u8',
        type: 'application/x-mpegURL'
      };
      const blobTwo = 'blob:two';
      const setTechFaker = (src) => {
        this.player.options_.techFaker = this.player.options_.techFaker || {};
        this.player.tech_.options_ = this.player.tech_.options_ || {};
        this.player.tech_.options_.sourceset = src;
        this.player.options_.techFaker.sourceset = src;
      };

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [m3u8One], e1, {event: blobOne, attr: blobOne, prop: blobOne});

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [m3u8Two], e2, {event: blobTwo, attr: blobTwo, prop: blobTwo});

          // should change to blobSrc now
          this.player.one('sourceset', (e3) => {
            validateSource(this.player, [blobSrc], e3);

            this.player.one('sourceset', (e4) => {
              validateSource(this.player, [m3u8Two], e2, {event: blobTwo, attr: blobTwo, prop: blobTwo});

              done();
            });

            setTechFaker(blobTwo);
            this.player.src(m3u8Two);
          });

          setTechFaker(blobSrc.src);
          this.player.src(blobSrc);
        });

        setTechFaker(blobTwo);
        this.player.src(m3u8Two);
      });

      setTechFaker(blobOne);
      this.player.src(m3u8One);
    });

    QUnit.test('hls -> mp4 -> hls -> blob', function(assert) {
      this.totalSourcesets = 5;
      // we have to force techFaker here as some browsers, ie edge/safari support
      // native HLS.
      this.player.options_.techOrder = ['techFaker'];
      this.player.options_.techFaker = this.player.options_.techFaker || {};
      const done = assert.async();
      const m3u8One = {
        src: 'http://vjs.zencdn.net/v/oceans.m3u8',
        type: 'application/x-mpegURL'
      };
      const blobOne = 'blob:one';
      const setTechFaker = (src) => {
        this.player.options_.techFaker = this.player.options_.techFaker || {};
        this.player.tech_.options_ = this.player.tech_.options_ || {};
        this.player.tech_.options_.sourceset = src;
        this.player.options_.techFaker.sourceset = src;
      };

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [m3u8One], e1, {event: blobOne, attr: blobOne, prop: blobOne});

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [testSrc], e2);

          // should change to blobSrc now
          this.player.one('sourceset', (e3) => {
            validateSource(this.player, [m3u8One], e3, {event: blobOne, attr: blobOne, prop: blobOne});

            this.player.one('sourceset', (e4) => {
              validateSource(this.player, [blobSrc], e4);

              done();
            });

            setTechFaker(blobSrc.src);
            this.player.src(blobSrc);
          });

          setTechFaker(blobOne);
          this.player.src(m3u8One);
        });

        setTechFaker(testSrc.src);
        this.player.src(testSrc);
      });

      setTechFaker(blobOne);
      this.player.src(m3u8One);
    });

    QUnit.test('player.src({...}) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [sourceOne], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceTwo], e2);
          done();
        });
      });

      this.player.src(sourceOne);
      this.player.src(sourceTwo);
    });

    QUnit.test('player.src({...}) x3 at the same time', function(assert) {
      const done = assert.async();

      // we have one more sourceset then other tests
      this.totalSourcesets = 4;

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, sourceOne, e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, sourceTwo, e2);

          this.player.one('sourceset', (e3) => {
            validateSource(this.player, sourceThree, e3);
            done();
          });
        });
      });

      this.player.src(sourceOne);
      this.player.src(sourceTwo);
      this.player.src(sourceThree);
    });

    QUnit.test('mediaEl.src = ...', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [testSrc], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceOne], e2);
          done();
        });

        this.mediaEl.src = sourceOne.src;
      });

      this.mediaEl.src = testSrc.src;
    });

    QUnit.test('mediaEl.src = ... x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [sourceOne], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceTwo], e2);
          done();
        });
      });

      this.mediaEl.src = sourceOne.src;
      this.mediaEl.src = sourceTwo.src;
    });

    QUnit.test('mediaEl.setAttribute("src", ...)', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [testSrc], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceOne], e2);
          done();
        });

        this.mediaEl.setAttribute('src', sourceOne.src);
      });

      this.mediaEl.setAttribute('src', testSrc.src);
    });

    QUnit.test('mediaEl.setAttribute("src", ...) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [sourceOne], e1);

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceTwo], e2);
          done();
        });
      });

      this.mediaEl.setAttribute('src', sourceOne.src);
      this.mediaEl.setAttribute('src', sourceTwo.src);
    });

    QUnit.test('mediaEl.load() with a src attribute', function(assert) {
      const done = assert.async();

      this.totalSourcesets = 1;

      window.setTimeout(() => {
        this.sourcesets = 0;
        this.totalSourcesets = 1;

        this.player.one('sourceset', (e) => {
          validateSource(this.player, [testSrc], e);
          done();
        });

        this.player.load();
      }, wait);
    });

    QUnit.test('mediaEl.load()', function(assert) {
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [testSrc], e1, {attr: '', prop: ''});

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceOne], e2, {attr: '', prop: ''});
        });

        source.src = sourceOne.src;
        source.type = sourceOne.type;

        this.mediaEl.load();
      });

      this.mediaEl.appendChild(source);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() x2 at the same time', function(assert) {
      const source = document.createElement('source');

      source.src = sourceOne.src;
      source.type = sourceOne.type;

      this.player.one('sourceset', (e1) => {
        validateSource(this.player, [sourceOne], e1, {attr: '', prop: ''});

        this.player.one('sourceset', (e2) => {
          validateSource(this.player, [sourceTwo], e2, {attr: '', prop: ''});
        });
      });

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');
      this.mediaEl.appendChild(source);
      this.mediaEl.load();

      source.src = sourceTwo.src;
      source.type = sourceTwo.type;
      this.mediaEl.load();
    });

    QUnit.test('adding a <source> without load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

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

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.mediaEl.appendChild(source);

      source.src = testSrc.src;

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
