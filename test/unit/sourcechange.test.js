/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import document from 'global/document';
import window from 'global/window';

const testSrc = {
  src: 'http://vjs.zencdn.net/v/oceans.mp4',
  type: 'video/mp4'
};

const wait = 100;

if (videojs.browser.IE_VERSION !== 8) {
  QUnit.module('sourcechange', function() {
    QUnit.module('videojs sources', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';

        this.fixture.appendChild(this.video);

        this.player = videojs(this.video, {sources: [testSrc]});
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.module('single source', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';

        this.source = document.createElement('source');
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.video.appendChild(this.source);
        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('source.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.source.src = testSrc.src;
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.module('double source', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';

        this.source = document.createElement('source');
        this.source.src = testSrc.src;
        this.source.type = testSrc.type;

        this.source2 = document.createElement('source');
        this.source2.src = testSrc.src;
        this.source2.type = testSrc.type;

        this.video.appendChild(this.source);
        this.video.appendChild(this.source2);
        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();

            // the sources also change
            const sources = this.video.getElementsByTagName('source');

            this.source = sources[0];
            this.source2 = sources[1];
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('remove source should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.removeChild(this.source2);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.module('video.src', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';
        this.video.src = testSrc.src;

        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.module('source after init', {
      beforeEach() {
        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';

        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.video = this.player.tech(true).el();
        }

      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 0, 'does not trigger sourcechange');

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        this.player.src(testSrc);

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 0, 'does not trigger sourcechange');

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        this.video.src = testSrc.src;
        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 0, 'does not trigger sourcechange');

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        this.video.setAttribute('src', testSrc.src);
        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
          done();
        }, wait);
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 0, 'does not trigger sourcechange');
        const source2 = document.createElement('source');

        source2.src = testSrc.src;
        source2.type = testSrc.type;

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        this.video.appendChild(source2);
        this.video.load();

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
          done();
        }, wait);
      }, wait);
    });

    QUnit.module('video.setAttribute', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';
        this.video.setAttribute('src', testSrc.src);

        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.module('player.src', {
      beforeEach(assert) {
        const done = assert.async();

        this.fixture = document.getElementById('qunit-fixture');

        this.video = document.createElement('video');
        this.video.className = 'video-js';

        this.fixture.appendChild(this.video);

        this.player = videojs(this.video);
        this.player.src(testSrc);

        this.sourcechanges = 0;
        this.player.on('sourcechange', () => this.sourcechanges++);

        // IOS changes the underlying video element
        // when the tech is ready
        if (videojs.browser.IS_IOS) {
          this.player.ready(() => {
            this.video = this.player.tech(true).el();
          });
        }

        window.setTimeout(() => {
          assert.equal(this.sourcechanges, 0, 'no initial sourcechange');
          done();
        }, wait);
      },
      afterEach() {
        this.player.dispose();
      }
    });

    QUnit.test('player.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.player.src(testSrc);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.src = testSrc.src;

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('video.setAttribute src should trigger sourcechange', function(assert) {
      const done = assert.async();

      this.video.setAttribute('src', testSrc.src);

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });

    QUnit.test('add source should trigger sourcechange', function(assert) {
      const done = assert.async();
      const source = document.createElement('source');

      source.src = testSrc.src;
      source.type = testSrc.type;

      this.video.appendChild(source);
      this.video.load();

      window.setTimeout(() => {
        assert.equal(this.sourcechanges, 1, 'triggers sourcechange');
        done();
      }, wait);
    });
  });
}
