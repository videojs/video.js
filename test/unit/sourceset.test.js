/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import window from 'global/window';
import log from '../../src/js/utils/log.js';
import sinon from 'sinon';

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
const validateSource = function(assert, player, sources, checkMediaElSource = true) {
  const tech = player.tech_;
  const mediaEl = tech.el();

  if (checkMediaElSource) {
    assert.equal(mediaEl.src, sources[0].src, 'mediaEl.src is correct');
    assert.equal(mediaEl.getAttribute('src'), sources[0].src, 'mediaEl attribute is correct');
    assert.equal(tech.src(), sources[0].src, 'tech is correct');
  }
};

const setupEnv = function(env, testName) {
  env.fixture = document.getElementById('qunit-fixture');

  if ((/^change/i).test(testName)) {
    Html5.prototype.movingMediaElementInDOM = false;
  }

  env.sourcesets = 0;
  env.hook = (player) => player.on('sourceset', () => env.sourcesets++);
  videojs.hook('setup', env.hook);

  if ((/video-js/i).test(testName)) {
    env.mediaEl = document.createElement('video-js');
  } else if ((/audio/i).test(testName)) {
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

const testTypes = ['video el', 'change video el', 'audio el', 'change audio el', 'video-js', 'change video-js el'];

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

    // TODO: unskip when https://github.com/videojs/video.js/pull/4861 is merged
    QUnit.skip('data-setup preload auto', function(assert) {
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

    // TODO: unskip when https://github.com/videojs/video.js/pull/4861 is merged
    QUnit.skip('player.src({...}) preload auto', function(assert) {
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
        assert.equal(e1.src, '', 'we got a sourceset with an empty src');

        this.player.one('sourceset', (e2) => {
          assert.equal(e2.src, '', 'we got a sourceset with an empty src');
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
        assert.equal(e1.src, '', 'we got a sourceset with an empty src');

        this.player.one('sourceset', (e2) => {
          assert.equal(e2.src, '', 'we got a sourceset with an empty src');
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
      enableSourceset: true,
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
