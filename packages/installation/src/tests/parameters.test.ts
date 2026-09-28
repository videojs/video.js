import { describe, expect, it } from 'vite-plus/test';

import { CLI_OPTION_SYNTAX, QUERY_OPTION_SYNTAX } from '../parameters';

describe('CLI_OPTION_SYNTAX', () => {
  it('writes options as space-separated flags', () => {
    expect(CLI_OPTION_SYNTAX.noun).toBe('flag');
    expect(CLI_OPTION_SYNTAX.options(['preset'])).toBe('--preset');
    expect(CLI_OPTION_SYNTAX.options(['sourceUrl', 'demo'], ['template', 'none'])).toBe(
      '--source-url demo --template none'
    );
  });
});

describe('QUERY_OPTION_SYNTAX', () => {
  it('writes options as Markdown guide query parameters', () => {
    expect(QUERY_OPTION_SYNTAX.noun).toBe('query parameter');
    expect(QUERY_OPTION_SYNTAX.options(['preset'])).toBe('preset');
    expect(QUERY_OPTION_SYNTAX.options(['sourceUrl', 'demo'], ['template', 'none'])).toBe(
      'source-url=demo&template=none'
    );
  });
});
