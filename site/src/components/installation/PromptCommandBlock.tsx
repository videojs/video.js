import clsx from 'clsx';
import { Fragment } from 'react';

/** Backticks the agent reads around code, kept for copying but not shown. */
export function CopiedBacktick() {
  return <span hidden>`</span>;
}

/**
 * The colors Shiki's Gruvbox dark themes give a shell command, so the prompt reads like the page's other code blocks
 * without loading a highlighter for three kinds of token.
 */
const SHELL_COLORS = {
  program: '#fabd2f',
  word: '#b8bb26',
  flag: '#d3869b',
  quote: '#a89984',
} as const;

/** A command's words: the program, then its package and subcommands. */
function CommandWords({ command }: { command: string }) {
  const [program, ...words] = command.split(' ');

  return (
    <>
      <span style={{ color: SHELL_COLORS.program }}>{program}</span>
      {words.map((word, index) => (
        <Fragment key={index}>
          {' '}
          <span style={{ color: SHELL_COLORS.word }}>{word}</span>
        </Fragment>
      ))}
    </>
  );
}

/** A flag's value as the shell reads it, with the quotes around a list or URL in their own color. */
function OptionValue({ value }: { value: string }) {
  const quoted = value.length > 1 && value.startsWith("'") && value.endsWith("'");
  const quote = <span style={{ color: SHELL_COLORS.quote }}>'</span>;

  return (
    <span style={{ color: SHELL_COLORS.word }}>
      {quoted ? (
        <>
          {quote}
          {value.slice(1, -1)}
          {quote}
        </>
      ) : (
        value
      )}
    </span>
  );
}

/** Values from this length wrap within themselves rather than moving to the next line with their flag. */
const LONG_VALUE = 32;

interface Props {
  command: string;
  /** The options the command states, as copied. */
  options: readonly { flag: string; value?: string | undefined }[];
}

/** One command as copied, in backticks, highlighted the way the page's shell code blocks are. */
export default function PromptCommandBlock({ command, options }: Props) {
  return (
    <p className="corner-squircle border-line bg-faded-black/60 text-code rounded-lg border px-3 py-3 font-mono wrap-anywhere sm:px-4">
      <CopiedBacktick />
      <CommandWords command={command} />
      {options.map(({ flag, value }) => (
        <Fragment key={flag}>
          {' '}
          {/* A flag stays on the line with its value, unless the value, such as a media URL, is too long to. */}
          <span className={clsx((value?.length ?? 0) < LONG_VALUE && 'whitespace-nowrap')}>
            <span style={{ color: SHELL_COLORS.flag }}>{flag}</span>
            {value !== undefined && (
              <>
                {' '}
                <OptionValue value={value} />
              </>
            )}
          </span>
        </Fragment>
      ))}
      <CopiedBacktick />
    </p>
  );
}
