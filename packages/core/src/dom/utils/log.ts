const warned = new Set<string>();

/** @internal */
export function logMissingFeature(displayName: string, featureName: string): void {
  if (!__DEV__) return;

  const key = `${displayName}:${featureName}`;
  if (warned.has(key)) return;

  warned.add(key);
  console.warn(`${displayName} requires ${featureName} feature`);
}
