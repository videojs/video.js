import { INSTALLATION_CLI_PACKAGE, installationCommand } from './plan';

/** The repository that publishes the Video.js skill and its plugin marketplace. */
export const SKILLS_REPOSITORY = 'videojs/skills';
export const SKILLS_REPOSITORY_URL = `https://github.com/${SKILLS_REPOSITORY}`;

/** Coding agents with their own install steps, in the order instructions list them. */
export const SKILL_AGENTS = ['codex', 'claude-code', 'vscode', 'cursor', 'other'] as const;
export type SkillAgent = (typeof SKILL_AGENTS)[number];

/** The values `claude plugin marketplace add --scope` and `claude plugin install --scope` accept. */
export const CLAUDE_CODE_SCOPES = ['user', 'project', 'local'] as const;
export type ClaudeCodeScope = (typeof CLAUDE_CODE_SCOPES)[number];

function includes<const Values extends readonly string[]>(values: Values, value: string): value is Values[number] {
  return values.includes(value);
}

export function isSkillAgent(value: string): value is SkillAgent {
  return includes(SKILL_AGENTS, value);
}

export function isClaudeCodeScope(value: string): value is ClaudeCodeScope {
  return includes(CLAUDE_CODE_SCOPES, value);
}

export interface SkillsSelection {
  /** Agents to include. Omitted means every agent. */
  agents?: readonly SkillAgent[];
  /** Claude Code's installation scope. Omitted keeps Claude Code's own default. */
  scope?: ClaudeCodeScope;
  /** Install with the `skills` installer for every project instead of the current one. */
  global?: boolean;
}

export interface SkillInstallStep {
  /** Markdown that ends with a colon when `commands` or `input` follow. */
  description: string;
  /** Terminal commands to run in order. */
  commands?: readonly string[];
  /** Text to enter in the editor, such as the repository URL. */
  input?: string;
}

export interface SkillInstallMethod {
  agent: SkillAgent;
  label: string;
  steps: readonly SkillInstallStep[];
  /** Markdown paragraphs about the steps, such as installer defaults. */
  notes: readonly string[];
  /** What the person using the agent does once the steps finish so the agent loads the skill. Agents relay it. */
  followUp: string;
}

function scopeFlag(scope: ClaudeCodeScope | undefined): string {
  return scope ? ` --scope ${scope}` : '';
}

function createSkillInstallMethod(agent: SkillAgent, selection: SkillsSelection): SkillInstallMethod {
  if (agent === 'codex') {
    return {
      agent,
      label: 'Codex',
      steps: [
        {
          description: 'Add the Video.js plugin marketplace, then install the plugin:',
          commands: [`codex plugin marketplace add ${SKILLS_REPOSITORY}`, 'codex plugin add videojs@videojs'],
        },
      ],
      notes: [],
      followUp: 'Start a new Codex session after installation.',
    };
  }

  if (agent === 'claude-code') {
    const scope = scopeFlag(selection.scope);

    return {
      agent,
      label: 'Claude Code',
      steps: [
        {
          description: 'Add the Video.js plugin marketplace, then install the plugin:',
          commands: [
            `claude plugin marketplace add ${SKILLS_REPOSITORY}${scope}`,
            `claude plugin install videojs@videojs${scope}`,
          ],
        },
      ],
      notes: ['You can invoke the skill directly with `/videojs:videojs`.'],
      followUp: 'Start a new Claude Code session, or run `/reload-plugins` in the current session.',
    };
  }

  if (agent === 'vscode' || agent === 'cursor') {
    const description =
      agent === 'vscode'
        ? 'Enable `chat.plugins.enabled`, run **Chat: Install Plugin From Source** from the Command Palette, and enter:'
        : 'Open **Customize**, select **Plugins**, choose **From GitHub Repository**, and enter:';

    return {
      agent,
      label: agent === 'vscode' ? 'VS Code' : 'Cursor',
      steps: [{ description, input: SKILLS_REPOSITORY_URL }],
      notes: [],
      followUp: `Start a new ${agent === 'vscode' ? 'VS Code' : 'Cursor'} session after installation, or reload the window.`,
    };
  }

  const command = `npx skills add ${SKILLS_REPOSITORY_URL}${selection.global ? ' -g' : ''}`;

  return {
    agent,
    label: 'Other coding agents',
    steps: [
      { description: 'Use the open `skills` installer and select your agent when prompted:', commands: [command] },
    ],
    notes: [
      selection.global
        ? '`-g` makes the skill available in every project instead of only the current one.'
        : 'Project-local installation is the default. Add `-g` if you want the skill available in every project.',
      `To skip the prompts, name the agent and confirm up front, for example \`${command} --agent <agent> --yes\`.`,
    ],
    followUp: 'Start a new session in your coding agent after installation.',
  };
}

