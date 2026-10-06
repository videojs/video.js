import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { enhanceFootnotes } from '../footnotePopovers';

// jsdom implements neither CSS anchor positioning nor the Popover API, so both are stubbed per test.
function installPopoverStubs() {
  const open = new WeakSet<HTMLElement>();
  const matches = HTMLElement.prototype.matches;

  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
    return selector === ':popover-open' ? open.has(this) : matches.call(this, selector);
  });
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    open.add(this);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    open.delete(this);
  });
}

function renderFootnotes() {
  document.body.innerHTML = `
    <p>Claim<sup><a href="#user-content-fn-a" id="user-content-fnref-a" data-footnote-ref>1</a></sup>
      again<sup><a href="#user-content-fn-a" id="user-content-fnref-a-2" data-footnote-ref>1</a></sup></p>
    <section data-footnotes>
      <ol><li id="user-content-fn-a"><p id="nested">A <em>note</em>.
        <a href="#user-content-fnref-a" data-footnote-backref>↩</a></p></li></ol>
    </section>`;

  return [...document.querySelectorAll<HTMLAnchorElement>('a[data-footnote-ref]')];
}

function popoverFor(reference: HTMLAnchorElement): HTMLElement {
  return document.getElementById(reference.getAttribute('data-footnote-popover')!)!;
}

describe('enhanceFootnotes', () => {
  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => true });
    installPopoverStubs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('leaves references as plain links without anchor positioning', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    expect(reference!.hasAttribute('data-footnote-popover')).toBe(false);
    expect(document.querySelector('[popover]')).toBeNull();
  });

  it('gives each reference its own popover with the definition content', () => {
    const references = renderFootnotes();

    enhanceFootnotes();

    const popovers = references.map(popoverFor);

    expect(new Set(popovers).size).toBe(2);

    for (const [index, popover] of popovers.entries()) {
      expect(popover.getAttribute('popover')).toBe('auto');
      expect(popover.textContent).toContain('A note.');
      expect(popover.querySelector('[data-footnote-backref]')).toBeNull();
      expect(popover.querySelector('[id]')).toBeNull();
      expect(references[index]!.getAttribute('interestfor')).toBe(popover.id);
    }
  });

  it('enhances each reference once', () => {
    renderFootnotes();

    enhanceFootnotes();
    enhanceFootnotes();

    expect(document.querySelectorAll('[popover]')).toHaveLength(2);
  });

  it('opens the popover on click instead of following the link, and closes it on a second click', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const popover = popoverFor(reference!);
    const firstClick = new MouseEvent('click', { bubbles: true, cancelable: true });

    reference!.dispatchEvent(firstClick);

    expect(firstClick.defaultPrevented).toBe(true);
    expect(popover.matches(':popover-open')).toBe(true);

    reference!.click();

    expect(popover.matches(':popover-open')).toBe(false);
  });

  it('keeps an open popover open when a click follows a hover', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const popover = popoverFor(reference!);

    popover.showPopover();
    reference!.click();

    expect(popover.matches(':popover-open')).toBe(true);
  });

  it('keeps a clicked popover open when interest is lost, but not a hovered one', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const popover = popoverFor(reference!);
    const loseInterest = () => {
      const event = new Event('loseinterest', { cancelable: true });

      popover.dispatchEvent(event);
      return event.defaultPrevented;
    };

    popover.showPopover();

    expect(loseInterest()).toBe(false);

    reference!.click();

    expect(loseInterest()).toBe(true);
  });

  it('stays closed when light dismiss closes a pinned popover between pointerdown and click', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const popover = popoverFor(reference!);

    reference!.click();
    reference!.dispatchEvent(new Event('pointerdown'));
    popover.hidePopover();
    popover.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    reference!.click();

    expect(popover.matches(':popover-open')).toBe(false);
  });

  it('marks the reference while its popover is open', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const popover = popoverFor(reference!);
    const toggle = (newState: 'open' | 'closed') =>
      popover.dispatchEvent(Object.assign(new Event('toggle'), { newState }));

    expect(reference!.getAttribute('aria-expanded')).toBe('false');

    toggle('open');

    expect(reference!.hasAttribute('data-popup-open')).toBe(true);
    expect(reference!.getAttribute('aria-expanded')).toBe('true');

    toggle('closed');

    expect(reference!.hasAttribute('data-popup-open')).toBe(false);
    expect(reference!.getAttribute('aria-expanded')).toBe('false');
  });

  it('lets modified clicks follow the link', () => {
    const [reference] = renderFootnotes();

    enhanceFootnotes();

    const click = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });

    reference!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(popoverFor(reference!).matches(':popover-open')).toBe(false);
  });
});
