# SPF architecture

<!--
AI first draft (2026-10-23), for Christian to rewrite. Snippets are trimmed from the source files they
name. Shape follows site/src/content/docs/guides/architecture.mdx: one section per piece, a sentence or
two, one small snippet, links into the reference.
-->

SPF has four pieces, and you meet them from the outside in. A media element talks to an adapter. The adapter drives an engine. The engine is a list of features, and each feature is a list of behaviors.

```mermaid
graph LR
  element["&lt;hls-video&gt;"] --> adapter[Adapter]
  adapter --> engine[Engine]
  engine --> features[Features]
  features --> behaviors[Behaviors]
```

For the reasons behind this design, see [Why SPF?](./why-spf.md).

## Adapter

An adapter does two jobs at once:

- **It is the engine's Video.js playback adapter.** It plays the role `@videojs/hlsjs-video` plays for hls.js. It implements the media element interface over the engine: `src`, `play()`, `currentTime`, the events, and the rest. Video.js uses it the way it uses a `<video>` element.
- **It is the engine's public API.** hls.js and dash.js each publish an API of their own, and you code against it directly. SPF publishes none at the engine level, because a composed engine's shape depends on which features it includes. The adapter is where an engine gets a stable, predictable API.

`<hls-video>` is a Video.js media element built on `HlsVideoAdapter`, from `@videojs/spf/adapters/hls-video`.

The adapter translates between the two sides. Setting `src` writes the engine's state, and attaching a `<video>` element writes the engine's context:

```ts
// packages/spf/src/playback/adapters/hls-video/mixin.ts (trimmed)
attach(mediaElement: HTMLMediaElement): void {
  this.#engine.context.mediaElement.set(mediaElement);
}

set src(value: string) {
  this.#engine.state.presentation.set(value ? { url: value } : undefined);
}
```

The adapter owns platform behavior such as attaching, starting playback, and reporting errors. The engine owns streaming.

## Engine

An engine is an ordered list of features. SPF ships pre-composed engines, such as `hls-video`, `hls-audio`, and `hls-background-video`. Each one's entry point exports its features, its defaults, and a `createEngine()` function:

```ts
// packages/spf/src/playback/engines/hls-video.ts (trimmed)
export const features = [
  initialLoadFeature,
  hlsLoadingFeature,
  multiCdnFeature,
  // …16 more
  chaptersFeature,
] as const;
```

```ts
import { createEngine } from '@videojs/spf/engines/hls-video';

const engine = createEngine({ initialBandwidth: 2_000_000 });

engine.context.mediaElement.set(videoEl);
engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });

await engine.destroy();
```

An engine exposes its `state`, its `context`, and `destroy()`. Its types come from its features, so adding or removing a feature changes them with nothing else to update. See the [engine reference](./reference/engines/hls-video.md).

> [!NOTE]
> SPF's core knows nothing about features. A composition is one list of behaviors, plus the config defaults and initial state they need, and `createComposition()` takes exactly that. Features are a layer on top that names and groups behaviors. `flattenFeatures()` turns a feature list into a composition's inputs, and `defineCompositionFactory()` turns those into `createEngine()`. You can also compose behaviors directly, with no features at all.

## Features

A feature is a group of behaviors that together give an engine one ability, such as playing video or handling DRM. It also carries the config defaults and initial state those behaviors need. SPF features live inside an engine and are unrelated to the player's store features. Some features have one behavior:

```ts
// packages/spf/src/playback/features/chapters.ts (trimmed)
export const behaviors = [loadChapters] as const;

export const chaptersFeature = defineFeature({ behaviors, defaultConfig, initialState });
```

Others have several. Features can depend on each other: the video feature loads nothing until another feature writes `context.mediaSource`. Each feature's reference page lists what it needs from the others. See the [features reference](./reference/README.md#features).

## Behaviors

A behavior does one job. It declares the state and context it uses, and its types say which of those it writes (`Signal`) and which it only reads (`ReadonlySignal`). A behavior never imports or calls another behavior. Behaviors coordinate only through shared state and context.

```ts
// packages/spf/src/playback/behaviors/dom/track-playback-rate.ts (trimmed)
export const trackPlaybackRate = defineBehavior({
  stateKeys: ['playbackRate'],
  contextKeys: ['mediaElement'],
  setup: ({ state, context }) =>
    effect(() => {
      const mediaElement = context.mediaElement.get();
      if (!mediaElement) return;

      const sync = () => state.playbackRate.set(mediaElement.playbackRate);
      sync();
      return listen(mediaElement, 'ratechange', sync);
    }),
});
```

`setup()` runs once, when the engine is created. Whatever it returns is the behavior's cleanup, which runs when the engine is destroyed. See the [behaviors reference](./reference/README.md#behaviors).

## State, context, and config

Every behavior in an engine shares three things:

- **State** holds facts about playback and what the user asked for, such as the presentation, the selected tracks, and the playback rate.
- **Context** holds objects the engine works with, such as the media element, the `MediaSource`, and the actors that own its buffers.
- **Config** holds settings and swappable functions, such as the initial bandwidth estimate or the playlist parser. It is fixed for the engine's lifetime.

State and context are signals: each key holds a current value that behaviors can read, write, and react to. Config is a plain object. Some state and context keys are written from outside the engine, by the adapter or your own code. Features declare those as external signals.

## Inside a behavior

A behavior uses a few smaller building blocks: signals and effects for reacting to state, tasks for cancellable async work, actors for owning resources like a `SourceBuffer`, and reactors for work that moves through stages. Later pages cover each one.

## Next

Start with the outermost piece: [build an adapter](./build-an-adapter.md).
