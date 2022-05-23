/* eslint-env qunit */
import * as Str from '../../../src/js/utils/str.js';

QUnit.module('utils/str');

QUnit.test('toTitleCase should make a string start with an uppercase letter', function(assert) {
  const foo = Str.toTitleCase('bar');

  assert.ok(foo === 'Bar');
});

QUnit.test('titleCaseEquals compares whether the TitleCase of two strings is equal', function(assert) {
  assert.ok(Str.titleCaseEquals('foo', 'foo'), 'foo equals foo');
  assert.ok(Str.titleCaseEquals('foo', 'Foo'), 'foo equals Foo');
  assert.ok(Str.titleCaseEquals('Foo', 'foo'), 'Foo equals foo');
  assert.ok(Str.titleCaseEquals('Foo', 'Foo'), 'Foo equals Foo');

  assert.ok(Str.titleCaseEquals('fooBar', 'fooBar'), 'fooBar equals fooBar');
  assert.notOk(Str.titleCaseEquals('fooBAR', 'fooBar'), 'fooBAR does not equal fooBar');
  assert.notOk(Str.titleCaseEquals('foobar', 'fooBar'), 'foobar does not equal fooBar');
  assert.notOk(Str.titleCaseEquals('fooBar', 'FOOBAR'), 'fooBar does not equal fooBAR');
});

QUnit.test('toLowerCase should make a string start with a lowercase letter', function(assert) {
  const foo = Str.toLowerCase('BAR');

  assert.ok(foo === 'bAR');
});
