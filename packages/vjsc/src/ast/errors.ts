/** An error anchored to a source offset, which the Vite adapter reports at the authored location. */
export interface SourceError extends Error {
  readonly pos: number;
}

/** Create an error that points at a source offset in the module being transformed. */
export function sourceError(message: string, pos: number): SourceError {
  return Object.assign(new Error(message), { pos });
}

/**
 * Run the work of transforming one node, anchoring any error it throws to the node unless the error already points at a
 * more precise offset. Target rules and renderers throw plain errors; this is where they gain a location.
 */
export function atSourcePosition<T>(pos: number, run: () => T): T {
  try {
    return run();
  } catch (error) {
    if (error instanceof Error && !('pos' in error)) Object.assign(error, { pos });

    throw error;
  }
}

interface ParseError {
  readonly message: string;
  readonly labels: readonly { readonly start: number }[];
  readonly codeframe?: string | null | undefined;
}

/** An error listing each parse failure at its file, line, and column, with the parser's code frame when it has one. */
export function parseError(summary: string, fileName: string, source: string, errors: readonly ParseError[]): Error {
  const details = errors.map((error) => {
    const offset = error.labels[0]?.start;
    const lines = offset === undefined ? undefined : source.slice(0, offset).split('\n');
    const location = lines ? `${fileName}:${lines.length}:${lines.at(-1)!.length + 1}` : fileName;

    return `${location}: ${error.message}${error.codeframe ? `\n${error.codeframe}` : ''}`;
  });

  return new Error(`${summary}\n${details.join('\n')}`);
}
