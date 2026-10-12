import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion } from '../../src/grade/task-checks.ts';

/**
 * The grader serves the marketing site, so the standard checks already need the player there. This adds the other half
 * of the user's answer: the dashboard, whose home page is just as much a "homepage", stays exactly as it was.
 */
export const project: TaskCheck['project'] = ({ changedFiles }) => {
  const dashboard = changedFiles.filter((file) => file.startsWith('apps/dashboard/'));
  const marketing = changedFiles.filter((file) => file.startsWith('apps/marketing/'));

  return [
    assertion('dashboard untouched', dashboard.length === 0, dashboard.slice(0, 5).join(', ') || undefined),
    assertion(
      'marketing site changed',
      marketing.length > 0,
      marketing.length > 0 ? undefined : 'no changes under apps/marketing'
    ),
  ];
};
