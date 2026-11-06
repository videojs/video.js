// <relay-video> on a connection the page owns: the page connects with the Relay SDK, hands the element its subscriber,
// and wants the broadcast's catalog itself on the same subscriber.
// http://localhost:5173/relay-video/
//
// Query params prefill the form, and `ns` connects at once:
//   url=<relay URL>   Defaults to https://relay.mux.global.
//   ns=<a/b/c>        The broadcast's namespace, slash-separated.
//   jwt=<token>       A subscribe token. Never commit one.
import '@app/styles.css';
import '@videojs/html/live-video/player';
import '@videojs/html/live-video/skin';
import '@videojs/html/live-video/skin.css';
import '@videojs/html/media/relay-video';
import { CATALOG_TRACK } from '@caprid/moq-media';
import { connectSupervisedSubscriber, DEFAULT_ENDPOINT, readText, type SupervisedSubscriber } from '@caprid/relay';

const form = document.querySelector<HTMLFormElement>('#connect')!;
const status = document.querySelector<HTMLElement>('#status')!;
const log = document.querySelector<HTMLOListElement>('#log')!;
const video = document.querySelector('relay-video')!;
const params = new URLSearchParams(location.search);

function field(name: 'url' | 'jwt' | 'ns'): HTMLInputElement {
  return form.elements.namedItem(name) as HTMLInputElement;
}

function report(message: string, error?: unknown): void {
  status.textContent = error === undefined ? message : `${message}: ${error instanceof Error ? error.message : error}`;
}

function logLine(text: string): void {
  const item = document.createElement('li');

  item.textContent = `${new Date().toLocaleTimeString()} ${text}`;
  log.prepend(item);
}

let connection: { subscriber: SupervisedSubscriber | null; controller: AbortController } | null = null;

function disconnect(): void {
  video.source = null;
  connection?.subscriber?.close();
  connection?.controller.abort();
  connection = null;
  report('Not connected.');
}

async function connect(): Promise<void> {
  disconnect();

  const controller = new AbortController();
  const current: NonNullable<typeof connection> = { subscriber: null, controller };
  const url = field('url').value.trim();
  const jwt = field('jwt').value.trim();
  const namespace = field('ns').value.split('/').filter(Boolean);

  connection = current;
  report(`Connecting to ${url}`);

  try {
    current.subscriber = await connectSupervisedSubscriber({
      url,
      signal: controller.signal,
      ...(jwt && { getToken: () => jwt }),
      onStatus: (state, error) => report(`Relay ${state}`, error),
    });
  } catch (error) {
    if (!controller.signal.aborted) report('Could not connect', error);

    return;
  }

  // Two wants on one subscriber: the element's, under keys of its own, and the page's.
  video.source = { subscriber: current.subscriber, namespace };
  current.subscriber.want(
    'sandbox/catalog',
    { namespace, track: CATALOG_TRACK },
    {
      onObject: (object) => logLine(`catalog group ${object.groupId}: ${readText(object)}`),
      onError: (error) => logLine(`catalog want failed: ${error}`),
    }
  );
}

field('url').value = params.get('url') ?? DEFAULT_ENDPOINT;
field('jwt').value = params.get('jwt') ?? '';
field('ns').value = params.get('ns') ?? '';

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void connect();
});
document.querySelector('#disconnect')!.addEventListener('click', disconnect);
video.addEventListener('error', () => report('Playback failed', video.error?.message));

if (params.get('ns')) void connect();
