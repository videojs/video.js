'use client';

import { selectPlaybackRate, selectTime } from '@videojs/core/dom';
import { createPlayer, Dialog, features, PlayButton, SeekButton, Time, TimeSlider } from '@videojs/react';
import { audioFeatures } from '@videojs/react/audio';
import { PauseIcon, PlayIcon } from '@videojs/react/icons';
import { MuxAudio } from '@videojs/react/media/mux-audio';
import { cn } from '@videojs/utils/style';
import { formatTime } from '@videojs/utils/time';
import type { ReactNode, SVGProps } from 'react';
import { useEffect, useState } from 'react';

import {
  type Audiobook,
  type AudiobookChapter,
  audiobookChaptersJsonUrl,
  audiobookCoverFallback,
  audiobookSrc,
  chapterAt,
  chaptersFromMux,
  chaptersVttDataUrl,
  type MuxChapter,
} from '../books';
import { bookmarksFeature, mediaSessionFeature, progressFeature, sleepTimerFeature } from '../features';

/**
 * An audio player whose store also remembers where the listener is, keeps their bookmarks, can fall asleep, and talks
 * to the lock screen. The stock audio preset handles play, seek, rate, volume, and buffering; `textTrack` reads the
 * chapters off the media the way it would for a video; the four extra features are the audiobook-shaped parts.
 */
export const { Player: AudiobookPlayer, usePlayer: useAudiobookPlayer } = createPlayer({
  features: [
    ...audioFeatures,
    features.textTrack,
    progressFeature,
    bookmarksFeature,
    sleepTimerFeature,
    mediaSessionFeature,
  ],
});

const RATES: readonly number[] = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SKIP_SECONDS = 15;
const SLEEP_MINUTES: readonly number[] = [15, 30, 45, 60];

const BUTTON =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-40 dark:hover:bg-white/10';

/** The cover, falling back to the archive.org thumbnail when the full-size file is having a day. */
export function CoverImage({ book, alt = '', className }: { book: Audiobook; alt?: string; className?: string }) {
  return (
    <img
      src={book.cover}
      alt={alt}
      className={className}
      onError={(event) => {
        const fallback = audiobookCoverFallback(book);

        if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
      }}
    />
  );
}

/** Which chapter the clock is in right now. */
export function useCurrentChapter(book: Audiobook): AudiobookChapter | undefined {
  const time = useAudiobookPlayer(selectTime);

  return chapterAt(book.chapters, time?.currentTime ?? 0);
}

function isMuxChapter(value: MuxChapter): boolean {
  return Number.isFinite(value['start-time']);
}

/**
 * The chapters as a WebVTT data URL for the `<track>`: the document on the Mux asset once it has arrived, the library's
 * table until then and when the asset carries none. The player only ever sees a chapters track on the media.
 */
function useChaptersTrackUrl(book: Audiobook): string {
  const [fromMux, setFromMux] = useState<{ book: Audiobook; url: string } | null>(null);

  useEffect(() => {
    const jsonUrl = audiobookChaptersJsonUrl(book);
    if (!jsonUrl) return;

    const controller = new AbortController();

    fetch(jsonUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
      .then((document: MuxChapter[]) => {
        if (!Array.isArray(document) || !document.every(isMuxChapter)) throw new TypeError('Not a chapters document');

        setFromMux({ book, url: chaptersVttDataUrl(chaptersFromMux(document, book.duration)) });
      })
      .catch(() => {
        // The library's table is already on the track; the asset's copy was a bonus.
      });

    return () => controller.abort();
  }, [book]);

  return fromMux?.book === book ? fromMux.url : chaptersVttDataUrl(book.chapters);
}

/**
 * The media for one title: the Mux stream, the chapters as a `<track>` so the player's text-track feature sees them
 * (the document on the Mux asset, once fetched), and the lock-screen metadata. Re-mount it (`key={book.id}`) to change
 * titles.
 */
export function AudiobookMedia({ book }: { book: Audiobook }): ReactNode {
  const setSessionMetadata = useAudiobookPlayer((state) => state.setSessionMetadata);
  const chaptersUrl = useChaptersTrackUrl(book);

  useEffect(() => {
    setSessionMetadata({
      title: book.title,
      artist: book.authors.join(', '),
      album: 'LibriVox',
      artwork: [{ src: book.cover, type: 'image/jpeg' }],
    });

    return () => setSessionMetadata(null);
  }, [book, setSessionMetadata]);

  return (
    <MuxAudio src={audiobookSrc(book)} preload="metadata" crossOrigin="">
      <track kind="chapters" src={chaptersUrl} srcLang="en" label="Chapters" default />
    </MuxAudio>
  );
}

function SkipIcon({ seconds, className }: { seconds: number; className?: string }) {
  const back = seconds < 0;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(className, back && '-scale-x-100')}
    >
      <path d="M12 4a8 8 0 1 1-7.5 5.2" />
      <path d="M9.5 1.5 12 4 9.5 6.5" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        transform={back ? 'translate(24 0) scale(-1 1)' : undefined}
      >
        {Math.abs(seconds)}
      </text>
    </svg>
  );
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

