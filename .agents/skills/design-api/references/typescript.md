# TypeScript Patterns

Type inference techniques for library authors and evaluation patterns for consumers.

## The Partial Inference Problem

TypeScript infers all generics or none. Libraries need techniques to enable partial inference.

### Currying Pattern

Split creation into two function calls to create separate inference sites:

```ts
// First () binds state type explicitly
// Second () allows middleware types to be inferred
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));
```

**When to use:** When you need to fix one type parameter while inferring others.

### Builder Pattern

Chain methods that progressively narrow types:

```ts
const schema = z.object({
  name: z.string(),
  age: z.number(),
});
// Type is inferred from the chain
type User = z.infer<typeof schema>;
```

### Factory with Generics Bound Once

Capture target/platform type once, let callbacks infer:

```ts
// Capture Target type once
const feature = defineFeature<HTMLVideoElement>()({
  state: ({ task }) => ({
    volume: 1,
    setVolume(v: number) {
      return task({ handler: ({ target }) => { target.volume = v; } });
    },
  }),

  attach({ target, signal, set }) {
    const sync = () => set({ volume: target.volume });

    sync();

    target.addEventListener('volumechange', sync, { signal });
  },
});
```

---

## Parse, Don't Validate

> "Parsers preserve information in the type system; validators throw it away." — Alexis King

```ts
// Validator: Returns boolean, discards knowledge
function isNonEmpty(list: string[]): boolean {
  return list.length > 0;
}
// After check, TypeScript still thinks it might be empty

// Parser: Returns refined type, preserves guarantee
function parseNonEmpty<T>(list: T[]): NonEmptyArray<T> | null {
  return list.length > 0 ? (list as NonEmptyArray<T>) : null;
}
// After parse, TypeScript knows it's non-empty
```

**Why parsing wins:** After parsing, TypeScript remembers the constraint. No redundant checks downstream.

---

## Eliminate Shotgun Parsing

Validation scattered throughout code signals missing abstraction:

```ts
// Shotgun parsing: validation everywhere
function processUser(data: unknown) {
  if (!data.name) throw new Error('Missing name');
  saveName(data.name);
  // ... 100 lines later ...
  if (!data.email) throw new Error('Missing email'); // Why here?
}

// Parse at boundaries, trust types internally
function processUser(user: User) {
  saveName(user.name); // Type guarantees existence
  saveEmail(user.email); // No defensive checks
}

// Parsing happens at API boundary
const user = userSchema.parse(request.body);
processUser(user);
```

---

## Explicit Context Narrowing

TypeScript's control flow doesn't propagate through function boundaries:

```ts
// Type narrowing lost
const middleware = ({ ctx, next }) => {
  if (!ctx.user) throw new Error('Unauthorized');
  return next(); // ctx.user still User | undefined downstream
};

// Explicit return tells TypeScript
const middleware = ({ ctx, next }) => {
  if (!ctx.user) throw new Error('Unauthorized');
  return next({
    ctx: { ...ctx, user: ctx.user }, // Explicitly non-null
  });
};
```

**Why explicit returns:** TypeScript can't know that throwing guarantees `ctx.user` exists in `next()`. You must explicitly return the narrowed context.

---

## Avoid Globals for Type Context

```ts
// Global interface declaration (avoid)
declare global {
  interface AppContext {
    user: User;
  }
}

// Factory carries type context (prefer)
const t = initTRPC.context<{ user: User }>().create();
// All procedures derived from t carry this context type
```

**Why factories win:**

- Can have multiple instances with different types
- No global pollution
- Easy to test with different contexts
- TypeScript tracks types through derivation

---

## Design Types First

> "Without the types and without that being great, there's no point of tRPC." — KATT

**Process:**

1. Design types first in TypeScript Playground
2. Verify inference works as expected
3. Backfill runtime implementation

**Why types-first works:**

- API design flaws surface early
- Impossible states become visible in types
- IDE autocomplete becomes documentation
- "If it compiles, the API contract is correct"

---

## Export Helper Types

Every library should export helper types so users can derive types:

```ts
// Zustand
type State = ExtractState<typeof useStore>;

// Jotai
type Value = ExtractAtomValue<typeof myAtom>;

// XState
type Snapshot = SnapshotFrom<typeof machine>;

// Your library
export type ExtractState<S> = S extends Store<infer T> ? T : never;
export type InferInput<S> = S extends Schema<infer I, any> ? I : never;
```

**Rule:** If users need to manually annotate, export a helper type to derive it.

---

## Type Guards Over String Checks

```ts
// Poor: stringly-typed, no narrowing
if (state.status === 'playing') { ... }

// Good: type guard with narrowing
if (isPlaying(state)) {
  state.currentTime // typed as number
}
```

---

## Discriminated Unions for State

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Narrowing works automatically
if (state.status === 'success') {
  state.data; // typed
}
```

---

## Generic Constraints

Good constraints guide inference and provide better errors:

```ts
// Poor: accepts anything, unhelpful errors
function createStore<T>(initial: T): Store<T>;

// Good: constrained, clear expectations
function createStore<T extends Record<string, unknown>>(initial: T): Store<T>;
```

---

## Inference Red Flags

| Pattern                             | Problem                       |
| ----------------------------------- | ----------------------------- |
| Frequent explicit generics in usage | Inference not working         |
| `unknown` in public API             | Forces user casting           |
| Deeply nested generics              | Inference often fails         |
| Required type annotations           | Library isn't inference-first |

---

## Testing Type Inference

Use `expectTypeOf` from Vite+ Test or `tsd` to verify inference:

```ts
import { expectTypeOf } from 'vite-plus/test';

test('infers state type', () => {
  const store = createStore({ count: 0 });
  expectTypeOf(store.getState()).toEqualTypeOf<{ count: number }>();
});
```

---

## Method Chaining vs Function Composition

| Approach                                | Pros                                | Cons              |
| --------------------------------------- | ----------------------------------- | ----------------- |
| Chaining (`z.string().email()`)         | Reads naturally, great autocomplete | Larger bundle     |
| Composition (`pipe(string(), email())`) | Tree-shakeable                      | Less discoverable |

**Bundle comparison:**

- Zod (chaining): ~15 kB for login form
- Valibot (composition): ~1.4 kB for same form

---

## See Also

- [Principles](principles.md) — core design principles
- [Anti-Patterns](anti-patterns.md) — TypeScript mistakes to avoid
