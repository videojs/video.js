import { describe, expect, it } from 'vite-plus/test';

import {
  canonicalInstallationSearch,
  DEFAULT_SELECTION,
  isCustomInstallationSelection,
  parseInstallationSearch,
  parseInstallationSearchForRoute,
  serializeInstallationSearch,
  serializeInstallationSearchForRoute,
} from '../url-state';

describe('parseInstallationSearch', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseInstallationSearch('')).toEqual(DEFAULT_SELECTION);
  });

  it('reads the CLI vocabulary', () => {
    expect(parseInstallationSearch('?preset=live-video&skin=minimal&media=hls&package-manager=npm')).toEqual({
      framework: 'react',
      template: 'next',
      project: 'existing',
      useCase: 'live-video',
      skin: 'minimal-video',
      media: 'hls',
      extensions: [],
      sourceUrl: '',
      installMethod: 'npm',
      styling: null,
    });
  });

  it('maps the skin tier onto the audio skins for audio presets', () => {
    expect(parseInstallationSearch('?preset=audio').skin).toBe('audio');
    expect(parseInstallationSearch('?preset=audio&skin=minimal').skin).toBe('minimal-audio');
    expect(parseInstallationSearch('?preset=audio&skin=none').skin).toBe('none');
  });

  it('defaults Mux Data for Mux media and preserves an explicit opt-out', () => {
    expect(parseInstallationSearch('?media=mux-video').extensions).toEqual(['mux-data']);
    expect(parseInstallationSearch('?media=mux-video&extensions=none').extensions).toEqual([]);
    expect(parseInstallationSearch('?media=hls&extensions=google-cast').extensions).toEqual(['google-cast']);
  });

  it('drops media the preset cannot play and ignores unknown values', () => {
    const selection = parseInstallationSearch('?preset=live-audio&media=youtube&skin=fancy&package-manager=curl');

    expect(selection.useCase).toBe('live-audio');
    expect(selection.media).toBe('mux-audio');
    expect(selection.skin).toBe('audio');
    expect(selection.installMethod).toBe('pnpm');
  });

  it('keeps the source url verbatim', () => {
    expect(parseInstallationSearch('?source-url=https%3A%2F%2Fexample.com%2Fa.m3u8').sourceUrl).toBe(
      'https://example.com/a.m3u8'
    );
  });

  it('reads the demo source choice as the empty source URL', () => {
    expect(parseInstallationSearch('?source-url=demo').sourceUrl).toBe('');
  });

  it('drops source URLs containing control characters', () => {
    expect(parseInstallationSearch('?source-url=line%0Abreak').sourceUrl).toBe('');
    expect(parseInstallationSearch('?source-url=line%E2%80%A8break').sourceUrl).toBe('');
  });
});

describe('parseInstallationSearchForRoute', () => {
  it('validates app setup against the framework fixed by a dedicated route', () => {
    expect(parseInstallationSearchForRoute('vue', '?template=nuxt')).toMatchObject({
      framework: 'vue',
      template: 'nuxt',
    });
    expect(parseInstallationSearchForRoute('svelte', '?template=sveltekit')).toMatchObject({
      framework: 'svelte',
      template: 'sveltekit',
    });
  });

  it('uses the framework query only on the shared Shadcn route', () => {
    expect(parseInstallationSearchForRoute('shadcn', '?framework=html&template=astro')).toMatchObject({
      framework: 'html',
      template: 'astro',
    });
    expect(parseInstallationSearchForRoute('vue', '?framework=react&template=nuxt')).toMatchObject({
      framework: 'vue',
      template: 'nuxt',
    });
  });

  it('keeps no scaffold on packaged HTML and resets it for Shadcn', () => {
    expect(parseInstallationSearchForRoute('html', '?template=none')).toMatchObject({ template: 'none' });
    expect(parseInstallationSearchForRoute('cdn', '?template=none')).toMatchObject({ template: 'none' });
    expect(parseInstallationSearchForRoute('shadcn', '?framework=html&template=none')).toMatchObject({
      framework: 'html',
      template: 'vite',
    });
  });

  it('falls back from a Vue or Svelte Shadcn query to the HTML source', () => {
    expect(parseInstallationSearchForRoute('shadcn', '?framework=vue&template=nuxt')).toMatchObject({
      framework: 'html',
      template: 'vite',
    });
    expect(parseInstallationSearchForRoute('shadcn', '?framework=svelte&template=astro')).toMatchObject({
      framework: 'html',
      template: 'astro',
    });
  });
});

