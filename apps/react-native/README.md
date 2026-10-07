# @videojs/react-native-example

Dev app for [`@videojs/react-native`](../../packages/react-native). Generated with
`@react-native-community/cli init` (React Native 0.86.2) and adapted for this
pnpm/Turbo monorepo.

## Prerequisites

Beyond the repo-wide setup in [`CONTRIBUTING.md`](../../CONTRIBUTING.md), this
app needs native toolchains that [mise](https://mise.jdx.dev) provisions from the
`mise.toml` in this directory. mise is optional for the web packages and required
here: the `Gemfile` needs Ruby 4 and `android/` needs JDK 17, and macOS ships
neither.

```bash
brew install mise                 # once; add `eval "$(mise activate zsh)"` to your shell rc
cd apps/react-native && mise trust && mise install   # Ruby 4, CocoaPods 1.17, Temurin JDK 17
```

- **Node** — the version in `.nvmrc`, via `nvm install` or mise. `pnpm install`
  runs this app's `postinstall` (`scripts/hoist-gradle-plugin.mjs`); on Node
  24.0.x it throws `EISDIR`, and a failed postinstall fails every `pnpm`
  command in the workspace, not just this app's.
- **iOS** — Xcode with the simulator runtime for its SDK installed
  (`xcodebuild -downloadPlatform iOS`; recent Xcode releases don't bundle it).
  Then `bundle install` in this directory, under mise's Ruby: the system Ruby
  can't satisfy the `Gemfile`.
- **Android** — the Android SDK, with these in your shell rc:

  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  ```

  `sdk.dir` in `android/local.properties` covers Gradle alone; the React Native
  CLI still needs `ANDROID_HOME` for `adb` and the emulator. With the SDK
  licenses accepted, the first build downloads the pinned platform, build-tools,
  NDK, and CMake itself; expect 10–20 minutes.
- **Watchman** (optional but recommended): `brew install watchman`

## Running

```bash
# Install iOS pods: first run, after native dependency changes, and after any
# pnpm-lock.yaml change (see below)
pnpm -F @videojs/react-native-example pods

# Start Metro
pnpm -F @videojs/react-native-example start

# Build and launch (in a second terminal). Name a current simulator: the CLI's
# default is the oldest available device, which the current Xcode may not build
# for. `xcrun simctl list devices available` prints the names.
pnpm -F @videojs/react-native-example ios --simulator "<device name>"   # e.g. "iPhone 18 Pro"
pnpm -F @videojs/react-native-example android   # with an emulator booted or a device attached
```

**Re-run `pods` after any `pnpm-lock.yaml` change.** `project.pbxproj` and the
Pods project hard-code `REACT_NATIVE_PATH` into pnpm's store, and that directory
name includes a hash of `react-native`'s peer set. When the lockfile changes the
path goes stale, `react-native run-ios` skips `pod install` because
`Podfile.lock` is unchanged, and `xcodebuild` fails with
`…/ReactCommon/react/timing/PrivacyInfo.xcprivacy: No such file or directory`.
`pod install` rewrites the path; commit the resulting `project.pbxproj` diff
alongside the lockfile.

`ios` and `android` run Fabric codegen as part of the native build, so changes
to `packages/react-native/src/PlayerViewNativeComponent.ts` require a
native rebuild — Fast Refresh alone won't pick up new props.

### Smoke test

Three checks cover the integration points: the app loads with no red screen
(two `react-native` copies surface here as `ReferenceError: Property 'window'
doesn't exist`; see below); **Play** toggles to Pause and back repeatedly;
**Swap src** changes the label and the video without the surface going black.

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

### One `react-native` instance

`packages/react-native` declares `@react-native-community/cli` and
`@react-native/metro-config` as devDependencies purely so its `react-native`
resolves to the same pnpm instance this app uses. pnpm keys an instance by its
peer closure, and those two packages propagate into `react-native`'s — so
without them the library gets a second copy.

Two copies break the app in a way that gives no useful error. Metro resolves
`getModulesRunBeforeMainModule` (i.e. `InitializeCore`) against this app's copy;
if the graph was built from the library's copy, that module isn't in it and gets
dropped silently. The bundle then ends with only `__r(0)` instead of
`__r(<InitializeCore>); __r(0)`, so RN's globals never get set up and the first
dev-only module to touch `window` throws `ReferenceError: Property 'window'
doesn't exist`.

To check for a regression:

```bash
ls -d node_modules/.pnpm/react-native@* # expect one peer-resolved entry
curl -s 'http://localhost:8081/index.bundle?platform=android&dev=true' | grep -o '^__r([0-9]*);'
```
