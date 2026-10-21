import {
  getRegisteredMedia,
  type MediaRemotePlaybackCapability,
  type RemotePlaybackConnectionState,
} from '@videojs/media';
import { isObject } from '@videojs/utils/predicate';

import type { PlayerExtension } from '../extensions/extension';

const sessions = new WeakMap<EventTarget, Map<PlayerExtension, RemotePlaybackConnectionState>>();

/** @internal */
export const REMOTE_PLAYBACK_CHANGE_EVENT = 'vjs-remote-playback-change';

/**
 * Publishes an extension's connection state for presentation without replacing the native remote picker. Owners must
 * publish disconnected when detached or removed.
 *
 * @internal
 */
export function setRemotePlaybackState(
  media: EventTarget,
  owner: PlayerExtension,
  state: RemotePlaybackConnectionState
): void {
  const target = getRegisteredMedia(media);
  let owners = sessions.get(target);
  if ((owners?.get(owner) ?? 'disconnected') === state) return;

  if (state === 'disconnected') {
    owners?.delete(owner);

    if (!owners?.size) sessions.delete(target);
  } else {
    if (!owners) sessions.set(target, (owners = new Map()));

    owners.set(owner, state);
  }

  target.dispatchEvent(new Event(REMOTE_PLAYBACK_CHANGE_EVENT));
}

function hasSession(media: EventTarget, state: RemotePlaybackConnectionState): boolean {
  return [...(sessions.get(getRegisteredMedia(media))?.values() ?? [])].includes(state);
}

function resolveRemote(media: EventTarget): MediaRemotePlaybackCapability['remote'] | undefined {
  const target = media as EventTarget & { remote?: unknown };

  if (isObject(target.remote) && 'state' in target.remote && 'prompt' in target.remote) {
    return target.remote as MediaRemotePlaybackCapability['remote'];
  }

  return undefined;
}

export function isRemotePlaybackConnected(media: EventTarget) {
  return hasSession(media, 'connected') || resolveRemote(media)?.state === 'connected';
}

export function isRemotePlaybackConnecting(media: EventTarget) {
  return hasSession(media, 'connecting') || resolveRemote(media)?.state === 'connecting';
}

export async function requestRemotePlayback(media: EventTarget) {
  const remote = resolveRemote(media);
  if (!remote) throw new DOMException('Remote playback not supported', 'NotSupportedError');

  return remote.prompt();
}
