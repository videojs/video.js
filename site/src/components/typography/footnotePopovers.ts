const ENHANCED_ATTR = 'data-footnote-popover';

// Matches the site's Base UI popups (see `AppearanceMenu`); the popover sits under `<body>`, so it inherits text color.
const POPOVER_CLASS =
  'footnote-popover rounded-lg corner-squircle border border-line bg-surface-raised p-4 text-p3 shadow-lg dark:bg-soot [&_p]:my-0 [&_p+p]:mt-2';

let popoverCount = 0;

function supportsAnchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--footnote');
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** Copies a definition's content without its backrefs or ids, which belong to the definition list. */
function createPopoverContent(definition: Element): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (const child of definition.childNodes) fragment.append(child.cloneNode(true));

  for (const backref of fragment.querySelectorAll('[data-footnote-backref]')) backref.remove();

  for (const element of fragment.querySelectorAll('[id]')) element.removeAttribute('id');

  return fragment;
}

function enhanceReference(reference: HTMLAnchorElement): void {
  const definitionId = decodeURIComponent(reference.hash.slice(1));
  const definition = definitionId ? document.getElementById(definitionId) : null;
  if (!definition) return;

  const anchorName = `--footnote-ref-${++popoverCount}`;
  const popover = document.createElement('div');

  popover.id = `footnote-popover-${popoverCount}`;
  popover.setAttribute('popover', 'auto');
  popover.className = POPOVER_CLASS;
  popover.setAttribute('role', 'note');
  popover.style.setProperty('position-anchor', anchorName);
  popover.append(createPopoverContent(definition));

  reference.style.setProperty('anchor-name', anchorName);
  reference.setAttribute(ENHANCED_ATTR, popover.id);
  // Interest invokers open the popover on hover and focus where supported; other browsers ignore the attribute.
  reference.setAttribute('interestfor', popover.id);

  // Opened by a click rather than by interest, so a second click closes it instead of interest re-showing it.
  let pinned = false;
  // Light dismiss can close the popover between pointerdown and click, so read its state before then.
  let stateAtPointerDown: { open: boolean; pinned: boolean } | undefined;

  reference.setAttribute('aria-expanded', 'false');

  // Mirror the Base UI triggers' `data-popup-open` so the reference shows its popover is open, however it opened.
  popover.addEventListener('toggle', (event) => {
    const open = (event as ToggleEvent).newState === 'open';

    reference.toggleAttribute('data-popup-open', open);
    reference.setAttribute('aria-expanded', String(open));

    if (!open) pinned = false;
  });

  // A popover that opened on hover and was then clicked stays open when the pointer leaves.
  popover.addEventListener('loseinterest', (event) => {
    if (pinned) event.preventDefault();
  });

  reference.addEventListener('pointerdown', () => {
    stateAtPointerDown = { open: popover.matches(':popover-open'), pinned };
  });

  reference.addEventListener('click', (event) => {
    // Modified clicks keep their native behavior, such as opening the definition in a new tab.
    if (isModifiedClick(event)) return;

    event.preventDefault();

    const { open: wasOpen, pinned: wasPinned } = stateAtPointerDown ?? {
      open: popover.matches(':popover-open'),
      pinned,
    };

    stateAtPointerDown = undefined;

    if (wasOpen && wasPinned) {
      pinned = false;

      if (popover.matches(':popover-open')) popover.hidePopover();

      return;
    }

    pinned = true;

    if (!popover.matches(':popover-open')) popover.showPopover({ source: reference } as ShowPopoverOptions);
  });

  document.body.append(popover);
}

/**
 * Shows each footnote's definition in a popover anchored to its reference, opened by click and, where interest invokers
 * are supported, by hover or focus. Browsers without CSS anchor positioning keep the plain link to the definition,
 * which already links back.
 */
export function enhanceFootnotes(root: ParentNode = document): void {
  if (!supportsAnchorPositioning()) return;

  for (const reference of root.querySelectorAll<HTMLAnchorElement>(`a[data-footnote-ref]:not([${ENHANCED_ATTR}])`)) {
    enhanceReference(reference);
  }
}
