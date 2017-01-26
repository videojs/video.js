/* eslint-env qunit */
import {filterSource} from '../../../src/js/utils/filter-source';

QUnit.module('utils/filter-source');

QUnit.test('invalid sources', function(assert) {
  assert.equal(filterSource(null), null, 'null source is filtered to null');
  assert.equal(filterSource(undefined), null, 'undefined source is filtered to null');
  assert.equal(filterSource(''), null, 'empty string source is filtered to null');
  assert.equal(filterSource(1), null, 'number source is filtered to null');
  assert.equal(filterSource([]), null, 'empty array source is filtered to null');
  assert.equal(filterSource(new Date()), null, 'Date source is filtered to null');
  assert.equal(filterSource(new RegExp()), null, 'RegExp source is filtered to null');
  assert.equal(filterSource(true), null, 'true boolean source is filtered to null');
  assert.equal(filterSource(false), null, 'false boolean source is filtered to null');
  assert.equal(filterSource([null]), null, 'invalid array source is filtered to null');
  assert.equal(filterSource([undefined]), null, 'invalid array source is filtered to null');
  assert.equal(filterSource([{src: 1}]), null, 'invalid array source is filtered to null');
  assert.equal(filterSource({}), null, 'empty object source is filtered to null');
  assert.equal(filterSource({src: 1}), null, 'invalid object source is filtered to null');
  assert.equal(filterSource({src: ''}), null, 'invalid object source is filtered to null');
  assert.equal(filterSource({src: null}), null, 'invalid object source is filtered to null');
  assert.equal(filterSource({url: 1}), null, 'invalid object source is filtered to null');
});

QUnit.test('valid sources', function(assert) {
  assert.deepEqual(filterSource('some-url'), {src: 'some-url'}, 'string source filters to object');
  assert.deepEqual(filterSource({src: 'some-url'}), {src: 'some-url'}, 'valid source filters to itself');
  assert.deepEqual(filterSource([{src: 'some-url'}]), [{src: 'some-url'}], 'valid source filters to itself');
  assert.deepEqual(filterSource([{src: 'some-url'}, {src: 'some-url2'}]), [{src: 'some-url'}, {src: 'some-url2'}], 'valid source filters to itself');
  assert.deepEqual(filterSource(['some-url', {src: 'some-url2'}]), [{src: 'some-url'}, {src: 'some-url2'}], 'mixed array filters to object array');
  assert.deepEqual(filterSource(['some-url', undefined, {src: 'some-url2'}]), [{src: 'some-url'}, {src: 'some-url2'}], 'mostly-valid array filters to valid object array');
});

QUnit.test('Dont filter extra object properties', function(assert) {
  assert.deepEqual(
    filterSource({src: 'some-url', type: 'some-type'}),
    {src: 'some-url', type: 'some-type'},
    'string source filters to object'
  );
});
