import { EmbedHost } from '../../../../media/src/dom/embed';

interface MediaRefProps<Media> {
  mediaRef?: Media;
}

interface ContainerVideoProps extends Partial<typeof EmbedHost.defaultProps>, MediaRefProps<EmbedHost> {}

declare function forwardRef<Ref, Props>(render: (props: Props, ref: Ref) => unknown): unknown;
declare function useSyncProps(target: object, props: object, defaults: object): object;

// An embed whose SDK builds its own iframe inside a container the component renders.
export const ContainerVideo = forwardRef<HTMLDivElement, ContainerVideoProps>(function ContainerVideo(props, ref) {
  useSyncProps({}, props, EmbedHost.defaultProps);
  return { ref };
});