/** Install steps for each selected agent, in {@link SKILL_AGENTS} order. */
export function skillInstallMethods(selection: SkillsSelection = {}): SkillInstallMethod[] {
  const agents = selection.agents ?? SKILL_AGENTS;

  return SKILL_AGENTS.filter((agent) => agents.includes(agent)).map((agent) =>
    createSkillInstallMethod(agent, selection)
  );
}

export interface SkillsOptionDefinition {
  flag: `--${string}`;
  description: string;
  values?: readonly string[];
  default: string;
  /** The only agent the option changes. */
  agent?: SkillAgent;
}

export const SKILLS_OPTIONS: readonly SkillsOptionDefinition[] = [
  {
    flag: '--agent',
    description:
      'Comma-separated coding agents to show install steps for. `other` covers any other agent through the open `skills` installer.',
    values: SKILL_AGENTS,
    default: 'every agent',
  },
  {
    flag: '--scope',
    description: 'Where Claude Code records the marketplace and plugin.',
    values: CLAUDE_CODE_SCOPES,
    default: "Claude Code's default, `user`",
    agent: 'claude-code',
  },
  {
    flag: '--global',
    description: 'Takes no value. Installs with the `skills` installer for every project instead of the current one.',
    default: 'the current project',
    agent: 'other',
  },
];

export interface SkillsCommandOption {
  key: keyof SkillsSelection;
  flag: `--${string}`;
  /** The value as the command prints it; absent for a flag that takes none, such as `--global`. */
  value?: string;
}

export interface SkillsCommandParts {
  /** The `agents skills` invocation without options. */
  command: string;
  /** The selected options in flag order. */
  options: readonly SkillsCommandOption[];
}

/** The pieces {@link skillsCommand} joins, for interfaces that present each option on its own. */
export function skillsCommandParts(
  selection: SkillsSelection = {},
  packageVersion: string | null = null
): SkillsCommandParts {
  const packageSpecifier = packageVersion ? `${INSTALLATION_CLI_PACKAGE}@${packageVersion}` : INSTALLATION_CLI_PACKAGE;
  const options: SkillsCommandOption[] = [];
  const { agents } = selection;

  if (agents) {
    options.push({
      key: 'agents',
      flag: '--agent',
      value: SKILL_AGENTS.filter((agent) => agents.includes(agent)).join(','),
    });
  }

  if (selection.scope) options.push({ key: 'scope', flag: '--scope', value: selection.scope });

  if (selection.global) options.push({ key: 'global', flag: '--global' });

  return { command: `npx ${packageSpecifier} agents skills`, options };
}

/** The `agents skills` command for a selection, with agents in canonical order. */
export function skillsCommand(selection: SkillsSelection = {}, packageVersion: string | null = null): string {
  const { command, options } = skillsCommandParts(selection, packageVersion);

  return [command, ...options.map(({ flag, value }) => (value === undefined ? flag : `${flag} ${value}`))].join(' ');
}

export interface SkillsInstructions {
  schemaVersion: 1;
  kind: 'skills';
  package: typeof INSTALLATION_CLI_PACKAGE;
  packageVersion: string;
  repository: string;
  /** Prints these instructions again. */
  command: string;
  /** The options this command was given, by option name. */
  selectedOptions: { agent?: readonly SkillAgent[]; scope?: ClaudeCodeScope; global?: true };
  options: readonly SkillsOptionDefinition[];
  agents: readonly SkillInstallMethod[];
  /** Prints version-matched installation instructions once the skill is available. */
  installationCommand: string;
  notice: string;
}

export function createSkillsInstructions(packageVersion: string, selection: SkillsSelection = {}): SkillsInstructions {
  const selectedOptions: SkillsInstructions['selectedOptions'] = {};

  if (selection.agents) selectedOptions.agent = SKILL_AGENTS.filter((agent) => selection.agents!.includes(agent));

  if (selection.scope) selectedOptions.scope = selection.scope;

  if (selection.global) selectedOptions.global = true;

  return {
    schemaVersion: 1,
    kind: 'skills',
    package: INSTALLATION_CLI_PACKAGE,
    packageVersion,
    repository: SKILLS_REPOSITORY_URL,
    command: skillsCommand(selection, packageVersion),
    selectedOptions,
    options: SKILLS_OPTIONS,
    agents: skillInstallMethods(selection),
    installationCommand: installationCommand(undefined, packageVersion),
    notice:
      'This command prints instructions. It never installs the skill, runs other CLIs, prompts, saves preferences, or writes files.',
  };
}
