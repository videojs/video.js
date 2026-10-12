import { createHash } from 'node:crypto';

const PREFIX = 'virtual:vjsc/css/';

/**
 * `base` modules import a transform's runtime base stylesheet so development pages load it; bundles add base styles
 * explicitly, so the graph never collects them. `asset` modules hold compiled rules for one output file.
 */
export type VirtualCssKind = 'asset' | 'base';

export interface VirtualCss {
  readonly kind: VirtualCssKind;
  /** Output file the stylesheet belongs to, such as `buttons.css`. */
  readonly fileName: string;
}

/** Matches generated stylesheet ids, including Rolldown's `\0` virtual-module marker, in hook filters. */
export const VIRTUAL_CSS_ID = /(?:^|\0)virtual:vjsc\/css\//;

/** Name a generated stylesheet by its kind, output file, and content, so a changed stylesheet gets a new id. */
export function createVirtualCssId(kind: VirtualCssKind, fileName: string, source: string): string {
  const hash = createHash('sha256').update(kind).update('\0').update(fileName).update('\0').update(source);

  return `${PREFIX}${kind}/${hash.digest('hex').slice(0, 12)}/${encodeURIComponent(fileName)}`;
}

/** Read a generated stylesheet id, with or without the `\0` virtual-module marker. */
export function parseVirtualCssId(id: string): VirtualCss | undefined {
  const publicId = id.startsWith('\0') ? id.slice(1) : id;
  if (!publicId.startsWith(PREFIX)) return undefined;

  const [kind, hash, file, ...rest] = publicId.slice(PREFIX.length).split('/');
  if ((kind !== 'asset' && kind !== 'base') || !hash || !file || rest.length > 0) return undefined;

  return { kind, fileName: decodeURIComponent(file) };
}

export function isVirtualCssId(id: string): boolean {
  return parseVirtualCssId(id) !== undefined;
}

export interface VirtualCssLifecycle {
  /**
   * Keep a released stylesheet resolvable, with empty source, instead of forgetting it. A development server may still
   * request a stylesheet an owner stopped importing, and must receive empty CSS rather than a resolution error.
   */
  readonly retainReleasedCss: boolean;
  onCssChange(id: string): void;
}

/** The generated stylesheets owner modules import, keyed by public id. */
export interface VirtualCssRegistry {
  /** Source of a generated stylesheet, by public or `\0`-marked id. */
  source(id: string): string | undefined;
  /** Replace every stylesheet one owner imports, releasing the ones it no longer does. */
  replace(owner: string, modules: readonly (readonly [id: string, source: string])[]): void;
}

/** Released stylesheets a development server keeps resolvable; ids are content hashes, so edits keep adding them. */
const RETAINED_RELEASED_CSS = 256;

export function createVirtualCssRegistry(lifecycle?: VirtualCssLifecycle): VirtualCssRegistry {
  const modules = new Map<string, { source: string; readonly owners: Set<string> }>();
  const byOwner = new Map<string, ReadonlySet<string>>();
  const released = new Set<string>();

  const release = (id: string): void => {
    const module = modules.get(id);
    if (!module) return;

    if (!lifecycle?.retainReleasedCss) {
      modules.delete(id);
      return;
    }

    if (module.source !== '') {
      module.source = '';
      lifecycle.onCssChange(id);
    }

    released.add(id);

    for (const oldest of released) {
      if (released.size <= RETAINED_RELEASED_CSS) break;

      released.delete(oldest);
      modules.delete(oldest);
    }
  };

  return {
    source: (id) => modules.get(id.startsWith('\0') ? id.slice(1) : id)?.source,
    replace(owner, next) {
      const nextIds = new Set(next.map(([id]) => id));

      for (const id of byOwner.get(owner) ?? []) {
        if (nextIds.has(id)) continue;

        const module = modules.get(id);

        module?.owners.delete(owner);

        if (module?.owners.size === 0) release(id);
      }

      for (const [id, source] of next) {
        const module = modules.get(id);

        released.delete(id);

        if (!module) {
          modules.set(id, { source, owners: new Set([owner]) });
          lifecycle?.onCssChange(id);
          continue;
        }

        module.owners.add(owner);

        if (module.source !== source) {
          module.source = source;
          lifecycle?.onCssChange(id);
        }
      }

      if (nextIds.size > 0) byOwner.set(owner, nextIds);
      else byOwner.delete(owner);
    },
  };
}