describe('serializeInstallationSearch', () => {
  it('writes nothing for the defaults', () => {
    expect(serializeInstallationSearch(DEFAULT_SELECTION)).toBe('');
  });

  it('writes only what differs from the preset defaults', () => {
    expect(
      serializeInstallationSearch({
        framework: 'react',
        template: 'next',
        project: 'existing',
        useCase: 'live-video',
        skin: 'minimal-video',
        media: 'hls',
        extensions: [],
        sourceUrl: '',
        installMethod: 'pnpm',
        styling: null,
      })
    ).toBe('?preset=live-video&skin=minimal');
  });

  it('round-trips through parse', () => {
    const selection = {
      framework: 'html',
      template: 'astro',
      project: 'new',
      useCase: 'default-audio',
      skin: 'none',
      media: 'spotify',
      extensions: [],
      sourceUrl: 'https://open.spotify.com/track/1',
      installMethod: 'pnpm',
      styling: null,
    } as const;

    expect(parseInstallationSearch(serializeInstallationSearch(selection))).toEqual(selection);
  });

  it('preserves unrelated params', () => {
    expect(serializeInstallationSearch({ ...DEFAULT_SELECTION, installMethod: 'bun' }, '?utm_source=x')).toBe(
      '?utm_source=x&package-manager=bun'
    );
  });

  it('round-trips the project starting point and forces Existing site to existing', () => {
    expect(parseInstallationSearch('?project=new').project).toBe('new');
    expect(serializeInstallationSearch({ ...DEFAULT_SELECTION, project: 'new' })).toBe('?project=new');
    expect(parseInstallationSearchForRoute('html', '?template=none&project=new')).toMatchObject({
      template: 'none',
      project: 'existing',
    });
  });

  it('writes non-default extension choices', () => {
    expect(
      serializeInstallationSearch({
        ...DEFAULT_SELECTION,
        media: 'hls',
        extensions: ['google-cast'],
      })
    ).toBe('?media=hls&extensions=google-cast');
    expect(
      serializeInstallationSearch({
        ...DEFAULT_SELECTION,
        media: 'mux-video',
        extensions: [],
      })
    ).toBe('?media=mux-video&extensions=none');
  });

  it('omits the hidden skin choice for background video', () => {
    const background = parseInstallationSearch('?preset=background-video&skin=minimal&media=background-video');

    expect(serializeInstallationSearch(background)).toBe('?preset=background-video');
  });
});

