/* eslint-env qunit */
import toTitleCase, { titleCaseEquals } from '../../../src/js/utils/to-title-case.js';

QUnit.module('to-title-case');

QUnit.test('should make a string start with an uppercase letter', function(assert) {
  const foo = toTitleCase('bar');

  assert.ok(foo === 'Bar');
});

QUnit.test('titleCaseEquals compares whether the TitleCase of two strings is equal', function(assert) {
  assert.ok(titleCaseEquals('foo', 'foo'), 'foo equals foo');
  assert.ok(titleCaseEquals('foo', 'Foo'), 'foo equals Foo');
  assert.ok(titleCaseEquals('Foo', 'foo'), 'Foo equals foo');
  assert.ok(titleCaseEquals('Foo', 'Foo'), 'Foo equals Foo');

  assert.ok(titleCaseEquals('fooBar', 'fooBar'), 'fooBar equals fooBar');
  assert.notOk(titleCaseEquals('fooBAR', 'fooBar'), 'fooBAR does not equal fooBar');
  assert.notOk(titleCaseEquals('foobar', 'fooBar'), 'foobar does not equal fooBar');
  assert.notOk(titleCaseEquals('fooBar', 'FOOBAR'), 'fooBar does not equal fooBAR');
});
