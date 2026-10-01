import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { initializeTableDisclosures } from './disclosures';

function renderApiRow(id: string): HTMLButtonElement {
  document.body.innerHTML = `
    <table>
      <tbody id="${id}" data-apiref-row>
        <tr>
          <td>Label</td>
          <td><button data-apiref-toggle aria-expanded="false" aria-controls="${id}-detail">Details</button></td>
        </tr>
        <tr id="${id}-detail" aria-hidden="true" inert>
          <td><div data-apiref-detail>Description</div></td>
        </tr>
      </tbody>
    </table>
  `;

  return document.querySelector<HTMLButtonElement>('[data-apiref-toggle]')!;
}

describe('initializeTableDisclosures', () => {
  afterEach(() => {
    window.__videojsTableDisclosureController?.abort();
    delete window.__videojsTableDisclosureController;
    window.history.replaceState(null, '', '/');
    document.body.replaceChildren();
    window.getSelection()?.removeAllRanges();
    vi.restoreAllMocks();
  });

  it('keeps expansion state and accessibility state synchronized', () => {
    const button = renderApiRow('Thumbnail.Root-thumbnails');
    const row = document.querySelector<HTMLElement>('[data-apiref-row]')!;
    const detail = document.getElementById('Thumbnail.Root-thumbnails-detail')!;

    initializeTableDisclosures();
    button.click();

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('data-expanded');
    expect(detail).toHaveAttribute('aria-hidden', 'false');
    expect(detail).not.toHaveAttribute('inert');

    button.click();

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(row).not.toHaveAttribute('data-expanded');
    expect(detail).toHaveAttribute('aria-hidden', 'true');
    expect(detail).toHaveAttribute('inert');
  });

  it('does not collapse when interacting with expanded detail content', () => {
    const button = renderApiRow('Thumbnail.Root-thumbnails');
    const panel = document.querySelector<HTMLElement>('[data-apiref-detail]')!;

    initializeTableDisclosures();
    button.click();
    panel.click();

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not toggle a row while its text is selected', () => {
    const button = renderApiRow('Thumbnail.Root-thumbnails');
    const label = document.querySelector<HTMLElement>('td')!;

    const selection = window.getSelection()!;

    selection.selectAllChildren(label);

    initializeTableDisclosures();
    label.click();

    expect(button).toHaveAttribute('aria-expanded', 'false');

    selection.collapseToStart();
    label.click();

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles rows swapped into the document after initialization', () => {
    initializeTableDisclosures();

    const button = renderApiRow('Thumbnail.Root-time');

    button.click();

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('expands the API row addressed by the current hash', () => {
    const button = renderApiRow('Thumbnail.Root-thumbnails');

    window.history.replaceState(null, '', '#Thumbnail.Root-thumbnails');
    initializeTableDisclosures();

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('expands a newly addressed row after a hash change', () => {
    const button = renderApiRow('Thumbnail.Root-thumbnails');

    initializeTableDisclosures();
    window.history.replaceState(null, '', '#Thumbnail.Root-thumbnails');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles preset detail rows through the same delegated listener', () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr id="preset-video" data-preset-row>
            <td><button data-preset-toggle aria-expanded="false" aria-controls="preset-video-detail">Details</button></td>
          </tr>
          <tr id="preset-video-detail" hidden><td>Features</td></tr>
        </tbody>
      </table>
    `;

    const button = document.querySelector<HTMLButtonElement>('[data-preset-toggle]')!;
    const detail = document.getElementById('preset-video-detail')!;

    initializeTableDisclosures();
    button.click();

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(detail).not.toHaveAttribute('hidden');
  });
});
