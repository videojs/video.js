import { PlayButton, useActiveTextCues, useTextCues } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';

import { type Lane, type Song, songFile } from './song';
import { lyricsTrack, sectionsTrack } from './tracks';
import { accuracy, type Game } from './use-game';

const LANES: readonly Lane[] = [0, 1, 2, 3, 4];

/** The song, its artist, and who charted it, until playback starts. */
export function TitleCard({ song }: { song: Song }) {
  const started = usePlayer((state) => !state.paused || state.currentTime > 0);
  if (started) return null;

  return (
    <div className="title-card">
      {song.albumArt && <img src={songFile(song.albumArt)} alt="" />}
      <h1>{song.title}</h1>
      <p>
        {song.artist} · charted by {song.charter}
      </p>
      <PlayButton className="start" render={(props) => <button {...props}>Play</button>} />
      <p className="hint">Strum with keys 1 to 5, or tap the lanes.</p>
    </div>
  );
}

/** Score, combo, and multiplier, lit up during Star Power. */
export function Hud({ game }: { game: Game }) {
  return (
    <div className="hud" data-star-power={game.starPower || undefined}>
      <span className="score">{game.score.toLocaleString()}</span>
      <span className="combo">{game.combo} in a row</span>
      <span className="multiplier">{game.starPower ? game.multiplier * 2 : game.multiplier}x</span>
    </div>
  );
}

/** The five lanes at the strike line: tap zones that flash as notes are hit and missed. */
export function Lanes({ game }: { game: Game }) {
  return (
    <div className="lanes">
      {LANES.map((lane) => {
        const flash = game.flashes[lane];

        return (
          <button
            key={lane}
            type="button"
            tabIndex={-1}
            className="lane"
            data-lane={lane}
            aria-label={`Lane ${lane + 1}`}
            onPointerDown={() => game.press(lane)}
            onPointerUp={() => game.release(lane)}
            onPointerLeave={() => game.release(lane)}
          >
            {flash && <span key={flash.at} className="flash" data-kind={flash.kind} />}
          </button>
        );
      })}
    </div>
  );
}

export function Banner({ banner }: { banner: Game['banner'] }) {
  return banner && <p key={banner.at} className="banner">{banner.text}</p>;
}

/** The line being sung, lit up syllable by syllable, while lyrics are on. Nothing else draws them on the canvas. */
export function Lyrics() {
  const showing = usePlayer((state) => state.subtitlesShowing);
  const time = usePlayer((state) => state.currentTime);
  const [line] = useActiveTextCues(lyricsTrack);
  if (!showing || !line) return null;

  return (
    <p className="lyrics">
      {line.value?.syllables.map((syllable, index) => (
        <span key={index} data-sung={syllable.time <= time || undefined}>
          {syllable.text}
        </span>
      )) ?? line.text}
    </p>
  );
}

/** Once the song ends: the score, and how each section went. */
export function Results({ game }: { game: Game }) {
  const ended = usePlayer((state) => state.ended);
  const sections = useTextCues(sectionsTrack);
  if (!ended) return null;

  return (
    <div className="results">
      <h2>{game.score.toLocaleString()}</h2>
      <p>
        {accuracy(game.notes, game.hits)}% notes hit · {game.maxCombo} best streak
      </p>
      <ol>
        {sections.map((section) => (
          <li key={section.id}>
            <span>{section.text}</span>
            <span>{accuracy(game.notes, game.hits, section)}%</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
