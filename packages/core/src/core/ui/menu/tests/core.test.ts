import { describe, expect, it } from 'vite-plus/test';

import { MenuCore, type MenuInput, resolveMenuOptionState } from '../core';

function createInput(overrides: Partial<MenuInput> = {}): MenuInput {
  return {
    active: false,
    status: 'idle',
    isSubmenu: false,
    ...overrides,
  };
}

describe('MenuCore', () => {
  describe('defaultProps', () => {
    it('has expected defaults', () => {
      expect(MenuCore.defaultProps).toEqual({
        side: 'bottom',
        align: 'start',
        open: false,
        defaultOpen: false,
        closeOnEscape: true,
        closeOnOutsideClick: true,
      });
    });
  });

  describe('getState', () => {
    it('returns closed state by default', () => {
      const core = new MenuCore();

      core.setInput(createInput());
      const state = core.getState();

      expect(state.open).toBe(false);
      expect(state.status).toBe('idle');
      expect(state.side).toBe('bottom');
      expect(state.align).toBe('start');
      expect(state.isSubmenu).toBe(false);
      expect(state.transitionStarting).toBe(false);
      expect(state.transitionEnding).toBe(false);
    });

    it('returns open state when active', () => {
      const core = new MenuCore();

      core.setInput(createInput({ active: true, status: 'idle' }));
      const state = core.getState();

      expect(state.open).toBe(true);
    });

    it('reflects transitionStarting during starting status', () => {
      const core = new MenuCore();

      core.setInput(createInput({ active: true, status: 'starting' }));
      const state = core.getState();

      expect(state.transitionStarting).toBe(true);
      expect(state.transitionEnding).toBe(false);
    });

    it('reflects transitionEnding during ending status', () => {
      const core = new MenuCore();

      core.setInput(createInput({ active: false, status: 'ending' }));
      const state = core.getState();

      expect(state.transitionStarting).toBe(false);
      expect(state.transitionEnding).toBe(true);
    });

    it('reflects custom side and align from props', () => {
      const core = new MenuCore({ side: 'top', align: 'end' });

      core.setInput(createInput());
      const state = core.getState();

      expect(state.side).toBe('top');
      expect(state.align).toBe('end');
    });

    it('reflects isSubmenu from runtime input', () => {
      const core = new MenuCore();

      core.setInput(createInput({ isSubmenu: true }));
      const state = core.getState();

      expect(state.isSubmenu).toBe(true);
    });

    it('omits root positioning for submenus', () => {
      const core = new MenuCore({ side: 'right', align: 'end' });

      core.setInput(createInput({ isSubmenu: true }));
      const state = core.getState();

      expect(state.side).toBeUndefined();
      expect(state.align).toBeUndefined();
    });
  });

  describe('getTriggerAttrs', () => {
    it('returns closed ARIA attrs', () => {
      const core = new MenuCore();

      core.setInput(createInput());
      const state = core.getState();
      const attrs = core.getTriggerAttrs(state);

      expect(attrs.tabIndex).toBe(0);
      expect(attrs['aria-haspopup']).toBe('menu');
      expect(attrs['aria-expanded']).toBe('false');
      expect(attrs['aria-controls']).toBeUndefined();
    });

    it('returns open ARIA attrs when open', () => {
      const core = new MenuCore();

      core.setInput(createInput({ active: true }));
      const state = core.getState();
      const attrs = core.getTriggerAttrs(state);

      expect(attrs['aria-expanded']).toBe('true');
    });

    it('returns aria-expanded false when closing', () => {
      const core = new MenuCore();

      core.setInput(createInput({ active: true, status: 'ending' }));
      const state = core.getState();
      const attrs = core.getTriggerAttrs(state);

      expect(state.open).toBe(true);
      expect(attrs['aria-expanded']).toBe('false');
    });

    it('sets aria-controls when contentId is provided', () => {
      const core = new MenuCore();

      core.setInput(createInput());
      const state = core.getState();
      const attrs = core.getTriggerAttrs(state, 'my-menu');

      expect(attrs['aria-controls']).toBe('my-menu');
    });

    it('leaves submenu tabindex to roving focus management', () => {
      const core = new MenuCore();

      core.setInput(createInput({ isSubmenu: true }));
      const state = core.getState();
      const attrs = core.getTriggerAttrs(state);

      expect('tabIndex' in attrs).toBe(false);
    });
  });

  describe('getContentAttrs', () => {
    it('returns menu ARIA attrs', () => {
      const core = new MenuCore();
      const attrs = core.getContentAttrs();

      expect(attrs.role).toBe('menu');
      expect(attrs.tabIndex).toBe(-1);
      expect('popover' in attrs).toBe(false);
    });
  });

  describe('getPopupAttrs', () => {
    it('returns the manual popover mode', () => {
      expect(new MenuCore().getPopupAttrs()).toEqual({ popover: 'manual' });
    });
  });

  describe('setProps', () => {
    it('updates props after construction', () => {
      const core = new MenuCore();

      core.setProps({ side: 'top', align: 'center' });
      core.setInput(createInput());
      const state = core.getState();

      expect(state.side).toBe('top');
      expect(state.align).toBe('center');
    });

    it('preserves defaults for unset props', () => {
      const core = new MenuCore();

      core.setProps({ side: 'left' });
      core.setInput(createInput());
      const state = core.getState();

      expect(state.side).toBe('left');
      expect(state.align).toBe('start');
      expect(state.isSubmenu).toBe(false);
    });
  });
});

describe('resolveMenuOptionState', () => {
  it('preserves the value for one option menu', () => {
    expect(
      resolveMenuOptionState([{ value: 'Auto', disabled: false, hidden: false, availability: 'available' }])
    ).toEqual({
      value: 'Auto',
      disabled: false,
      hidden: false,
      availability: 'available',
    });
  });

  it('makes a parent available when any nested menu is available', () => {
    expect(
      resolveMenuOptionState([
        { value: 'Auto', disabled: false, hidden: false, availability: 'available' },
        { value: '', disabled: true, hidden: true, availability: 'unavailable' },
      ])
    ).toEqual({ value: '', disabled: false, hidden: false, availability: 'available' });
  });

  it('distinguishes unsupported collections from unavailable options', () => {
    expect(
      resolveMenuOptionState([
        { value: '', disabled: true, hidden: false, availability: 'unsupported' },
        { value: '', disabled: true, hidden: false, availability: 'unsupported' },
      ])
    ).toEqual({ value: '', disabled: true, hidden: false, availability: 'unsupported' });
    expect(
      resolveMenuOptionState([
        { value: '', disabled: true, hidden: false, availability: 'unsupported' },
        { value: '', disabled: true, hidden: false, availability: 'unavailable' },
      ])
    ).toEqual({ value: '', disabled: true, hidden: false, availability: 'unavailable' });
  });

  it('hides a parent only when every nested menu is hidden', () => {
    expect(
      resolveMenuOptionState([
        { value: '', disabled: true, hidden: true, availability: 'unavailable' },
        { value: '', disabled: true, hidden: true, availability: 'unsupported' },
      ])
    ).toEqual({ value: '', disabled: true, hidden: true, availability: 'unavailable' });
  });
});
