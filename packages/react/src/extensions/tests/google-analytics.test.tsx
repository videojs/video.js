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

    render(
      <GoogleAnalytics
        dataLayerName="customLayer"
        videoTitle="React Video"
        videoProvider="custom-provider"
        trackProgress={false}
        debug
      />,
      { wrapper: Wrapper }
    );

    const extension = extensions.get(GoogleAnalyticsExtension)!;

    expect(extension.dataLayerName).toBe('customLayer');
    expect(extension.videoTitle).toBe('React Video');
    expect(extension.videoProvider).toBe('custom-provider');
    expect(extension.trackProgress).toBe(false);
    expect(extension.debug).toBe(true);
  });

  it('resets a removed prop to its default', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<GoogleAnalytics debug />, { wrapper: Wrapper });

    rerender(<GoogleAnalytics />);

    expect(extensions.get(GoogleAnalyticsExtension)!.debug).toBe(false);
  });
});
