import * as path from 'node:path';

import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';

import { abbreviateType, formatDetailedType, formatType } from '../formatter';
import type { ResolvedType, SourceFile } from '../oxc-project';
import { OxcProject } from '../oxc-project';

const FIXTURE_ROOT = path.resolve(import.meta.dirname, 'fixtures/monorepo');

describe('abbreviateType', () => {
  it('abbreviates functions and callback unions', () => {
    expect(abbreviateType('selector', '((state: object) => string)')).toBe('function');
    expect(abbreviateType('selector', '((state: object) => string) | undefined')).toBe('undefined | function');
    expect(abbreviateType('useMedia', '(() => Media | null)')).toBe('function');
    expect(abbreviateType('useMedia', '(() => Media | null) | undefined')).toBe('undefined | function');
    expect(abbreviateType('onChange', '(value: string) => void')).toBe('function');
    expect(abbreviateType('label', "string | ((state: object) => string) | 'auto'")).toBe("string | 'auto' | function");
    expect(abbreviateType('transform', '((value: string) => string) | ((value: number) => number)')).toBe('function');
    expect(abbreviateType('transform', '((value: string) => string) | ((value: number) => number) | undefined')).toBe(
      'undefined | function'
    );
  });

  it('does not treat nested unions or function properties as top-level function members', () => {
    expect(abbreviateType('result', 'Promise<string | null> | undefined')).toBeUndefined();
    expect(abbreviateType('config', '{ load: (() => void) }')).toBeUndefined();
    expect(abbreviateType('result', 'Promise<() => void> | undefined')).toBeUndefined();
    expect(abbreviateType('result', 'Array<() => void> | null')).toBeUndefined();
    expect(abbreviateType('config', '{ load: (() => void) } | undefined')).toBeUndefined();
    expect(abbreviateType('factory', 'Record<string, (state: State) => string | undefined>')).toBe(
      'Record<string, (state: State) => stri...'
    );
  });

  it('abbreviates only top-level function intersections', () => {
    expect(abbreviateType('PlayerElement', 'typeof UIElement & ((...args: unknown) => PlayerElement)')).toBe(
      'typeof UIElement & function'
    );
    expect(abbreviateType('value', 'A & (() => void) | undefined')).toBe('undefined | A & function');
  });

  it('uses the conventional component display types', () => {
    expect(abbreviateType('className', 'string | ((state: object) => string)')).toBe('string | function');
    expect(abbreviateType('className', 'string | ((state: SliderState) => string | undefined)')).toBe(
      'string | function'
    );
    expect(abbreviateType('style', 'CSSProperties | ((state: object) => CSSProperties)')).toBe(
      'CSSProperties | function'
    );
    expect(abbreviateType('render', 'ReactElement | ((state: object) => ReactElement)')).toBe(
      'ReactElement | function'
    );
  });

  it('leaves compact scalar and union types alone', () => {
    expect(abbreviateType('disabled', 'boolean')).toBeUndefined();
    expect(abbreviateType('size', "'small' | 'large'")).toBeUndefined();
    expect(abbreviateType('size', "'small' | 'medium' | 'large' | 'xlarge'")).toBeUndefined();
  });

  it('abbreviates long object and union types', () => {
    expect(abbreviateType('result', '{ volume: number; muted: boolean; level: string }')).toBe('object');

    const union = "'option-a' | 'option-b' | 'option-c' | 'option-d' | 'option-e'";

    expect(abbreviateType('choice', union)).toBe(`${union.slice(0, 37)}...`);
  });
});

