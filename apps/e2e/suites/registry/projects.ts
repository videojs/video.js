/** The tool that scaffolds, builds, and serves a consumer. Bundler compatibility is a property of the packages. */
export type RegistryConsumerBundler = 'next' | 'vite' | 'webpack' | 'rspack';

interface RegistryConsumerProjectBase {
  readonly name: string;
  readonly directory: string;
  readonly port: number;
  readonly bundler: RegistryConsumerBundler;
  readonly theme: 'default' | 'neutral' | 'compat';
}

export type RegistryConsumerProject = RegistryConsumerProjectBase &
  (
    | { readonly framework: 'react'; readonly styling: 'css' | 'tailwind' }
    | { readonly framework: 'html'; readonly styling: 'css' }
  );

/** The on-demand skins every theme catalog publishes under the same item names. */
export const registryConsumerSkins = ['video', 'audio'] as const;

/** Smallest consumer that proves generated source works with the exact package versions published to npm. */
export const publishedRegistryConsumerProject = {
  name: 'next-react-tailwind-published',
  directory: 'next-react-tailwind-published',
  framework: 'react',
  styling: 'tailwind',
  theme: 'default',
  bundler: 'next',
  port: 5315,
} as const satisfies RegistryConsumerProject;

/** External projects exercised against the local, hosted registry output. */
export const registryConsumerProjects = [
  {
    name: 'next-react-tailwind',
    directory: 'next-react-tailwind',
    framework: 'react',
    styling: 'tailwind',
    theme: 'default',
    bundler: 'next',
    port: 5310,
  },
  {
    name: 'next-react-tailwind-neutral',
    directory: 'next-react-tailwind-neutral',
    framework: 'react',
    styling: 'tailwind',
    theme: 'neutral',
    bundler: 'next',
    port: 5316,
  },
  {
    name: 'next-react-css',
    directory: 'next-react-css',
    framework: 'react',
    styling: 'css',
    theme: 'neutral',
    bundler: 'next',
    port: 5311,
  },
  {
    name: 'vite-html-css',
    directory: 'vite-html-css',
    framework: 'html',
    styling: 'css',
    theme: 'default',
    bundler: 'vite',
    port: 5312,
  },
  {
    name: 'webpack-react-css',
    directory: 'webpack-react-css',
    framework: 'react',
    styling: 'css',
    theme: 'default',
    bundler: 'webpack',
    port: 5313,
  },
  {
    name: 'rspack-html-css',
    directory: 'rspack-html-css',
    framework: 'html',
    styling: 'css',
    theme: 'neutral',
    bundler: 'rspack',
    port: 5314,
  },
  {
    name: 'next-react-tailwind-compat',
    directory: 'next-react-tailwind-compat',
    framework: 'react',
    styling: 'tailwind',
    theme: 'compat',
    bundler: 'next',
    port: 5317,
  },
  {
    name: 'next-react-css-compat',
    directory: 'next-react-css-compat',
    framework: 'react',
    styling: 'css',
    theme: 'compat',
    bundler: 'next',
    port: 5318,
  },
  {
    name: 'vite-html-css-compat',
    directory: 'vite-html-css-compat',
    framework: 'html',
    styling: 'css',
    theme: 'compat',
    bundler: 'vite',
    port: 5319,
  },
] as const satisfies readonly RegistryConsumerProject[];
