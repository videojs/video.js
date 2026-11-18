import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkBudgets } from '../bundle-size-budget.js';

function entry(name, size, extra = {}) {
  return { name, size, type: 'subpath', format: 'js', ...extra };
}

describe('checkBudgets', () => {
  it('passes an entry at or under its budget', () => {
    const results = checkBudgets([entry('a', 100)], { a: 100 });

    assert.deepEqual(results, [{ name: 'a', size: 100, budget: 100, ok: true }]);
  });

  it('fails an entry over its budget', () => {
    const [result] = checkBudgets([entry('a', 101)], { a: 100 });

    assert.equal(result.ok, false);
  });

  it('ignores lazy chunks', () => {
    const [result] = checkBudgets(
      [entry('a', 100, { lazySize: 50_000, totalSize: 50_100 })],
      { a: 100 },
    );

    assert.equal(result.ok, true);
  });

  it('fails a budgeted entry that was not measured', () => {
    const [result] = checkBudgets([entry('b', 1)], { a: 100 });

    assert.deepEqual(result, {
      name: 'a',
      size: undefined,
      budget: 100,
      ok: false,
    });
  });

});
