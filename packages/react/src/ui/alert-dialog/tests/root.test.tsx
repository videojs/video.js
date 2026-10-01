import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AlertDialog } from '..';

afterEach(cleanup);

describe('AlertDialog', () => {
  it('provides alert semantics to its shared dialog parts', () => {
    const { getByRole } = render(
      <AlertDialog.Root open>
        <AlertDialog.Popup>
          <AlertDialog.Title>Stop playback?</AlertDialog.Title>
          <AlertDialog.Description>The current video will close.</AlertDialog.Description>
          <AlertDialog.Close>Continue</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Root>
    );

    const popup = getByRole('alertdialog');

    expect(popup.getAttribute('aria-modal')).toBe('true');
    expect(popup.getAttribute('aria-labelledby')).toBe(getByRole('heading').id);
    expect(popup.getAttribute('aria-describedby')).toBe(getByRole('paragraph').id);
  });

  it('supports uncontrolled mode with defaultOpen', () => {
    const { getByRole } = render(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Popup>Content</AlertDialog.Popup>
      </AlertDialog.Root>
    );

    expect(getByRole('alertdialog')).toBeDefined();
  });
});
