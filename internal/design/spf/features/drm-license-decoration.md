---
status: implemented
date: 2026-09-10
definition: sketched
---

# DRM license & certificate transforms

How a consumer decorates or replaces the network exchanges DRM performs — the
**license** request/response and the **app-certificate** request/response —
without forking the engine. Provider-neutral `<hls-video>` is public API at
VJSv10 GA, so the extension shape freezes now; this record fixes it so every
later provider is an additive data point, not a contract change.

Part of [drm-support](./drm-support.md) — the "license-fetcher composability"
line item, whose concrete need is GA of the provider-neutral element.

## The shape: per-key-system transform slots, on the objects that already exist

The transforms that need *functions* are key-system-specific — SPC shaping, CKC
unwrapping, PlayReady envelope handling are properties of a system's wire
protocol, not the deployment. (Cross-cutting, deployment-wide needs are almost
all *data* — auth headers — already covered by `source.drm[ks].headers`.) So the
slots are per key system, and they live on the two per-key-system objects SPF
already has — no new container, no global filter list, no `keySystem` branching:

```ts
type DrmRequestTransform  = (req: DrmRequest) => DrmRequest | Promise<DrmRequest>;
type DrmResponseTransform = (res: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> | Promise<Uint8Array<ArrayBuffer>>;
interface DrmRequest { url: string; method: string; headers: Record<string, string>; body: BufferSource | null; } // fetch RequestInit subset

// Home 1 — KeySystemModule (media/drm.ts): the SHIPPED DEFAULT per system,
// engine-applied. `licenseRequest` (was shapeLicenseRequest) is the widened
// slot; three siblings join it, identity when unset.
interface KeySystemModule {
  /* …keySystem, keyFormats, requestVariants, initDataTypes, toInitData… */
  readonly licenseRequest?:      DrmRequestTransform;
  readonly licenseResponse?:     DrmResponseTransform;
  readonly certificateRequest?:  DrmRequestTransform;
  readonly certificateResponse?: DrmResponseTransform;
}

// Home 2 — DrmSystemConfig (spf/media/drm.ts): the per-source OVERRIDE the
// consumer sets on source.drm[keySystem], beside licenseUrl. Same four slots,
// optional, plain functions (NOT DrmValue — see threading below).
interface DrmSystemConfig {
  licenseUrl: DrmUrl;
  serverCertificateUrl?: DrmUrl;
  headers?: DrmHeaders;
  licenseRequest?:      DrmRequestTransform;
  licenseResponse?:     DrmResponseTransform;
  certificateRequest?:  DrmRequestTransform;
  certificateResponse?: DrmResponseTransform;
}
```

Read: `source.drm['com.apple.fps'].licenseResponse = detectFairPlayCkc`, sitting
next to `.licenseUrl`.

## Threading: the adapter wraps the source transform in a stable function

The engine never reads `source.drm`. The Media builds a stable engine-facing
`DrmSystemsConfig` once (`hls-video/adapter.ts:215`) whose fields are resolver
closures over the live `#source`, so the engine — built once — licenses whatever
source is current without a rebuild. The transforms thread the same way, with one
twist that makes the adapter-wrap **necessary, not just consistent**:

`licenseUrl`/`headers` are `DrmValue<T>` = `T | (() => T)`, and the engine calls
`toValue` (`@videojs/utils/function`), which reads `typeof value === 'function'` as "this is a
resolver, call it." That only works because those `T`s are *data*. A transform is
itself a function, so `typeof === 'function'` can no longer tell "a resolver
returning a transform" from "the transform." The `DrmValue` mechanism collides on
function-valued config.

So the engine-facing transform field is a **plain, stable** transform, and the
Media builds it as a closure that *applies* the current source's transform (vs.
*returning* a value like the URL/header resolvers do):

```ts
// alongside the licenseUrl / serverCertificateUrl / headers resolvers:
licenseResponse: (res) => (this.#source?.drm?.[keySystem]?.licenseResponse ?? ((r) => r))(res),
```

The engine calls one stable function every time and never holds the source's
function object. Consequences:

- **Source-switch correctness without rebuild** — a Mux→EZDRM swap changes the
  CKC unwrapper exactly as it changes `licenseUrl` today.
- **The deepEqual boundary softens.** These stay SPF-engine-local for now, but the
  reason they were kept *off* the shared `@videojs/media` contract — function
  values tripping the hls.js/Shaka `#engineConfigKey` structural compare and
  rebuilding the engine — dissolves under wrap-once: the engine only ever sees
  stable identities. A future promotion becomes a per-adapter wrap-once discipline,
  not a contract hazard. Not promoting now; the boundary just stopped being a wall.

## Composition at the fetch seam: module default, then source override

Two layers meet per exchange: the module's shipped default (Home 1, engine-applied)
and the source override (Home 2, adapter-wrapped). They **compose, module first** —
the module shapes the wire protocol, then the override decorates the result:

```
request:  CDM message   → [module default] → [source override] → fetch
response: fetched bytes  → [module default] → [source override] → session.update / setServerCertificate
```

