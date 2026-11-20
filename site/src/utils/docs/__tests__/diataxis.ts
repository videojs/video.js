import type { DocType } from '@/types/docs';

/** The parts of a docs page the structure rules read. */
export interface DocPage {
  /** Collection id, such as `guides/autoplay`. */
  id: string;
  type: DocType;
  title: string;
  /** MDX source without its frontmatter block. */
  body: string;
}

export interface DiataxisIssue {
  id: string;
  rule: DiataxisRule;
  message: string;
}

export type DiataxisRule = 'title-how-to-prefix' | 'reference-how-to-section' | 'reference-custom-ui-note';

const HOW_TO_PREFIX = /^how to\b/i;
const CUSTOM_UI_NOTE = /<CustomUiNote\b/;
const HEADING = /^#{2,6}\s+(.+?)\s*$/gm;

/**
 * First words that turn a heading into an instruction. Concept headings name the thing being explained ("Feature
 * bundles"), not the task ("Create a player"). Kept short so the signal stays precise.
 */
const TASK_VERBS = new Set([
  'add',
  'build',
  'check',
  'choose',
  'clean',
  'configure',
  'connect',
  'create',
  'customize',
  'customizing',
  'eject',
  'enable',
  'extend',
  'install',
  'keep',
  'migrate',
  'register',
  'release',
  'remove',
  'run',
  'set',
  'swap',
  'test',
  'use',
  'using',
  'write',
]);

/** Headings the how-to template owns; on a reference page they mean a task walkthrough has crept in. */
const HOW_TO_SECTIONS = new Set(['recommended approach', 'how it works', 'common variations', 'troubleshooting']);

