# Security Policy

## Supported versions

| Version | Where                                                   | Status              | Support ends    |
| ------- | ------------------------------------------------------- | ------------------- | --------------- |
| 8.x     | This repository (`main`)                                | Security fixes      | October 1, 2028 |
| 10.x    | [videojs/video.js](https://github.com/videojs/video.js) | Active development  | —               |
| ≤ 7.x   | —                                                       | Unsupported         | Ended           |

Video.js 8 is maintained, not developed. It receives security fixes and a best effort on bug fixes only — no new features — until October 1, 2028. Fixes are published as `video.js@8` patch releases:

```sh
npm install video.js@8
```

When you're ready to move, the migration guide maps Video.js 8 onto Video.js 10 for [HTML](https://videojs.org/docs/framework/html/guides/migrate-from-video-js-8) and [React](https://videojs.org/docs/framework/react/guides/migrate-from-video-js-8).

### What qualifies for a v8 release

- A vulnerability in Video.js 8 or a dependency it ships, such as XSS, unsafe URL handling, or a supply-chain issue.
- A browser change that breaks basic playback in a supported browser.

## Reporting a vulnerability

Do not open a public issue or discussion for a vulnerability.

Report it privately through [GitHub private vulnerability reporting](https://github.com/videojs/videojs-v8/security/advisories/new). Include the version, a minimal reproduction, and the impact you observed. For Video.js 10, report in [videojs/video.js](https://github.com/videojs/video.js/security/advisories/new) instead.

We acknowledge reports within 5 business days and aim to publish a fix or mitigation within 90 days of confirmation.

We credit reporters in the published advisory unless you ask us not to.
