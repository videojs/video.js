/* eslint-env qunit */
import mergeOptions from '../../../src/js/utils/merge-options.js';

QUnit.module('merge-options');

QUnit.test('should merge options objects', function(assert) {
  const ob1 = {
    a: true,
    b: { b1: true, b2: true, b3: true },
    c: true
  };

  const ob2 = {
    // override value
    a: false,
    // merge sub-option values
    b: { b1: true, b2: false, b4: true },
    // add new option
    d: true
  };

  const ob3 = mergeOptions(ob1, ob2);

  assert.deepEqual(ob3, {
    a: false,
    b: { b1: true, b2: false, b3: true, b4: true },
    c: true,
    d: true
  }, 'options objects merged correctly');
});

QUnit.test('should ignore non-objects', function(assert) {
  const obj = { a: 1 };

  assert.deepEqual(mergeOptions(obj, true), obj, 'ignored non-object input');
});
