import sandbox from '../../../../apps/sandbox/package.json' with { type: 'json' };
import packageJson from '../../package.json' with { type: 'json' };

const { dependencies: sandboxDependencies, devDependencies: sandboxDevDependencies } = sandbox;

/**
 * Versions written into new projects. `videojs` follows this package, which releases in lockstep with the Video.js
 * packages; the registry pins its own items to the same version. The workbench is a copy of the sandbox's shell, so its
 * packages come from the sandbox manifest at build time. Tailwind, TypeScript, and Vite use workspace catalog or
 * toolchain aliases there, so they're pinned here.
 */
export const VERSIONS = {
  videojs: packageJson.version,
  baseUi: sandboxDependencies['@base-ui/react'],
  classVarianceAuthority: sandboxDependencies['class-variance-authority'],
  cn: sandboxDependencies.cn,
  heroicons: sandboxDependencies['@heroicons/react'],
  react: sandboxDevDependencies.react,
  reactTypes: sandboxDevDependencies['@types/react'],
  tailwind: '^4.3.3',
  typescript: '^7.0.2',
  vite: '^8.3.4',
  vitePluginReact: sandboxDevDependencies['@vitejs/plugin-react'],
} as const;
