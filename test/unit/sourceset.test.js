/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import window from 'global/window';
import log from '../../src/js/utils/log.js';
import sinon from 'sinon';

const Html5 = videojs.getTech('Html5');
const wait = 100;
let qunitFn = 'module';

if (!Html5.canOverrideAttributes()) {
  qunitFn = 'skip';
}

const oldMovingMedia = Html5.prototype.movingMediaElementInDOM;
const validateSource = function(assert, player, sources, checkMediaElSource = true) {
  const tech = player.tech_;
  const mediaEl = tech.el();

  // assert.deepEqual(player.currentSource(), sources[0], 'currentSource is correct');
  // assert.equal(player.src(), sources[0].src, 'src is correct');
  // assert.deepEqual(player.currentSources(), sources, 'currentSources is correct');
  // when we are dealing with <source> elements mediaEl.src will be null
  if (checkMediaElSource) {
    assert.equal(mediaEl.src, sources[0].src, 'mediaEl.src is correct');
    assert.equal(mediaEl.getAttribute('src'), sources[0].src, 'mediaEl attribute is correct');
    assert.equal(tech.src(), sources[0].src, 'tech is correct');
  }
};

QUnit[qunitFn]('sourceset', function(hooks) {
  ['video el', 'change video el', 'audio el', 'change audio el'].forEach((testName) => {
    QUnit.module(`source before player - ${testName}`, {
      beforeEach() {
        sinon.stub(log, 'error');
        if (testName === 'change video el' || testName === 'change audio el') {
          Html5.prototype.movingMediaElementInDOM = false;
        }
        this.hook = (player) => player.on('sourceset', () => this.sourcesets++);
        videojs.hook('setup', this.hook);

        this.sourcesets = 0;
        this.fixture = document.getElementById('qunit-fixture');

        if ((/audio/i).test(testName)) {
          this.mediaEl = document.createElement('audio');
          this.testSrc = {
            src: 'http://vjs.zencdn.net/v/oceans.mp3',
            type: 'audio/mpeg'
          };
        } else {
          this.mediaEl = document.createElement('video');
          this.testSrc = {
            src: 'http://vjs.zencdn.net/v/oceans.mp4',
            type: 'video/mp4'
          };
        }
        this.sourceOne = {src: 'http://example.com/one.mp4', type: 'video/mp4'};
        this.sourceTwo = {src: 'http://example.com/two.mp4', type: 'video/mp4'};

        if ((/audio/).test(testName)) {
          this.sourceOne = {src: 'http://example.com/one.mp3', type: 'audio/mpeg'};
          this.sourceTwo = {src: 'http://example.com/two.mp3', type: 'audio/mpeg'};
        }

        this.mediaEl.className = 'video-js';
        this.fixture.appendChild(this.mediaEl);
      },
      afterEach(assert) {
        const done = assert.async();

        // reset sourceset to 0 so we can track if more happen
        this.sourcesets = 0;

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 0, 'no additional sourcesets');

          this.player.dispose();
          assert.equal(this.sourcesets, 0, 'no source set on dispose');

          videojs.removeHook('setup', this.hook);
          Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
          log.error.restore();
          done();
        }, wait);
      }
    });

    QUnit.test('data-setup x1', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.testSrc]}));
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('data-setup, x2', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('data-setup', JSON.stringify({sources: [this.sourceOne, this.sourceTwo]}));
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) x1', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {sources: [this.testSrc]});

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('videojs({sources: [...]}) x2', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl, {sources: [this.sourceOne, this.sourceTwo]});

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('player.src({...})', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);
      this.player.src(this.testSrc);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('player.src({...}) x2', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);
      this.player.src([this.sourceOne, this.sourceTwo]);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('mediaEl.src = ...;', function(assert) {
      const done = assert.async();

      this.mediaEl.src = this.testSrc.src;
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('mediaEl.setAttribute("src", ...)"', function(assert) {
      const done = assert.async();

      this.mediaEl.setAttribute('src', this.testSrc.src);
      this.player = videojs(this.mediaEl);

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('<source> x1', function(assert) {
      const done = assert.async();

      this.source = document.createElement('source');
      this.source.src = this.testSrc.src;
      this.source.type = this.testSrc.type;

      this.mediaEl.appendChild(this.source);

      this.player = videojs(this.mediaEl);
      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc]);
        done();
      });
    });

    QUnit.test('<source> x2', function(assert) {
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

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne, this.sourceTwo]);
        done();
      });
    });

    QUnit.test('no source', function(assert) {
      const done = assert.async();

      this.player = videojs(this.mediaEl);

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 0, 'no sourceset');
        done();
      }, wait);
    });

    QUnit.module(`source change - ${testName}`, {
      beforeEach(assert) {
        sinon.stub(log, 'error');
        const done = assert.async();

        if (testName === 'change video el' || testName === 'change audio el') {
          Html5.prototype.movingMediaElementInDOM = false;
        }

        this.hook = (player) => player.on('sourceset', () => this.sourcesets++);
        videojs.hook('setup', this.hook);

        this.sourcesets = 0;
        this.fixture = document.getElementById('qunit-fixture');

        if ((/audio/i).test(testName)) {
          this.mediaEl = document.createElement('audio');
          this.testSrc = {
            src: 'http://vjs.zencdn.net/v/oceans.mp3',
            type: 'audio/mpeg'
          };
        } else {
          this.mediaEl = document.createElement('video');
          this.testSrc = {
            src: 'http://vjs.zencdn.net/v/oceans.mp4',
            type: 'video/mp4'
          };
        }

        this.sourceOne = {src: 'http://example.com/one.mp4', type: 'video/mp4'};
        this.sourceTwo = {src: 'http://example.com/two.mp4', type: 'video/mp4'};

        if ((/audio/).test(testName)) {
          this.sourceOne = {src: 'http://example.com/one.mp3', type: 'audio/mpeg'};
          this.sourceTwo = {src: 'http://example.com/two.mp3', type: 'audio/mpeg'};
        }

        this.mediaEl.className = 'video-js';
        this.mediaEl.src = this.testSrc.src;
        this.fixture.appendChild(this.mediaEl);

        this.player = videojs(this.mediaEl);

        this.player.ready(() => {
          this.mediaEl = this.player.tech_.el();
        });

        // intial sourceset should happen on player.ready
        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.testSrc]);
          done();
        });
      },
      afterEach(assert) {
        const done = assert.async();

        // reset sourceset to 0 so we can track if more happen
        this.sourcesets = 0;

        window.setTimeout(() => {
          assert.equal(this.sourcesets, 0, 'no additional sourcesets');

          this.player.dispose();
          assert.equal(this.sourcesets, 0, 'no source set on dispose');

          videojs.removeHook('setup', this.hook);
          Html5.prototype.movingMediaElementInDOM = oldMovingMedia;
          log.error.restore();
          done();
        }, wait);
      }
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

    QUnit.test('mediaEl.load()', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.testSrc.src;
      source.type = this.testSrc.type;

      // the only way to unset a source, so that we use the source
      // elements instead
      this.mediaEl.removeAttribute('src');

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.testSrc], false);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceOne], false);
          done();
        });

        source.src = this.sourceOne.src;
        source.type = this.sourceOne.type;

        this.mediaEl.load();
      });

      this.mediaEl.appendChild(source);
      this.mediaEl.load();
    });

    QUnit.test('mediaEl.load() x2 at the same time', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = this.sourceOne.src;
      source.type = this.sourceOne.type;

      this.player.one('sourceset', () => {
        validateSource(assert, this.player, [this.sourceOne], false);

        this.player.one('sourceset', () => {
          validateSource(assert, this.player, [this.sourceTwo], false);
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

      window.setTimeout(() => {
        assert.equal(this.sourcesets, 1, 'does not trigger sourceset');
        done();
      }, wait);
    });
  });
});
