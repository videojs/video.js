/**
 * SPF's slice of the SVTA 2070 (Standardized Error Codes) vocabulary: the shape of a reported condition, the standard
 * codes SPF reports, and the codes the spec leaves to the publisher.
 *
 * The standard codes come from `@svta/cml-error-codes`, the spec's reference implementation, and are re-exported here
 * so this module is the only place SPF imports CML. Producers and adapters keep importing the vocabulary from here, no
 * code is transcribed from the spec PDF, and a spec revision arrives as a dependency bump rather than an edit. What
 * this module defines itself is what CML deliberately doesn't ship: the reporting envelope ({@link SvtaError}) and the
 * publisher-defined codes ({@link SVTA_UNSUPPORTED_PLAYBACK_FEATURE}, {@link SVTA_UNSUPPORTED_ENCRYPTION_METHOD}).
 *
 * Two properties of the spec shape the types here:
 *
 * - **Severity is deliberately not part of a code.** Per §Approach, "impact varies with player implementation, breaking
 *   the consistency of a specific error mapping to single code." So an error carries no fatal flag — whether a
 *   condition is fatal depends on the composition observing it, and is decided downstream.
 * - **Reporting is partial and stacked** (Principles 5–6). Errors are reported as encountered, most of them non-fatal,
 *   and the _sequence_ carries causation a single value can't.
 *
 * See `internal/design/spf/features/errors.md`.
 */
/**
 * The standard codes SPF reports, one re-export per code rather than `export *` so this list stays the inventory of
 * what the engine can say. A new producer adds its code here, with a note on where it fires.
 *
 * `getSvtaErrorCategory` and `getSvtaErrorIndex` ride along: the spec's `code / 1000` and `code % 1000` arithmetic,
 * uniform across the four-digit native form and the five-digit form embedding an external standard (`"03404"` is
 * numerically 3404, which decomposes identically). Both answer `undefined` for input the spec assigns nothing to: a
 * non-integer, a negative, or, for the category, the reserved `8`–`98` range.
 *
 * Media content and playback — the unsupported-source detection path:
 *
 * - `SVTA_UNSUPPORTED_VIDEO_FORMAT` (1004) / `SVTA_UNSUPPORTED_AUDIO_FORMAT` (1005) — a rendition in a container this
 *   engine can't append, reported per rendition as a _cause_.
 * - `SVTA_NO_SUPPORTED_VIDEO_TRACK` (2011) / `SVTA_NO_SUPPORTED_AUDIO_TRACK` (2012) — the _verdict_: a type has nothing
 *   playable, whether every rendition was excluded or the source carried none and the composition said it needs the
 *   type. One code for both, because they are the same answer to a viewer.
 *
 * Content protection — detection first, then the EME license exchange and key statuses:
 *
 * - `SVTA_UNSUPPORTED_DRM_SYSTEM` (4008) — an encrypted rendition with no decryption pipeline. Detection, not a license
 *   failure; a cause like the format codes.
 * - `SVTA_DRM_INITIALIZATION_ERROR` (4010) — the key system negotiated but MediaKeys could not be created or attached, so
 *   decryption never became possible for this source.
 * - `SVTA_DRM_CERTIFICATE_ERROR` (4013) — the server (application) certificate could not be fetched or was rejected by
 *   the CDM; without it FairPlay can never produce a license request.
 * - `SVTA_LICENSE_REQUEST_GENERATION_ERROR` (4021) — the CDM could not produce a license request from the init data
 *   (`MediaKeySession.generateRequest()` threw); nothing ever reached the server.
 * - `SVTA_BAD_LICENSE_REQUEST` (4004) — the license server could not be reached or refused the CDM's message. From the
 *   client there is one observable ("the exchange failed at the server"); which side was at fault lives in `data`, not
 *   the code.
 * - `SVTA_LICENSE_RESPONSE_REJECTED` (4016) — the server answered **200 with a license body** and the CDM refused it
 *   (`MediaKeySession.update()` threw). Not a server-side rejection: a non-2xx license response throws inside
 *   `fetchDrm` and reports 4004 instead. So this code proves the license URL, credentials, and request shaping all
 *   worked, and narrows the fault to the license's own contents — a security-level mismatch between the challenge and
 *   the issued license, for one.
 * - `SVTA_LICENSE_EXPIRED` (4003) — a key's status transitioned to `expired` (short license windows, long sessions).
 *   Browsers queue decode on a missing key, so without this cause the expiry presents as a silent mid-playback stall;
 *   reported so the stall is diagnosable. Re-requesting is a policy decision that lives downstream.
 * - `SVTA_INSUFFICIENT_OUTPUT_PROTECTION` (4007) — a key went `output-restricted`: the CDM refuses to decode onto the
 *   current output path (HDCP downgrade, an external display, screen mirroring). Presents as a black frame or stall
 *   with no media error — nothing else in the pipeline observes the restriction.
 * - `SVTA_DRM_SESSION_ERROR` (4014) — a key reported `internal-error`: the CDM failed in a way it does not attribute (its
 *   own defect, a corrupted key store). Reported for diagnosability; recovery is downstream.
 */
