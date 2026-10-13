import { stdin, stdout } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';

export interface Choice<Value extends string> {
  value: Value;
  label: string;
  hint?: string;
}

/** Thrown when the user presses Ctrl+C or Ctrl+D at a prompt. */
export class PromptCancelled extends Error {}

/**
 * Plain terminal prompts on Node's `readline`, so the CLI ships no prompt library. One interface serves every question
 * in a run; close it when the run ends.
 */
export class Prompter {
  readonly #readline: Interface;
  #cancel: (() => void) | undefined;

  constructor() {
    this.#readline = createInterface({ input: stdin, output: stdout });
    this.#readline.on('SIGINT', () => this.#cancel?.());
    this.#readline.on('close', () => this.#cancel?.());
  }

  close(): void {
    this.#cancel = undefined;
    this.#readline.close();
  }

  async #question(query: string, initial = ''): Promise<string> {
    const controller = new AbortController();
    let cancelled = false;

    this.#cancel = () => {
      cancelled = true;
      controller.abort();
    };

    try {
      const answer = this.#readline.question(query, { signal: controller.signal });

      // Pre-fill an editable answer, as a shell does for a suggested path.
      if (initial) this.#readline.write(initial);

      return await answer;
    } catch (error) {
      if (cancelled) throw new PromptCancelled();

      throw error;
    } finally {
      this.#cancel = undefined;
    }
  }

  /** Ask for text until `validate` returns no message. `initial` is pre-filled and editable. */
  async text(message: string, options: { initial?: string; validate?: (value: string) => string | undefined } = {}) {
    for (;;) {
      const value = (await this.#question(`${message} `, options.initial)).trim();
      const problem = options.validate?.(value);
      if (!problem) return value;

      stdout.write(`  ${problem}\n`);
    }
  }

  /** Ask for one of `choices` by number; Enter keeps `initial`. */
  async select<Value extends string>(
    message: string,
    choices: readonly Choice<Value>[],
    initial: Value
  ): Promise<Value> {
    const defaultIndex = Math.max(
      0,
      choices.findIndex((choice) => choice.value === initial)
    );

    stdout.write(`${message}\n`);

    for (const [index, choice] of choices.entries()) {
      stdout.write(`  ${index + 1}. ${choice.label}${choice.hint ? ` (${choice.hint})` : ''}\n`);
    }

    for (;;) {
      const answer = (await this.#question(`Number [${defaultIndex + 1}]: `)).trim();
      if (!answer) return choices[defaultIndex]!.value;

      const choice = choices[Number(answer) - 1];
      if (choice && /^\d+$/.test(answer)) return choice.value;

      stdout.write(`  Enter a number from 1 to ${choices.length}.\n`);
    }
  }

  /** Ask a yes or no question; Enter keeps `initial`. */
  async confirm(message: string, initial: boolean): Promise<boolean> {
    for (;;) {
      const answer = (await this.#question(`${message} ${initial ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase();
      if (!answer) return initial;

      if (answer === 'y' || answer === 'yes') return true;

      if (answer === 'n' || answer === 'no') return false;

      stdout.write('  Enter y or n.\n');
    }
  }
}