function SkipButton({ seconds, className, iconClass }: { seconds: number; className?: string; iconClass?: string }) {
  return (
    <SeekButton
      seconds={seconds}
      className={cn(BUTTON, 'size-10', className)}
      render={(props) => (
        <button {...props}>
          <SkipIcon seconds={seconds} className={cn('size-7', iconClass)} />
        </button>
      )}
    />
  );
}

function PlayPauseButton({ className, iconClass }: { className?: string; iconClass?: string }) {
  return (
    <PlayButton
      className={cn(
        BUTTON,
        'size-10 bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200',
        className
      )}
      render={(props, state) => (
        <button {...props}>
          {state.paused ? (
            <PlayIcon className={cn('size-6', iconClass)} />
          ) : (
            <PauseIcon className={cn('size-6', iconClass)} />
          )}
        </button>
      )}
    />
  );
}

/** Cycles the rates an audiobook listener actually uses, rather than the stock button's 0.2–2 list. */
function SpeedButton() {
  const rate = useAudiobookPlayer(selectPlaybackRate);
  const current = rate?.playbackRate ?? 1;
  const index = RATES.findIndex((candidate) => candidate > current);
  const next = RATES[index === -1 ? 0 : index] ?? 1;

  return (
    <button
      type="button"
      className={cn(BUTTON, 'h-10 min-w-12 px-2 text-sm font-semibold tabular-nums')}
      aria-label={`Playback speed ${current}×. Change to ${next}×`}
      onClick={() => rate?.setPlaybackRate(next)}
    >
      {current}×
    </button>
  );
}

function ProgressHairline() {
  const time = useAudiobookPlayer(selectTime);
  const percent = time && time.duration > 0 ? (time.currentTime / time.duration) * 100 : 0;

  return (
    <div className="absolute inset-x-0 top-0 h-0.5 bg-black/10 dark:bg-white/10" aria-hidden="true">
      <div className="h-full bg-neutral-900 dark:bg-white" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** The bar that stays at the bottom of the app while the listener browses. */
export function MiniPlayer({ book, onExpand }: { book: Audiobook; onExpand: () => void }): ReactNode {
  const chapter = useCurrentChapter(book);

  return (
    <div className="relative border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
      <ProgressHairline />
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          aria-label={`Now playing ${book.title}. Open the player`}
          onClick={onExpand}
        >
          <CoverImage book={book} className="size-11 shrink-0 rounded object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{book.title}</span>
            <span className="block truncate text-xs opacity-70">{chapter?.title ?? book.authors.join(', ')}</span>
          </span>
        </button>
        <SkipButton seconds={-SKIP_SECONDS} />
        <PlayPauseButton />
        <SkipButton seconds={SKIP_SECONDS} />
      </div>
    </div>
  );
}

/** The time slider, split per chapter the way the player's chapter cues describe it. */
function ChapterSlider() {
  return (
    <TimeSlider.Root className="group relative flex h-8 w-full cursor-pointer touch-none items-center">
      <TimeSlider.Track className="relative h-1.5 w-full">
        <TimeSlider.Chapters
          className="absolute inset-0"
          renderChapter={(props) => (
            <div
              {...props}
              className="absolute inset-y-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
              style={{
                ...props.style,
                left: 'calc(var(--media-slider-chapter-start) + 1px)',
                right: 'calc(100% - var(--media-slider-chapter-end) + 1px)',
              }}
            >
              <div className="absolute inset-y-0 left-0 w-[var(--media-slider-chapter-buffer)] bg-neutral-400/50" />
              <div className="absolute inset-y-0 left-0 w-[var(--media-slider-chapter-fill)] bg-neutral-900 dark:bg-white" />
            </div>
          )}
        />
      </TimeSlider.Track>
      <TimeSlider.Thumb className="absolute top-1/2 left-[var(--media-slider-fill)] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900 shadow ring-2 ring-white dark:bg-white dark:ring-neutral-900" />
    </TimeSlider.Root>
  );
}

/** A bottom sheet, built on the player's dialog primitive. Sits inside whatever frame holds the app. */
function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Backdrop className="absolute inset-0 z-10 bg-black/40" />
      <Dialog.Popup className="absolute inset-x-0 bottom-0 z-20 flex max-h-[85%] flex-col rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-neutral-900">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Close className={cn(BUTTON, 'size-8 text-lg')} aria-label="Close">
            ×
          </Dialog.Close>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 pb-6">{children}</div>
      </Dialog.Popup>
    </Dialog.Root>
  );
}

