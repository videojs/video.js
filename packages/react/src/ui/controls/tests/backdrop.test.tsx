import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { ControlsBackdrop } from '../backdrop';
import { ControlsRoot } from '../root';

afterEach(cleanup);

describe('ControlsBackdrop', () => {
  it('is presentational and receives controls state attributes', () => {
    const { Wrapper } = createPlayerWrapper({
      controlsVisible: true,
      userActive: true,
    });
    const { getByTestId } = render(
      <ControlsRoot>
        <ControlsBackdrop data-testid="backdrop" />
      </ControlsRoot>,
      { wrapper: Wrapper }
    );

    const backdrop = getByTestId('backdrop');

    expect(backdrop.getAttribute('role')).toBe('presentation');
    expect(backdrop.getAttribute('aria-hidden')).toBe('true');
    expect(backdrop.hasAttribute('data-visible')).toBe(true);
    expect(backdrop.hasAttribute('data-user-active')).toBe(true);
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { Wrapper } = createPlayerWrapper({
      controlsVisible: true,
      userActive: true,
    });

    render(
      <ControlsRoot>
        <ControlsBackdrop ref={ref} />
      </ControlsRoot>,
      { wrapper: Wrapper }
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('allows the default aria-hidden value to be overridden', () => {
    const { Wrapper } = createPlayerWrapper({
      controlsVisible: true,
      userActive: true,
    });
    const { getByTestId } = render(
      <ControlsRoot>
        <ControlsBackdrop aria-hidden={false} data-testid="backdrop" />
      </ControlsRoot>,
      { wrapper: Wrapper }
    );

    expect(getByTestId('backdrop').getAttribute('aria-hidden')).toBe('false');
  });
});