Compose rather than replace because the common override is *additive* — a provider
adds an auth header or mints a per-session token onto an otherwise-correct request
— and replace would force it to re-implement the module's wire shaping (PlayReady's
envelope unwrap) just to add a header. An override that wants to fully own the
output still can: it receives the module-shaped value and may ignore its structure.
(Judgment call; revisit if a provider ever needs the pre-module raw message —
that's really a `KeySystemModule` concern, a new system, not a source override.)

Applied one place each, thin by design:

- **License**, in `exchange-licenses`: build `DrmRequest` (`method: 'POST'`, URL +
  headers from the resolved `config.drm[ks]`) → module `licenseRequest`
  (`applyLicenseRequest`, or octet default) → source `licenseRequest` → `fetchDrm`
  → module `licenseResponse` → source `licenseResponse` → `session.update`.
- **Certificate**, in `setup-media-keys`: build `DrmRequest` (`method: 'GET'`, body
  `null`, empty headers) → module then source `certificateRequest` → `fetchDrm` →
  module then source `certificateResponse` → `setServerCertificate`. Cert-specific
  auth (Vualto's `x-vudrm-token`) rides in via `certificateRequest`, not by reusing
  the license `headers`.

Both paths share one seam, `fetchDrm(request, signal)`, which reads `method`,
`headers`, and `body` off the request. When network concerns move into their own
sub-architecture, `DrmRequest` + `fetchDrm` + these transforms become one typed
instance of that layer's request pipeline, and this record is superseded rather
than unwound.

## Decisions (resolved)

1. **Return-new, not mutate.** Transforms return the next value; immutable, and
   consistent with today's `licenseRequest` (which already returns).
2. **Async.** `=> T | Promise<T>` — per-session token minting is real.
3. **No auto-detect default.** Default slot is identity (raw), preserving the
   Mux/EZDRM green path. Unwrap logic ships as **exported, tree-shakable helpers**
   from `@videojs/spf` media (`detectFairPlayCkc`, `unwrapJsonLicense`, …) that a
   consumer, a test, or a reference example drops into a slot — weight only if
   imported. Shaka's library-of-named-functions model.
4. **Compose module→override, not replace.** See the fetch-seam section.
5. **Adapter-wrapped, not `DrmValue`-resolved.** Engine-facing transforms are plain
   stable functions the Media closes over `#source`; they can't ride `DrmValue`
   (the typeof-function collision above). Consumer surface is `source.drm[keySystem]`
   (SPF's local type), mirroring how the hls.js Media keeps functions with the
   engine-specific config while data stays on the shared shape.
6. **No full-override / cross-cutting hook now.** A "own the whole round-trip" hook
   (rx-player `getLicense`) and any deployment-wide network hook are additive later
   (new optional field breaks nothing); cross-cutting network concerns belong to the
   future network sub-architecture, not here.
7. **Fetch-shaped, one fetch seam.** `DrmRequest` is a subset of a `fetch` request
   (`url` + `method`/`headers`/`body`), and a single `fetchDrm(request, signal)`
   serves both the license (POST) and certificate (GET) fetches — the shape the
   future network layer inherits. `method` lets a transform change the verb; the
   app-cert audit found no provider needs non-GET today (all GET a static file, the
   only variance being auth on the GET — Vualto a header, Mux a signed query param),
   so `method` is forward-design, not a current need.

## Out of scope of this record

- **`keystatuschange` policy** (expiry/HDCP → error|continue|fallback) —
  rx-player's declarative enums; a sibling extension point, its own record.
- **Init-data transform / FairPlay content-id over MSE** — the Axinom analysis
  proved it can't rescue that case (session binding); tracked in drm-support.
- **Promotion to the shared `@videojs/media` contract** — enabled by wrap-once but
  deferred; each engine adopting the discipline is its own change.

## TDD plan

1. ✅ **Rename + widen:** `KeySystemModule.shapeLicenseRequest` → `licenseRequest`,
   `(message) => {body,headers}` → `(req: DrmRequest) => DrmRequest | Promise`.
   PlayReady default + `exchange-licenses` call site + tests; suite green (pure
   refactor). *(commit `7124c2ed5`)*
2. ✅ **Default slots:** `licenseResponse`/`certificateRequest`/`certificateResponse`
   on `KeySystemModule` (with `DrmResponseTransform`); identity when unset. *(`52bab1c3e`)*
3. ✅ **Consumer slots + adapter wrap:** the four on SPF `DrmSystemConfig` (public
   surface); the hls-video Media wraps each as a stable closure over `#source` via
   the new `sourceDrmSystems` helper; unit-tested for live-deref across swaps.
   *(`94278e6f1`)*
4. ✅ **Apply — license:** `exchange-licenses` composes module→source over request
   and response, `licenseResponse` before `session.update`; a throwing request
   override reports 4004, a response override 4016. *(`d3ef04d59`)*
   - ✅ **Fetch alignment (after 4):** `DrmRequest` gained `method`; `fetchLicense`
     and `fetchServerCertificate` collapsed into one `fetchDrm(request, signal)`.
     *(`4c5e4c750`)*
5. ✅ **Apply — certificate:** `setup-media-keys` composes module→source over the
   cert request/response through `fetchDrm`; cert auth rides in via
   `certificateRequest`. *(`fed5735e2`)*
6. ✅ **Helpers:** `detectFairPlayCkc` (raw/base64/`<ckc>`XML/JSON → raw) and
   `unwrapJsonLicense`, exported + unit-tested against Shaka's known shapes.
   *(`48336ee53`; `formEncodeLicenseRequest` followed in `7dfc8a44b`)*
7. ✅ **Composition invariant:** the new config still materializes only in DRM engine
   variants — droppability test unchanged
   (`playback/engines/tests/engine-drm-optional.test-d.ts`).
