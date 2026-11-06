// Stands in for `createVideoPlayer` in `@caprid/moq-media` until that ships (muxinc/relay-sdks#478). Names and option
// shapes match it, so moving to the SDK's player is an import change.

import type { FrameDiscontinuity, PlayoutClock, SequencedFrame } from '@caprid/moq-media';

/**
 * The part of the broadcast's playout clock the player asks: share the clock with the audio input and the frame
 * reader's sequencer, so video follows the audio that drives it.
 *
 * @internal
 */
export type VideoPlayerClock = Pick<PlayoutClock, 'due' | 'localNow'>;

/**
 * One encoded video frame in decode order; a frame reader's `SequencedFrame` qualifies.
 *
 * @internal
 */
export type VideoPlayerFrame = Pick<SequencedFrame, 'timestampUs' | 'payload' | 'key'> & {
  discontinuity?: FrameDiscontinuity | undefined;
};

/** @internal */
export interface VideoPlayerOptions {
  clock: VideoPlayerClock;
  decoderConfig: VideoDecoderConfig;
  /** Show a frame that is due. The frame is closed once this returns; a sink that keeps it keeps a clone. */
  render(frame: VideoFrame): void;
  /** A decoder error, after which decoding resumes at the next keyframe, or an exception from `render`. */
  onError?(error: unknown): void;
}

/** @internal */
export interface VideoPlayer {
  /**
   * Decode a frame. Deltas are skipped until a keyframe at the start, after a decoder error, and after a discontinuity
   * that breaks the reference chain. A `resync` or `restart` also drops what waits to be shown: it belongs to the
   * replaced timeline.
   */
  push(frame: VideoPlayerFrame): void;
  /** Decode with this config from the next keyframe pushed, as at a rendition switch. */
  configure(decoderConfig: VideoDecoderConfig): void;
  /** Close the decoder and every frame waiting to be shown; later pushes are ignored. */
  close(): void;
}

// A frame that waits is checked again at least this often: the audio input can move the clock meanwhile.
const MAX_WAIT_MS = 50;

type Decoding =
  | { state: 'awaiting-key'; decoder: VideoDecoder | null }
  | { state: 'decoding'; decoder: VideoDecoder; config: VideoDecoderConfig }
  | { state: 'closed' };

/**
 * Decode a track's frames with WebCodecs and hand each decoded frame to `render` when the playout clock says it is due,
 * or close it unseen when the clock says it is too late.
 *
 * @internal
 */
export function createVideoPlayer({ clock, decoderConfig, render, onError }: VideoPlayerOptions): VideoPlayer {
  let config = decoderConfig;
  let decoding: Decoding = { state: 'awaiting-key', decoder: null };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const decoded: VideoFrame[] = [];

  const report = (error: unknown) => {
    if (onError) onError(error);
    else console.error(error);
  };

  const currentDecoder = () => (decoding.state === 'closed' ? null : decoding.decoder);

  const cancelPump = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const dropDecoded = () => {
    for (const frame of decoded.splice(0)) frame.close();
  };

  const pump = () => {
    timer = undefined;

    for (let frame = decoded[0]; frame; frame = decoded[0]) {
      const decision = clock.due(frame.timestamp);

      if (decision.action === 'wait') {
        timer = setTimeout(pump, Math.min(decision.waitUs / 1000, MAX_WAIT_MS));
        return;
      }

      decoded.shift();

      try {
        if (decision.action === 'show') render(frame);
      } catch (error) {
        report(error);
      } finally {
        frame.close();
      }
    }
  };

  const fail = (decoder: VideoDecoder, error: unknown) => {
    // WebCodecs closes a decoder before it reports an error; one that threw synchronously may still be open.
    if (decoder.state !== 'closed') decoder.close();

    decoding = { state: 'awaiting-key', decoder: null };
    report(error);
  };

  const openDecoder = (): VideoDecoder => {
    const decoder = new VideoDecoder({
      output(frame) {
        if (currentDecoder() !== decoder) {
          frame.close();
          return;
        }

        decoded.push(frame);

        if (timer === undefined) pump();
      },
      error(error) {
        if (currentDecoder() === decoder) fail(decoder, error);
      },
    });

    return decoder;
  };

  const startTimeline = () => {
    cancelPump();
    dropDecoded();

    const decoder = currentDecoder();

    if (decoder?.state === 'configured') decoder.reset();

    decoding = { state: 'awaiting-key', decoder };
  };

  return {
    push(frame) {
      if (decoding.state === 'closed') return;

      if (frame.discontinuity === 'resync' || frame.discontinuity === 'restart') {
        startTimeline();
      } else if (frame.discontinuity === 'gap' && !frame.key && decoding.state === 'decoding') {
        decoding = { state: 'awaiting-key', decoder: decoding.decoder };
      }

      if (decoding.state === 'awaiting-key' && !frame.key) return;

      const decoder = decoding.decoder ?? openDecoder();

      try {
        if (decoding.state === 'awaiting-key' || (frame.key && decoding.config !== config)) {
          decoder.configure(config);
          decoding = { state: 'decoding', decoder, config };
        }

        decoder.decode(
          new EncodedVideoChunk({
            type: frame.key ? 'key' : 'delta',
            timestamp: frame.timestampUs,
            data: frame.payload,
          })
        );
      } catch (error) {
        fail(decoder, error);
      }
    },
    configure(next) {
      config = next;
    },
    close() {
      const decoder = currentDecoder();

      decoding = { state: 'closed' };
      cancelPump();
      dropDecoded();

      if (decoder && decoder.state !== 'closed') decoder.close();
    },
  };
}

/** @internal */
export interface VideoCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): CanvasDrawImage | null;
}

/**
 * A `render` that draws each frame onto a canvas, resizing the canvas to the frame's display size when it changes.
 *
 * @internal
 */
export function canvasRenderer(canvas: VideoCanvas): (frame: VideoFrame) => void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The canvas already has a context other than 2d.');

  return (frame) => {
    if (canvas.width !== frame.displayWidth) canvas.width = frame.displayWidth;

    if (canvas.height !== frame.displayHeight) canvas.height = frame.displayHeight;

    context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  };
}
