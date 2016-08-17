/* eslint-env qunit */
import toTitleCase from '../../../src/js/utils/to-title-case.js';

QUnit.module('to-title-case');

QUnit.test('should make a string start with an uppercase letter', function(assert) {
  const foo = toTitleCase('bar');

  assert.ok(foo === 'Bar');
});
