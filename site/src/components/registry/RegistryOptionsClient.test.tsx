import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { registrySkin, registryStyling, registryTheme } from '@/stores/registry';

vi.mock('@/components/Select', () => ({
  Select: ({ value, ...props }: { value: string; 'aria-label': string }) => (
    <span data-label={props['aria-label']}>{value}</span>
  ),
}));

vi.mock('@/components/CardRadioGroup', () => ({
  default: ({
    value,
    options,
    ...props
  }: {
    value: string;
    options: { description?: string; label: string }[];
    'aria-label': string;
  }) => (
    <span
      data-label={props['aria-label']}
      data-options={options.map(({ label }) => label).join(',')}
      data-descriptions={options.flatMap(({ description }) => (description ? [description] : [])).join(',')}
    >
      {value}
    </span>
  ),
}));

import RegistryOptionsClient from './RegistryOptionsClient';

describe('RegistryOptionsClient', () => {
  afterEach(() => {
    registrySkin.set(null);
    registryStyling.set(null);
    registryTheme.set(null);
  });

  it('uses route defaults for server markup when client selections differ', () => {
    registrySkin.set('audio');
    registryStyling.set('css');
    registryTheme.set('neutral');

    const catalogMarkup = renderToString(
      <RegistryOptionsClient
        defaultSkin="video"
        defaultTheme="default"
        framework="react"
        installation={false}
        kind="catalog"
      />
    );

    expect(catalogMarkup).toContain('data-label="Select skin">video</span>');
    expect(catalogMarkup).toContain('data-label="Select styling">tailwind</span>');
    expect(catalogMarkup).toContain('data-label="Select theme">default</span>');
  });

  it('renders the Shadcn styling choice as cards for the source catalog', () => {
    registryStyling.set('css');

    const react = renderToString(<RegistryOptionsClient framework="react" installation kind="styling" />);
    const html = renderToString(<RegistryOptionsClient framework="html" installation kind="styling" />);

    expect(react).toContain('data-label="Select styling"');
    expect(react).toContain('data-options="Vanilla CSS,Tailwind CSS"');
    expect(react).toContain('>tailwind</span>');
    expect(html).toContain('data-options="Vanilla CSS"');
  });
});
