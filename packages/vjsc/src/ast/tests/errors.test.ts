import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';

import { atSourcePosition, parseError } from '../errors';

describe('atSourcePosition', () => {
  it('anchors an unlocated error to the node and keeps a more precise one', () => {
    expect(() =>
      atSourcePosition(4, () => {
        throw new Error('plain');
      })
    ).toThrow(expect.objectContaining({ message: 'plain', pos: 4 }));
    expect(() =>
      atSourcePosition(4, () => {
        throw Object.assign(new Error('precise'), { pos: 9 });
      })
    ).toThrow(expect.objectContaining({ pos: 9 }));
    expect(atSourcePosition(4, () => 'value')).toBe('value');
  });
});

describe('parseError', () => {
  it('lists each parse failure at its file, line, and column', () => {
    const source = 'const a = 1;\nconst = ;';
    const { errors } = parseSync('fixture.ts', source);

    expect(parseError('Cannot read the fixture.', 'fixture.ts', source, errors).message).toMatch(
      /^Cannot read the fixture\.\nfixture\.ts:2:\d+: /
    );
  });
});