function ContentsList({ book, onPick }: { book: Audiobook; onPick: () => void }) {
  const time = useAudiobookPlayer(selectTime);
  const current = chapterAt(book.chapters, time?.currentTime ?? 0);
  const multiReader = book.readers.length > 1;

  return (
    <ol className="divide-y divide-black/5 dark:divide-white/10">
      {book.chapters.map((chapter) => (
        <li key={chapter.index}>
          <button
            type="button"
            aria-current={chapter === current ? 'true' : undefined}
            className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left aria-[current]:font-semibold"
            onClick={() => {
              void time?.seek(chapter.start);
              onPick();
            }}
          >
            <span className="w-16 shrink-0 text-xs tabular-nums opacity-60">
              {formatTime(chapter.start, book.duration)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{chapter.title}</span>
              {multiReader && <span className="block truncate text-xs opacity-60">{chapter.readers.join(', ')}</span>}
            </span>
            <span className="text-xs tabular-nums opacity-60">{formatTime(chapter.end - chapter.start)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function relativeTime(at: number): string {
  const minutes = Math.round((at - Date.now()) / 60_000);
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute');

  if (Math.abs(minutes) < 60 * 24) return format.format(Math.round(minutes / 60), 'hour');

  return format.format(Math.round(minutes / (60 * 24)), 'day');
}

function BookmarksList({ book }: { book: Audiobook }) {
  const time = useAudiobookPlayer(selectTime);
  const bookmarks = useAudiobookPlayer((state) => state.bookmarks);
  const addBookmark = useAudiobookPlayer((state) => state.addBookmark);
  const updateBookmark = useAudiobookPlayer((state) => state.updateBookmark);
  const removeBookmark = useAudiobookPlayer((state) => state.removeBookmark);
  const places = useAudiobookPlayer((state) => state.recentPlaces);
  const clearRecentPlaces = useAudiobookPlayer((state) => state.clearRecentPlaces);
  const [note, setNote] = useState('');
  const currentTime = time?.currentTime ?? 0;
  const input =
    'min-w-0 flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm placeholder:opacity-50 focus:outline-2 focus:outline-offset-1 focus:outline-current dark:border-white/20';

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addBookmark(note.trim());
          setNote('');
        }}
      >
        <input
          value={note}
          placeholder={`Note at ${formatTime(currentTime, book.duration)}`}
          aria-label="Bookmark note"
          className={input}
          onChange={(event) => setNote(event.target.value)}
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Bookmark
        </button>
      </form>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide uppercase opacity-60">Bookmarks</h3>
        {bookmarks.length === 0 ? (
          <p className="text-sm opacity-60">Nothing saved yet. Bookmarks keep the place and a note.</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.id} className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  className="shrink-0 cursor-pointer text-left text-xs tabular-nums underline-offset-2 hover:underline"
                  onClick={() => void time?.seek(bookmark.time)}
                >
                  <span className="block">{formatTime(bookmark.time, book.duration)}</span>
                  <span className="block opacity-60">{chapterAt(book.chapters, bookmark.time)?.title}</span>
                </button>
                <input
                  defaultValue={bookmark.note}
                  placeholder="Add a note"
                  aria-label="Bookmark note"
                  className={cn(input, 'border-transparent px-2 py-1')}
                  onBlur={(event) => {
                    if (event.target.value !== bookmark.note) updateBookmark(bookmark.id, event.target.value);
                  }}
                />
                <button
                  type="button"
                  className={cn(BUTTON, 'size-8 text-lg')}
                  aria-label="Remove bookmark"
                  onClick={() => removeBookmark(bookmark.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wide uppercase opacity-60">Recent places</h3>
          {places.length > 0 && (
            <button
              type="button"
              className="cursor-pointer text-xs underline-offset-2 hover:underline"
              onClick={clearRecentPlaces}
            >
              Clear
            </button>
          )}
        </div>
        {places.length === 0 ? (
          <p className="text-sm opacity-60">
            Where you were before each jump shows up here, so a slip of the finger is never lost.
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {places.map((place) => (
              <li key={place.at}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 py-2 text-left"
                  onClick={() => void time?.seek(place.time)}
                >
                  <span className="w-16 shrink-0 text-xs tabular-nums">{formatTime(place.time, book.duration)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{chapterAt(book.chapters, place.time)?.title}</span>
                  <span className="shrink-0 text-xs opacity-60">{relativeTime(place.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Journey({ book }: { book: Audiobook }) {
  const time = useAudiobookPlayer(selectTime);
  const rate = useAudiobookPlayer(selectPlaybackRate);
  const listened = useAudiobookPlayer((state) => state.listenedSeconds);
  const firstAt = useAudiobookPlayer((state) => state.firstListenedAt);
  const lastAt = useAudiobookPlayer((state) => state.lastListenedAt);
  const position = time?.currentTime ?? 0;
  const speed = rate?.playbackRate ?? 1;
  const percent = book.duration > 0 ? Math.round((position / book.duration) * 100) : 0;
  const chaptersDone = book.chapters.filter((chapter) => chapter.end <= position).length;
  const stats: [string, string][] = [
    ['Progress', `${percent}%`],
    ['Chapters finished', `${chaptersDone} of ${book.chapters.length}`],
    ['Time listened', formatTime(listened)],
    [`Left at ${speed}×`, formatTime((book.duration - position) / speed)],
    ['Started', firstAt ? new Date(firstAt).toLocaleDateString() : '—'],
    ['Last listened', lastAt ? relativeTime(lastAt) : '—'],
  ];

  return (
    <dl className="grid grid-cols-2 gap-3">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-black/5 px-3 py-2 dark:bg-white/10">
          <dt className="text-xs opacity-60">{label}</dt>
          <dd className="text-base font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SleepTimerOptions({ book, onPick }: { book: Audiobook; onPick: () => void }) {
  const time = useAudiobookPlayer(selectTime);
  const timer = useAudiobookPlayer((state) => state.sleepTimer);
  const remaining = useAudiobookPlayer((state) => state.sleepRemaining);
  const setSleepTimer = useAudiobookPlayer((state) => state.setSleepTimer);
  const chapter = chapterAt(book.chapters, time?.currentTime ?? 0);
  const option =
    'w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10';

  return (
    <div className="flex flex-col gap-1">
      {timer.mode !== 'off' && (
        <button type="button" className={cn(option, 'font-semibold')} onClick={() => setSleepTimer(null)}>
          Turn off · {formatTime(remaining)} left
        </button>
      )}
      {SLEEP_MINUTES.map((minutes) => (
        <button
          key={minutes}
          type="button"
          className={option}
          onClick={() => {
            setSleepTimer({ minutes });
            onPick();
          }}
        >
          {minutes} minutes
        </button>
      ))}
      <button
        type="button"
        className={option}
        disabled={!chapter}
        onClick={() => {
          if (chapter) setSleepTimer({ until: chapter.end });

          onPick();
        }}
      >
        End of chapter{chapter ? ` · ${formatTime(chapter.end - (time?.currentTime ?? 0))} left` : ''}
      </button>
    </div>
  );
}

function SleepTimerButton({ onClick }: { onClick: () => void }) {
  const timer = useAudiobookPlayer((state) => state.sleepTimer);
  const remaining = useAudiobookPlayer((state) => state.sleepRemaining);
  const active = timer.mode !== 'off';

  return (
    <button
      type="button"
      className={cn(
        BUTTON,
        'h-10 gap-1 px-2 text-xs font-semibold tabular-nums',
        active && 'text-sky-600 dark:text-sky-400'
      )}
      aria-label={active ? `Sleep timer, ${formatTime(remaining)} left` : 'Sleep timer'}
      aria-pressed={active}
      onClick={onClick}
    >
      <MoonIcon className="size-6" />
      {active && <span>{formatTime(remaining)}</span>}
    </button>
  );
}

type SheetName = 'contents' | 'bookmarks' | 'journey' | 'sleep';

/** The full-height player: cover, chaptered slider, transport, and the sheets behind the tabs. */
export function NowPlaying({ book, onCollapse }: { book: Audiobook; onCollapse: () => void }): ReactNode {
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const chapter = useCurrentChapter(book);
  const close = () => setSheet(null);
  const tab = 'cursor-pointer py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10';

  return (
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-neutral-950">
      <header className="flex items-center justify-between px-3 pt-3">
        <button type="button" className={cn(BUTTON, 'size-10')} aria-label="Back to the library" onClick={onCollapse}>
          <ChevronDownIcon className="size-6" />
        </button>
        <span className="text-xs font-semibold tracking-wide uppercase opacity-60">Now playing</span>
        <span className="size-10" aria-hidden="true" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6">
        <CoverImage
          book={book}
          alt={`Cover of ${book.title}`}
          className="aspect-square w-52 rounded-xl object-cover shadow-xl"
        />
        <div className="w-full text-center">
          <h2 className="truncate text-lg font-semibold">{book.title}</h2>
          <p className="truncate text-sm opacity-70">{book.authors.join(', ')}</p>
          <p className="mt-2 truncate text-sm">{chapter?.title ?? ' '}</p>
          <p className="truncate text-xs opacity-60">{chapter ? `Read by ${chapter.readers.join(', ')}` : ' '}</p>
        </div>
      </div>

      <div className="px-6">
        <ChapterSlider />
        <div className="flex justify-between text-xs tabular-nums opacity-70">
          <Time.Value type="current" />
          <Time.Value type="remaining" toggle />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3">
        <SleepTimerButton onClick={() => setSheet('sleep')} />
        <SkipButton seconds={-SKIP_SECONDS} className="size-12" iconClass="size-9" />
        <PlayPauseButton className="size-16" iconClass="size-8" />
        <SkipButton seconds={SKIP_SECONDS} className="size-12" iconClass="size-9" />
        <SpeedButton />
      </div>

      <nav className="grid grid-cols-3 border-t border-black/10 dark:border-white/10" aria-label="Player sections">
        <button type="button" className={tab} onClick={() => setSheet('contents')}>
          Contents
        </button>
        <button type="button" className={tab} onClick={() => setSheet('bookmarks')}>
          Bookmarks
        </button>
        <button type="button" className={tab} onClick={() => setSheet('journey')}>
          Journey
        </button>
      </nav>

      <Sheet open={sheet === 'contents'} title="Contents" onClose={close}>
        <ContentsList book={book} onPick={close} />
      </Sheet>
      <Sheet open={sheet === 'bookmarks'} title="Bookmarks & places" onClose={close}>
        <BookmarksList book={book} />
      </Sheet>
      <Sheet open={sheet === 'journey'} title="Listening journey" onClose={close}>
        <Journey book={book} />
      </Sheet>
      <Sheet open={sheet === 'sleep'} title="Sleep timer" onClose={close}>
        <SleepTimerOptions book={book} onPick={close} />
      </Sheet>
    </div>
  );
}
