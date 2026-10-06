import { describe, expect, it } from 'vite-plus/test';

import { splitTitleLines } from '../render-og-image';

describe('splitTitleLines', () => {
  it('breaks after an em dash when both clauses fit and are balanced', () => {
    expect(splitTitleLines('VIDEO.JS V10 IS GA — LET THE MIGRATIONS BEGIN!')).toEqual([
      'VIDEO.JS V10 IS GA —',
      'LET THE MIGRATIONS BEGIN!',
    ]);
  });

  it('breaks after a colon', () => {
    expect(splitTitleLines('MIGRATING FROM PLYR: A STEP BY STEP GUIDE')).toEqual([
      'MIGRATING FROM PLYR:',
      'A STEP BY STEP GUIDE',
    ]);
  });

  it('keeps titles that fit on one line intact', () => {
    expect(splitTitleLines('HELLO — WORLD AGAIN')).toEqual(['HELLO — WORLD AGAIN']);
  });

  it('skips unbalanced or overlong clauses', () => {
    expect(splitTitleLines('NOTE: EVERYTHING ABOUT THE NEW STREAMING ENGINE')).toEqual([
      'NOTE: EVERYTHING ABOUT THE NEW STREAMING ENGINE',
    ]);
    expect(splitTitleLines('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AGAIN — YES')).toEqual([
      'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AGAIN — YES',
    ]);
  });

  it('does not break at hyphens inside words', () => {
    expect(splitTitleLines('SERVER-SIDE AD INSERTION WITH SOME LONG SUFFIX')).toEqual([
      'SERVER-SIDE AD INSERTION WITH SOME LONG SUFFIX',
    ]);
  });
});
