import variant from '@jitl/quickjs-singlefile-mjs-release-sync';
import { z } from 'astro/zod';
import {
  newQuickJSWASMModuleFromVariant,
  type QuickJSContext,
  type QuickJSHandle,
  type QuickJSWASMModule,
  shouldInterruptAfterDeadline,
} from 'quickjs-emscripten-core';

export interface QueryLimits {
  timeoutMs: number;
  memoryBytes: number;
  stackBytes: number;
  /** Characters of JSON returned, about 4k tokens by default. */
  outputCharacters: number;
}

export const DEFAULT_QUERY_LIMITS: QueryLimits = {
  timeoutMs: 1000,
  memoryBytes: 128 * 1024 * 1024,
  stackBytes: 1024 * 1024,
  outputCharacters: 16_000,
};

export type QueryReferenceResult =
  | { ok: true; json: string; truncated: boolean; characters: number }
  | { ok: false; error: string };

const RECORD_HINT =
  'props, state, dataAttributes, cssCustomProperties, parts, config, and actions are objects keyed by name; use Object.keys or Object.entries on them.';

let quickjs: Promise<QuickJSWASMModule> | undefined;

function loadQuickJS(): Promise<QuickJSWASMModule> {
  quickjs ??= newQuickJSWASMModuleFromVariant(variant);

  return quickjs;
}

// The agent's code is either a function of `ref` or an expression that uses `ref`; both run with `ref` in scope. An
// async function's promise is settled after the synchronous run, under the same deadline.
function program(code: string): string {
  return `"use strict";
const ref = JSON.parse(globalThis.__ref);
delete globalThis.__ref;
const __query = (
${code}
);
const __value = typeof __query === 'function' ? __query(ref) : __query;
const __json = (value) => JSON.stringify(value === undefined ? null : value);
__value instanceof Promise ? __value.then(__json) : __json(__value);`;
}

// QuickJS dumps a thrown Error as a plain `{ name, message }` object.
const ThrownErrorSchema = z.object({ name: z.string().default('Error'), message: z.string() });

type ThrownError = z.infer<typeof ThrownErrorSchema>;

/** Read and release a thrown value's handle. */
function takeError(vm: QuickJSContext, handle: QuickJSHandle): ThrownError {
  const dumped = vm.dump(handle);
  const parsed = ThrownErrorSchema.safeParse(dumped);

  handle.dispose();

  return parsed.success ? parsed.data : { name: 'Error', message: String(dumped) };
}

function describeError({ name, message }: ThrownError): string {
  if (name === 'InternalError' && message === 'interrupted') return 'The query ran past its time limit. Narrow it.';

  const hint =
    name === 'SyntaxError'
      ? ' Pass one function of `ref`, such as `ref => ref.components.map((c) => c.name)`.'
      : /not a function|not iterable|cannot read property|undefined|null/i.test(message)
        ? ` ${RECORD_HINT}`
        : '';

  return `${name}: ${message}${hint}`;
}

/**
 * Run agent-written JavaScript against the reference data in a fresh QuickJS context: no network, no host functions,
 * bounded time and memory. Returns the result as JSON, truncated to the output limit.
 */
export async function queryReference(
  code: string,
  referenceJson: string,
  limits: QueryLimits = DEFAULT_QUERY_LIMITS
): Promise<QueryReferenceResult> {
  const module = await loadQuickJS();
  const runtime = module.newRuntime();

  runtime.setMemoryLimit(limits.memoryBytes);
  runtime.setMaxStackSize(limits.stackBytes);
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + limits.timeoutMs));

  const vm = runtime.newContext();

  try {
    const data = vm.newString(referenceJson);

    vm.setProp(vm.global, '__ref', data);
    data.dispose();

    const evaluated = vm.evalCode(program(code), 'query.js');
    if (evaluated.error) return { ok: false, error: describeError(takeError(vm, evaluated.error)) };

    let output = evaluated.value;
    const initial = vm.getPromiseState(output);

    // A non-promise comes back as itself; a promise's early state holds a handle of its own to release.
    if (initial.type !== 'fulfilled' || !initial.notAPromise) {
      if (initial.type === 'fulfilled') initial.value.dispose();
      else if (initial.type === 'rejected') initial.error.dispose();

      // A job that throws also rejects the query's promise, which is reported below.
      runtime.executePendingJobs().dispose();

      const settled = vm.getPromiseState(output);

      output.dispose();

      if (settled.type === 'pending') return { ok: false, error: 'The query never settled. Return a value.' };

      if (settled.type === 'rejected') return { ok: false, error: describeError(takeError(vm, settled.error)) };

      output = settled.value;
    }

    const json = vm.typeof(output) === 'string' ? vm.getString(output) : 'null';

    output.dispose();

    const truncated = json.length > limits.outputCharacters;

    return {
      ok: true,
      json: truncated ? json.slice(0, limits.outputCharacters) : json,
      truncated,
      characters: json.length,
    };
  } finally {
    vm.dispose();
    runtime.dispose();
  }
}
