import {
  createInstallationDiscovery,
  createInstallationPlan,
  INSTALLATION_FRAMEWORKS,
  INSTALLATION_METHODS,
  INSTALLATION_PARAMETERS,
  type InstallationInput,
  type InstallationInputKey,
  installationDecisionOrderFor,
  installationInputKeyFromFlag,
  type InstallationOptionSyntax,
  installationOptionDefinitionsFor,
  renderArgumentErrors,
  renderInstallationCompatibilityMarkdown,
  renderInstallationMarkdown,
  resolveInstallationSelection,
} from '@videojs/installation';

/** Installation options as `plan_install` names them: the `InstallationInput` keys. */
export const PLAN_INSTALL_KEYS = INSTALLATION_PARAMETERS.map(({ key }) => key) satisfies InstallationInputKey[];

/** Names options the way an MCP client passes them, so validation messages and guidance match the tool's arguments. */
export const TOOL_OPTION_SYNTAX: InstallationOptionSyntax = {
  noun: 'argument',
  options: (...choices) => choices.map(([key, value]) => (value === undefined ? key : `${key}: "${value}"`)).join(', '),
};

export type PlanInstallResult = { ok: true; markdown: string } | { ok: false; markdown: string };

/** The option reference an agent reads before choosing: what to decide, in order, and which values combine. */
export function renderInstallChoices(packageVersion: string): string {
  const context = { methods: INSTALLATION_METHODS, frameworks: INSTALLATION_FRAMEWORKS };
  const discovery = createInstallationDiscovery(packageVersion);
  const decisions = installationDecisionOrderFor(context, TOOL_OPTION_SYNTAX)
    .map(({ title, guidance }, index) => `${index + 1}. **${title}.** ${guidance}`)
    .join('\n');
  // CLI-only options such as `--json` have no argument here.
  const options = installationOptionDefinitionsFor(context, TOOL_OPTION_SYNTAX)
    .flatMap((option) => {
      const key = installationInputKeyFromFlag(option.flag);
      if (!key) return [];

      const values = option.values ? ` Values: ${option.values.map((value) => `\`${value}\``).join(', ')}.` : '';
      const applies = option.appliesWhen ? ` Applies when ${option.appliesWhen}.` : '';

      return [`- \`${key}\`: ${option.description}${values} Default: ${option.default}.${applies}`];
    })
    .join('\n');

  return `# Video.js installation choices

Video.js ${packageVersion}. Call \`plan_install\` again with your choices to get one complete, step-by-step plan. Omitted choices use the defaults below.

## Decide in this order

${decisions}

## Arguments

${options}

## Compatibility

${renderInstallationCompatibilityMarkdown(discovery.compatibility, TOOL_OPTION_SYNTAX)}
`;
}

/**
 * The installation plan for one set of choices, or the option reference when none were given. Invalid combinations come
 * back as errors naming the arguments to change.
 */
export function planInstall(input: InstallationInput, packageVersion: string): PlanInstallResult {
  const given = PLAN_INSTALL_KEYS.filter((key) => input[key] !== undefined);
  if (given.length === 0) return { ok: true, markdown: renderInstallChoices(packageVersion) };

  const resolved = resolveInstallationSelection(input, packageVersion, {}, TOOL_OPTION_SYNTAX);

  if (!resolved.ok) {
    const errors = renderArgumentErrors('Invalid installation arguments:', resolved.errors);

    return {
      ok: false,
      markdown: `${errors}\n\nCall \`plan_install\` with no arguments to list every choice and how they combine.`,
    };
  }

  return { ok: true, markdown: renderInstallationMarkdown(createInstallationPlan(resolved.selection, packageVersion)) };
}
