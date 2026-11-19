import { describe, expect, it } from 'vite-plus/test';

import { type DocBlock, firstSentence, withoutObservesTags } from '../model';

const doc = (text: string): DocBlock => ({ text, tags: [] });

describe('firstSentence', () => {
  it('ends at the first sentence of the first paragraph', () => {
    expect(firstSentence(doc('Loads segments. Then appends them.\n\nMore detail.'))).toBe('Loads segments.');
  });

  it('keeps a sentence whose period sits inside code', () => {
    expect(firstSentence(doc('Reads `a.b` from state. Writes nothing.'))).toBe('Reads `a.b` from state.');
  });

  it('returns a bold lead whole', () => {
    expect(firstSentence(doc('**Picks a track once.** Then leaves it alone.'))).toBe('**Picks a track once.**');
  });

  it('returns a bold lead that contains an asterisk', () => {
    expect(firstSentence(doc('**The simple alternative to the `switch*` variants.** When resolved, sets ids.'))).toBe(
      '**The simple alternative to the `switch*` variants.**'
    );
  });

  it('returns the whole paragraph when it has no sentence end', () => {
    expect(firstSentence(doc('A lead without a period'))).toBe('A lead without a period');
  });
});

describe('withoutObservesTags', () => {
  it('collects the keys every `@observes` tag names and drops those tags from the doc', () => {
    const block: DocBlock = {
      text: 'Loads segments.',
      tags: [
        { name: 'observes', text: 'loadingSuspended segmentLoadingBlocked' },
        { name: 'example', text: 'load();' },
        { name: 'observes', text: 'presentation' },
      ],
    };

    expect(withoutObservesTags(block)).toEqual({
      doc: { text: 'Loads segments.', tags: [{ name: 'example', text: 'load();' }] },
      observes: ['loadingSuspended', 'segmentLoadingBlocked', 'presentation'],
    });
  });
});
