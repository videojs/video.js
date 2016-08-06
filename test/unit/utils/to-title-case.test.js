/* eslint-env qunit */
import toTitleCase from '../../../src/js/utils/to-title-case.js';

QUnit.module('to-title-case');

QUnit.test('should make a string start with an uppercase letter', function() {
  const foo = toTitleCase('bar');

  QUnit.ok(foo === 'Bar');
});
