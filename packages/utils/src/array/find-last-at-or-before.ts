/** Finds the index of the last ordered item whose value is at or before the target, or `-1` if none exists. */
export function findLastIndexAtOrBefore<Item>(
  items: readonly Item[],
  value: number,
  getValue: (item: Item) => number
): number {
  let low = 0;
  let high = items.length - 1;
  let index = -1;

  while (low <= high) {
    const mid = (low + high) >>> 1;

    if (getValue(items[mid]!) <= value) {
      index = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return index;
}

/**
 * Finds the last ordered item whose value is at or before the target.
 *
 * @internal
 */
export function findLastAtOrBefore<Item>(
  items: readonly Item[],
  value: number,
  getValue: (item: Item) => number
): Item | undefined {
  const index = findLastIndexAtOrBefore(items, value, getValue);

  return index < 0 ? undefined : items[index];
}
