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

QUnit.test('middleware get iterates through the middleware array the right order', function(assert) {
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

QUnit.test('middleware set iterates through the middleware array the right order', function(assert) {
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

QUnit.test('setSource is run asynchronously', function(assert) {
  let src;
  let acc;

  middleware.setSource({
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
});