describe('serializeInstallationSearchForRoute', () => {
  it('keeps only parameters supported by the current installation route', () => {
    const search = '?method=shadcn&framework=vue&template=astro&styling=css&package-manager=pnpm&utm_source=docs';
    const vue = { ...DEFAULT_SELECTION, framework: 'vue', template: 'vite' } as const;
    const html = { ...DEFAULT_SELECTION, framework: 'html', template: 'vite', styling: 'css' } as const;

    expect(serializeInstallationSearchForRoute('vue', vue, search)).toBe('?utm_source=docs');
    expect(serializeInstallationSearchForRoute('cdn', parseInstallationSearchForRoute('cdn', ''), search)).toBe(
      '?utm_source=docs'
    );
    expect(serializeInstallationSearchForRoute('shadcn', html, search)).toBe(
      '?framework=html&styling=css&utm_source=docs'
    );
  });

  it('omits the existing-page defaults on the CDN route', () => {
    expect(serializeInstallationSearchForRoute('cdn', parseInstallationSearchForRoute('cdn', '?template=none'))).toBe(
      ''
    );
  });

  it('keeps a new CDN app with its package manager', () => {
    const selection = parseInstallationSearchForRoute('cdn', '?project=new&template=vite&package-manager=yarn');

    expect(selection).toMatchObject({ project: 'new', template: 'vite', installMethod: 'yarn' });
    expect(serializeInstallationSearchForRoute('cdn', selection)).toBe(
      '?template=vite&project=new&package-manager=yarn'
    );
  });

  it('gives a new CDN app the Vite setup', () => {
    expect(canonicalInstallationSearch('cdn', '?project=new')).toBe('?project=new&template=vite');
    expect(canonicalInstallationSearch('cdn', '?project=new&template=none')).toBe('');
    expect(canonicalInstallationSearch('cdn', '?project=new&template=next')).toBe('?project=new&template=vite');
  });

  it('drops the package manager from an existing CDN page', () => {
    const selection = parseInstallationSearchForRoute('cdn', '?package-manager=yarn');

    expect(selection).toMatchObject({ project: 'existing', template: 'none' });
    expect(serializeInstallationSearchForRoute('cdn', selection)).toBe('');
    expect(isCustomInstallationSelection('cdn', selection)).toBe(false);
  });

  it('writes an explicit Shadcn styling choice and drops it from other routes', () => {
    const selection = { ...DEFAULT_SELECTION, styling: 'css' } as const;

    expect(serializeInstallationSearchForRoute('shadcn', selection)).toBe('?framework=react&styling=css');
    expect(serializeInstallationSearchForRoute('react', selection)).toBe('');
  });
});

describe('parseInstallationSearchForRoute on the Shadcn guide', () => {
  it('fits unsupported choices to the player shown by the page', () => {
    expect(
      parseInstallationSearchForRoute('shadcn', '?preset=background-video&skin=minimal&media=background-video')
    ).toMatchObject({
      useCase: 'default-video',
      skin: 'minimal-video',
      media: 'html5-video',
    });
    expect(parseInstallationSearchForRoute('shadcn', '?preset=audio&skin=none&media=spotify')).toMatchObject({
      useCase: 'default-audio',
      skin: 'audio',
      media: 'spotify',
    });
  });

  it('keeps a styling choice only when the framework offers it', () => {
    expect(parseInstallationSearchForRoute('shadcn', '?framework=react&styling=css').styling).toBe('css');
    expect(parseInstallationSearchForRoute('shadcn', '?framework=html&styling=tailwind').styling).toBeNull();
    expect(parseInstallationSearchForRoute('react', '?styling=css').styling).toBeNull();
  });

  it('uses the fallback framework only without a framework query', () => {
    expect(parseInstallationSearchForRoute('shadcn', '?preset=audio', 'html').framework).toBe('html');
    expect(parseInstallationSearchForRoute('shadcn', '?framework=react', 'html').framework).toBe('react');
  });
});

describe('canonicalInstallationSearch', () => {
  it('drops invalid picks and keeps unrelated params in place', () => {
    expect(
      canonicalInstallationSearch(
        'shadcn',
        '?framework=vue&template=next&styling=css&preset=audio&skin=fancy&utm_source=docs'
      )
    ).toBe('?framework=html&styling=css&preset=audio&utm_source=docs');
  });

  it('drops the demo source choice, which the page shows by default', () => {
    expect(canonicalInstallationSearch('react', '?preset=audio&source-url=demo')).toBe('?preset=audio');
  });
});

describe('isCustomInstallationSelection', () => {
  it('compares a selection with the defaults the guide prerenders', () => {
    expect(isCustomInstallationSelection('react', parseInstallationSearchForRoute('react', ''))).toBe(false);
    expect(isCustomInstallationSelection('react', parseInstallationSearchForRoute('react', '?preset=audio'))).toBe(
      true
    );
    expect(isCustomInstallationSelection('shadcn', parseInstallationSearchForRoute('shadcn', '', 'html'))).toBe(true);
  });
});
