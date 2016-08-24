/* eslint-env qunit */
import window from 'global/window';
import MediaError from '../../src/js/media-error';

const isModernBrowser = window.MediaError && Object.create && Object.defineProperty;

/**
 * Creates a real native MediaError object.
 *
 * @param  {Number} code
 * @param  {String} [message]
 * @return {MediaError}
 */
const createNativeMediaError = (code, message) => {
  const err = Object.create(window.MediaError);

  Object.defineProperty(err, 'code', {value: code});

  if (message) {
    err.message = message;
  }

  return err;
};

QUnit.module('MediaError');

QUnit.test('can be constructed from a number', function(assert) {
  const mediaError = new MediaError(1);

  assert.strictEqual(mediaError.code, 1);
  assert.strictEqual(mediaError.message, MediaError.defaultMessages['1']);
});

QUnit.test('can be constructed from a string', function(assert) {
  const mediaError = new MediaError('hello, world');

  assert.strictEqual(mediaError.code, 0);
  assert.strictEqual(mediaError.message, 'hello, world');
});

QUnit.test('can be constructed from an object', function(assert) {
  const mediaError = new MediaError({code: 2});
  const mediaErrorMsg = new MediaError({code: 2, message: 'hello, world'});

  assert.strictEqual(mediaError.code, 2);
  assert.strictEqual(mediaError.message, MediaError.defaultMessages['2']);
  assert.strictEqual(mediaErrorMsg.code, 2);
  assert.strictEqual(mediaErrorMsg.message, 'hello, world');
});

if (isModernBrowser) {
  QUnit.test('can be constructed from a native MediaError object', function(assert) {
    const mediaError = new MediaError(createNativeMediaError(3));
    const mediaErrorMsg = new MediaError(createNativeMediaError(4, 'hello, world'));

    assert.strictEqual(mediaError.code, 3);
    assert.strictEqual(mediaError.message, MediaError.defaultMessages['3']);
    assert.strictEqual(mediaErrorMsg.code, 4);
    assert.strictEqual(mediaErrorMsg.message, 'hello, world');
  });
}

QUnit.test('can be constructed redundantly', function(assert) {
  const mediaError = new MediaError(2);
  const redundantMediaError = new MediaError(mediaError);

  assert.strictEqual(redundantMediaError, mediaError);
});
