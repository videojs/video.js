# BrowserStack compatibility checks

Run the packaged HTML and React video, neutral video, and audio pages at the Chrome, Edge, Firefox, and Safari minimums resolved from the root browserslist. Desktop Safari coverage uses WebKit. The checks cover CSS fallbacks, closed popovers, playback, seeking, and opening menus. Playback failure is a test failure, including missing H.264 support.

This suite replaces the previous Docker floor job and its pinned Playwright clients. BrowserStack's desktop WebKit is still an engine approximation, not actual Safari. The iOS project runs Safari on a real device selected from BrowserStack's device API. BrowserStack selects iOS by major version, so the browserslist minimum is rounded up to the next whole major: iOS 17 for the current 16.4 minimum. This keeps real-device coverage within the supported range, while desktop WebKit retains the 16.4 minimum check. Selection uses a stable ordering of matching iPhones and fails if no matching device is available; the user-agent assertion verifies the selected major version. The suite does not currently verify captions or fullscreen.

## Enable CI

1. Use the existing repository secrets `BROWSER_STACK_USERNAME` and `BROWSER_STACK_ACCESS_KEY` for an Automate account. The workflow maps them to the `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` environment variables used by BrowserStack.
2. Confirm the pinned combinations are available to that account using [BrowserStack's supported browser matrix](https://www.browserstack.com/docs/automate/playwright/browsers-and-os).
3. Dispatch the BrowserStack workflow. No repository variables are required. Missing credentials fail before dependencies are installed or the app is built.

The workflow runs on pull requests from branches in this repository, nightly at 16:00 UTC, and via manual dispatch. Fork pull requests skip the cloud job because repository secrets are unavailable. It starts and stops a BrowserStack Local tunnel for the generated app. Five workers allow up to five remote sessions per run, leaving capacity within the sponsored account's ten parallel slots. Each test has a three-minute timeout for remote media readiness, seeking, and menu checks; the suite remains capped at 25 minutes. Reports and screenshots are uploaded to Actions; session recordings are available in BrowserStack.

The suite asserts browser versions from their user agents so an unexpected upgrade fails. Chrome and Edge request their resolved minimum versions directly; iOS requests the rounded major version. Bundled Firefox/WebKit still require matching Playwright server releases in the config; if browserslist changes, the version checks fail until those releases are updated. The desktop combinations have passed in CI. Real-device iOS coverage must also pass a credentialed cloud run.

## Run locally

Prepare the packaged pages:

```sh
pnpm exec vp run '@videojs/e2e#prepare:player'
```

To verify the assertions on local Chromium without credentials or a tunnel:

```sh
BROWSERSTACK_LOCAL_TEST=1 pnpm -F @videojs/e2e test:browserstack
```

For a cloud run, export the two credentials, start [BrowserStack Local](https://www.browserstack.com/docs/local-testing/binary-params) with identifier `videojs`, and run:

```sh
pnpm -F @videojs/e2e test:browserstack
```

Use `BROWSERSTACK_LOCAL_IDENTIFIER` if the tunnel has another identifier. The iOS device is discovered automatically using the same credentials; its OS version comes from browserslist.
