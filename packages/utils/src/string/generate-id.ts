/**
 * Generate a unique-ish string ID via timestamp + random.
 *
 * @example
 *   const id = generateId(); // "1738423156789-542891"
 *
 * @returns String in `timestamp-random` format (e.g. `"1738423156789-542891"`).
 * @internal
 */
export function generateId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
