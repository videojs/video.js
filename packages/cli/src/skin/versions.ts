import packageJson from '../../package.json' with { type: 'json' };

/**
 * Versions written into new projects. `videojs` follows this package, which releases in lockstep with the Video.js
 * packages; the registry pins its own items to the same version.
 */
export const VERSIONS = {
  videojs: packageJson.version,
  baseUi: '^1.6.0',
  classVarianceAuthority: '^0.7.1',
  cn: '^0.4.0',
  heroicons: '^2.2.0',
  react: '^19.3.0',
  reactTypes: '^19.3.0',
  tailwind: '^4.3.3',
  typescript: '^7.0.2',
  vite: '^8.3.4',
  vitePluginReact: '^6.1.2',
} as const;
