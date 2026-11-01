import type { TransferRecord } from '../record.ts';
import { runSession, type SessionOptions } from './session.ts';

export const DEFAULT_SRC = 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8';

interface AbrLab {
  start(options?: Partial<Omit<SessionOptions, 'onProgress' | 'signal'>>): void;
  stop(): void;
  done: boolean;
  records: TransferRecord[];
}

declare global {
  interface Window {
    abrLab: AbrLab;
  }
}

const params = new URLSearchParams(location.search);
const form = document.querySelector<HTMLFormElement>('#controls')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const download = document.querySelector<HTMLButtonElement>('#download')!;
let controller: AbortController | undefined;

form.src.value = params.get('src') ?? DEFAULT_SRC;
form.minutes.value = params.get('minutes') ?? '10';
form.audio.checked = params.get('audio') !== '0';

window.abrLab = {
  done: false,
  records: [],
  start(options = {}) {
    controller?.abort();
    controller = new AbortController();
    window.abrLab.done = false;
    window.abrLab.records = [];

    const recording = options.recording ?? `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 6)}`;
    let count = 0;

    runSession({
      src: options.src ?? form.src.value,
      durationMs: options.durationMs ?? Number(form.minutes.value) * 60_000,
      audio: options.audio ?? form.audio.checked,
      seed: options.seed,
      maxSegments: options.maxSegments,
      recording,
      signal: controller.signal,
      onProgress: (record) => {
        count++;
        const ms = (record.t.end ?? record.t.start) - record.t.start;

        status.value = `${count} segments · last ${(record.bytes / 1000).toFixed(0)} kB in ${ms.toFixed(0)} ms`;
      },
    })
      .then((records) => {
        window.abrLab.records = records;
        status.value = `Done: ${records.length} transfers recorded.`;
      })
      .catch((error: unknown) => {
        status.value = `Failed: ${String(error)}`;
      })
      .finally(() => {
        window.abrLab.done = true;
      });
  },
  stop() {
    controller?.abort();
  },
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  window.abrLab.start();
});

download.addEventListener('click', () => {
  const blob = new Blob([window.abrLab.records.map((r) => JSON.stringify(r)).join('\n')], {
    type: 'application/x-ndjson',
  });
  const link = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'abr-lab.jsonl',
  });

  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector('#stop')!.addEventListener('click', () => window.abrLab.stop());
