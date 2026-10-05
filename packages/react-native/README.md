# react-native

video.js for react-native

## Installation

```sh
npm install @videojs/react-native
```

Requires React Native 0.76 or later with the New Architecture enabled (the default since 0.76): the player view is a
Fabric component and the engine is a TurboModule, both generated from `codegenConfig`. React 18 and 19 are supported.


## Usage


```tsx
import { Player } from "@videojs/react-native";

// ...

<Player source="https://stream.mux.com/{PLAYBACK_ID}.m3u8" style={{ width: 320, height: 180 }} />
```


## Contributing

Repository setup and workflow are in the monorepo's
[`CONTRIBUTING.md`](https://github.com/videojs/v10/blob/main/CONTRIBUTING.md). The native toolchain
this package needs, and the example app that exercises it, are documented in
[`apps/react-native/README.md`](https://github.com/videojs/v10/blob/main/apps/react-native/README.md).

## License

MIT
