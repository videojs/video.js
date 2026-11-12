import { describe, expect, it } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import { aacCodec } from '../../../media/mpeg-ts/codecs/aac';
import { aacSegment } from '../../../media/mpeg-ts/tests/synthetic-ts';
import type { Frame, LoadStep, StepDeps } from '../segment-load-pipeline';
import type { IndividualSourceBufferMessage } from '../source-buffer-messages';
import { transmuxPipelinesFor } from '../transmux-pipelines';

async function* streamOf(bytes: Uint8Array): AsyncIterable<Uint8Array> {
  yield bytes;
}

async function collect(data: AsyncIterable<Uint8Array> | ArrayBuffer): Promise<Uint8Array> {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);

  const chunks: number[] = [];

  for await (const chunk of data) chunks.push(...chunk);

  return Uint8Array.from(chunks);
}

/** The first box type of an appended segment: `ftyp` when it carries an init, `moof` when it doesn't. */
async function firstBox(message: IndividualSourceBufferMessage | undefined): Promise<string> {
  if (message?.type !== 'append-segment') throw new Error('expected an append-segment message');

  return new TextDecoder().decode((await collect(message.data)).subarray(4, 8));
}

/** The audio pipeline over one SourceBuffer that records what it is sent and is always idle. */
function setup() {
  const sent: IndividualSourceBufferMessage[] = [];
  const deps: StepDeps = {
    state: { presentation: signal(undefined) },
    context: {},
    config: {
      fetch: async (addressable: { url: string }) =>
        streamOf(aacSegment({ samplingIndex: addressable.url.startsWith('low') ? 4 : 3 })),
      sourceBufferActor: {
        send: (message: IndividualSourceBufferMessage) => sent.push(message),
        snapshot: signal({ value: 'idle' }),
      },
    },
  };
  const steps = transmuxPipelinesFor('audio', [aacCodec])()['append-segment'];

  /** Run the steps the way the loader's runner does: stop before any step once the signal is aborted. */
  const load = async (url: string, abortAfter?: LoadStep) => {
    const controller = new AbortController();
    const meta = { id: url, startTime: 0, duration: 5, trackId: url.split('-')[0]! };
    const frame: Frame = { op: { type: 'append-segment', url, meta }, meta };

    for (const step of steps) {
      if (controller.signal.aborted) return;

      await step(frame, controller.signal, deps);

      if (step === abortAfter) controller.abort();
    }
  };

  return { sent, steps, load };
}

describe('transmuxPipelinesFor', () => {
  it('prepends the init segment to the first fragment only', async () => {
    const { sent, load } = setup();

    await load('main-0');
    await load('main-1');

    expect(await firstBox(sent[0])).toBe('ftyp');
    expect(await firstBox(sent[1])).toBe('moof');
  });

  it('re-sends an init segment whose load was aborted before it was appended', async () => {
    const { sent, steps, load } = setup();
    const transmuxStep = steps[1];

    // Preempted after the transmux step, before the dispatch: nothing reaches the SourceBuffer.
    await load('main-0', transmuxStep);
    expect(sent).toHaveLength(0);

    await load('main-1');
    await load('main-2');

    expect(await firstBox(sent[0])).toBe('ftyp');
    expect(await firstBox(sent[1])).toBe('moof');
  });

  it('sends the init of a new rendition when the load of its first segment was aborted', async () => {
    const { sent, steps, load } = setup();
    const transmuxStep = steps[1];

    await load('main-0');
    await load('low-1', transmuxStep);
    await load('low-2');

    expect(await firstBox(sent[0])).toBe('ftyp');
    expect(await firstBox(sent[1])).toBe('ftyp');
  });
});