describe('formatType', () => {
  it.each([
    ['boolean', 'boolean'],
    ['string | undefined', 'string | undefined'],
    ['string | undefined', 'string', true],
    ['string | (number | boolean)', 'string | number | boolean'],
    ['{ x: number; y?: number }', '{ x: number; y?: number }'],
    ['string[]', 'string[]'],
    ['(string | number)[]', '(string | number)[]'],
    ['[string, number]', '[string, number]'],
    ['"hello"', "'hello'"],
    ['React.ReactElement<{ x: string }>', 'ReactElement'],
    ['React.CSSProperties', 'CSSProperties'],
    ['Map<string, number>', 'Map<string, number>'],
    ['(x: string) => void', '((x: string) => void)'],
    ['{ (state: State): Result; displayName?: string }', '{ (state: State): Result; displayName?: string }'],
    ['{ run(count?: number, ...rest: string[]): void }', '{ run(count?: number, ...rest: string[]): void }'],
    ['new (host: HTMLElement) => Controller', '(new (host: HTMLElement) => Controller)'],
    ['Tag | (string & {})', 'Tag | string & {}'],
  ])('formats %s', (input, expected, removeUndefined = false) => {
    expect(formatType(parseType(input), removeUndefined)).toBe(expected);
  });

  it('orders null and undefined last and deduplicates unions', () => {
    expect(formatType(parseType('null | string | undefined | number | string'), false)).toBe(
      'string | number | null | undefined'
    );
  });

  it('formats call and construct signatures with type substitutions', () => {
    const type = parseType('{ (state: State): Result; new <Value>(store: Store): PlayerController<Store> }');
    const substitutions = new Map<string, ResolvedType>([
      ['State', parseType("'ready'")],
      ['Result', parseType('boolean')],
      ['Store', parseType('VideoPlayerStore')],
    ]);

    expect(formatType({ ...type, substitutions }, false)).toBe(
      "{ (state: 'ready'): boolean; new <Value>(store: VideoPlayerStore): PlayerController<VideoPlayerStore> }"
    );
  });
});

describe('formatDetailedType', () => {
  const project = new OxcProject(FIXTURE_ROOT);
  const gaugeFile = path.join(FIXTURE_ROOT, 'packages/core/src/core/ui/gauge/core.ts');
  const mediaTypesFile = path.join(FIXTURE_ROOT, 'packages/media/src/core/types.ts');

  it('expands a local alias through the Oxc project resolver', () => {
    const file = project.source(gaugeFile)!;
    const type = parseType('FillLevel', file);

    expect(formatDetailedType(project, type, false)).toBe("'empty' | 'partial' | 'full'");
  });

  it('falls back to the authored reference when it cannot resolve a name', () => {
    const file = project.source(gaugeFile)!;

    expect(formatDetailedType(project, parseType('UnknownType', file), false)).toBe('UnknownType');
  });

  it('expands indexed access over a const object to its literal values', () => {
    const file = project.source(mediaTypesFile)!;

    expect(formatDetailedType(project, parseType('MediaStreamType', file), false)).toBe(
      "'on-demand' | 'live' | 'unknown'"
    );
  });

  it('expands keyof over a const object to its literal keys', () => {
    const file = project.source(mediaTypesFile)!;

    expect(formatDetailedType(project, parseType('MediaStreamTypeKey', file), false)).toBe(
      "'ON_DEMAND' | 'LIVE' | 'UNKNOWN'"
    );
  });

  it('expands inherited interface members and their aliased types', () => {
    const file = project.source(gaugeFile)!;

    expect(formatDetailedType(project, parseType('TapGestureOptions', file), false)).toBe(
      "{ pointer?: 'mouse' | 'touch'; disabled?: boolean; target?: HTMLElement | null }"
    );
  });

  it('keeps derived properties and method overloads when expanding heritage', () => {
    const file = project.source(gaugeFile)!;

    expect(formatDetailedType(project, parseType('OverrideOptions', file), false)).toBe(
      "{ inherited: boolean; value?: string; addListener(type: 'ready', listener: (() => void)): void; addListener(type: 'change', listener: ((value: string) => void)): void }"
    );
  });

  it('uses display type hints with generic substitutions', () => {
    const file = project.source(gaugeFile)!;

    expect(formatDetailedType(project, parseType('InferFixtureState<FixtureStore>', file), false)).toBe(
      "FixtureStore['state']"
    );
  });
});

function parseType(typeText: string, context?: SourceFile): ResolvedType {
  const source = `type __Test = ${typeText};`;
  const parsed = parseSync('formatter-test.ts', source);
  const declaration = parsed.program.body[0];
  if (declaration?.type !== 'TSTypeAliasDeclaration') throw new Error(`Could not parse type: ${typeText}`);

  return {
    file: context ?? {
      filePath: 'formatter-test.ts',
      source,
      program: parsed.program,
      comments: parsed.comments,
    },
    type: declaration.typeAnnotation,
  };
}
