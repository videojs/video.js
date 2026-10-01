/** Players an installation can migrate from, each with a migration guide. */
export const INSTALLATION_MIGRATION_SOURCES = ['video-js-8', 'mux-player', 'plyr', 'media-chrome', 'vidstack'] as const;
export type InstallationMigrationSource = (typeof INSTALLATION_MIGRATION_SOURCES)[number];

export const INSTALLATION_MIGRATION_NAMES = {
  'video-js-8': 'Video.js 8',
  'mux-player': 'Mux Player',
  plyr: 'Plyr',
  'media-chrome': 'Media Chrome',
  vidstack: 'Vidstack',
} as const satisfies Record<InstallationMigrationSource, string>;

export function isInstallationMigrationSource(value: string): value is InstallationMigrationSource {
  return INSTALLATION_MIGRATION_SOURCES.some((source) => source === value);
}

/** The slug of the guide for migrating from a player. */
export function migrationGuideSlug(source: InstallationMigrationSource): string {
  return `migrate-from-${source}`;
}
