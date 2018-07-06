/* eslint-env qunit */
import * as middleware from '../../../src/js/tech/middleware.js';
import sinon from 'sinon';
import window from 'global/window';

QUnit.module('Middleware', {
  beforeEach(assert) {
    this.clock = sinon.useFakeTimers();
  },
  afterEach(assert) {
    this.clock.restore();
  }
});

QUnit.test('middleware can be added with the use method', function(assert) {
  const myMw = {};
  const mwFactory = () => myMw;

  middleware.use('foo', mwFactory);

  assert.equal(middleware.getMiddleware('foo').pop(), mwFactory, 'we are able to add middleware');
});

QUnit.test('middleware get iterates through the middleware array in the right order', function(assert) {
  const cts = [];
  const durs = [];
  const foos = [];
  const mws = [
    {
      currentTime(ct) {
        cts.push(ct);
        return ct * 2;
      },
      duration(dur) {
        durs.push(dur);
        return dur + 2;
      },
      foo(f) {
        foos.push(f);
        return f / 2;
      }
    },
    {
      currentTime(ct) {
        cts.push(ct);
        return ct + 2;
      },
      duration(dur) {
        durs.push(dur);
        return dur / 2;
      },
      foo(f) {
        foos.push(f);
        return f + 3;
      }
    }
  ];
  const tech = {
    currentTime(ct) {
      return 5;
    },
    duration(dur) {
      return 5;
    },
    foo(f) {
      return 5;
    }
  };

  const ct = middleware.get(mws, tech, 'currentTime');
  const dur = middleware.get(mws, tech, 'duration');
  const foo = middleware.get(mws, tech, 'foo');

  const assertion = (actual, expected, actualArr, expectedArr, type) => {
    assert.equal(actual, expected, `our middleware chain return currectly for ${type}`);
    assert.deepEqual(actualArr, expectedArr, `we got called in the correct order for ${type}`);
  };

  assertion(ct, 14, cts, [5, 7], 'currentTime');
  assertion(dur, 4.5, durs, [5, 2.5], 'duration');
  assertion(foo, 4, foos, [5, 8], 'foo');
});

QUnit.test('middleware set iterates through the middleware array in the right order', function(assert) {
  const cts = [];
  const durs = [];
  const foos = [];
  const mws = [
    {
      currentTime(ct) {
        cts.push(ct);
        return ct * 2;
      },
      duration(dur) {
        durs.push(dur);
        return dur + 2;
      },
      foo(f) {
        foos.push(f);
        return f / 2;
      }
    },
    {
      currentTime(ct) {
        cts.push(ct);
        return ct + 2;
      },
      duration(dur) {
        durs.push(dur);
        return dur / 2;
      },
      foo(f) {
        foos.push(f);
        return f + 3;
      }
    }
  ];
  const tech = {
    currentTime(ct) {
      cts.push(ct);
      return ct / 2;
    },
    duration(dur) {
      durs.push(dur);
      return dur;
    },
    foo(f) {
      foos.push(f);
      return f;
    }
  };

  const ct = middleware.set(mws, tech, 'currentTime', 10);
  const dur = middleware.set(mws, tech, 'duration', 10);
  const foo = middleware.set(mws, tech, 'foo', 10);

  const assertion = (actual, expected, actualArr, expectedArr, type) => {
    assert.equal(actual, expected, `our middleware chain return currectly for ${type}`);
    assert.deepEqual(actualArr, expectedArr, `we got called in the correct order for ${type}`);
  };

  assertion(ct, 11, cts, [10, 20, 22], 'currentTime');
  assertion(dur, 6, durs, [10, 12, 6], 'duration');
  assertion(foo, 8, foos, [10, 5, 8], 'foo');
});

