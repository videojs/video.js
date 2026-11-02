import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import StoryPlayer from '../StoryPlayer';

const scrollTo = vi.fn();
const originalScrollTo = Element.prototype.scrollTo;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}

      observe() {
        // SAFETY: the player only reads `isIntersecting` and never touches the observer argument.
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
      }

      disconnect() {}
    }
  );
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
  vi.stubGlobal('CSS', { supports: () => true });
  scrollTo.mockReset();
  Element.prototype.scrollTo = scrollTo;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Element.prototype.scrollTo = originalScrollTo;
});

function renderStory() {
  const section = document.createElement('section');

  section.setAttribute('data-story', '');
  document.body.append(section);

  const result = render(<StoryPlayer poster="poster.webp" />, { container: section });
  const scroller = result.container.querySelector<HTMLElement>('.story-scroller')!;

  Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 1000 });
  return { ...result, section, scroller };
}

describe('StoryPlayer', () => {
  it('drives every look from one shared video', () => {
    const { container } = renderStory();

    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(container.querySelectorAll('.story-page')).toHaveLength(5);
  });

  it('leaves only the look in view available to assistive technology', () => {
    const { container, scroller } = renderStory();
    const pages = () => [...container.querySelectorAll<HTMLElement>('.story-page')];

    // jsdom reflects the attribute but does not implement the inert property.
    expect(pages().filter((page) => !page.hasAttribute('inert'))).toEqual([pages()[0]]);

    scroller.scrollLeft = 2000;
    fireEvent.scroll(scroller);

    expect(pages().filter((page) => !page.hasAttribute('inert'))).toEqual([pages()[2]]);
    expect(screen.getByRole('button', { name: 'Compat skin', pressed: true })).toBeTruthy();
  });

  it('settles on whichever look a swipe leaves most of the stage to', () => {
    const { scroller } = renderStory();

    scroller.scrollLeft = 1400;
    fireEvent.scroll(scroller);

    expect(screen.getByRole('button', { name: 'Neutral skin', pressed: true })).toBeTruthy();
  });

  it('scrolls to a chosen look', () => {
    renderStory();

    fireEvent.click(screen.getByRole('button', { name: 'Background preset' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 3000, behavior: 'smooth' });
  });

  it('advances to the next look on its own until the reader swipes', () => {
    // The label loop has nothing to place here; skipping its frames keeps the fake clock fast.
    vi.stubGlobal('requestAnimationFrame', () => 0);
    const { scroller } = renderStory();

    act(() => vi.advanceTimersByTime(5000));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 1000, behavior: 'smooth' });

    scrollTo.mockClear();
    fireEvent.wheel(scroller, { deltaX: 30, deltaY: 0 });
    act(() => vi.advanceTimersByTime(6000));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('hands over to the breakdown skin past the intro, and resets the looks behind it', () => {
    const { container, section, scroller } = renderStory();

    expect(container.querySelector('.story-skin')).toBeNull();

    section.style.setProperty('--handover', '0.5');
    act(() => vi.advanceTimersByTime(50));

    expect(container.querySelector('.story-player')!.hasAttribute('data-exploded')).toBe(true);
    expect(container.querySelector('.story-skin')).not.toBeNull();
    expect(scroller.hasAttribute('inert')).toBe(true);

    act(() => vi.advanceTimersByTime(300));
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'instant' });
  });

  it('walks keyboard focus through the speed menu and reads out each item while the menus are open', () => {
    const { container, section } = renderStory();
    const readout = () => container.querySelector('.story-label-readout')!.textContent;
    const pressed = () => container.querySelector('.story-label-keys [data-pressed]')?.textContent;

    section.style.setProperty('--handover', '1');
    section.style.setProperty('--menus', '1');
    act(() => vi.advanceTimersByTime(50));

    expect(readout()).toBe('“1×, radio menu item, checked, 2 of 4”');
    expect(container.querySelector('.story-focus')!.textContent).toBe('1×');

    act(() => vi.advanceTimersByTime(1100));

    expect(readout()).toBe('“1.5×, radio menu item, not checked, 3 of 4”');
    expect(container.querySelector('.story-focus')!.textContent).toBe('1.5×');
    expect(pressed()).toBe('↓');
  });
});
