import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

/**
 * The template files and the commit they were built from, written by the CLI's build. The templates are not published
 * with the package; `skin create` downloads the ones it needs from that commit, so a CLI version always gets its own.
 */
declare const __SKIN_TEMPLATES__: { ref: string; files: string[] } | undefined;

const REPOSITORY_RAW = 'https://raw.githubusercontent.com/videojs/video.js';
const TEMPLATES_PATH = 'packages/cli/templates/skin';

/** Where templates come from: the published commit by default, or a local folder or URL with `--templates`. */
export function defaultTemplateSource(): string | undefined {
  if (typeof __SKIN_TEMPLATES__ === 'undefined') return undefined;

  return `${REPOSITORY_RAW}/${__SKIN_TEMPLATES__.ref}/${TEMPLATES_PATH}`;
}

function isUrl(source: string): boolean {
  return /^https?:\/\//.test(source);
}

/** Every file under `directories` in a local templates folder, keyed by path relative to that directory. */
async function readLocal(source: string, directories: readonly string[]): Promise<Map<string, Map<string, string>>> {
  const result = new Map<string, Map<string, string>>();

  for (const directory of directories) {
    const root = resolve(source, directory);
    const files = new Map<string, string>();
    const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => {
      throw new Error(`Could not read skin templates from ${root}.`);
    });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const path = join(entry.parentPath, entry.name);

      files.set(relative(root, path), await readFile(path, 'utf8'));
    }

    result.set(directory, files);
  }

  return result;
}

/** Requests in flight at once: what a browser opens per host, so proxies and small servers keep up. */
const CONCURRENCY = 6;

/** Fetch one template, retrying once, since a dropped connection is more likely than a missing file. */
async function fetchTemplate(url: string): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not download ${url}: ${response.status} ${response.statusText}.`);

      return await response.text();
    } catch (error) {
      if (attempt >= 2) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new Error(`Could not download the skin templates (${url}): ${reason} Check your connection.`);
      }
    }
  }
}

/** Download the files under `directories` from a templates URL, a few at a time. */
async function download(
  source: string,
  directories: readonly string[],
  files: readonly string[]
): Promise<Map<string, Map<string, string>>> {
  const base = source.replace(/\/$/, '');
  const wanted = files.filter((file) => directories.some((directory) => file.startsWith(`${directory}/`)));
  const downloaded = new Map<string, string>();
  const queue = [...wanted];

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
        downloaded.set(file, await fetchTemplate(`${base}/${file}`));
      }
    })
  );

  const result = new Map(directories.map((directory) => [directory, new Map<string, string>()]));

  for (const [file, content] of downloaded) {
    const directory = directories.find((name) => file.startsWith(`${name}/`))!;

    result.get(directory)!.set(file.slice(directory.length + 1), content);
  }

  return result;
}

/**
 * The template files under each of `directories`, keyed by directory and then by path within it. `source` is a local
 * folder or a URL; a URL needs the file list the build records, since a web server can't be listed.
 */
export async function loadTemplates(
  source: string | undefined,
  directories: readonly string[]
): Promise<Map<string, Map<string, string>>> {
  if (!source) {
    throw new Error('This build has no skin templates. Pass --templates with a local templates folder.');
  }

  if (!isUrl(source)) return readLocal(source, directories);

  if (typeof __SKIN_TEMPLATES__ === 'undefined') {
    throw new Error('Downloading templates needs the file list from a CLI build. Pass a local --templates folder.');
  }

  return download(source, directories, __SKIN_TEMPLATES__.files);
}
