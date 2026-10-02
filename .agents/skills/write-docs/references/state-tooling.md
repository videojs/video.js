# State Management & Tooling Documentation Patterns

Patterns from Zustand, Jotai, XState, Vite, Vitest, esbuild, Biome.

## Contents

- [State Management Documentation](#state-management-documentation) — Zustand, Jotai, XState patterns
- [Configuration Documentation](#configuration-documentation) — Vite, esbuild patterns
- [Testing Documentation](#testing-documentation-vitest) — Test examples, mocking media

## State Management Documentation

### Zustand Pattern: Minimal Getting Started

3 code blocks to first success:

```markdown
## Getting Started

Create a store:

const useStore = create((set) => ({
volume: 1,
setVolume: (v) => set({ volume: v }),
}));

Use in component:

function VolumeControl() {
const volume = useStore((state) => state.volume);
return <input value={volume} />;
}

That's it. No providers, no boilerplate.
```

**Key:** Show the simplest possible example first. Complexity comes later.

### Jotai Pattern: Primitive Naming

`atomWith*` naming convention documents behavior:

| Name              | Behavior                 |
| ----------------- | ------------------------ |
| `atom`            | Basic read/write         |
| `atomWithStorage` | Persists to localStorage |
| `atomWithReset`   | Has reset capability     |
| `atomWithDefault` | Async default value      |

**Applicable to Video.js:**

- `createPlayerWith*` naming for factory functions
- `featureWith*` for feature factories

### XState Pattern: Visual State Machines

Bidirectional code-visualization sync:

```markdown
## Player States

[Interactive state diagram here]

const playerMachine = createMachine({
initial: 'idle',
states: {
idle: { on: { LOAD: 'loading' } },
loading: { on: { READY: 'ready', ERROR: 'error' } },
ready: { on: { PLAY: 'playing' } },
playing: { on: { PAUSE: 'paused', END: 'ended' } },
paused: { on: { PLAY: 'playing' } },
ended: { on: { REPLAY: 'playing' } },
error: { on: { RETRY: 'loading' } },
},
});
```

**Applicable to Video.js:**

- Document player state machine with diagrams
- Show event-driven transitions
- Visualize request lifecycle

### TanStack Query Pattern: AI-Friendly Exports

Every page includes:

```markdown
> **AI/LLM:** This page is available in plain markdown at
> [/docs/queries.md](/docs/queries.md)
```

Also:

- Codemod-assisted migrations (`npx @tanstack/query-codemod`)
- Per-version documentation (`/v4/`, `/v5/`)

## Configuration Documentation

### Vite Pattern: Option Documentation

```markdown
### root

- **Type:** `string`
- **Default:** `process.cwd()`
- **CLI:** `--root <path>`

Project root directory. Can be absolute or relative to cwd.

export default defineConfig({
root: './src',
});
```

**Format rules:**

- Type first (expandable for complex types)
- Default value explicit
- CLI equivalent if applicable
- Short description
- Example

### esbuild Pattern: Multi-Interface Examples

Same config in multiple formats:

```markdown
## minify

<Tabs>
<Tab label="CLI">
esbuild app.js --minify
</Tab>
<Tab label="JS">
import * as esbuild from 'esbuild';

await esbuild.build({
entryPoints: ['app.js'],
minify: true,
});
</Tab>
<Tab label="Go">
package main

import "github.com/evanw/esbuild/pkg/api"

api.Build(api.BuildOptions{
EntryPoints: []string{"app.js"},
MinifyWhitespace: true,
})
</Tab>
</Tabs>
```

**Applicable to Video.js:**

- JS config object
- Data attributes on `<video>`
- Framework-specific props

### Biome Pattern: Migration Documentation

```markdown
## Migrating from ESLint

Run the migration tool:

npx @biomejs/biome migrate eslint --write

This reads your `.eslintrc` and generates `biome.json`.

### Rule Mapping

| ESLint           | Biome                                |
| ---------------- | ------------------------------------ |
| `no-unused-vars` | `lint/correctness/noUnusedVariables` |
| `semi`           | `lint/style/useSemicolons`           |

### What's Not Migrated

- Plugin-specific rules
- Custom rule configurations
```

**Applicable to Video.js:**

- Migration from v8/v9 to v10
- Plugin compatibility tables
- Codemod commands

## Testing Documentation (Vitest)

### Test Examples Pattern

```markdown
## Testing Components

import { render, screen } from '@testing-library/react';
import { Player } from '@videojs/react';

test('renders player', () => {
render(<Player src="test.mp4" />);
expect(screen.getByRole('application')).toBeInTheDocument();
});

### Mocking Media

import { mockMediaElement } from '@videojs/test-utils';

beforeEach(() => {
mockMediaElement();
});
```

### Test Utilities Documentation

Document test helpers prominently:

```markdown
## Test Utilities

@videojs/test-utils provides:

| Export               | Purpose                   |
| -------------------- | ------------------------- |
| `mockMediaElement()` | Mock HTMLMediaElement     |
| `createTestPlayer()` | Create player for testing |
| `simulatePlay()`     | Trigger play event        |
| `waitForState()`     | Wait for state change     |
```

## CLI Documentation

### Command Reference Pattern

```markdown
## Commands

### videojs build

Build player bundle.

videojs build [options]

#### Options

| Option        | Description         | Default |
| ------------- | ------------------- | ------- |
| `--outdir`    | Output directory    | `dist`  |
| `--minify`    | Minify output       | `true`  |
| `--sourcemap` | Generate sourcemaps | `true`  |

#### Examples

# Basic build

videojs build

# Custom output

videojs build --outdir=public/player
```

### Error Messages Documentation

Document common errors:

```markdown
## Troubleshooting

### "Player not attached to media component"

**Cause:** Called method before `attach()`.

**Solution:**

// ❌ Wrong
const { PlayerElement } = createPlayer({ features: videoFeatures });
const player = new PlayerElement();
await player.store.play(); // No media is attached yet.

// ✅ Correct
const { PlayerElement } = createPlayer({ features: videoFeatures });
const player = new PlayerElement();
player.append(videoElement);
document.body.append(player);
await player.store.play();
```

## Plugin Documentation Pattern

```markdown
## Creating Plugins

### Basic Plugin

function myPlugin(player, options) {
// Plugin code
return {
destroy() {
// Cleanup
},
};
}

// Register
player.use(myPlugin, { option: 'value' });

### Plugin Options

Define options with defaults:

const defaultOptions = {
enabled: true,
threshold: 0.5,
};

function myPlugin(player, userOptions) {
const options = { ...defaultOptions, ...userOptions };
}

### Plugin Lifecycle

| Hook        | When                       |
| ----------- | -------------------------- |
| `onAttach`  | Player attached to element |
| `onReady`   | Media ready to play        |
| `onDestroy` | Player being destroyed     |
```

## Event Documentation Pattern

```markdown
## Events

### Listening to Events

player.on('play', () => {
console.log('Playing');
});

### Event Reference

| Event          | Payload                              | Description      |
| -------------- | ------------------------------------ | ---------------- |
| `play`         | `void`                               | Playback started |
| `pause`        | `void`                               | Playback paused  |
| `timeupdate`   | `{ currentTime: number }`            | Time changed     |
| `volumechange` | `{ volume: number, muted: boolean }` | Volume changed   |
| `error`        | `{ code: number, message: string }`  | Error occurred   |

### Custom Events

player.emit('custom:event', { data: 'value' });
```
