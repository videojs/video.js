# Why SPF?

<!--
AI first draft (2026-10-23), for Christian to rewrite. Every claim traces to a source in the private
inventory (why-spf-inventory.md, §n) or to the code; nothing here is meant as final wording.
Shape follows site/src/content/docs/guides/why-videojs.mdx. Target length: about 1,000–1,200 words.
-->

SPF is a library for building streaming engines out of small parts. Video.js's HLS media elements run on engines built with it, so most people use SPF without ever seeing it. This page explains why we built SPF, the principles behind its design, and the tradeoffs we accept to hold to them.

## Why we built SPF

Playback engines like hls.js, dash.js, and Shaka Player are large because of how they grow. Each feature spreads across many modules and shares code with other features. Over time, that spread hardens into assumptions about how the pieces fit together. Those assumptions make features hard to remove. hls.js's light build drops DRM, subtitles, alternate audio, and more, and it is still about two thirds the size of the full build.

The same assumptions get in the way when you need something nonstandard. Audio-only playback is a good example. A typical engine reads the multivariant playlist and downloads video renditions it never plays. Changing that means working against the engine.

Monoliths cause this problem across the whole player, not only in the engine. Video.js answers it with composable features, skins you can change, and media elements that hide which engine runs underneath. We built SPF to give the engine the same answer.

In 2024, [@cjpillsbury](https://github.com/cjpillsbury) and [@decepulis](https://github.com/decepulis) wrote [Why are video players so big?](https://www.mux.com/blog/what-is-a-video-playback-engine). The post diagnosed this problem and advised against building a custom engine for a single player. The diagnosis still holds. What changed is what we were building. The post looked at one player, and reusing hls.js made sense there. Video.js is a toolkit for many players, from full-featured video to audio-only to background video. Each of those needs a different engine, and the engine was the heaviest part of the player that we couldn't trim. One library that composes many engines fits that job better than one engine that tries to cover every case. Our current full HLS video engine supports less than hls.js and tolerates less from messy streams, but it is about a quarter of hls.js's size. The engines built for narrower jobs are smaller still.

## Design principles

### Small by default

Every byte in an SPF engine should earn its place. A smaller engine loads faster, and shipping less code is the way to improve page performance without hurting playback quality. For background video, the baseline we compete with is the plain `<video>` element.

As of Video.js 10.2, `<hls-video>` ships about 35 kB with its SPF engine included. `<hlsjs-video>`, its counterpart on hls.js, ships about 137 kB with hls.js included. SPF's full HLS engine is about a quarter of the size. `<hls-background-video>` composes a smaller engine and ships about 18 kB.

<!-- Measured 2026-10-23, minified + brotli (quality 11), the same method as the CI bundle-size report.
SPF figures: CI report on #9581 (main at c15ea1927): /media/hls-video 34.89 kB,
/media/hls-background-video 17.94 kB. hls.js figure: /media/hlsjs-video 2.64 kB plus hls.js 1.6.19
dist/hls.min.js 133.83 kB (hls.light.min.js: 91.59 kB). Re-measure before publishing; these drift
with every feature. -->


Size is one value among several, so it doesn't win every argument. It does break ties: when two ways of writing something are otherwise equal, we choose the one that ships fewer bytes.

### Compose the engine you need

An SPF engine is a list of behaviors. Each behavior does one job, such as choosing a rendition or loading segments. Features group related behaviors with their default config. The engines Video.js ships for video, audio-only, and background video are built from the same parts, and you can build your own the same way.

Leave a feature out, and its code doesn't ship. Replace a behavior, and the rest of the engine keeps working. You can pass in your own playlist parser through config. The same parts let you build a one-off engine to reproduce a bug and narrow down where it starts.

This works because behaviors don't know about each other. A behavior never imports or calls another behavior. Behaviors read and write shared state, and changes flow between them through signals.

That design gives contributors one rule to protect: the simplest engine must keep working. If a new feature makes the small engine depend on it, the change has coupled pieces that should stay apart.

The same idea holds one level up, so SPF doesn't lock you in. Video.js talks to every engine through the media element interface. SPF's official engines sit behind that interface, and so can any engine you compose or modify. Engines built without SPF sit behind it too: `<hlsjs-video>`, `<dash-video>`, and `<shaka-video>` use hls.js, dash.js, and Shaka Player, respectively.

### Built for where playback is going

Some goals shape the architecture before they ship. Engine state is plain, JSON-serializable data. That keeps a split possible where a server does part of the work and the client runs the rest, as two compositions of the same code. Web workers and resource-constrained devices like smart TVs are on the same list. So are delivery methods beyond HLS over MSE, such as MoQ. The design keeps these possible; most of them are not built yet.

### Contracts an agent can follow

SPF's contracts are explicit. State is plain data. Each behavior declares the state it reads and the state it writes, and the type checker holds it to that. There is no hidden state to discover.

That makes SPF unfamiliar at first. It also gives a coding agent, or a person, clear rules to follow when composing or changing an engine. We expect most SPF work to happen with an agent in the loop, and we design for that.

## Tradeoffs we accept

We chose [simple but unfamiliar over easy but tangled](https://www.infoq.com/presentations/Simple-Made-Easy/). We accept these costs to hold to that choice:

- **Harder to follow at first.** Most engines are built from familiar shapes: controllers and managers, objects that own child objects, subclasses that extend a base class, and events that one part dispatches and another listens for. Below the adapter, SPF uses none of these. A behavior never calls another behavior, so you can't trace a feature by following function calls. You follow state instead: which behaviors write a key, and which behaviors react when it changes. Most people find that unfamiliar until they know the moving pieces.
- **More wiring in the source.** Each behavior declares the state and context it uses, and each engine lists its parts. A design that assumed how its parts fit together could hide that wiring. We keep it visible until a repeated pattern earns a shared abstraction.
- **Composition isn't fully checked.** If an engine includes a behavior that reads state nothing writes, playback stalls without an error.
- **No fixed API until the adapter.** A composed engine exposes its state, its context, and a `destroy()` method. Its shape depends on which features it includes, so there are no stable methods or events to code against. The adapter wraps the engine in the media element interface, with the properties, methods, and events you'd expect.
- **SPF is young.** Some of the design is principle more than proof.

## When to use hls.js

hls.js has spent years learning to play whatever HLS a server sends, and it keeps playing through content that breaks the rules. SPF aims narrower: modern, well-formed streams and the features most players need, in as little code as possible. When your streams or requirements fall outside that, use hls.js.

We made that choice official on purpose. `<hlsjs-video>` is a first-party Video.js media element, as are `<dash-video>` and `<shaka-video>`. `<mux-video>` and `<mux-audio>` ship in both SPF and hls.js versions, and switching between them usually takes only a change of import path. We expect hls.js to stay the right choice for some players for the foreseeable future, and we want that choice to be a good one.

## Who works with SPF directly

Most people never touch SPF. They pick a media element, and the element picks the engine. You work with SPF directly when you change an engine, compose a new one, or build an adapter for one. These docs are for you.

## Next

Read [SPF architecture](./architecture.md) for the pieces: the adapter, the engine, its features, and their behaviors.