QUnit.test('middleware mediate iterates through the middleware array twice', function(assert) {
  let playsToTech = 0;
  let playsToPlayer = 0;
  let techPlays = 0;
  let techPlay;
  let pv1;
  let pv2;
  let pc1;
  let pc2;

  const mws = [{
    callPlay() {
      playsToTech++;
    },
    play(cancelled, value) {
      playsToPlayer++;
      pv1 = value;
      pc1 = cancelled;
    }
  }, {
    callPlay() {
      playsToTech++;
    },
    play(cancelled, value) {
      playsToPlayer++;
      pv2 = value;
      pc2 = cancelled;
    }
  }];
  const tech = {
    play() {
      techPlays++;
      techPlay = {then: () => {}};

      return techPlay;
    }
  };

  const pp = middleware.mediate(mws, tech, 'play');

  assert.equal(playsToTech, playsToPlayer, 'middleware got called the same number of times');
  assert.equal(playsToTech, 2, 'both middleware got called before the tech');
  assert.equal(techPlays, 1, 'the tech method only gets called once');
  assert.equal(playsToPlayer, 2, 'both middleware got called after the tech');

  assert.deepEqual(pv1.then, techPlay.then, 'the value returned by the tech is passed through the middleware');
  assert.deepEqual(pv2, techPlay, 'the value returned by the tech is passed through the middleware');
  assert.deepEqual(pp, techPlay, 'the value returned to the player is the value returned from the tech');
  assert.equal(pc1, false, 'the play has not been cancelled in middleware 1');
  assert.equal(pc2, false, 'the play has not been cancelled in middleware 2');
});

QUnit.test('middleware mediate allows and can detect cancellation', function(assert) {
  let playsToTech = 0;
  let playsToPlayer = 0;
  let techPlays = 0;
  let pv1;
  let pv2;
  let pc1;
  let pc2;

  const mws = [{
    callPlay() {
      playsToTech++;
    },
    play(cancelled, value) {
      playsToPlayer++;
      pv1 = value;
      pc1 = cancelled;
    }
  }, {
    callPlay() {
      playsToTech++;
      return middleware.TERMINATOR;
    },
    play(cancelled, value) {
      playsToPlayer++;
      pv2 = value;
      pc2 = cancelled;
    }
  }];
  const tech = {
    play() {
      techPlays++;
      return {then: () => {}};
    }
  };

  const pp = middleware.mediate(mws, tech, 'play');

  assert.equal(playsToTech, 2, 'both middleware run until middleware terminates');
  assert.equal(techPlays, 0, 'the tech should not be called if a middleware terminates');
  assert.equal(playsToPlayer, 2, 'both middleware run after the tech');

  assert.equal(pv1, null, 'null is returned through the middleware if a middleware terminated previously');
  assert.equal(pv2, null, 'null is returned through the middleware if a middleware terminated previously');
  assert.equal(pp, null, 'null is returned to the player if a middleware terminated previously');
  assert.equal(pc1, true, 'the play has been cancelled in middleware 1');
  assert.equal(pc2, true, 'the play has been cancelled in middleware 2');
});

QUnit.test('setSource is run asynchronously', function(assert) {
  let src;
  let acc;

  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, { src: 'foo', type: 'video/foo' }, function(_src, _acc) {
    src = _src;
    acc = _acc;
  });

  assert.equal(src, undefined, 'no src was returned yet');
  assert.equal(acc, undefined, 'no accumulator was returned yet');

  this.clock.tick(1);

  assert.deepEqual(src, {src: 'foo', type: 'video/foo'}, 'we got the same source back');
  assert.equal(acc.length, 0, 'we did not accumulate any middleware since there were none');
});

QUnit.test('setSource selects a source based on the middleware given', function(assert) {
  let src;
  let acc;
  const mw = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const fooFactory = () => mw;

  middleware.use('video/foo', fooFactory);

  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function(_src, _acc) {
    src = _src;
    acc = _acc;
  });

  this.clock.tick(1);

  assert.equal(src.type, 'video/mp4', 'we selected a new type of video/mp4');
  assert.equal(src.src, 'http://example.com/video.mp4', 'we selected a new src of video.mp4');
  assert.equal(acc.length, 1, 'we got one middleware');
  assert.equal(acc[0], mw, 'we chose the one middleware');

  middleware.getMiddleware('video/foo').pop();
});

QUnit.test('setSource can select multiple middleware from multiple types', function(assert) {
  let src;
  let acc;
  const foomw = {
    setSource(_src, next) {
      next(null, {
        src: 'bar',
        type: 'video/bar'
      });
    }
  };
  const barmw = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const fooFactory = () => foomw;
  const barFactory = () => barmw;

  middleware.use('video/foo', fooFactory);
  middleware.use('video/bar', barFactory);

  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function(_src, _acc) {
    src = _src;
    acc = _acc;
  });

  this.clock.tick(1);

  assert.equal(src.type, 'video/mp4', 'we selected a new type of video/mp4');
  assert.equal(src.src, 'http://example.com/video.mp4', 'we selected a new src of video.mp4');
  assert.equal(acc.length, 2, 'we got two middleware');
  assert.equal(acc[0], foomw, 'foomw is the first middleware');
  assert.equal(acc[1], barmw, 'barmw is the first middleware');

  middleware.getMiddleware('video/foo').pop();
  middleware.getMiddleware('video/bar').pop();
});