function headings(body: string): string[] {
  return [...body.matchAll(HEADING)].map((match) => match[1]!.replace(/`/g, ''));
}

/**
 * Report where a page breaks the boundary between guides and reference. Guides may explain or instruct; reference
 * describes the machinery and links guides for tasks. The rules are the observable tells, nothing more.
 */
export function findDiataxisIssues(page: DocPage): DiataxisIssue[] {
  const issues: DiataxisIssue[] = [];
  const report = (rule: DiataxisRule, message: string) => issues.push({ id: page.id, rule, message });

  if (HOW_TO_PREFIX.test(page.title)) {
    report('title-how-to-prefix', `Title "${page.title}" should complete "How to…" without the literal prefix.`);
  }

  if (page.type !== 'reference') return issues;

  if (CUSTOM_UI_NOTE.test(page.body)) {
    report('reference-custom-ui-note', '<CustomUiNote /> frames a task for custom-UI builders and belongs in a guide.');
  }

  for (const heading of headings(page.body)) {
    if (HOW_TO_SECTIONS.has(heading.toLowerCase())) {
      report(
        'reference-how-to-section',
        `Heading "${heading}" is a how-to template section; move the task to a guide.`
      );
    }
  }

  return issues;
}

/**
 * Headings on a concept page that read as instructions. Concept and how-to share a folder, so this is advisory: the
 * content test prints these as warnings for the pages listed under the Concepts sidebar section and never fails on
 * them.
 */
export function findTaskHeadings(page: DocPage): string[] {
  return headings(page.body).filter((heading) => TASK_VERBS.has(heading.split(/\s+/)[0]?.toLowerCase() ?? ''));
}

/** A guide passage that repeats one on a reference page. */
export interface ReferenceDuplicate {
  /** The guide that repeats the passage. */
  id: string;
  /** The reference page it repeats. */
  referenceId: string;
  /** The repeated passage, or the first cells of the repeated table rows. */
  excerpt: string;
}

/** Shorter prose passages are too generic to call a copy ("It renders nothing."). */
const MIN_PASSAGE_LENGTH = 80;
/** Fewer shared rows than this, under the same columns, is a coincidence rather than a copied lookup table. */
const MIN_SHARED_TABLE_ROWS = 4;

// Fences may be indented, such as one inside a numbered list.
const CODE_FENCE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const JSX_ONLY_LINE = /^\s*(<\/?[A-Z][^>]*>|\{\/\*.*\*\/\})\s*$/;
const TABLE_RULE = /^\|?[\s:|-]+\|?$/;

interface Table {
  header: string;
  /** First-column cells of the body rows. */
  rows: string[];
}

interface Passages {
  prose: Set<string>;
  tables: Table[];
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(normalize);
}

function toTable(lines: string[]): Table {
  const [header = '', ...body] = lines.filter((line) => !TABLE_RULE.test(line.trim()));

  return { header: cells(header).join('|'), rows: body.map((line) => cells(line)[0] ?? '').filter(Boolean) };
}

/**
 * Prose paragraphs, list items, and table first columns, the parts of a page that state facts. Code is left out because
 * a guide may show the same snippet its reference does, and so are imports, headings, and component tags.
 */
function passages(body: string): Passages {
  const result: Passages = { prose: new Set(), tables: [] };
  const lines = body.replace(CODE_FENCE, '').split('\n');
  const blocks: string[][] = [[]];

  for (const line of lines) {
    if (line.trim() === '' || JSX_ONLY_LINE.test(line) || /^(import |#{1,6} )/.test(line)) {
      blocks.push([]);
      continue;
    }

    blocks.at(-1)!.push(line);
  }

  for (const lines of blocks) {
    let block = lines;
    // Component markup, such as a multi-line `<Demo files={[…]}>`, is wiring rather than a statement of fact. A paragraph
    // that opens with an inline component, such as `<DocsLink>…</DocsLink> renders…`, closes it on the same line.
    if (block.length === 0 || (/^\s*[<{]/.test(block[0]!) && !block[0]!.includes('</'))) continue;

    if (block[0]!.trim().startsWith('|')) {
      const end = block.findIndex((line) => !line.trim().startsWith('|'));

      result.tables.push(toTable(end === -1 ? block : block.slice(0, end)));

      if (end === -1) continue;

      // Prose that follows a table without a blank line is still prose.
      block = block.slice(end);
    }

    const items = /^\s*([-*]|\d+\.)\s/.test(block[0]!)
      ? block.join('\n').split(/\n(?=\s*(?:[-*]|\d+\.)\s)/)
      : [block.join(' ')];

    for (const item of items) {
      const text = normalize(item.replace(/^\s*([-*]|\d+\.)\s+/, ''));

      // Measured as read, without tags or link targets, so a list of links such as "Related guides" isn't prose.
      if (text.replace(/<[^>]+>/g, '').replace(MARKDOWN_LINK, '$1').length >= MIN_PASSAGE_LENGTH)
        result.prose.add(text);
    }
  }

  return result;
}

/**
 * Report guide passages that repeat a reference page verbatim: the same paragraph or list item, or a table with the
 * same columns whose rows name the same entries. Reference owns exact options, values, and lookup tables, so a guide
 * links to them instead. Code examples are exempt, and restatements in other words are left to review. Only pages under
 * `guides/` are checked; the writing-style pages quote reference prose as examples.
 */
export function findReferenceDuplicates(pages: DocPage[]): ReferenceDuplicate[] {
  const references = pages
    .filter((page) => page.type === 'reference')
    .map((page) => ({ id: page.id, ...passages(page.body) }));
  const duplicates: ReferenceDuplicate[] = [];

  for (const page of pages) {
    if (!page.id.startsWith('guides/')) continue;

    const guide = passages(page.body);

    for (const reference of references) {
      for (const text of guide.prose) {
        if (reference.prose.has(text)) duplicates.push({ id: page.id, referenceId: reference.id, excerpt: text });
      }

      for (const table of guide.tables) {
        for (const referenceTable of reference.tables) {
          if (table.header !== referenceTable.header) continue;

          const shared = table.rows.filter((row) => referenceTable.rows.includes(row));

          if (shared.length >= MIN_SHARED_TABLE_ROWS) {
            duplicates.push({ id: page.id, referenceId: reference.id, excerpt: `table rows ${shared.join(', ')}` });
          }
        }
      }
    }
  }

  return duplicates;
}
