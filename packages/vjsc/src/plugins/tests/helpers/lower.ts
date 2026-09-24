import { parseSync } from 'oxc-parser';
import { type OutputChunk, type Plugin, rolldown } from 'rolldown';

export const FIXTURE_ID = '\0fixture.tsx?target=react';

export interface LowerFixtureOptions {
  /** Module identity the fixture source is loaded under, including any transform query. */
  readonly id?: string | undefined;
  /** Compiler passes under test, in pipeline order. */
  readonly plugins: readonly Plugin[];
  /** Additional modules the fixture imports, keyed by resolved identity. */
  readonly modules?: Readonly<Record<string, string>> | undefined;
}

export interface FixtureBuild {
  /** The fixture's source after the passes under test. */
  readonly source: string;
  /** The chunk the build emitted. */
  readonly code: string;
  /** The fixture module's metadata once the build finished. */
  readonly meta: unknown;
}

/**
 * Compile one TSX fixture through the given passes. The lowered source is parsed so a pass that emits invalid syntax
 * fails here rather than in a later assertion.
 */
export async function buildFixture(source: string, options: LowerFixtureOptions): Promise<FixtureBuild> {
  const id = options.id ?? FIXTURE_ID;
  const modules = { ...options.modules, [id]: source };
  let output: string | undefined;
  let meta: unknown;

  const bundle = await rolldown({
    input: 'fixture',
    experimental: { nativeMagicString: true },
    external: (specifier) => specifier !== 'fixture' && !(specifier in modules),
    transform: { jsx: 'preserve' },
    plugins: [
      {
        name: 'fixture:modules',
        resolveId: (specifier) => (specifier === 'fixture' ? id : specifier in modules ? specifier : null),
        load: (moduleId) => (moduleId in modules ? { code: modules[moduleId]!, moduleType: 'tsx' } : null),
      },
      ...options.plugins,
      {
        name: 'fixture:inspect',
        buildEnd() {
          const info = this.getModuleInfo(id);

          output = info?.code ?? undefined;
          meta = info?.meta;
        },
      },
    ],
  });

  const generated = await bundle.generate({ format: 'es' });

  await bundle.close();

  const chunk = generated.output.find((item): item is OutputChunk => item.type === 'chunk');
  if (output === undefined || !chunk) throw new Error('Fixture build did not transform the fixture module.');

  const parsed = parseSync('fixture.tsx', output);

  if (parsed.errors.length > 0) {
    throw new Error(
      `Lowered fixture is not valid TSX:\n${parsed.errors.map((error) => error.message).join('\n')}\n\n${output}`
    );
  }

  return { source: output, code: chunk.code, meta };
}

/** Compile one TSX fixture through the given passes and return its final source. */
export async function lowerFixture(source: string, options: LowerFixtureOptions): Promise<string> {
  return (await buildFixture(source, options)).source;
}
