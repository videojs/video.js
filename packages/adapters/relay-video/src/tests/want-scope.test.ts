import { describe, expect, it } from 'vite-plus/test';

import { createWantScope } from '../want-scope';
import { createFakeSubscriber } from './fake-subscriber';

const namespace = ['live', 'room'];

describe('createWantScope', () => {
  it('wants each track under its own prefixed key', () => {
    const subscriber = createFakeSubscriber();
    const scope = createWantScope(subscriber, 'a/');

    scope.want('catalog', { namespace, track: 'catalog' }, {});
    scope.want('video', { namespace, track: 'video' }, {});

    expect([...subscriber.wants.keys()]).toEqual(['a/catalog', 'a/video']);
  });

  it('unwants only the keys it holds, leaving the application and other scopes their wants', () => {
    const subscriber = createFakeSubscriber();
    const first = createWantScope(subscriber, 'a/');
    const second = createWantScope(subscriber, 'b/');

    subscriber.want('chat', { namespace, track: 'chat' });
    first.want('catalog', { namespace, track: 'catalog' }, {});
    first.want('audio', { namespace, track: 'audio' }, {});
    second.want('catalog', { namespace, track: 'catalog' }, {});

    first.clear();

    expect([...subscriber.wants.keys()]).toEqual(['chat', 'b/catalog']);
    expect(subscriber.unwant.mock.calls).toEqual([['a/catalog'], ['a/audio']]);
  });

  it('ignores an unwant or catch-up for a track it does not hold', () => {
    const subscriber = createFakeSubscriber();
    const scope = createWantScope(subscriber, 'a/');

    scope.unwant('video');
    scope.catchUp('video');
    scope.want('video', { namespace, track: 'video' }, {});
    scope.catchUp('video');

    expect(subscriber.unwant).not.toHaveBeenCalled();
    expect(subscriber.catchUp.mock.calls).toEqual([['a/video']]);
  });
});
