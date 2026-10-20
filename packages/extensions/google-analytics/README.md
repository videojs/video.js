# @videojs/google-analytics

Google Analytics 4 (GA4) telemetry integration for Video.js. It monitors media playback and user interactions, automatically dispatching standard GA4 Enhanced Measurement video events and Video.js interaction events to `window.dataLayer` (or `window.gtag`).
It is an extension: it adds behavior to whichever media the player is playing.

```bash
pnpm add @videojs/html @videojs/google-analytics
# or
pnpm add @videojs/react @videojs/google-analytics
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print installation instructions that include Google Analytics:

```sh
npx @videojs/cli agents init --framework react --media default --extensions google-analytics
npx @videojs/cli agents init --framework html --media default --extensions google-analytics
```

## Usage

### React

```tsx
import { GoogleAnalytics } from '@videojs/react/extensions/google-analytics';

<Player>
  <Video src="https://example.com/video.mp4" />
  <GoogleAnalytics videoTitle="My Video" streamType="vod" debug />
</Player>;
```

### HTML

```html
<video-player>
  <video src="https://example.com/video.mp4"></video>
  <google-analytics video-title="My Video" stream-type="vod" debug></google-analytics>
</video-player>

<script type="module">
  import '@videojs/html/video/player';
  import '@videojs/html/extensions/google-analytics';
</script>
```

### Vanilla / Standalone

```ts
import { GoogleAnalyticsExtension } from '@videojs/google-analytics';

const ga = new GoogleAnalyticsExtension({
  videoTitle: 'My Video',
  streamType: 'vod',
  debug: true,
});

player.use(ga);
```

### CDN Script

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn/extensions/google-analytics.js"></script>

<video-player>
  <video src="https://example.com/video.mp4"></video>
  <google-analytics video-title="My Video" stream-type="vod" debug></google-analytics>
</video-player>
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `dataLayerName` | `string` | `'dataLayer'` | Name of the dataLayer array on `window`. |
| `videoTitle` | `string` | `undefined` | Explicit title for the video. Falls back to media element title or current URL if omitted. |
| `videoProvider` | `string` | `'video.js'` | Video provider name reported in parameters. |
| `streamType` | `'live' \| 'vod'` | `'vod'` | Stream type reported in parameters (`'live'` or `'vod'`). |
| `trackProgress` | `boolean` | `true` | Whether to track 10%, 25%, 50%, and 75% progress milestones. |
| `debug` | `boolean` | `false` | Whether to log telemetry events to the browser console. |
| `customParams` | `Record<string, string \| number \| boolean>` | `undefined` | Custom extra parameters to include with every dispatched event. |
| `onEvent` | `(event: GoogleAnalyticsEventName, params: GoogleAnalyticsEventParams) => void` | `undefined` | Optional callback to intercept dispatched events. |

In HTML, attributes map to configuration options in kebab-case: `data-layer-name`, `video-title`, `video-provider`, `stream-type`, `track-progress`, and boolean `debug`. Non-primitive options (`customParams`, `onEvent`) are set as properties on the custom element.

## Dispatched Events

Events are dispatched to `window.dataLayer` (as `{ event, ...params }`) and forwarded to `window.gtag('event', event, params)` when available.

### GA4 Enhanced Measurement Video Events

- `video_start`: Dispatched when video playback starts for the first time or playback begins at `currentTime > 0`.
- `video_progress`: Dispatched as playback reaches the 10%, 25%, 50%, and 75% duration milestones (when `trackProgress` is `true`).
- `video_complete`: Dispatched when the video reaches the end (`ended` event).

### Video.js Interaction Events

- `play`: Dispatched on the initial play event.
- `pause`: Dispatched when playback is paused (excluding seek pauses and video completion).
- `resume`: Dispatched when playback resumes after being paused.
- `end`: Dispatched when playback reaches the end.
- `seek`: Dispatched after seeking completes (`seeked` event).
- `mute`: Dispatched when the player is muted or volume is set to 0.
- `unmute`: Dispatched when unmuted with non-zero volume.
- `fullscreenEnter`: Dispatched when the player enters fullscreen mode.
- `fullscreenExit`: Dispatched when the player exits fullscreen mode.

## Event Parameters

Every dispatched event includes standard GA4 Enhanced Measurement video parameters along with any configured `customParams`:

| Parameter | Type | Description |
|---|---|---|
| `video_current_time` | `number` | Current playback time rounded to whole seconds. |
| `video_duration` | `number` | Total duration of the media rounded to whole seconds (or `0` if unknown). |
| `video_percent` | `number` | Playback percentage (`0` to `100`). For milestone progress, this is the milestone value (10, 25, 50, 75). |
| `video_provider` | `string` | Video provider name (`'video.js'` by default). |
| `video_stream_type` | `'live' \| 'vod'` | Stream type (`'vod'` or `'live'`). |
| `video_title` | `string` | Video title, resolved from `videoTitle`, media element `title`, or URL. |
| `video_url` | `string` | URL of the media source being played. |
| `visible` | `boolean` | Whether the browser document is currently visible (`!document.hidden`). |
| `...customParams` | `string \| number \| boolean` | Any custom parameters passed via `customParams`. |

## License

[Apache-2.0](../../../LICENSE)
