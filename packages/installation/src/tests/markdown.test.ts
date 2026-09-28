import { describe, expect, it } from 'vite-plus/test';

import { renderInstallationCompatibilityMarkdown } from '../markdown';
import { installationCompatibilityFor } from '../options';
import { QUERY_OPTION_SYNTAX } from '../parameters';

describe('renderInstallationCompatibilityMarkdown', () => {
  it('mentions the none app setup only for frameworks that offer it', () => {
    expect(renderInstallationCompatibilityMarkdown(installationCompatibilityFor(['react']))).not.toContain('`none`');
    expect(renderInstallationCompatibilityMarkdown(installationCompatibilityFor(['react', 'html']))).toContain(
      'The `none` app setup is available only for plain HTML'
    );
  });

  it('names CDN app setups in the reader syntax', () => {
    const compatibility = installationCompatibilityFor(['html']);

    expect(renderInstallationCompatibilityMarkdown(compatibility)).toContain(
      'Use `--project existing --template none` for an existing page or `--project new --template vite`'
    );
    expect(renderInstallationCompatibilityMarkdown(compatibility, QUERY_OPTION_SYNTAX)).toContain(
      'Use `project=existing&template=none` for an existing page or `project=new&template=vite`'
    );
  });
});
