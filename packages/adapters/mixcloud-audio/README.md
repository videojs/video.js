# @videojs/mixcloud-audio

[Mixcloud Widget](https://www.mixcloud.com/developers/widget/) playback adapter for Video.js. It plays Mixcloud shows
and exposes the adapter, its props, and defaults; the HTML and React façades live in `@videojs/html` and
`@videojs/react`.

```bash
pnpm add @videojs/html @videojs/mixcloud-audio
# or
pnpm add @videojs/react @videojs/mixcloud-audio
```

## Usage

```ts
import '@videojs/html/media/mixcloud-audio';
```

```html
<mixcloud-audio src="https://www.mixcloud.com/spartacus/lambiance/"></mixcloud-audio>
```

The Mixcloud widget is subject to Mixcloud's own terms. Before you use this package, read the
[Mixcloud Terms of Use](https://www.mixcloud.com/terms/) and the [Widget documentation](https://www.mixcloud.com/developers/widget/)
to learn where and how you can use the widget.

## License

[Apache-2.0](../../../LICENSE)
