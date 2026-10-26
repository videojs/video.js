import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Dialog } from '..';
import { createPlayerWrapper } from '../../../testing/mocks';

afterEach(cleanup);

describe('Dialog', () => {
  it('opens from Trigger with modal dialog semantics', async () => {
    const { getByRole, queryByRole } = render(
      <Dialog.Root>
        <Dialog.Trigger>Open video</Dialog.Trigger>
        <Dialog.Popup>
          <Dialog.Title>Video</Dialog.Title>
        </Dialog.Popup>
      </Dialog.Root>
    );

    const trigger = getByRole('button', { name: 'Open video' });

    expect(queryByRole('dialog')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    const popup = await waitFor(() => getByRole('dialog'));

    expect(popup.getAttribute('aria-modal')).toBe('true');
    expect(popup.getAttribute('aria-labelledby')).toBe(getByRole('heading').id);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
  });

  it('reports document scope outside a player', () => {
    const { getByRole } = render(
      <Dialog.Root defaultOpen>
        <Dialog.Popup>Content</Dialog.Popup>
      </Dialog.Root>
    );

    expect(getByRole('dialog').getAttribute('data-scope')).toBe('document');
  });

  it('warns when a player-scoped dialog opens outside a player', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole } = render(
      <Dialog.Root defaultOpen scope="player">
        <Dialog.Popup>Content</Dialog.Popup>
      </Dialog.Root>
    );

    expect(getByRole('dialog').getAttribute('data-scope')).toBe('document');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('scope="player"'));

    warn.mockRestore();
  });

  it('does not warn when an auto-scoped dialog opens outside a player', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <Dialog.Root defaultOpen>
        <Dialog.Popup>Content</Dialog.Popup>
      </Dialog.Root>
    );

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('scope="player"'));

    warn.mockRestore();
  });

  it.each([
    [undefined, 'player', null],
    ['auto', 'player', null],
    ['player', 'player', null],
    ['document', 'document', 'true'],
  ] as const)('applies scope %s inside a player', async (scope, expectedScope, ariaModal) => {
    const container = document.createElement('div');
    const { Wrapper, value } = createPlayerWrapper();

    value.container = container;
    document.body.append(container);

    const { getByRole, getByTestId } = render(
      <Wrapper>
        <Dialog.Root defaultOpen scope={scope}>
          <Dialog.Backdrop data-testid="backdrop" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Root>
      </Wrapper>,
      { container }
    );

    const popup = getByRole('dialog');

    await waitFor(() => expect(popup.getAttribute('data-scope')).toBe(expectedScope));
    expect(popup.getAttribute('aria-modal')).toBe(ariaModal);
    expect(getByTestId('backdrop').getAttribute('data-scope')).toBe(expectedScope);

    container.remove();
  });

  it('closes only from Close', () => {
    const onOpenChange = vi.fn();
    const { getByRole } = render(
      <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
        <Dialog.Popup>
          <button type="button">Player control</button>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Root>
    );

    fireEvent.click(getByRole('button', { name: 'Player control' }));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    fireEvent.click(getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('wires the optional description', () => {
    const { getByRole } = render(
      <Dialog.Root defaultOpen>
        <Dialog.Popup>
          <Dialog.Description>Choose playback options.</Dialog.Description>
        </Dialog.Popup>
      </Dialog.Root>
    );

    const popup = getByRole('dialog');

    expect(popup.getAttribute('aria-describedby')).toBe(getByRole('paragraph').id);
  });

  it('forwards popup and trigger refs', () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const popupRef = createRef<HTMLDivElement>();

    render(
      <Dialog.Root defaultOpen>
        <Dialog.Trigger ref={triggerRef}>Open</Dialog.Trigger>
        <Dialog.Popup ref={popupRef}>Content</Dialog.Popup>
      </Dialog.Root>
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(popupRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
