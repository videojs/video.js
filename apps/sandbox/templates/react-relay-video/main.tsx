// <RelayVideo> on a connection the page owns: the page connects with the Relay SDK, hands the component its subscriber,
// and wants the broadcast's catalog itself on the same subscriber.
// http://localhost:5173/react-relay-video/
//
// Query params prefill the form, and `ns` connects at once:
//   url=<relay URL>   Defaults to https://relay.mux.global.
//   ns=<a/b/c>        The broadcast's namespace, slash-separated.
//   jwt=<token>       A subscribe token. Never commit one.
import '@app/styles.css';
import '@videojs/react/live-video/skin.css';
import { CATALOG_TRACK } from '@caprid/moq-media';
import { connectSupervisedSubscriber, DEFAULT_ENDPOINT, readText, type SupervisedSubscriber } from '@caprid/relay';
import { LiveVideoPlayer, LiveVideoSkin } from '@videojs/react/live-video';
import { RelayVideo } from '@videojs/react/media/relay-video';
import { type FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface Target {
  url: string;
  jwt: string;
  namespace: string[];
}

const params = new URLSearchParams(location.search);
const initial = {
  url: params.get('url') ?? DEFAULT_ENDPOINT,
  jwt: params.get('jwt') ?? '',
  ns: params.get('ns') ?? '',
};

function toTarget({ url, jwt, ns }: typeof initial): Target {
  return { url: url.trim(), jwt: jwt.trim(), namespace: ns.split('/').filter(Boolean) };
}

function describe(message: string, error?: unknown): string {
  return error === undefined ? message : `${message}: ${error instanceof Error ? error.message : error}`;
}

/** The page's connection: opened for a target, closed when the target changes or goes away. */
function useRelaySubscriber(target: Target | null, report: (status: string) => void): SupervisedSubscriber | null {
  const [subscriber, setSubscriber] = useState<SupervisedSubscriber | null>(null);

  useEffect(() => {
    if (!target) {
      report('Not connected.');
      return;
    }

    const controller = new AbortController();
    let opened: SupervisedSubscriber | undefined;

    report(`Connecting to ${target.url}`);
    connectSupervisedSubscriber({
      url: target.url,
      signal: controller.signal,
      ...(target.jwt && { getToken: () => target.jwt }),
      onStatus: (state, error) => report(describe(`Relay ${state}`, error)),
    }).then(
      (next) => {
        opened = next;
        setSubscriber(next);
      },
      (error) => {
        if (!controller.signal.aborted) report(describe('Could not connect', error));
      }
    );

    return () => {
      controller.abort();
      opened?.close();
      setSubscriber(null);
    };
  }, [target, report]);

  return subscriber;
}

/** The page's own want on the subscriber the video borrows: the catalog, raw. */
function useCatalogLog(subscriber: SupervisedSubscriber | null, namespace: string[] | undefined): string[] {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!subscriber || !namespace) return;

    const log = (text: string) => setLines((prev) => [`${new Date().toLocaleTimeString()} ${text}`, ...prev]);

    subscriber.want(
      'sandbox/catalog',
      { namespace, track: CATALOG_TRACK },
      {
        onObject: (object) => log(`catalog group ${object.groupId}: ${readText(object)}`),
        onError: (error) => log(`catalog want failed: ${error}`),
      }
    );

    return () => subscriber.unwant('sandbox/catalog');
  }, [subscriber, namespace]);

  return lines;
}

function App() {
  const [fields, setFields] = useState(initial);
  const [target, setTarget] = useState<Target | null>(() => (initial.ns ? toTarget(initial) : null));
  const [status, setStatus] = useState('Not connected.');
  const subscriber = useRelaySubscriber(target, setStatus);
  const lines = useCatalogLog(subscriber, target?.namespace);

  const connect = (event: FormEvent) => {
    event.preventDefault();
    setTarget(toTarget(fields));
  };

  const input = (name: keyof typeof initial, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="flex flex-col">
      {label}
      <input
        name={name}
        className="rounded border px-2 py-1"
        value={fields[name]}
        onChange={(event) => setFields({ ...fields, [name]: event.target.value })}
        {...props}
      />
    </label>
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <form id="connect" className="flex flex-wrap items-end gap-2 text-sm" onSubmit={connect}>
        {input('url', 'Relay URL', { size: 28, required: true })}
        {input('jwt', 'JWT', { size: 28, type: 'password', autoComplete: 'off' })}
        {input('ns', 'Namespace', { size: 20, placeholder: 'live/room', required: true })}
        <button className="rounded bg-zinc-900 px-3 py-1 text-white">Connect</button>
        <button type="button" id="disconnect" className="rounded border px-3 py-1" onClick={() => setTarget(null)}>
          Disconnect
        </button>
      </form>
      <p id="status" className="font-mono text-xs">
        {status}
      </p>
      <LiveVideoPlayer>
        <LiveVideoSkin className="sandbox-video-frame w-full">
          <RelayVideo
            // Written inline: the same subscriber and namespace is the same broadcast to the media.
            source={subscriber && target ? { subscriber, namespace: target.namespace } : null}
            onError={(event) => setStatus(describe('Playback failed', event.currentTarget.error?.message))}
          />
        </LiveVideoSkin>
      </LiveVideoPlayer>
      <section className="text-sm">
        <h2 className="font-semibold">The app's own want on the same subscriber: the catalog, raw</h2>
        <ol id="log" className="max-h-48 overflow-auto font-mono text-xs">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
