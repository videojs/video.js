/* eslint-env qunit */
import document from 'global/document';
import * as DomData from '../../../src/js/utils/dom-data';
import videojs from '../../../src/js/video.js';

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

let memoryTestRun = false;

QUnit.done(function(details) {
  // don't run the extra dom data test on failures, there will likely be
  // memory leaks
  if (details.failed || memoryTestRun) {
    return;
  }

  // TODO: fix memory leaks on the following
  if (videojs.browser.IS_SAFARI || videojs.browser.IS_EDGE || videojs.browser.IE_VERSION) {
    return;
  }

  memoryTestRun = true;

  QUnit.module('dom-data memory');

  /**
   * If this test fails you will want to add a debug statement
   * in DomData.getData with the `id`. For instance if DomData.elData
   * had 2 objects in it {5: {...}, 2003: {...} you would add:
   *
   * ```js
   * if (id === 5) {
   *   debugger;
   * }
   * ```
   * to the tests to see what test. Then re-run the tests to see
   * what leaking and where.
   *
   * > Note that the id can be off by 1-2 in either direction
   *   for larger guids, so you may have to account for that.
   */
  QUnit.test('Memory is not leaking', function(assert) {
    if (Object.keys(DomData.elData).length > 0) {
      videojs.domData = DomData;
    }
    assert.equal(Object.keys(DomData.elData).length, 0, 'no leaks, check videojs.domData.elData if failure');
  });
});
