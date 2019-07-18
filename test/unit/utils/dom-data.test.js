/* eslint-env qunit */
import document from 'global/document';
import * as DomData from '../../../src/js/utils/dom-data';

QUnit.module('dom-data');

QUnit.test('should get and remove data from an element', function(assert) {
  const el = document.createElement('div');
  const data = DomData.getData(el);

  assert.strictEqual(typeof data, 'object', 'data object created');

  // Add data
  const testData = {asdf: 'fdsa'};

  data.test = testData;
  assert.strictEqual(DomData.getData(el).test, testData, 'data added');

  // Remove all data
  DomData.removeData(el);

  assert.notOk(DomData.hasData(el), 'cached item emptied');
});
