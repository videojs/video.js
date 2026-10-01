import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Slider } from '..';
import { measureSlider, pointer } from './support';

afterEach(cleanup);

describe('Slider.Thumbnail', () => {
  it('requires the root to be inside Slider.Root', () => {
    expect(() =>
      render(
        <Slider.Thumbnail.Root>
          <Slider.Thumbnail.Image />
        </Slider.Thumbnail.Root>
      )
    ).toThrow('Slider compound components must be used within a Slider.Root');
  });

  it('forwards root and image refs', () => {
    const ref = createRef<HTMLDivElement>();
    const imgRef = createRef<HTMLImageElement>();

    render(
      <Slider.Root>
        <Slider.Thumbnail.Root ref={ref}>
          <Slider.Thumbnail.Image ref={imgRef} />
        </Slider.Thumbnail.Root>
      </Slider.Root>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(imgRef.current).toBeInstanceOf(HTMLImageElement);
  });

  it('selects the thumbnail at the slider pointer', () => {
    const thumbnails = [
      { url: 'thumb-0.jpg', startTime: 0 },
      { url: 'thumb-5.jpg', startTime: 5 },
    ];

    const { getByTestId } = render(
      <Slider.Root>
        <Slider.Thumbnail.Root thumbnails={thumbnails}>
          <Slider.Thumbnail.Image data-testid="image" />
        </Slider.Thumbnail.Root>
      </Slider.Root>
    );

    const image = getByTestId('image');

    expect(image.getAttribute('src')).toBe('thumb-0.jpg');
    const root = image.closest('[data-orientation]') as HTMLElement;

    measureSlider(root);
    pointer(root, 'pointermove', 100, 0);
    expect(getByTestId('image').getAttribute('src')).toBe('thumb-5.jpg');
  });
});
