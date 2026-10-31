import { render } from '@testing-library/react';
import { GoogleAnalyticsExtension } from '@videojs/google-analytics';
import { describe, expect, it } from 'vite-plus/test';

import { createPlayerWrapper } from '../../testing/mocks';
import { GoogleAnalytics } from '../google-analytics';

describe('GoogleAnalytics', () => {
  it('registers a GoogleAnalyticsExtension with the surrounding player', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<GoogleAnalytics />, { wrapper: Wrapper });

    expect(extensions.get(GoogleAnalyticsExtension)).toBeInstanceOf(GoogleAnalyticsExtension);
  });

  it('syncs props to the extension', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const metadata = { video_title: 'React Video', video_provider: 'custom-provider' };

    render(<GoogleAnalytics dataLayerName="customLayer" metadata={metadata} disableProgress debug />, {
      wrapper: Wrapper,
    });

    const extension = extensions.get(GoogleAnalyticsExtension)!;

    expect(extension.dataLayerName).toBe('customLayer');
    expect(extension.metadata).toEqual(metadata);
    expect(extension.disableProgress).toBe(true);
    expect(extension.debug).toBe(true);
  });

  it('resets a removed prop to its default', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<GoogleAnalytics debug />, { wrapper: Wrapper });

    rerender(<GoogleAnalytics />);

    expect(extensions.get(GoogleAnalyticsExtension)!.debug).toBe(false);
  });
});
