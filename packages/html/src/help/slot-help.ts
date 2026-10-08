/** Explains how players, skins, and Media fit together. The site redirects it to the HTML architecture guide. */
export const PLAYER_HELP_URL = 'https://videojs.org/video-player-help';

/**
 * Puts a help message after `slot` and shows it only while no element is assigned to the slot. Players and skins use it
 * to explain themselves when they render without the Media they need.
 *
 * Slot fallback content can't do this alone: whitespace between the host's tags is assigned to a default slot as well,
 * which hides the fallback in almost every hand-written page.
 *
 * Returns the check. Slot changes re-run it; call it once the host's children have been parsed.
 */
export function createSlotHelp(slot: HTMLSlotElement, message: string): () => void {
  const doc = slot.ownerDocument;
  const help = doc.createElement('p');
  const link = doc.createElement('a');

  link.href = PLAYER_HELP_URL;
  link.textContent = 'Learn more';
  help.className = 'media-help';
  help.setAttribute('part', 'help');
  help.hidden = true;
  help.append(`${message} `, link);
  slot.after(help);

  const update = () => {
    help.hidden = slot.assignedElements().length > 0;
  };

  slot.addEventListener('slotchange', update);

  return update;
}

/** Runs `callback` once the parser has finished the document, so a host connected mid-parse sees all its children. */
export function afterParse(doc: Document, callback: () => void): void {
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
}
