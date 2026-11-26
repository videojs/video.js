// Store features the use cases share. Each one is small, reads one capability
// off the media, and would be a candidate for the core presets.
export { type FrameFeatureState, frameFeature, isMediaFrameCapable, type MediaFrameCapability } from './frame';
export { type LoopFeatureState, loopFeature } from './loop';
export { type SnapshotFeatureState, snapshotFeature } from './snapshot';
