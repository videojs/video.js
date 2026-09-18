# @videojs/react-native-example

Dev app for [`@videojs/react-native`](../../packages/react-native). Generated with
`@react-native-community/cli init` (React Native 0.86.2) and adapted for this
pnpm/Turbo monorepo.

## Prerequisites

Beyond the repo-wide setup in [`CONTRIBUTING.md`](../../CONTRIBUTING.md):

- **iOS** — Xcode, plus CocoaPods via Bundler: `cd apps/react-native && bundle install`
- **Android** — Android SDK with `ANDROID_HOME` set, and JDK 17+
- **Watchman** (optional but recommended): `brew install watchman`

## Running

```bash
# Install iOS pods (first run, and after native dependency changes)
pnpm -F @videojs/react-native-example pods

# Start Metro
pnpm -F @videojs/react-native-example start

# Build and launch (in a second terminal)
pnpm -F @videojs/react-native-example ios
pnpm -F @videojs/react-native-example android
```

`ios` and `android` run Fabric codegen as part of the native build, so changes
to `packages/react-native/src/PlayerViewNativeComponent.ts` require a
native rebuild — Fast Refresh alone won't pick up new props.

## Monorepo wiring

Four files carry the monorepo-specific setup:

| File                      | What it does                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `metro.config.js`         | Watches the repo root and reads workspace globs from `pnpm-workspace.yaml` (`react-native-monorepo-config` defaults to npm/yarn `workspaces`, which pnpm doesn't use). |
| `babel.config.js`         | Compiles the library from source via `react-native-builder-bob/babel-config`.                                    |
| `react-native.config.js`  | Autolinks the library from `packages/react-native` rather than `node_modules`.                                    |
| `tsconfig.json`           | Standalone — the root project-reference graph is DOM-oriented.                                                    |

The `react-native-source` export condition makes JS changes in
`packages/react-native/src` hot-reload without a rebuild. Verify resolution with:

```bash
pnpm -F @videojs/react-native-example bundle:ios
```

### pnpm caveat

`android/settings.gradle` hardcodes `../node_modules/@react-native/gradle-plugin`,
and the React Native Gradle plugin defaults to `../../node_modules/react-native`
and `../../node_modules/@react-native/codegen`. pnpm's isolated layout only links
a package's *direct* dependencies, so `@react-native/gradle-plugin`,
`@react-native/codegen`, and `react-native` are declared explicitly in
`package.json` even though they'd normally come in transitively. Don't remove them.
