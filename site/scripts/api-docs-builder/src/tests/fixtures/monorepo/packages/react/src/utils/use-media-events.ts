/**
 * Mock media event prop routing table.
 *
 * Exercises: reading the React event props a media component handles from the
 * `as const` object that `useMediaEvents` routes.
 */
const MEDIA_EVENT_PROPS = {
  onEnded: 'ended',
  onLoadedMetadata: 'loadedmetadata',
  onPause: 'pause',
  onPlay: 'play',
  onWaiting: 'waiting',
} as const;

export type MediaEventPropName = keyof typeof MEDIA_EVENT_PROPS;

export type MediaEventProps<Target extends EventTarget = EventTarget> = {
  [Prop in MediaEventPropName]?: ((event: Event & { readonly currentTarget: Target }) => void) | undefined;
};
