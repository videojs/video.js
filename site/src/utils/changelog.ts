interface ChangelogSortKey {
  date: Date;
  version: string;
}

/** Newest first: by date, then by version so a release on the same day ranks above its prereleases. */
export function compareChangelogEntries(a: ChangelogSortKey, b: ChangelogSortKey): number {
  return b.date.valueOf() - a.date.valueOf() || compareVersions(b.version, a.version);
}

/** Compare `x.y.z[-prerelease]` versions by semver precedence. */
export function compareVersions(a: string, b: string): number {
  const [aCore, aPre] = splitVersion(a);
  const [bCore, bPre] = splitVersion(b);

  for (let index = 0; index < 3; index++) {
    const difference = (aCore[index] ?? 0) - (bCore[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }

  if (aPre.length === 0 || bPre.length === 0) return Math.sign(bPre.length - aPre.length);

  for (let index = 0; index < Math.max(aPre.length, bPre.length); index++) {
    const aPart = aPre[index];
    const bPart = bPre[index];
    if (aPart === undefined || bPart === undefined) return aPart === undefined ? -1 : 1;

    const numeric = /^\d+$/.test(aPart) && /^\d+$/.test(bPart);
    const difference = numeric ? Number(aPart) - Number(bPart) : aPart.localeCompare(bPart);
    if (difference !== 0) return Math.sign(difference);
  }

  return 0;
}

function splitVersion(version: string): [number[], string[]] {
  const [core = '', prerelease] = version.split(/-(.*)/s);

  return [core.split('.').map(Number), prerelease ? prerelease.split('.') : []];
}
