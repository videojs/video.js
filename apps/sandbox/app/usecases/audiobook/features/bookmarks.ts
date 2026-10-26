import { definePlayerFeature, type PlayerFeatureConfig } from '@videojs/core/dom';
import { isMediaSeekCapable } from '@videojs/media';
import { isNumber, isString } from '@videojs/utils/predicate';

import { isJsonObject, type JsonStorage, type JsonValue, localJsonStorage } from './storage';

export interface Bookmark {
  id: string;
  /** Media time, in seconds. */
  time: number;
  note: string;
  /** Epoch milliseconds. */
  createdAt: number;
}

export interface BookmarksState {
  /** Which title the bookmarks belong to. None are kept while it is `null`. */
  bookmarksKey: string | null;
  setBookmarksKey(key: string | null | undefined): void;
  /** Bookmarks for the current key, earliest media time first. */
  bookmarks: readonly Bookmark[];
  /** Drop a bookmark at the media's current time. Returns it, or `null` when there is no key or no clock. */
  addBookmark(note?: string): Bookmark | null;
  updateBookmark(id: string, note: string): void;
  removeBookmark(id: string): void;
}

const STORAGE_PREFIX = 'vjs-usecase-audiobook:bookmarks:';

function isBookmark(value: JsonValue): value is Bookmark & { [key: string]: JsonValue } {
  return (
    isJsonObject(value) &&
    isString(value.id) &&
    isNumber(value.time) &&
    isString(value.note) &&
    isNumber(value.createdAt)
  );
}

function parseBookmarks(value: JsonValue | null): Bookmark[] {
  return Array.isArray(value) ? value.filter(isBookmark).sort((a, b) => a.time - b.time) : [];
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Bookmarks with notes, kept per title. The media only lends its clock; everything else is the listener's, which is why
 * this is a feature of the player rather than a capability of the media.
 */
export function createBookmarksFeature(storage: JsonStorage = localJsonStorage) {
  return definePlayerFeature({
    name: 'bookmarks',
    config: {
      /** Which title the bookmarks belong to. */
      bookmarksKey: { action: 'setBookmarksKey', state: 'bookmarksKey' },
    } satisfies PlayerFeatureConfig<BookmarksState>,
    state: ({ target, set }): BookmarksState => {
      // The actions close over the key and list rather than reading the store, which has no typed `get` this early.
      let key: string | null = null;
      let bookmarks: Bookmark[] = [];

      const write = (next: Bookmark[]) => {
        if (!key) return;

        bookmarks = next;
        storage.write(
          STORAGE_PREFIX + key,
          bookmarks.map((bookmark) => ({ ...bookmark }))
        );
        set({ bookmarks });
      };

      return {
        bookmarksKey: null,
        setBookmarksKey(value) {
          key = value || null;
          bookmarks = key ? parseBookmarks(storage.read(STORAGE_PREFIX + key)) : [];
          set({ bookmarksKey: key, bookmarks });
        },
        bookmarks: [],
        addBookmark(note = '') {
          const { media } = target();
          if (!key || !isMediaSeekCapable(media)) return null;

          const bookmark: Bookmark = { id: createId(), time: media.currentTime, note, createdAt: Date.now() };

          write([...bookmarks, bookmark].sort((a, b) => a.time - b.time));

          return bookmark;
        },
        updateBookmark(id, note) {
          write(bookmarks.map((bookmark) => (bookmark.id === id ? { ...bookmark, note } : bookmark)));
        },
        removeBookmark(id) {
          write(bookmarks.filter((bookmark) => bookmark.id !== id));
        },
      };
    },
  });
}

export const bookmarksFeature = createBookmarksFeature();
