/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import window from 'global/window';

const testSrc = {
  src: 'http://vjs.zencdn.net/v/oceans.mp4',
  type: 'video/mp4'
};

const wait = 400;
let qunitFn = 'module';

if (videojs.browser.IS_IE8) {
  qunitFn = 'skip';
}

const Html5 = videojs.getTech('Html5');
const oldMovingMedia = Html5.prototype.movingMediaElementInDOM;

const validateSource = function(assert, player, sources, checkVideoSource = true) {
  const tech = player.tech_;
  const video = tech.el();

  assert.deepEqual(player.currentSource(), sources[0], 'currentSource is correct');
  assert.equal(player.src(), sources[0].src, 'src is correct');
  assert.deepEqual(player.currentSources(), sources, 'currentSources is correct');
  // when we are dealing with <source> elements video.src will be null
  if (checkVideoSource) {
    assert.equal(video.src, sources[0].src, 'video.src is correct');
    assert.equal(video.getAttribute('src'), sources[0].src, 'video attribute is correct');
    assert.equal(tech.src(), sources[0].src, 'tech is correct');
  }
};

QUnit[qunitFn]('sourceset', function(hooks) {
  ['', ' and change video el'].forEach((testName) => {

    QUnit.module(`source before player${testName}`, {
      beforeEach() {
        if (testName === 'and change video el') {
          Html5.prototype.movingMediaElementInDOM = false;
        }
        this.hook = (player) => player.on('sourceset', () => this.sourcesets++);
        videojs.hook('setup', this.hook);

        this.sourcesets = 0;
        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';
        this.fixture.appendChild(this.video);
      },
      afterEach(assert) {
        const done = assert.async();

        this.sourcesets = 0;
        this.player.dispose();

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 0, 'no source set on dispose');

          videojs.removeHook('setup', this.hook);
          Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
          done();
        }, wait);
      }
    });

    QUnit.test('videojs({sources: [...]}) x1', function(assert) {
      const done = assert.async();

      this.player = videojs(this.video, {sources: [testSrc]});

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('videojs({sources: [...]}) x2', function(assert) {
      const done = assert.async();

      this.player = videojs(this.video, {sources: [testSrc, testSrc]});

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc, testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player = videojs(this.video);
      this.player.src(testSrc);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('player.src({...}) x2', function(assert) {
      const done = assert.async();

      this.player = videojs(this.video);
      this.player.src([testSrc, testSrc]);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc, testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('no source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.video);

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 0, 'no sourceset');
        done();
      }, wait);
    });

    QUnit.test('video.src = ...;', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;
      this.player = videojs(this.video);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);
      this.player = videojs(this.video);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('<source> x1', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = testSrc.src;
      this.source.type = testSrc.type;

      this.video.appendChild(this.source);

      this.player = videojs(this.video);
      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.test('<source> x2', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = testSrc.src;
      this.source.type = testSrc.type;

      this.video.appendChild(this.source);
      this.video.appendChild(this.source.cloneNode(true));

      this.player = videojs(this.video);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc, testSrc]);
      });

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'only one sourceset');
        done();
      }, wait);
    });

    QUnit.module(`source change${testName}`, {
      beforeEach(assert) {
        const done = assert.async();

        if (testName === 'and change video el') {
          Html5.prototype.movingMediaElementInDOM = false;
        }
        this.hook = (player) => player.on('sourceset', () => this.sourcesets++);
        videojs.hook('setup', this.hook);

        this.sourcesets = 0;
        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';
        this.video.src = testSrc.src;
        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);

        this.player.ready(() => {
          this.video = this.player.tech_.el();
        });

        // intial sourceset should happen on player.ready
        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [testSrc]);
        });

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 1, 'initial sourceset');
          done();
        }, wait);

      },
      afterEach(assert) {
        const done = assert.async();

        this.sourcesets = 0;
        this.player.dispose();

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 0, 'no source set on dispose');

          videojs.removeHook('setup', this.hook);
          Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
          done();
        }, wait);
      }
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 2, 'triggers sourceset');
        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);
        });

        this.player.src({src: 'http://example.com/one.mp4', type: 'video/mp4'});

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 3, 'triggers another sourceset');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('player.src({...}) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/two.mp4', type: 'video/mp4'}]);
        });
      });

      this.player.src({src: 'http://example.com/one.mp4', type: 'video/mp4'});
      this.player.src({src: 'http://example.com/two.mp4', type: 'video/mp4'});

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 3, 'triggers two sourcesets');
        done();
      }, wait);
    });

    QUnit.test('video.src = ...', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 2, 'triggers sourceset');

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);
        });

        this.video.src = 'http://example.com/one.mp4';

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 3, 'triggers another sourceset');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('video.src = ... x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/two.mp4', type: 'video/mp4'}]);
        });
      });
      this.video.src = 'http://example.com/one.mp4';
      this.video.src = 'http://example.com/two.mp4';

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 3, 'triggers two sourceset');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute("src", ...)', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc]);
      });

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 2, 'triggers sourceset');

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);
        });

        this.video.setAttribute('src', 'http://example.com/one.mp4');

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 3, 'triggers another sourceset');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('video.setAttribute("src", ...) x2 at the same time', function(assert) {
      const done = assert.async();

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}]);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/two.mp4', type: 'video/mp4'}]);
        });
      });

      this.video.setAttribute('src', 'http://example.com/one.mp4');
      this.video.setAttribute('src', 'http://example.com/two.mp4');

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 3, 'triggers two sourceset');
        done();
      }, wait);
    });

    QUnit.test('video.load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.video.removeAttribute('src');

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [testSrc], false);
      });

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 2, 'triggers sourceset');

        source.src = 'http://example.com/one.mp4';

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}], false);
        });

        this.video.load();

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 3, 'triggers sourceset');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('video.load() x2 at the same time', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = 'http://example.com/one.mp4';
      source.type = testSrc.type;

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [{src: 'http://example.com/one.mp4', type: 'video/mp4'}], false);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [{src: 'http://example.com/two.mp4', type: 'video/mp4'}], false);
        });
      });

      // the only way to unset a source, so that we use the source
      // elements instead
      this.video.removeAttribute('src');
      this.video.appendChild(source);
      this.video.load();

      source.src = 'http://example.com/two.mp4';
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 3, 'triggers two sourceset');
        done();
      }, wait);
    });

    QUnit.test('adding a <source> without load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);

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

      this.video.appendChild(source);

      source.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'does not trigger sourceset');
        done();
      }, wait);
    });
  });
});
