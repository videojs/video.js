/* eslint-env qunit */
import TestHelpers from './test-helpers.js';

QUnit.module('ErrorDisplay');

QUnit.test('should update errorDisplay when several errors occur in succession', function(assert) {
  const player = TestHelpers.makePlayer({ techOrder: ['html5'] });
  const events = {
    beforemodalopen: 0,
    beforemodalclose: 0,
    modalopen: 0,
    modalclose: 0
  };

  player.errorDisplay.on(
    ['beforemodalopen', 'beforemodalclose', 'modalopen', 'modalclose'],
    ({ type }) => {
      events[type] += 1;
    }
  );

  // Dummy case for initial state
  assert.strictEqual(player.error(), null, 'error is null');
  assert.strictEqual(
    player.errorDisplay.contentEl().textContent,
    '',
    'error display contentEl textContent is empty'
  );
  assert.strictEqual(events.beforemodalopen, 0, 'beforemodalopen was not called');
  assert.strictEqual(events.modalopen, 0, 'modalopen was not called');
  assert.strictEqual(events.beforemodalclose, 0, 'beforemodalclose was not called');
  assert.strictEqual(events.modalclose, 0, 'modalclose was not called');

  // Case for first error
  player.error('Error 1');

  assert.strictEqual(player.error().message, 'Error 1', 'error has message');
  assert.strictEqual(
    player.errorDisplay.contentEl().textContent,
    'Error 1',
    'error display contentEl textContent has content'
  );
  assert.strictEqual(events.beforemodalopen, 1, 'beforemodalopen was called once');
  assert.strictEqual(events.modalopen, 1, 'modalopen was called once');
  assert.strictEqual(events.beforemodalclose, 0, 'beforemodalclose was not called');
  assert.strictEqual(events.modalclose, 0, 'modalclose was not called');

  // Case for second error
  player.error('Error 2');

  assert.strictEqual(player.error().message, 'Error 2', 'error has new message');
  assert.strictEqual(
    player.errorDisplay.contentEl().textContent,
    'Error 2',
    'error display contentEl textContent has been updated with the new error message'
  );
  assert.strictEqual(events.beforemodalopen, 1, 'beforemodalopen was called once');
  assert.strictEqual(events.modalopen, 1, 'modalopen has been called once');
  assert.strictEqual(events.beforemodalclose, 0, 'beforemodalclose was not called');
  assert.strictEqual(events.modalclose, 0, 'modalclose was not called');

  player.dispose();
});
