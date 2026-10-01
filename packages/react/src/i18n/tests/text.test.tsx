import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { I18nProvider } from '../create-i18n';
import { Text } from '../text';

describe('Text', () => {
  afterEach(cleanup);

  it('uses children as the translation fallback', () => {
    const { rerender } = render(<Text token="custom.label">Fallback</Text>);

    expect(screen.queryByText('Fallback')).not.toBeNull();

    rerender(
      <I18nProvider locale="en" translations={{ 'custom.label': 'Translated' }}>
        <Text token="custom.label">Fallback</Text>
      </I18nProvider>
    );

    expect(screen.queryByText('Translated')).not.toBeNull();
    expect(screen.queryByText('Fallback')).toBeNull();
  });

  it('renders ordinary children without a token', () => {
    render(<Text>10</Text>);

    expect(screen.queryByText('10')).not.toBeNull();
  });
});