QUnit.test('setSource will select all middleware of a given type, until src change', function(assert) {
  let src;
  let acc;
  const foomw1 = {
    setSource(_src, next) {
      next(null, {
        src: 'bar',
        type: 'video/foo'
      });
    }
  };
  const foomw2 = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const foomw3 = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const fooFactory1 = () => foomw1;
  const fooFactory2 = () => foomw2;
  const fooFactory3 = () => foomw3;

  middleware.use('video/foo', fooFactory1);
  middleware.use('video/foo', fooFactory2);
  middleware.use('video/foo', fooFactory3);

  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function(_src, _acc) {
    src = _src;
    acc = _acc;
  });

  this.clock.tick(1);

  assert.equal(src.type, 'video/mp4', 'we selected a new type of video/mp4');
  assert.equal(src.src, 'http://example.com/video.mp4', 'we selected a new src of video.mp4');
  assert.equal(acc.length, 2, 'we got two middleware');
  assert.equal(acc[0], foomw1, 'foomw is the first middleware');
  assert.equal(acc[1], foomw2, 'foomw is the first middleware');

  middleware.getMiddleware('video/foo').pop();
  middleware.getMiddleware('video/foo').pop();
  middleware.getMiddleware('video/foo').pop();
});

QUnit.test('a middleware without a mediator method will not throw an error', function(assert) {
  let pauseCalled = 0;
  const myMw = {};
  const mwFactory = () => myMw;
  const mwFactory2 = () => ({
    pause() {
      pauseCalled++;
    }
  });

  middleware.mediate([mwFactory(), mwFactory2()], {pause: () => {}}, 'pause');

  assert.equal(pauseCalled, 1, 'pauseCalled was called once and no error was thrown');
});

QUnit.test('a middleware factory is not called on source change', function(assert) {
  let mwfactoryCalled = 0;
  const mw = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const fooFactory = () => {
    mwfactoryCalled++;
    return mw;
  };

  middleware.use('video/foo', fooFactory);

  // set "initial" source"
  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function() {});

  this.clock.tick(1);

  assert.equal(mwfactoryCalled, 1, 'the factory was called once');

  // "change" source
  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'bar', type: 'video/foo'}, function() {});

  this.clock.tick(1);

  assert.equal(mwfactoryCalled, 1, 'the factory was not called again');

  middleware.getMiddleware('video/foo').pop();
});

QUnit.test('a middleware factory is called on a new source with a new player', function(assert) {
  let mwfactoryCalled = 0;
  const mw = {
    setSource(_src, next) {
      next(null, {
        src: 'http://example.com/video.mp4',
        type: 'video/mp4'
      });
    }
  };
  const fooFactory = () => {
    mwfactoryCalled++;
    return mw;
  };

  middleware.use('video/foo', fooFactory);

  // set "initial" source with player vid1
  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function() {});

  this.clock.tick(1);

  assert.equal(mwfactoryCalled, 1, 'the factory was called once');

  // set "initial" source with player vid2
  middleware.setSource({
    id() {
      return 'vid2';
    },
    setTimeout: window.setTimeout
  }, {src: 'bar', type: 'video/foo'}, function() {});

  this.clock.tick(1);

  assert.equal(mwfactoryCalled, 2, 'the factory was called again');

  middleware.getMiddleware('video/foo').pop();
});

QUnit.test('a middleware without a setSource gets chosen implicitly', function(assert) {
  let mws = [];
  const mw = {
    currentTime(ct) {
    }
  };
  const mwFactory = () => mw;

  middleware.use('video/foo', mwFactory);

  middleware.setSource({
    id() {
      return 'vid1';
    },
    setTimeout: window.setTimeout
  }, {src: 'foo', type: 'video/foo'}, function(src, _mws) {
    mws = _mws;
  });

  this.clock.tick(1);

  assert.equal(mws.length, 1, 'we have 1 middleware set');

  middleware.getMiddleware('video/foo').pop();
});
