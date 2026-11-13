// The GIF library: fetch, decode, lay frames out in time, paint. Nothing here
// knows about Video.js, and nothing here may import from `@videojs/*`.
export { createDecodedGifSource, DecodedGifSource } from './decoded-gif-source';
export { type GifFrameSource, normalizeFrameDelay } from './frame-source';
export { GifDisposal, type GifDisposalMethod, type GifFrame, type ParsedGif, parseGif } from './gif-decoder';
export { createGifSource, GifLoadError, type GifSource, loadGif, type LoadGifOptions } from './gif-source';
export { createImageDecoderSource, isImageDecoderSupported } from './image-decoder-source';
