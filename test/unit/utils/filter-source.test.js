/* eslint-env qunit */
import filterSource from '../../../src/js/utils/filter-source';

QUnit.module('utils/filter-source');

QUnit.test('invalid sources', function(assert) {
  assert.deepEqual(filterSource(null), [], 'null source is filtered to []');
  assert.deepEqual(filterSource(undefined), [], 'undefined source is filtered to []');
  assert.deepEqual(filterSource(''), [], 'empty string source is filtered to []');
  assert.deepEqual(filterSource(' '), [], 'bad string source is filtered to []');
  assert.deepEqual(filterSource(1), [], 'number source is filtered to []');
  assert.deepEqual(filterSource([]), [], 'empty array source is filtered to []');
  assert.deepEqual(filterSource([[]]), [], 'empty array source is filtered to []');
  assert.deepEqual(filterSource(new Date()), [], 'Date source is filtered to []');
  assert.deepEqual(filterSource(new RegExp()), [], 'RegExp source is filtered to []');
  assert.deepEqual(filterSource(true), [], 'true boolean source is filtered to []');
  assert.deepEqual(filterSource(false), [], 'false boolean source is filtered to []');
  assert.deepEqual(filterSource([null]), [], 'invalid array source is filtered to []');
  assert.deepEqual(filterSource([undefined]), [], 'invalid array source is filtered to []');
  assert.deepEqual(filterSource([{src: 1}]), [], 'invalid array source is filtered to []');
  assert.deepEqual(filterSource({}), [], 'empty object source is filtered to []');
  assert.deepEqual(filterSource({src: 1}), [], 'invalid object source is filtered to []');
  assert.deepEqual(filterSource({src: ''}), [], 'invalid object source is filtered to []');
  assert.deepEqual(filterSource({src: null}), [], 'invalid object source is filtered to []');
  assert.deepEqual(filterSource({url: 1}), [], 'invalid object source is filtered to []');
});

QUnit.test('valid sources', function(assert) {
  assert.deepEqual(
    filterSource('some-url'),
    [{src: 'some-url'}],
    'string source filters to object'
  );
  assert.deepEqual(
    filterSource({src: 'some-url'}),
    [{src: 'some-url'}],
    'valid source filters to itself'
  );
  assert.deepEqual(
    filterSource([{src: 'some-url'}]),
    [{src: 'some-url'}],
    'valid source filters to itself'
  );
  assert.deepEqual(
    filterSource([{src: 'some-url'}, {src: 'some-url2'}]),
    [{src: 'some-url'}, {src: 'some-url2'}],
    'valid source filters to itself'
  );
  assert.deepEqual(
    filterSource(['some-url', {src: 'some-url2'}]),
    [{src: 'some-url'}, {src: 'some-url2'}],
    'mixed array filters to object array'
  );
  assert.deepEqual(
    filterSource(['some-url', undefined, {src: 'some-url2'}]),
    [{src: 'some-url'}, {src: 'some-url2'}],
    'mostly-valid array filters to valid object array'
  );
  assert.deepEqual(
    filterSource([[{src: 'some-url'}]]),
    [{src: 'some-url'}],
    'nested array filters to flattened array itself'
  );

  assert.deepEqual(
    filterSource([[[{src: 'some-url'}]]]),
    [{src: 'some-url'}],
    'double nested array filters to flattened array'
  );

  assert.deepEqual(
    filterSource([{src: 'some-url2'}, [{src: 'some-url'}], undefined]),
    [{src: 'some-url2'}, {src: 'some-url'}],
    'nested array filters to flattened array'
  );

  assert.deepEqual(
    filterSource([[{src: 'some-url2'}], [[[{src: 'some-url'}]]], [undefined]]),
    [{src: 'some-url2'}, {src: 'some-url'}],
    'nested array filters to flattened array in correct order'
  );
});

QUnit.test('Order is maintained', function(assert) {
  assert.deepEqual(
    filterSource([{src: 'one'}, {src: 'two'}, {src: 'three'}, undefined]),
    [{src: 'one'}, {src: 'two'}, {src: 'three'}],
    'source order is maintained for array'
  );

  assert.deepEqual(
    filterSource([{src: 'one'}, {src: 'two'}, {src: 'three'}, undefined]),
    [{src: 'one'}, {src: 'two'}, {src: 'three'}],
    'source order is maintained for array'
  );

  assert.deepEqual(
    filterSource([null, [{src: 'one'}], [[[{src: 'two'}]]], {src: 'three'}, undefined]),
    [{src: 'one'}, {src: 'two'}, {src: 'three'}],
    'source order is maintained for mixed nested arrays'
  );

});

QUnit.test('Dont filter extra object properties', function(assert) {
  assert.deepEqual(
    filterSource({src: 'some-url', type: 'some-type'}),
    [{src: 'some-url', type: 'some-type'}],
    'type key is maintained'
  );

  assert.deepEqual(
    filterSource({src: 'some-url', type: 'some-type', foo: 'bar'}),
    [{src: 'some-url', type: 'some-type', foo: 'bar'}],
    'foo and bar keys are maintained'
  );

  assert.deepEqual(
    filterSource([{src: 'some-url', type: 'some-type', foo: 'bar'}]),
    [{src: 'some-url', type: 'some-type', foo: 'bar'}],
    'foo and bar keys are not removed'
  );

});

QUnit.test('SourceObject type is filled with default values when extension is known', function(assert) {
  assert.deepEqual(
    filterSource('some-url.mp4'),
    [{src: 'some-url.mp4', type: 'video/mp4'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource('some-url.ogv'),
    [{src: 'some-url.ogv', type: 'video/ogg'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource('some-url.aac'),
    [{src: 'some-url.aac', type: 'audio/aac'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource({src: 'some-url.mp4'}),
    [{src: 'some-url.mp4', type: 'video/mp4'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource({src: 'some-url.ogv'}),
    [{src: 'some-url.ogv', type: 'video/ogg'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource([{src: 'some-url.MP4'}, {src: 'some-url.OgV'}, {src: 'some-url.AaC'}]),
    [{src: 'some-url.MP4', type: 'video/mp4'}, {src: 'some-url.OgV', type: 'video/ogg'}, {src: 'some-url.AaC', type: 'audio/aac'}],
    'string source filters to object'
  );
});

QUnit.test('SourceObject type is not filled when extension is unknown', function(assert) {
  assert.deepEqual(
    filterSource('some-url.ppp'),
    [{src: 'some-url.ppp'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource('some-url.a'),
    [{src: 'some-url.a'}],
    'string source filters to object'
  );

  assert.deepEqual(
    filterSource('some-url.mp8'),
    [{src: 'some-url.mp8'}],
    'string source filters to object'
  );
});

QUnit.test('SourceObject type is not changed when type exists', function(assert) {
  assert.deepEqual(
    filterSource({src: 'some-url.aac', type: 'video/zzz'}),
    [{src: 'some-url.aac', type: 'video/zzz'}],
    'string source filters to object'
  );
});
