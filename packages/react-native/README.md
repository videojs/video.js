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

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
