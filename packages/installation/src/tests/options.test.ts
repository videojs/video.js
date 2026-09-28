import { describe, expect, it } from 'vite-plus/test';

import { installationCompatibility, installationDecisionOrderFor, installationOptionDefinitionsFor } from '../options';
import { QUERY_OPTION_SYNTAX } from '../parameters';

function valuesFor(
  definitions: ReturnType<typeof installationOptionDefinitionsFor>,
  flag: string
): readonly string[] | undefined {
  return definitions.find((option) => option.flag === flag)?.values;
}

describe('installationOptionDefinitionsFor', () => {
  it('only advertises the methods supported by the selected frameworks', () => {
    const react = installationOptionDefinitionsFor({ methods: ['packaged', 'shadcn'], frameworks: ['react'] });
    const every = installationOptionDefinitionsFor({
      methods: ['packaged', 'shadcn', 'cdn'],
      frameworks: ['react', 'html', 'vue', 'svelte'],
    });

    expect(valuesFor(react, '--method')).toEqual(['packaged', 'shadcn']);
    expect(react.find(({ flag }) => flag === '--method')?.description).toBe(
      'Choose packaged modules or editable Shadcn source.'
    );
    expect(valuesFor(every, '--method')).toEqual(['packaged', 'shadcn', 'cdn']);
    expect(valuesFor(every, '--framework')).toEqual(['react', 'html', 'vue', 'svelte']);
  });

  it('advertises every app setup supported by the HTML custom-element frameworks', () => {
    const definitions = installationOptionDefinitionsFor({
      methods: ['packaged', 'shadcn', 'cdn'],
      frameworks: ['html', 'vue', 'svelte'],
    });

    expect(valuesFor(definitions, '--template')).toEqual(['vite', 'astro', 'laravel', 'none', 'nuxt', 'sveltekit']);
    expect(valuesFor(definitions, '--project')).toEqual(['new', 'existing']);
    expect(valuesFor(definitions, '--styling')).toEqual(['css']);
    expect(definitions.find(({ flag }) => flag === '--template')?.default).toBe('vite');
    expect(definitions.find(({ flag }) => flag === '--styling')?.default).toBe('css');
  });

  it('filters choices for a Shadcn-only route', () => {
    const definitions = installationOptionDefinitionsFor({ methods: ['shadcn'], frameworks: ['react', 'html'] });

    expect(valuesFor(definitions, '--preset')).not.toContain('background-video');
    expect(valuesFor(definitions, '--skin')).not.toContain('none');
    expect(valuesFor(definitions, '--template')).toEqual(['next', 'vite', 'start', 'react-router', 'astro', 'laravel']);
    expect(valuesFor(definitions, '--styling')).toEqual(['tailwind', 'css']);
    expect(definitions.find(({ flag }) => flag === '--template')?.default).toBe('next for React; vite otherwise');
    expect(definitions.find(({ flag }) => flag === '--styling')?.default).toBe('tailwind for React; css otherwise');
  });

  it('describes the none app setup only where a listed path offers it', () => {
    const react = installationOptionDefinitionsFor({ methods: ['packaged'], frameworks: ['react'] });
    const html = installationOptionDefinitionsFor({ methods: ['packaged'], frameworks: ['html'] });
    const template = (definitions: typeof react) => definitions.find(({ flag }) => flag === '--template')?.description;

    expect(template(react)).toBe('The app setup and file layout.');
    expect(template(html)).toContain('Packaged `none` needs an existing bundler');
    expect(template(html)).not.toContain('CDN defaults');
    expect(template(html)).not.toContain('Shadcn');
  });

  it('offers an existing page or Vite scaffold for CDN instructions', () => {
    const definitions = installationOptionDefinitionsFor({ methods: ['cdn'], frameworks: ['html'] });

    expect(valuesFor(definitions, '--template')).toEqual(['vite', 'none']);
    expect(definitions.find(({ flag }) => flag === '--template')?.default).toBe('none');
  });

  it('names the options it depends on in the reader syntax', () => {
    const context = { methods: ['packaged', 'shadcn', 'cdn'], frameworks: ['react', 'html'] } as const;
    const appliesWhen = (definitions: ReturnType<typeof installationOptionDefinitionsFor>) =>
      definitions.flatMap((option) => (option.appliesWhen ? [option.appliesWhen] : []));

    expect(appliesWhen(installationOptionDefinitionsFor(context))).toEqual([
      '--preset is not background-video',
      '--method is not cdn with --template none',
      '--method shadcn',
    ]);
    expect(appliesWhen(installationOptionDefinitionsFor(context, QUERY_OPTION_SYNTAX))).toEqual([
      'preset is not background-video',
      'method is not cdn with template none',
      'method=shadcn',
    ]);
  });
});

