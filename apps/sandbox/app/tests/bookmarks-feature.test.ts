import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import { createBookmarksFeature, createMemoryStorage } from '../usecases/audiobook/features';
import { FakeAudio } from './helpers/fake-audio';

describe('bookmarksFeature', () => {
  it('adds at the media clock, keeps time order, edits and removes', () => {
    const storage = createMemoryStorage();
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(createBookmarksFeature(storage)));

    store.setBookmarksKey('book-1');
    store.attach({ media, container: null });

    media.currentTime = 120;
    const later = store.addBookmark('the tea party');

    media.currentTime = 30;
    const earlier = store.addBookmark();

    expect(store.bookmarks.map((bookmark) => bookmark.time)).toEqual([30, 120]);
    expect(later?.note).toBe('the tea party');
    expect(earlier?.note).toBe('');

    store.updateBookmark(earlier!.id, 'down the rabbit hole');
    expect(store.bookmarks[0]?.note).toBe('down the rabbit hole');

    store.removeBookmark(later!.id);
    expect(store.bookmarks).toHaveLength(1);
  });

  it('persists per key and refuses without one', () => {
    const storage = createMemoryStorage();
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(createBookmarksFeature(storage)));

    store.attach({ media, container: null });
    expect(store.addBookmark()).toBeNull();

    store.setBookmarksKey('book-1');
    media.currentTime = 10;
    store.addBookmark('one');

    store.setBookmarksKey('book-2');
    expect(store.bookmarks).toEqual([]);

    store.setBookmarksKey('book-1');
    expect(store.bookmarks.map((bookmark) => bookmark.note)).toEqual(['one']);

    const again = createStore<PlayerTarget>()(combine(createBookmarksFeature(storage)));

    again.setBookmarksKey('book-1');
    expect(again.bookmarks).toHaveLength(1);
  });
});
