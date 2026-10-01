import { EmbedHost } from '../../../../media/src/dom/embed';

interface MediaRefProps<Media> {
  mediaRef?: Media;
}

interface EmbedVideoProps extends Partial<typeof EmbedHost.defaultProps>, MediaRefProps<EmbedHost> {}

declare function forwardRef<Ref, Props>(render: (props: Props, ref: Ref) => unknown): unknown;
declare function useSyncProps(target: object, props: object, defaults: object): object;

export const EmbedVideo = forwardRef<HTMLIFrameElement, EmbedVideoProps>(function EmbedVideo(props, ref) {
  useSyncProps({}, props, EmbedHost.defaultProps);
  return { ref };
});
