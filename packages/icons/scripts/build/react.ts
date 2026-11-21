import { join } from 'node:path';

import { transform } from '@svgr/core';
import { transformSync } from 'oxc-transform';
import { optimize } from 'svgo';

import { DIST_DIR } from '../internal/paths.js';
import { createSvgoConfig } from '../internal/svg.js';
import type { IconDefinition, IconFamily } from './model.js';
import { writeOutput } from './output.js';

/** One React-flavored output: where it is written, whether SVGR targets `react-native-svg`, and its typings. */
interface ReactTarget {
  readonly directory: string;
  readonly native: boolean;
  readonly typeImports: string;
  readonly componentType: string;
}

const REACT_TARGET: ReactTarget = {
  directory: 'react',
  native: false,
  typeImports: `import type * as React from 'react';`,
  componentType: 'React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>>',
};

const REACT_NATIVE_TARGET: ReactTarget = {
  directory: 'react-native',
  native: true,
  typeImports: [`import type * as React from 'react';`, `import type { Svg, SvgProps } from 'react-native-svg';`].join(
    '\n'
  ),
  componentType: 'React.ForwardRefExoticComponent<SvgProps & React.RefAttributes<Svg>>',
};

/**
 * `react-native-svg` has no stylesheet, class or CSS-variable support, so the hooks web icons expose for CSS animation
 * (the spinner's `<style>`, segment classes and `--media-spinner-delay`) would only reach native as inert props.
 */
const NATIVE_SVG_CONFIG = createSvgoConfig([
  'removeStyleElement',
  'removeXMLNS',
  { name: 'removeAttrs', params: { attrs: ['class', 'style'] } },
]);

async function buildComponent(icon: IconDefinition, target: ReactTarget): Promise<string> {
  const componentName = `${icon.pascalName}Icon`;
  const svg = target.native ? optimize(icon.svg, NATIVE_SVG_CONFIG).data : icon.svg;
  const jsx = await transform(
    svg,
    { plugins: ['@svgr/plugin-jsx'], jsxRuntime: 'automatic', ref: true, native: target.native },
    { componentName }
  );
  const result = transformSync(`${componentName}.jsx`, jsx, {
    lang: 'jsx',
    sourceType: 'module',
    jsx: { runtime: 'automatic' },
  });

  if (result.errors.length > 0 || !result.code) {
    const errors = result.errors.map((error) => error.codeframe ?? error.message).join('\n');

    throw new Error(`Could not transpile ${componentName}:\n${errors}`);
  }

  return result.code;
}

async function emitFamily({ name: family, icons }: IconFamily, target: ReactTarget): Promise<void> {
  const directory = join(DIST_DIR, target.directory, family);

  for (const icon of icons) {
    const componentName = `${icon.pascalName}Icon`;

    writeOutput(join(directory, `${icon.name}.js`), await buildComponent(icon, target));
    writeOutput(
      join(directory, `${icon.name}.d.ts`),
      [
        target.typeImports,
        `declare const ${componentName}: ${target.componentType};`,
        `export default ${componentName};`,
        ``,
      ].join('\n')
    );
  }

  writeOutput(
    join(directory, 'index.js'),
    `${icons.map(({ name, pascalName }) => `export { default as ${pascalName}Icon } from './${name}.js';`).join('\n')}\n`
  );
  writeOutput(
    join(directory, 'index.d.ts'),
    [
      target.typeImports,
      ...icons.map(({ pascalName }) => `export declare const ${pascalName}Icon: ${target.componentType};`),
      ``,
    ].join('\n')
  );
}

export function emitReactFamily(family: IconFamily): Promise<void> {
  return emitFamily(family, REACT_TARGET);
}

/**
 * Same SVGR pipeline as {@link emitReactFamily}, targeting `react-native-svg`, so both platforms render one source.
 * Icons that animate through CSS (the spinner) render static here; native bindings animate them themselves.
 */
export function emitReactNativeFamily(family: IconFamily): Promise<void> {
  return emitFamily(family, REACT_NATIVE_TARGET);
}
