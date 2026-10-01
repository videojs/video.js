import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeyboardEventHandler, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { ControlsContextProvider } from '../../controls/context';
import { MenuCheckboxItem } from '../checkbox-item';
import { MenuContent } from '../content';
import { useMenuOptionState } from '../context';
import { MenuGroup } from '../group';
import { MenuGroupLabel } from '../group-label';
import { MenuItem } from '../item';
import { MenuItemIndicator } from '../item-indicator';
import { MenuPopup } from '../popup';
import { MenuRadioGroup } from '../radio-group';
import { MenuRadioItem } from '../radio-item';
import { MenuRoot } from '../root';
import { MenuSeparator } from '../separator';
import { MenuTrigger } from '../trigger';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function makeDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  return new DOMRect(x, y, width, height);
}

function OptionPublisher() {
  useMenuOptionState({ value: 'Auto', disabled: false, hidden: false, availability: 'available' });

  return null;
}

function MountedOptionMenuFixture() {
  return (
    <MenuRoot>
      <MenuTrigger data-testid="settings-trigger">Settings</MenuTrigger>
      <MenuPopup keepMounted data-testid="settings-popup">
        <MenuContent>
          <MenuRoot>
            <OptionPublisher />
            <MenuTrigger data-testid="quality-trigger">Quality</MenuTrigger>
            <MenuContent data-testid="quality-content">Auto</MenuContent>
          </MenuRoot>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuFixture({
  onTriggerKeyDown,
  onOpenChange,
}: {
  onOpenChange?: MenuRoot.Props['onOpenChange'];
  onTriggerKeyDown?: KeyboardEventHandler<HTMLButtonElement | HTMLDivElement>;
}) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot {...(onOpenChange ? { onOpenChange } : {})}>
              <MenuTrigger data-testid="submenu-trigger" {...(onTriggerKeyDown ? { onKeyDown: onTriggerKeyDown } : {})}>
                Quality
              </MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-back">Back</MenuItem>
                <MenuItem data-testid="submenu-item">Auto</MenuItem>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuPropagationFixture({ onRootKeyDown }: { onRootKeyDown: KeyboardEventHandler<HTMLDivElement> }) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content" onKeyDown={onRootKeyDown}>
          <div data-testid="root-items">
            <MenuRoot>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-item">Auto</MenuItem>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuKeyboardFixture() {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-item">Auto</MenuItem>
              </MenuContent>
            </MenuRoot>
            <MenuItem data-testid="root-item">Copy link</MenuItem>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuPreventDefaultFixture({
  onSubmenuKeyDown,
  onOpenChange,
}: {
  onOpenChange: NonNullable<MenuRoot.Props['onOpenChange']>;
  onSubmenuKeyDown: KeyboardEventHandler<HTMLDivElement>;
}) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot onOpenChange={onOpenChange}>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content" onKeyDown={onSubmenuKeyDown}>
                <MenuItem data-testid="submenu-item">Auto</MenuItem>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function NestedTriggerPreventDefaultFixture({
  onTriggerKeyDown,
}: {
  onTriggerKeyDown: KeyboardEventHandler<HTMLButtonElement | HTMLDivElement>;
}) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent>
          <MenuRoot defaultOpen>
            <MenuTrigger>Quality</MenuTrigger>
            <MenuContent data-testid="submenu-content">
              <MenuRoot>
                <MenuTrigger data-testid="nested-trigger" onKeyDown={onTriggerKeyDown}>
                  Resolution
                </MenuTrigger>
                <MenuContent>
                  <MenuItem>1080p</MenuItem>
                </MenuContent>
              </MenuRoot>
            </MenuContent>
          </MenuRoot>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuSelectFixture({ onSelect }: { onSelect: () => void }) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-item" onSelect={onSelect}>
                  Auto
                </MenuItem>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function SubmenuEscapeFixture({ onRootOpenChange }: { onRootOpenChange: (open: boolean) => void }) {
  return (
    <MenuRoot defaultOpen onOpenChange={onRootOpenChange}>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-item">Auto</MenuItem>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function NestedSubmenuFixture() {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="root-content">
          <div data-testid="root-items">
            <MenuRoot>
              <MenuTrigger data-testid="first-submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="first-submenu-content">
                <div data-testid="first-submenu-items">
                  <MenuRoot>
                    <MenuTrigger data-testid="second-submenu-trigger">Advanced</MenuTrigger>
                    <MenuContent data-testid="second-submenu-content">
                      <MenuItem data-testid="second-submenu-item">HDR</MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </div>
              </MenuContent>
            </MenuRoot>
          </div>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function RootPropagationFixture({ onContainerKeyDown }: { onContainerKeyDown: KeyboardEventHandler<HTMLDivElement> }) {
  return (
    <div data-testid="container" onKeyDown={onContainerKeyDown} role="application">
      <MenuRoot defaultOpen>
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">
            <MenuItem data-testid="item">Auto</MenuItem>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    </div>
  );
}

function ControlsHiddenFixture({
  visible,
  onOpenChange,
}: {
  visible: boolean;
  onOpenChange: NonNullable<MenuRoot.Props['onOpenChange']>;
}) {
  return (
    <ControlsContextProvider
      value={{
        state: { visible, userActive: visible },
        stateAttrMap: { visible: 'data-visible', userActive: 'data-user-active' },
      }}
    >
      <MenuRoot defaultOpen onOpenChange={onOpenChange}>
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">
            <MenuItem data-testid="item">Auto</MenuItem>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    </ControlsContextProvider>
  );
}

function CheckboxFixture({
  onCheckedChange,
  onRootOpenChange,
}: {
  onCheckedChange: (checked: boolean) => void;
  onRootOpenChange: NonNullable<MenuRoot.Props['onOpenChange']>;
}) {
  return (
    <MenuRoot defaultOpen onOpenChange={onRootOpenChange}>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent data-testid="content">
          <MenuCheckboxItem data-testid="checkbox-item" checked={false} onCheckedChange={onCheckedChange}>
            Autoplay
          </MenuCheckboxItem>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function GroupLabelFixture() {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent>
          <MenuGroup data-testid="group">
            <MenuGroupLabel data-testid="label">Playback</MenuGroupLabel>
            <MenuItem>Copy link</MenuItem>
          </MenuGroup>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function RadioGroupLabelFixture() {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent>
          <MenuRadioGroup data-testid="group" value="auto" onValueChange={vi.fn()}>
            <MenuGroupLabel data-testid="label">Quality</MenuGroupLabel>
            <MenuRadioItem value="auto">Auto</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function ExplicitGroupLabelFixture() {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger>Settings</MenuTrigger>
      <MenuPopup>
        <MenuContent>
          <MenuGroup data-testid="aria-label-group" aria-label="Playback">
            <MenuGroupLabel data-testid="aria-label-label">Ignored</MenuGroupLabel>
          </MenuGroup>
          <MenuRadioGroup
            data-testid="aria-labelledby-group"
            aria-labelledby="external-label"
            value="auto"
            onValueChange={vi.fn()}
          >
            <MenuGroupLabel data-testid="aria-labelledby-label">Ignored</MenuGroupLabel>
            <MenuRadioItem value="auto">Auto</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </MenuPopup>
    </MenuRoot>
  );
}

function FocusOutFixture({ onRootOpenChange }: { onRootOpenChange: NonNullable<MenuRoot.Props['onOpenChange']> }) {
  return (
    <>
      <MenuRoot defaultOpen onOpenChange={onRootOpenChange}>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="root-content">
            <MenuItem data-testid="root-item">Copy link</MenuItem>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
      <button type="button" data-testid="outside">
        Outside
      </button>
    </>
  );
}

const menuStateAttrs = ['data-open', 'data-side', 'data-align', 'data-starting-style', 'data-ending-style'] as const;

function expectNoMenuStateAttrs(element: HTMLElement): void {
  for (const attr of menuStateAttrs) {
    expect(element.hasAttribute(attr), `${element.dataset.testid ?? element.tagName} should not have ${attr}`).toBe(
      false
    );
  }
}

function createRect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('MenuContent', () => {
  it('publishes mounted option state through submenu and root triggers', async () => {
    render(<MountedOptionMenuFixture />);

    await waitFor(() => {
      expect(screen.getByTestId('quality-trigger').getAttribute('data-availability')).toBe('available');
      expect(screen.getByTestId('settings-trigger').getAttribute('data-availability')).toBe('available');
    });

    expect(screen.getByTestId('settings-popup').hasAttribute('hidden')).toBe(true);
    expect(screen.getByTestId('settings-popup').hasAttribute('inert')).toBe(true);
    expect(screen.queryByTestId('quality-content')).toBeNull();
  });

  it('shows a popup kept mounted for option state when it opens', async () => {
    render(<MountedOptionMenuFixture />);

    const popup = screen.getByTestId('settings-popup');
    const showPopover = vi.fn();

    Object.defineProperty(popup, 'showPopover', { configurable: true, value: showPopover });
    fireEvent.click(screen.getByTestId('settings-trigger'));

    await waitFor(() => {
      expect(showPopover).toHaveBeenCalled();
      expect(popup.hasAttribute('hidden')).toBe(false);
      expect(popup.hasAttribute('data-starting-style')).toBe(true);
    });
  });

  it('includes the root trigger in sequential focus', () => {
    render(
      <MenuRoot>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent>Playback speed</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('tabindex')).toBe('0');
  });

  it('only links triggers to rendered menu content', async () => {
    render(<SubmenuFixture />);

    const rootTrigger = screen.getByRole('button', { name: 'Settings' });
    const rootContent = screen.getByTestId('root-content');
    const submenuTrigger = screen.getByTestId('submenu-trigger');

    expect(rootTrigger.getAttribute('aria-controls')).toBe(rootContent.id);
    expect(submenuTrigger.hasAttribute('aria-controls')).toBe(false);

    fireEvent.click(submenuTrigger);

    await waitFor(() => {
      const submenuContent = screen.getByTestId('submenu-content');

      expect(submenuTrigger.getAttribute('aria-controls')).toBe(submenuContent.id);
    });
  });

  it('omits aria-controls while root menu content is not rendered', async () => {
    render(
      <MenuRoot>
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">Settings</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    const trigger = screen.getByTestId('trigger');

    expect(trigger.hasAttribute('aria-controls')).toBe(false);

    fireEvent.click(trigger);

    await waitFor(() => {
      const content = screen.getByTestId('content');

      expect(trigger.getAttribute('aria-controls')).toBe(content.id);
    });
  });

  it.each(['Enter', ' '])('opens a root menu with %j', async (key) => {
    render(
      <MenuRoot>
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">Settings</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    const trigger = screen.getByTestId('trigger');

    fireEvent.keyDown(trigger, { key });

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeNull();
    });
  });

  it('honors preventDefault from root trigger key handlers', () => {
    const onKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLElement>) => event.preventDefault());

    render(
      <MenuRoot>
        <MenuTrigger data-testid="trigger" onKeyDown={onKeyDown}>
          Settings
        </MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">Settings</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('waits for a controlled owner to commit requested open changes', async () => {
    const onOpenChange = vi.fn();
    const renderMenu = (open: boolean) => (
      <MenuRoot open={open} onOpenChange={onOpenChange}>
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">Settings</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );
    const { rerender } = render(renderMenu(false));

    fireEvent.click(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'click' }));
    expect(screen.queryByTestId('content')).toBeNull();

    rerender(renderMenu(true));

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeNull();
    });
  });

  it('exposes the positioned side on root content', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'trigger') return makeDOMRect(100, 10, 40, 20);

      if (this.dataset.testid === 'content') return makeDOMRect(0, 0, 100, 60);

      return makeDOMRect(0, 0, 300, 200);
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'content' ? 100 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'content' ? 60 : 0;
    });

    render(
      <MenuRoot defaultOpen side="top" boundary="viewport">
        <MenuTrigger
          render={(props, state) => <button {...props} data-render-side={state.side} data-testid="trigger" />}
        >
          Settings
        </MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="content">
            <MenuItem>Auto</MenuItem>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content').parentElement?.getAttribute('data-side')).toBe('bottom');
      expect(screen.getByTestId('trigger').getAttribute('data-render-side')).toBe('bottom');
    });
  });

  it('scopes menu state data attributes to content elements', async () => {
    render(
      <MenuRoot defaultOpen side="top" align="end">
        <MenuTrigger data-testid="trigger">Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="root-content">
            <MenuGroup data-testid="group">
              <MenuGroupLabel data-testid="label">Playback</MenuGroupLabel>
              <MenuItem data-testid="item">Copy link</MenuItem>
              <MenuCheckboxItem data-testid="checkbox-item" checked={false} onCheckedChange={vi.fn()}>
                Autoplay
              </MenuCheckboxItem>
              <MenuRadioGroup data-testid="radio-group" aria-label="Quality" value="auto" onValueChange={vi.fn()}>
                <MenuRadioItem data-testid="radio-item" value="auto">
                  Auto
                  <MenuItemIndicator data-testid="indicator" checked>
                    Checked
                  </MenuItemIndicator>
                </MenuRadioItem>
              </MenuRadioGroup>
            </MenuGroup>
            <MenuSeparator data-testid="separator" />
            <div data-testid="root-items">
              <MenuRoot>
                <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
                <MenuContent data-testid="submenu-content">
                  <MenuItem data-testid="back">Back</MenuItem>
                  <MenuItem data-testid="submenu-item">Auto</MenuItem>
                </MenuContent>
              </MenuRoot>
            </div>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    const rootContent = screen.getByTestId('root-content');
    const popup = rootContent.parentElement!;

    expect(rootContent.hasAttribute('data-open')).toBe(true);
    expect(popup.getAttribute('data-side')).toBe('top');
    expect(popup.getAttribute('data-align')).toBe('end');

    for (const testId of [
      'trigger',
      'label',
      'group',
      'separator',
      'item',
      'checkbox-item',
      'radio-group',
      'radio-item',
      'indicator',
      'submenu-trigger',
    ]) {
      expectNoMenuStateAttrs(screen.getByTestId(testId));
    }

    expect(screen.getByTestId('item').hasAttribute('data-item')).toBe(true);
    expect(screen.getByTestId('radio-item').hasAttribute('data-item')).toBe(true);
    expect(screen.getByTestId('checkbox-item').hasAttribute('data-item')).toBe(true);
    expect(screen.getByTestId('submenu-trigger').hasAttribute('data-item')).toBe(true);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => expect(screen.queryByTestId('submenu-content')).not.toBeNull());

    const submenuContent = screen.getByTestId('submenu-content');

    expect(submenuContent.hasAttribute('data-submenu')).toBe(true);
    expect(submenuContent.hasAttribute('data-open')).toBe(true);
    expect(submenuContent.hasAttribute('data-side')).toBe(false);
    expect(submenuContent.hasAttribute('data-align')).toBe(false);
    expectNoMenuStateAttrs(screen.getByTestId('back'));
  });

  it('makes the parent Content inactive while a submenu is active', async () => {
    render(<SubmenuFixture />);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      const rootContent = screen.getByTestId('root-content');

      expect(rootContent.getAttribute('aria-hidden')).toBe('true');
      expect(rootContent.hasAttribute('inert')).toBe(true);
      expect(rootContent.hasAttribute('data-child-open')).toBe(true);
    });
  });

  it('exposes starting and ending style hooks on submenu content', async () => {
    render(<SubmenuFixture />);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    expect(screen.getByTestId('submenu-content').hasAttribute('data-starting-style')).toBe(true);

    fireEvent.click(screen.getByTestId('submenu-back'));

    const submenu = screen.getByTestId('submenu-content');

    expect(submenu.hasAttribute('data-ending-style')).toBe(true);
    expect(submenu.hasAttribute('data-open')).toBe(true);
    expect(screen.getByTestId('submenu-trigger').getAttribute('aria-expanded')).toBe('false');

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('data-child-open')).toBe(false);
      expect(submenu.hasAttribute('inert')).toBe(true);
    });
  });

  it('portals every submenu content into the popup as siblings', async () => {
    render(<NestedSubmenuFixture />);

    fireEvent.click(screen.getByTestId('first-submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('first-submenu-content').parentElement).toBe(
        screen.getByTestId('root-content').parentElement
      );
    });

    fireEvent.click(screen.getByTestId('second-submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('second-submenu-content').parentElement).toBe(
        screen.getByTestId('root-content').parentElement
      );
      expect(screen.getByTestId('second-submenu-content').parentElement).not.toBe(
        screen.getByTestId('first-submenu-items')
      );
    });
  });

  it('sizes the Popup to the deepest active Content', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const widths: Record<string, number> = {
        'root-items': 180,
        'first-submenu-items': 200,
        'second-submenu-item': 220,
      };
      const heights: Record<string, number> = {
        'root-items': 100,
        'first-submenu-items': 150,
        'second-submenu-item': 240,
      };

      return createRect(widths[this.dataset.testid ?? ''] ?? 0, heights[this.dataset.testid ?? ''] ?? 0);
    });

    render(<NestedSubmenuFixture />);
    fireEvent.click(screen.getByTestId('first-submenu-trigger'));

    await waitFor(() => {
      const popup = screen.getByTestId('root-content').parentElement!;

      expect(popup.style.getPropertyValue('--media-menu-width')).toBe('200px');
      expect(popup.style.getPropertyValue('--media-menu-height')).toBe('150px');
    });

    fireEvent.click(screen.getByTestId('second-submenu-trigger'));

    await waitFor(() => {
      const popup = screen.getByTestId('root-content').parentElement!;

      expect(popup.style.getPropertyValue('--media-menu-width')).toBe('220px');
      expect(popup.style.getPropertyValue('--media-menu-height')).toBe('240px');
    });
  });

  it('syncs root content size without position options', async () => {
    const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRectMock() {
      if (this.getAttribute('data-testid') === 'root-items') {
        return new DOMRect(0, 0, 180, 96);
      }

      return getBoundingClientRect.call(this);
    };

    try {
      render(
        <MenuRoot defaultOpen side={null as never}>
          <MenuTrigger>Settings</MenuTrigger>
          <MenuPopup>
            <MenuContent data-testid="root-content">
              <div data-testid="root-items">
                <MenuItem>Auto</MenuItem>
              </div>
            </MenuContent>
          </MenuPopup>
        </MenuRoot>
      );

      await waitFor(() => {
        expect(screen.getByTestId('root-content').parentElement?.style.getPropertyValue('--media-menu-height')).toBe(
          '96px'
        );
      });
    } finally {
      HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect;
    }
  });

  it('can reopen a submenu immediately after closing it', async () => {
    const onOpenChange = vi.fn();

    render(<SubmenuFixture onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByTestId('submenu-trigger'));
    await waitFor(() => expect(screen.getByTestId('submenu-content').hasAttribute('data-starting-style')).toBe(false));

    fireEvent.click(screen.getByTestId('submenu-back'));
    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(true);
    onOpenChange.mockClear();
    fireEvent.click(screen.getByTestId('submenu-trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'click' }));
    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(false);

    // Drain more frames than the cancelled close needs, then check the settled page.
    await act(async () => {
      for (let frame = 0; frame < 6; frame++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    });

    expect(screen.getByTestId('submenu-trigger').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('submenu-content').hasAttribute('data-open')).toBe(true);
    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(false);
    expect(screen.getByTestId('submenu-content').hasAttribute('data-starting-style')).toBe(false);
    expect(screen.getByTestId('submenu-content').hasAttribute('inert')).toBe(false);
    expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(true);
  });

  it('resets an open submenu when its parent menu closes', async () => {
    const onSubmenuOpenChange = vi.fn();
    const renderMenu = (open: boolean) => (
      <MenuRoot open={open}>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent data-testid="root-content">
            <div>
              <MenuRoot onOpenChange={onSubmenuOpenChange}>
                <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
                <MenuContent data-testid="submenu-content">
                  <MenuItem>Auto</MenuItem>
                </MenuContent>
              </MenuRoot>
            </div>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );
    const { rerender } = render(renderMenu(true));

    fireEvent.click(screen.getByTestId('submenu-trigger'));
    await waitFor(() => expect(screen.getByTestId('submenu-content')).not.toBeNull());
    onSubmenuOpenChange.mockClear();

    rerender(renderMenu(false));

    await waitFor(() => {
      expect(onSubmenuOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'imperative-action' }));
      expect(screen.getByTestId('submenu-trigger').getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('handles keyboard navigation in the active submenu', async () => {
    render(<SubmenuKeyboardFixture />);

    fireEvent.pointerEnter(screen.getByTestId('submenu-trigger'));
    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-content')).not.toBeNull();
    });

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'ArrowDown' });

    expect(screen.getByTestId('submenu-item').hasAttribute('data-highlighted')).toBe(true);
    expect(screen.getByTestId('root-item').hasAttribute('data-highlighted')).toBe(false);
  });

  it('opens a submenu with ArrowRight', async () => {
    render(<SubmenuFixture />);

    const trigger = screen.getByTestId('submenu-trigger');

    fireEvent.keyDown(trigger, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getByTestId('submenu-content')).not.toBeNull();
      expect(screen.getByTestId('submenu-back').hasAttribute('data-highlighted')).toBe(true);
    });
  });

  it('honors preventDefault from submenu trigger key handlers', () => {
    const onKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLElement>) => event.preventDefault());

    render(<SubmenuFixture onTriggerKeyDown={onKeyDown} />);

    fireEvent.keyDown(screen.getByTestId('submenu-trigger'), { key: 'ArrowRight' });

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('submenu-content')).toBeNull();
  });

  it('preserves trigger preventDefault while the event bubbles through nested menus', () => {
    const onKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLElement>) => event.preventDefault());

    render(<NestedTriggerPreventDefaultFixture onTriggerKeyDown={onKeyDown} />);

    fireEvent.keyDown(screen.getByTestId('nested-trigger'), { key: 'ArrowLeft' });

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(false);
  });

  it('highlights the first item when a submenu becomes active', async () => {
    render(<SubmenuFixture />);

    await waitFor(() => {
      expect(screen.getByTestId('submenu-trigger').hasAttribute('data-highlighted')).toBe(true);
    });
    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('submenu-back').hasAttribute('data-highlighted')).toBe(true);
      expect(screen.getByTestId('submenu-trigger').hasAttribute('data-highlighted')).toBe(false);
    });
  });

  it('highlights the checked submenu item without briefly highlighting Back', async () => {
    render(
      <MenuRoot defaultOpen>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent>
            <MenuRoot>
              <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
              <MenuContent data-testid="submenu-content">
                <MenuItem data-testid="submenu-back">Back</MenuItem>
                <MenuRadioGroup value="1080p" onValueChange={vi.fn()}>
                  <MenuRadioItem value="auto" data-testid="auto-item">
                    Auto
                  </MenuRadioItem>
                  <MenuRadioItem value="1080p" data-testid="selected-item">
                    1080p
                  </MenuRadioItem>
                </MenuRadioGroup>
              </MenuContent>
            </MenuRoot>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-item').hasAttribute('data-highlighted')).toBe(true);
      expect(screen.getByTestId('submenu-back').hasAttribute('data-highlighted')).toBe(false);
    });
  });

  it('returns to the parent content when selecting an item in a submenu', async () => {
    const onSelect = vi.fn();

    render(<SubmenuSelectFixture onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(true);
    });

    fireEvent.click(screen.getByTestId('submenu-item'));

    expect(onSelect).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(false);
    });
  });

  it('returns to the parent content without closing the root menu when Escape is pressed in a submenu', async () => {
    const onRootOpenChange = vi.fn();

    render(<SubmenuEscapeFixture onRootOpenChange={onRootOpenChange} />);
    onRootOpenChange.mockClear();

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(true);
    });

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(false);
    });

    expect(onRootOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByTestId('root-content').hasAttribute('data-open')).toBe(true);
  });

  it('returns to the parent content when ArrowLeft is pressed in a submenu', async () => {
    render(<SubmenuFixture />);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(true);
    });

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(false);
    });
  });

  it('returns focus after the submenu exit transition completes', async () => {
    render(<SubmenuFixture />);

    const trigger = screen.getByTestId('submenu-trigger');
    const focus = vi.spyOn(trigger, 'focus').mockImplementation((options) => {
      if (!screen.getByTestId('root-content').hasAttribute('inert')) {
        HTMLElement.prototype.focus.call(trigger, options);
      }
    });

    await waitFor(() => {
      expect(trigger.hasAttribute('data-highlighted')).toBe(true);
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('submenu-back').hasAttribute('data-highlighted')).toBe(true);
    });

    fireEvent.click(screen.getByTestId('submenu-back'));

    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(true);

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-content')).toBeNull();
      expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(false);
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('honors preventDefault from submenu key handlers', async () => {
    const onSubmenuKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLDivElement>) => event.preventDefault());
    const onOpenChange = vi.fn();

    render(<SubmenuPreventDefaultFixture onSubmenuKeyDown={onSubmenuKeyDown} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByTestId('submenu-trigger'));
    await waitFor(() => expect(screen.getByTestId('submenu-content').hasAttribute('data-starting-style')).toBe(false));
    onOpenChange.mockClear();

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'ArrowLeft' });

    expect(onSubmenuKeyDown).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      for (let frame = 0; frame < 3; frame++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    });
    expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(true);
    expect(screen.getByTestId('submenu-content').hasAttribute('data-ending-style')).toBe(false);

    onSubmenuKeyDown.mockImplementation(() => {});
    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'ArrowLeft' });
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape' }));
    await waitFor(() => expect(screen.queryByTestId('submenu-content')).toBeNull());
    expect(screen.getByTestId('root-content').hasAttribute('inert')).toBe(false);
  });

  it('only stops propagation for submenu-owned keyboard events', async () => {
    const onRootKeyDown = vi.fn();

    render(<SubmenuPropagationFixture onRootKeyDown={onRootKeyDown} />);

    fireEvent.click(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-content')).not.toBeNull();
    });

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'ArrowDown' });
    expect(onRootKeyDown).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByTestId('submenu-content'), { key: 'Tab' });
    expect(onRootKeyDown).toHaveBeenCalledTimes(1);
  });

  it('stops propagation for root menu keyboard navigation', () => {
    const onContainerKeyDown = vi.fn();

    render(<RootPropagationFixture onContainerKeyDown={onContainerKeyDown} />);

    fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowDown' });

    expect(onContainerKeyDown).not.toHaveBeenCalled();
    expect(screen.getByTestId('item').hasAttribute('data-highlighted')).toBe(true);

    fireEvent.keyDown(screen.getByTestId('content'), { key: 'Tab' });

    expect(onContainerKeyDown).toHaveBeenCalledTimes(1);
  });

  it('stops propagation for root trigger keyboard navigation while open', () => {
    const onContainerKeyDown = vi.fn();

    render(<RootPropagationFixture onContainerKeyDown={onContainerKeyDown} />);

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'ArrowRight' });

    expect(onContainerKeyDown).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'ArrowDown' });

    expect(onContainerKeyDown).not.toHaveBeenCalled();
    expect(screen.getByTestId('item').hasAttribute('data-highlighted')).toBe(true);
  });

  it('prevents default before native player hotkeys receive menu keys', () => {
    const defaultPreventedValues: boolean[] = [];
    const onContainerKeyDown = vi.fn((event: KeyboardEvent) => {
      defaultPreventedValues.push(event.defaultPrevented);
    });

    render(<RootPropagationFixture onContainerKeyDown={vi.fn()} />);

    screen.getByTestId('container').addEventListener('keydown', onContainerKeyDown);
    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowLeft' });

    expect(defaultPreventedValues).toEqual([true, true]);
  });

  it('closes an open root menu when parent controls become hidden', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<ControlsHiddenFixture visible onOpenChange={onOpenChange} />);

    onOpenChange.mockClear();
    rerender(<ControlsHiddenFixture visible={false} onOpenChange={onOpenChange} />);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'imperative-action' }));
    });
  });

  it('holds a controls visibility lock while a root menu is open', async () => {
    const releaseControlsLock = vi.fn();
    const requestControlsLock = vi.fn(() => releaseControlsLock);
    const { Wrapper } = createPlayerWrapper({
      userActive: true,
      controlsVisible: true,
      requestControlsLock,
      toggleControls: vi.fn(),
    });

    render(<ControlsHiddenFixture visible onOpenChange={vi.fn()} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(requestControlsLock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(releaseControlsLock).toHaveBeenCalledTimes(1);
    });
  });

  it('wires GroupLabel to Group with aria-labelledby', async () => {
    render(<GroupLabelFixture />);

    await waitFor(() => {
      expect(screen.getByTestId('group').getAttribute('aria-labelledby')).toBe(screen.getByTestId('label').id);
    });
  });

  it('wires GroupLabel to RadioGroup with aria-labelledby', async () => {
    render(<RadioGroupLabelFixture />);

    await waitFor(() => {
      expect(screen.getByTestId('group').getAttribute('aria-labelledby')).toBe(screen.getByTestId('label').id);
    });
  });

  it('derives item indicators from their radio item', () => {
    render(
      <MenuRoot defaultOpen>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent>
            <MenuRadioGroup value="auto" onValueChange={vi.fn()}>
              <MenuRadioItem value="auto">
                Auto
                <MenuItemIndicator data-testid="selected-indicator">Selected</MenuItemIndicator>
              </MenuRadioItem>
              <MenuRadioItem value="1080p">
                1080p
                <MenuItemIndicator data-testid="unselected-indicator">Selected</MenuItemIndicator>
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    expect(screen.queryByTestId('selected-indicator')).not.toBeNull();
    expect(screen.queryByTestId('unselected-indicator')).toBeNull();
  });

  it('lets explicit group labels override generated aria-labelledby', async () => {
    render(<ExplicitGroupLabelFixture />);

    await waitFor(() => {
      expect(screen.getByTestId('aria-label-label').id).not.toBe('');
      expect(screen.getByTestId('aria-labelledby-label').id).not.toBe('');
    });

    expect(screen.getByTestId('aria-label-group').getAttribute('aria-label')).toBe('Playback');
    expect(screen.getByTestId('aria-label-group').hasAttribute('aria-labelledby')).toBe(false);
    expect(screen.getByTestId('aria-labelledby-group').getAttribute('aria-labelledby')).toBe('external-label');
  });

  it('keeps the menu open when a checkbox item is toggled', () => {
    const onCheckedChange = vi.fn();
    const onRootOpenChange = vi.fn();

    render(<CheckboxFixture onCheckedChange={onCheckedChange} onRootOpenChange={onRootOpenChange} />);
    onRootOpenChange.mockClear();

    fireEvent.click(screen.getByTestId('checkbox-item'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onRootOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
    expect(screen.queryByTestId('content')).not.toBeNull();
  });

  it('highlights pointer-entered items without moving focus', () => {
    render(
      <MenuRoot defaultOpen>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuPopup>
          <MenuContent>
            <MenuItem data-testid="first-item">Auto</MenuItem>
            <MenuItem data-testid="second-item">1080p</MenuItem>
          </MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    const secondItem = screen.getByTestId('second-item');
    const focus = vi.spyOn(secondItem, 'focus');

    fireEvent.pointerEnter(secondItem);

    expect(focus).not.toHaveBeenCalled();
    expect(secondItem.hasAttribute('data-highlighted')).toBe(true);
  });

  it('closes when focus moves outside the root menu', async () => {
    const onRootOpenChange = vi.fn();

    render(<FocusOutFixture onRootOpenChange={onRootOpenChange} />);
    onRootOpenChange.mockClear();

    fireEvent.focusOut(screen.getByTestId('root-content'), { relatedTarget: screen.getByTestId('outside') });

    await waitFor(() => {
      expect(onRootOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'blur' }));
    });
  });

  it('routes focus leaving a submenu through the submenu popover', async () => {
    const onSubmenuOpenChange = vi.fn();

    render(
      <>
        <MenuRoot defaultOpen>
          <MenuTrigger>Settings</MenuTrigger>
          <MenuPopup>
            <MenuContent>
              <div>
                <MenuRoot onOpenChange={onSubmenuOpenChange}>
                  <MenuTrigger data-testid="submenu-trigger">Quality</MenuTrigger>
                  <MenuContent data-testid="submenu-content">
                    <MenuItem>Auto</MenuItem>
                  </MenuContent>
                </MenuRoot>
              </div>
            </MenuContent>
          </MenuPopup>
        </MenuRoot>
        <button type="button" data-testid="outside">
          Outside
        </button>
      </>
    );
    fireEvent.click(screen.getByTestId('submenu-trigger'));
    await waitFor(() => expect(screen.getByTestId('submenu-content')).not.toBeNull());
    onSubmenuOpenChange.mockClear();

    fireEvent.blur(screen.getByTestId('submenu-content'), { relatedTarget: screen.getByTestId('outside') });

    await waitFor(() => {
      expect(onSubmenuOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'blur' }));
    });
  });

  it('forwards disabled to a root trigger render prop and prevents opening', () => {
    render(
      <MenuRoot>
        <MenuTrigger disabled render={<button type="button" data-testid="trigger" />} />
        <MenuPopup>
          <MenuContent data-testid="content">Captions</MenuContent>
        </MenuPopup>
      </MenuRoot>
    );

    const trigger = screen.getByTestId('trigger');

    expect(trigger).toHaveProperty('disabled', true);

    fireEvent.click(trigger);

    expect(screen.queryByTestId('content')).toBeNull();

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });

    trigger.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });
});