describe('installationDecisionOrderFor', () => {
  it('defaults to the video preset and default skin unless the request signals otherwise', () => {
    const decisions = installationDecisionOrderFor({ methods: ['packaged', 'shadcn'], frameworks: ['react'] });
    const guidance = (title: string) => decisions.find((decision) => decision.title === title)?.guidance;
    const shadcn = installationDecisionOrderFor({ methods: ['shadcn'], frameworks: ['react', 'html'] });

    expect(guidance('Choose the player')).toMatch(/^Use video unless the request signals another experience/);
    expect(guidance('Choose the player')).toContain('Ask only when those signals conflict.');
    expect(guidance('Choose the skin')).toMatch(/^Use default unless the request asks for a minimal/);
    expect(guidance('Choose the skin')).toContain('which Shadcn does not support');
    expect(shadcn.find(({ title }) => title === 'Choose the skin')?.guidance).not.toContain('none');
  });

  it('explains every installation method when all frameworks are available', () => {
    const decisions = installationDecisionOrderFor({
      methods: ['packaged', 'shadcn', 'cdn'],
      frameworks: ['react', 'html', 'vue', 'svelte'],
    });
    const guidance = decisions.find(({ title }) => title === 'Choose how to install')?.guidance;

    expect(guidance).toContain('Shadcn when a React or plain HTML project');
    expect(guidance).toContain('CDN scripts are for plain HTML only');
    expect(decisions.find(({ title }) => title === 'Inspect the project')?.guidance).toContain(
      'React installs @videojs/react; HTML, Vue, and Svelte install @videojs/html.'
    );
  });

  it('describes the fixed installation path represented by a guide', () => {
    const shadcn = installationDecisionOrderFor({ methods: ['shadcn'], frameworks: ['react', 'html'] });
    const cdn = installationDecisionOrderFor({ methods: ['cdn'], frameworks: ['html'] });

    expect(shadcn.find(({ title }) => title === 'Choose how to install')?.guidance).toContain('This guide uses Shadcn');
    expect(shadcn.find(({ title }) => title === 'Choose how to install')?.guidance).toContain(
      'Vue and Svelte use packaged modules'
    );
    expect(cdn.find(({ title }) => title === 'Choose how to install')?.guidance).toContain(
      'scaffold a minimal Vite app only when no app exists'
    );
  });

  it('asks for every applicable option in the reader syntax', () => {
    const context = { methods: ['packaged'], frameworks: ['react'] } as const;
    const plan = (syntax?: typeof QUERY_OPTION_SYNTAX) =>
      installationDecisionOrderFor(context, syntax).find(({ title }) => title === 'Return one explicit plan')?.guidance;

    expect(plan()).toContain('pass every applicable flag, including `--extensions none`');
    expect(plan()).toContain('`--source-url demo`');
    expect(plan(QUERY_OPTION_SYNTAX)).toContain('pass every applicable query parameter, including `extensions=none`');
    expect(plan(QUERY_OPTION_SYNTAX)).toContain('`source-url=demo`');
  });

  it('asks for the styling after the Shadcn method when React source is possible', () => {
    const shadcn = installationDecisionOrderFor({ methods: ['shadcn'], frameworks: ['react', 'html'] });
    const titles = shadcn.map(({ title }) => title);
    const packaged = installationDecisionOrderFor({ methods: ['packaged', 'shadcn'], frameworks: ['react'] });
    const htmlOnly = installationDecisionOrderFor({ methods: ['packaged', 'shadcn', 'cdn'], frameworks: ['html'] });

    expect(titles.indexOf('Choose the styling')).toBe(titles.indexOf('Choose how to install') + 1);
    expect(shadcn.find(({ title }) => title === 'Choose the styling')?.guidance).toMatch(/^For React/);
    expect(packaged.find(({ title }) => title === 'Choose the styling')?.guidance).toMatch(/^Only for Shadcn/);
    expect(htmlOnly.some(({ title }) => title === 'Choose the styling')).toBe(false);
  });
});

describe('installationCompatibility', () => {
  it('exposes installation methods by project framework', () => {
    expect(installationCompatibility.methodsByFramework).toEqual({
      react: ['packaged', 'shadcn'],
      html: ['packaged', 'shadcn', 'cdn'],
      vue: ['packaged'],
      svelte: ['packaged'],
    });
  });

  it('exposes the exact media choices for every preset', () => {
    expect(installationCompatibility.mediaByPreset.audio).toEqual(['html5-audio', 'mux-audio', 'spotify']);
    expect(installationCompatibility.mediaByPreset['live-video']).toEqual(['hls', 'mux-video']);
    expect(installationCompatibility.mediaByPreset['background-video']).toEqual([
      'background-video',
      'hls-background-video',
      'mux-background-video',
    ]);
    expect(installationCompatibility.templatesByFramework.vue).toEqual(['vite', 'astro', 'nuxt']);
    expect(installationCompatibility.templatesByFramework.svelte).toEqual(['vite', 'astro', 'sveltekit']);
    expect(installationCompatibility.shadcn.stylingsByFramework).toEqual({ react: ['tailwind', 'css'], html: ['css'] });
  });
});
