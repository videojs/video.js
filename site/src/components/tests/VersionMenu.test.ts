import { describe, expect, it } from 'vite-plus/test';

import { channelOptions } from '../VersionMenu';

describe('channelOptions', () => {
  it('lists versions newest first', () => {
    expect(channelOptions('10.1.0', '/').map((option) => option.value)).toEqual(['main', 'current', 'legacy']);
  });

  it('links legacy to its own site root', () => {
    const legacy = channelOptions('10.1.0', '/docs/framework/react/how-to/installation').find(
      (option) => option.value === 'legacy'
    );

    expect(legacy?.href).toBe('https://legacy.videojs.org/');
    expect(legacy?.external).toBe(true);
  });

  it('keeps the current path when switching between current and main', () => {
    const options = channelOptions('10.1.0', '/docs/framework/react/how-to/installation');

    expect(options.find((option) => option.value === 'current')).toMatchObject({
      label: 'v10.1.0',
      description: 'Latest',
      href: 'https://videojs.org/docs/framework/react/how-to/installation',
    });
    expect(options.find((option) => option.value === 'main')).toMatchObject({
      label: 'main',
      href: 'https://main.videojs.org/docs/framework/react/how-to/installation',
    });
  });
});
