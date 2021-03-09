/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import window from 'global/window';
import * as middleware from '../../src/js/tech/middleware.js';
import videojs from '../../src/js/video.js';

const middleWareTerminations = ['terminates', 'does not-terminate'];
const playReturnValues = ['non-promise', 'promise'];

const mainModule = function(playReturnValue, middlewareTermination, subhooks) {
  subhooks.beforeEach(function(assert) {
    this.clock = sinon.useFakeTimers();
    this.techPlayCalls = 0;
    this.playsTerminated = 0;
    this.playTests = [];
    this.terminate = false;

    if (middlewareTermination === 'terminates') {
      this.terminate = true;
    }
    this.techPlay = () => {
      this.techPlayCalls++;

      if (playReturnValue === 'promise') {
        return window.Promise.resolve('foo');
      }
      return 'foo';
    };

    this.finish = function() {
      const done = assert.async(this.playTests.length);

      const singleFinish = (playValue, assertName) => {
        assert.equal(playValue, 'foo', `play call from - ${assertName} - is correct`);
        done();
      };

      this.playTests.forEach(function(test) {
        const playRetval = test.playRetval;
        const testName = test.assertName;

        if (typeof playRetval === 'string') {
          singleFinish(playRetval, testName);
        } else {
          playRetval.then((v) => {
            singleFinish(v, testName);
          });
        }
      });
    };

    this.checkState = (assertName, options = {}) => {
      const expectedState = videojs.mergeOptions({
        playCalls: 0,
        techLoaded: false,
        techReady: false,
        playerReady: false,
        changingSrc: false,
        playsTerminated: 0
      }, options);

      if (typeof options.techLoaded === 'undefined' && typeof options.techReady !== 'undefined') {
        expectedState.techLoaded = options.techReady;
      }

      const currentState = {
        playCalls: this.techPlayCalls,
        techLoaded: Boolean(this.player.tech_),
        techReady: Boolean((this.player.tech_ || {}).isReady_),
        playerReady: Boolean(this.player.isReady_),
        changingSrc: Boolean(this.player.changingSrc_),
        playsTerminated: Number(this.playsTerminated)
      };

      assert.deepEqual(currentState, expectedState, assertName);
    };

    this.playTerminatedQueue = () => this.playsTerminated++;

    this.playTest = (assertName, options = {}) => {
      if (this.player.playTerminatedQueue_ !== this.playTerminatedQueue) {
        this.player.runPlayTerminatedQueue_ = this.playTerminatedQueue;
      }
      if (this.player && this.player.tech_ && this.player.tech_.play !== this.techPlay) {
        this.player.tech_.play = this.techPlay;
      }
      this.playTests.push({assertName, playRetval: this.player.play()});
      this.checkState(assertName, options);
    };

    this.middleware = () => {
      return {
        // pass along source
        setSource(srcObj, next) {
          next(null, srcObj);
        },
        callPlay: () => {
          if (this.terminate) {
            return middleware.TERMINATOR;
          }
        }
      };
    };

    middleware.use('*', this.middleware);
  });

  subhooks.afterEach(function() {
    // remove added middleware
    const middlewareList = middleware.getMiddleware('*');

    for (let i = 0; i < middlewareList.length; i++) {
      if (middlewareList[i] === this.middleware) {
        middlewareList.splice(i, 1);
      }
    }
    if (this.player) {
      this.player.dispose();
    }
    this.clock.restore();
  });

  QUnit.test('Player#play() resolves correctly with dom sources and async tech ready', function(assert) {
    // turn of mediaLoader to prevent setting a tech right away
    // similar to settings sources in the DOM
    // turn off autoReady to prevent syncronous ready from the tech
    this.player = TestHelpers.makePlayer({mediaLoader: false, techFaker: {autoReady: false}});

    this.playTest('before anything is ready');

    this.player.src({
      src: 'http://example.com/video.mp4',
      type: 'video/mp4'
    });

    this.playTest('only changingSrc', {
      changingSrc: true
    });

    this.clock.tick(1);

    this.playTest('still changingSrc, tech loaded', {
      techLoaded: true,
      changingSrc: true
    });

    this.player.tech_.triggerReady();
    this.playTest('still changingSrc, tech loaded and ready', {
      techReady: true,
      changingSrc: true
    });
    this.clock.tick(1);

    this.playTest('done changingSrc, tech/player ready', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.clock.tick(1);

    this.checkState('state stays the same', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.playTest('future calls hit tech#play directly, unless terminated', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 2,
      playsTerminated: this.terminate ? 2 : 0
    });

    if (this.terminate) {
      this.terminate = false;

      this.playTest('play works if not terminated', {
        playerReady: true,
        techReady: true,
        playCalls: 1,
        playsTerminated: 2
      });

      this.playTest('future calls hit tech#play directly', {
        playerReady: true,
        techReady: true,
        playCalls: 2,
        playsTerminated: 2
      });
    }

    this.finish(assert);
  });

  QUnit.test('Player#play() resolves correctly with dom sources', function(assert) {
    this.player = TestHelpers.makePlayer({mediaLoader: false});

    this.playTest('before anything is ready');

    this.player.src({
      src: 'http://example.com/video.mp4',
      type: 'video/mp4'
    });

    this.playTest('only changingSrc', {
      changingSrc: true
    });

    this.clock.tick(1);

    this.playTest('still changingSrc, tech/player ready', {
      techLoaded: true,
      changingSrc: true,
      playerReady: true,
      techReady: true
    });

    this.clock.tick(1);

    this.playTest('done changingSrc, tech#play is called', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.clock.tick(1);

    this.checkState('state stays the same', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.playTest('future calls hit tech#play directly', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 2,
      playsTerminated: this.terminate ? 2 : 0
    });

    if (this.terminate) {
      this.terminate = false;

      this.playTest('play works if not terminated', {
        playerReady: true,
        techReady: true,
        playCalls: 1,
        playsTerminated: 2
      });

      this.playTest('future calls hit tech#play directly', {
        playerReady: true,
        techReady: true,
        playCalls: 2,
        playsTerminated: 2
      });
    }

    this.finish(assert);
  });

  QUnit.test('Player#play() resolves correctly with async tech ready', function(assert) {
    this.player = TestHelpers.makePlayer({techFaker: {autoReady: false}});

    this.playTest('before anything is ready', {
      techLoaded: true
    });

    this.player.src({
      src: 'http://example.com/video.mp4',
      type: 'video/mp4'
    });

    this.playTest('tech loaded changingSrc', {
      techLoaded: true,
      changingSrc: true
    });

    this.clock.tick(1);

    this.playTest('still changingSrc, tech loaded', {
      techLoaded: true,
      changingSrc: true
    });

    this.clock.tick(1);
    this.playTest('still changingSrc, tech loaded again', {
      techLoaded: true,
      changingSrc: true
    });

    this.player.tech_.triggerReady();
    this.playTest('still changingSrc, tech loaded and ready', {
      techReady: true,
      changingSrc: true
    });
    this.clock.tick(1);

    this.playTest('still changingSrc tech/player ready', {
      changingSrc: true,
      playerReady: true,
      techReady: true
    });

    // player ready calls fire now
    // which sets changingSrc_ to false
    this.clock.tick(1);

    this.checkState('play was called on ready', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.playTest('future calls hit tech#play directly', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 2,
      playsTerminated: this.terminate ? 2 : 0
    });

    if (this.terminate) {
      this.terminate = false;

      this.playTest('play works if not terminated', {
        playerReady: true,
        techReady: true,
        playCalls: 1,
        playsTerminated: 2
      });

      this.playTest('future calls hit tech#play directly', {
        playerReady: true,
        techReady: true,
        playCalls: 2,
        playsTerminated: 2
      });
    }

    this.finish(assert);
  });

  QUnit.test('Player#play() resolves correctly', function(assert) {
    this.player = TestHelpers.makePlayer();

    this.playTest('player/tech start out ready', {
      techReady: true,
      playerReady: true
    });

    this.player.src({
      src: 'http://example.com/video.mp4',
      type: 'video/mp4'
    });

    this.playTest('now changingSrc', {
      techReady: true,
      playerReady: true,
      changingSrc: true
    });

    this.clock.tick(1);

    this.playTest('done changingSrc, play called if not terminated', {
      techReady: true,
      playerReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.clock.tick(2);

    this.checkState('state stays the same', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 1,
      playsTerminated: this.terminate ? 1 : 0
    });

    this.playTest('future calls hit tech#play directly', {
      playerReady: true,
      techReady: true,
      playCalls: this.terminate ? 0 : 2,
      playsTerminated: this.terminate ? 2 : 0
    });

    if (this.terminate) {
      this.terminate = false;

      this.playTest('play works if not terminated', {
        playerReady: true,
        techReady: true,
        playCalls: 1,
        playsTerminated: 2
      });

      this.playTest('future calls hit tech#play directly', {
        playerReady: true,
        techReady: true,
        playCalls: 2,
        playsTerminated: 2
      });
    }

    this.clock.tick(1000);

    this.finish(assert);
  });

  // without enableSourceset this test will fail.
  QUnit.test('Player#play() resolves correctly on tech el src', function(assert) {
    this.player = TestHelpers.makePlayer({techOrder: ['html5'], enableSourceset: true});

    this.playTest('player/tech start out ready', {
      techReady: true,
      playerReady: true
    });

    this.player.tech_.el_.src = 'http://vjs.zencdn.net/v/oceans.mp4';

    this.player.on('loadstart', () => {
      this.checkState('play should have been called', {
        techReady: true,
        playerReady: true,
        playCalls: 1
      });

      this.finish(assert);
    });
  });
};

QUnit.module('Player#play()', (hooks) => {
  playReturnValues.forEach((playReturnValue) => {
    middleWareTerminations.forEach((middlewareTermination) => {
      QUnit.module(`tech#play() => ${playReturnValue}, middleware ${middlewareTermination}`, (subhooks) => {
        mainModule(playReturnValue, middlewareTermination, subhooks);
      });
    });
  });
});
