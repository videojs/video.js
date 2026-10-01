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