export {
  getSvtaErrorCategory,
  getSvtaErrorIndex,
  SVTA_BAD_LICENSE_REQUEST,
  SVTA_DRM_CERTIFICATE_ERROR,
  SVTA_DRM_INITIALIZATION_ERROR,
  SVTA_DRM_SESSION_ERROR,
  SVTA_INSUFFICIENT_OUTPUT_PROTECTION,
  SVTA_LICENSE_EXPIRED,
  SVTA_LICENSE_REQUEST_GENERATION_ERROR,
  SVTA_LICENSE_RESPONSE_REJECTED,
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_AUDIO_FORMAT,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
} from '@svta/cml-error-codes';

/**
 * A reported condition, identified by its SVTA code.
 *
 * Named for the spec rather than the engine because the vocabulary is format- and player-neutral. Not `MediaError` —
 * that name belongs to the `@videojs/media` DOM-facing class this eventually maps _onto_, and the mapping is the point
 * at which severity and user-facing text get decided.
 */
export interface SvtaError {
  /** The SVTA code — see `getSvtaErrorCategory` / `getSvtaErrorIndex`. */
  code: number;
  /** Engineer-facing detail. Optional; the code is the identity. */
  message?: string;
  /** Reporter-specific context (track type, url, the constraint that fired). */
  data?: unknown;
}

/**
 * SVTA 99 [Custom] 001 — this engine has no pipeline for something the source requires, so the source is unplayable
 * _here_ rather than broken.
 *
 * Custom rather than standard because the standard codes available describe either narrower or wider things. The causes
 * (1004/1005 unsupported format, 4008 unsupported DRM) say what one rendition hit; the verdicts (2011/2012 no supported
 * track) say a type emptied without saying why it's unfixable. And 2039 "Manifest feature unsupported" covers features
 * that are unsupported but still _playable_ — LL-HLS degrading to standard live is a 2039 — so overloading it for a
 * fatal condition would make it useless for the notices it belongs on.
 *
 * Index `001`: the spec defines only `99000` (Unknown) for the custom category and leaves `99001`–`99999` to the
 * publisher, which is why CML exports nothing for it and SPF defines it here. The first code we define; later custom
 * codes follow the `99CII` convention (see {@link SVTA_UNSUPPORTED_ENCRYPTION_METHOD}), while this cross-category
 * "can't play this" surface stays in the general `990XX` bucket.
 *
 * Five digits, and deliberately not special-cased anywhere: `getSvtaErrorCategory` and `getSvtaErrorIndex` decompose it
 * correctly by arithmetic alone, because every standard category is below `8000` and custom starts at `99000`.
 */
export const SVTA_UNSUPPORTED_PLAYBACK_FEATURE = 99001;

/**
 * SVTA 99 [Custom] 408 — the source is encrypted with a scheme this engine has no decryptor for, and it is **not** a
 * DRM key system: HLS `METHOD=AES-128` / `SAMPLE-AES` under the `identity` keyformat (clear-key over HTTP). The non-DRM
 * counterpart of {@link SVTA_UNSUPPORTED_DRM_SYSTEM} — reported so the diagnosis names the real gap, an unsupported
 * encryption method, rather than blaming a DRM system that was never involved. `data` carries the HLS `method` and
 * `keyFormat`. Actually decrypting such content is a deferred feature — see
 * `internal/design/spf/features/clear-key-aes.md`.
 *
 * **The `99CII` custom-code convention.** SVTA 2070 leaves the whole `99xxx` category to the publisher (defining only
 * `99000` Unknown). Rather than number custom codes sequentially, they mirror the standard taxonomy in their index
 * digits: `99` + `C` (the standard category this parallels) + `II` (the index within it). So a content-protection
 * (category 4) custom cause is `994II`, and `99408` deliberately echoes standard `4008` as its non-DRM sibling.
 * `getSvtaErrorCategory` / `getSvtaErrorIndex` still decompose it by arithmetic (category `99`, index `408`); the
 * parallel is a reading convention, not something the math needs. General, cross-category custom codes stay in
 * `990XX`.
 */
export const SVTA_UNSUPPORTED_ENCRYPTION_METHOD = 99408;
