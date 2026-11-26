import '@app/styles.css';
import type { Audiobook } from '@app/usecases/audiobook/books';
// An audiobook app — React
// http://localhost:5173/audiobook-react/
//
// The player belongs to the app, not to a page: one store, one media, a mini
// bar that follows the listener through the library and a full view on top.
// Three LibriVox titles, each stitched into one Mux audio-only asset so its
// chapters share a clock. The switch at the top plays the same recording from
// the Mux stream, which carries the title and chapters itself, or from the
// plain file on archive.org, where the app has to supply both.
import { localJsonStorage, readProgressPosition } from '@app/usecases/audiobook/features';
import { AUDIOBOOKS, findAudiobook } from '@app/usecases/audiobook/library';
import {
  AudiobookMedia,
  AudiobookPlayer,
  type AudiobookSource,
  CoverImage,
  MiniPlayer,
  NowPlaying,
} from '@app/usecases/audiobook/skin/react';
import { isString } from '@videojs/utils/predicate';
import { formatTime } from '@videojs/utils/time';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const CURRENT_KEY = 'vjs-usecase-audiobook:current';
const SOURCE_KEY = 'vjs-usecase-audiobook:source';

function hoursAndMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function SourceSwitch({ source, onChange }: { source: AudiobookSource; onChange: (source: AudiobookSource) => void }) {
  const option = (value: AudiobookSource, label: string) => (
    <button
      type="button"
      className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:bg-white dark:aria-pressed:text-black"
      aria-pressed={source === value}
      onClick={() => onChange(value)}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex items-center gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10"
      role="group"
      aria-label="Audio source"
    >
      {option('mux', 'Mux stream')}
      {option('file', 'Plain file')}
    </div>
  );
}

function Library({
  currentId,
  source,
  onOpen,
  onSource,
}: {
  currentId: string | undefined;
  source: AudiobookSource;
  onOpen: (book: Audiobook) => void;
  onSource: (source: AudiobookSource) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Library</h1>
        <SourceSwitch source={source} onChange={onSource} />
      </div>
      <ul className="flex flex-col">
        {AUDIOBOOKS.map((book) => {
          const position = readProgressPosition(book.id);
          const percent = Math.round((position / book.duration) * 100);
          const current = book.id === currentId;

          return (
            <li key={book.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5"
                aria-current={current ? 'true' : undefined}
                onClick={() => onOpen(book)}
              >
                <CoverImage book={book} className="size-20 shrink-0 rounded-md object-cover shadow" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{book.title}</span>
                  <span className="block truncate text-sm opacity-70">{book.authors.join(', ')}</span>
                  <span className="block text-xs opacity-60">
                    {hoursAndMinutes(book.duration)} · {book.chapters.length} chapters
                    {source === 'file' && !book.file ? ' · Mux stream only' : ''}
                  </span>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <span className="block h-full bg-neutral-900 dark:bg-white" style={{ width: `${percent}%` }} />
                  </span>
                  <span className="mt-1 block text-xs opacity-60">
                    {position > 0 ? `${percent}% · ${formatTime(position, book.duration)}` : 'Not started'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="px-5 py-4 text-xs opacity-60">
        {source === 'mux'
          ? 'Streaming from Mux: the title and chapters come with the stream. Progress, bookmarks, and recent places stay in this browser.'
          : 'Playing the plain M4B from archive.org: the app supplies the title and chapters itself. Progress carries over from the stream.'}
      </p>
    </div>
  );
}

function App() {
  const [bookId, setBookId] = useState<string | null>(() => {
    const saved = localJsonStorage.read(CURRENT_KEY);

    return isString(saved) ? saved : null;
  });
  const [source, setSource] = useState<AudiobookSource>(() =>
    localJsonStorage.read(SOURCE_KEY) === 'file' ? 'file' : 'mux'
  );
  const [expanded, setExpanded] = useState(false);
  const book = findAudiobook(bookId);
  // A title with no plain file plays from Mux whatever the switch says.
  const activeSource: AudiobookSource = source === 'file' && book?.file ? 'file' : 'mux';

  const changeSource = (next: AudiobookSource) => {
    localJsonStorage.write(SOURCE_KEY, next);
    setSource(next);
  };

  const open = (next: Audiobook) => {
    localJsonStorage.write(CURRENT_KEY, next.id);
    setBookId(next.id);
    setExpanded(true);
  };

  return (
    <div className="relative h-[800px] w-[390px] overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
      <AudiobookPlayer
        progressKey={book?.id}
        bookmarksKey={book?.id}
        title={activeSource === 'file' ? book?.title : undefined}
      >
        {book && <AudiobookMedia key={`${book.id}:${activeSource}`} book={book} source={activeSource} />}
        <div className="flex h-full flex-col">
          <Library currentId={book?.id} source={source} onOpen={open} onSource={changeSource} />
          {book && <MiniPlayer book={book} onExpand={() => setExpanded(true)} />}
        </div>
        {book && expanded && <NowPlaying book={book} onCollapse={() => setExpanded(false)} />}
      </AudiobookPlayer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
