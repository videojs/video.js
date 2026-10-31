# @videojs/google-analytics

Google Analytics 4 (GA4) telemetry integration for Video.js. It monitors media playback and user interactions, automatically dispatching standard GA4 Enhanced Measurement video events and Video.js interaction events to `window.dataLayer` (or `window.gtag`).
It is an extension: it adds behavior to whichever media the player is playing.

```bash
pnpm add @videojs/html @videojs/google-analytics
# or
pnpm add @videojs/react @videojs/google-analytics
```

## Usage

```ts
import '@videojs/html/extensions/google-analytics';
```

```tsx
import { GoogleAnalytics } from '@videojs/react/extensions/google-analytics';
```

## License

[Apache-2.0](../../../LICENSE)
