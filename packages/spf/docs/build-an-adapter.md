# Build an adapter

<!--
AI first draft (2026-10-23), for Christian to rewrite. The adapter below was verified playing in
Playwright Chromium, Firefox, and WebKit (2026-10-23): 1280×720 of 5 renditions picked, currentTime
advancing, MSE blob source. Not yet run in real Safari. No sandbox template for now.
-->

An adapter is the outermost piece of SPF. On this page you build one for the background-video engine, the smallest engine SPF ships, and play a stream through it.

Background video is a real use case with a narrow job: play muted, loop, and start on its own. That keeps the adapter small enough to read in one sitting.

## What the adapter does

The adapter has [two jobs](./architecture.md#adapter). It implements the media element interface, so Video.js can use it the way it uses a `<video>` element. It is also the engine's public API, the one place code outside SPF talks to the engine.

The engine knows nothing about `src`, `play()`, or events. It knows its state and context. The adapter translates between the two.

## The adapter

`HTMLVideoAdapter` from `@videojs/media/dom` forwards the media element interface to an attached `<video>`. Extend it, create the engine, and override only what the engine has to handle:

```ts
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { createEngine } from '@videojs/spf/engines/hls-background-video';

export class BackgroundVideoAdapter extends HTMLVideoAdapter {
  readonly engine = createEngine();

  override get src(): string {
    return this.engine.state.presentation.get()?.url ?? '';
  }

  override set src(value: string) {
    if (value === this.src) return;

    this.engine.state.presentation.set(value ? { url: value } : undefined);
  }

  override attach(target: HTMLVideoElement): void {
    super.attach(target);

    // Background video is muted, loops, and starts on its own.
    target.muted = true;
    target.loop = true;
    target.autoplay = true;

    this.engine.context.mediaElement.set(target);
  }

  override detach(): void {
    this.engine.context.mediaElement.set(undefined);
    super.detach();
  }

  override destroy(): void {
    void this.engine.destroy();
    super.destroy();
  }
}
```

Each override connects one part of the media element interface to the engine:

- **`src`** reads and writes `state.presentation`. Writing `{ url }` is all it takes to start: the engine fetches the playlist, picks a rendition, and starts loading segments.
- **`attach()`** writes `context.mediaElement`. The engine waits for an element before it creates a `MediaSource`.
- **`detach()` and `destroy()`** clear the element and destroy the engine, which releases everything it created.

Everything else comes from the base class. `play()`, `currentTime`, and the media events go straight to the `<video>` element.

## Use it

Attach a `<video>` element and set a source:

```ts
const adapter = new BackgroundVideoAdapter();

adapter.attach(document.querySelector('video')!);
adapter.src = 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8';

adapter.addEventListener('timeupdate', () => console.log(adapter.currentTime));
```

## Compare it with the shipped adapter

SPF ships `HlsBackgroundVideoAdapter`, from `@videojs/spf/adapters/hls-background-video`, over the same engine. It does the same translation and adds what production needs:

- **Errors.** It reads `state.errors`, promotes the first fatal one to the adapter's `error` property, and fires an `error` event.
- **Playing before the source is ready.** If `play()` fails because the source hasn't loaded yet, it waits for `loadstart` and tries again. It cancels that retry when the source or element changes.
- **Config.** It passes engine config through its constructor.

The `<hls-background-video>` element wraps it so it can sit inside a Video.js player.

## Next

The engine behind this adapter is a list of features. Next, [compose an engine](./compose-an-engine.md) of your own and put it behind the same adapter.

