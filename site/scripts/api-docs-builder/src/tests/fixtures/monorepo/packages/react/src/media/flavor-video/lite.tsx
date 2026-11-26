/** Mock React component over the lite flavor's host. */
import { FlavorLiteHost } from '../../../../media/src/dom/flavor';

interface VideoHTMLAttributes<Element> {
  element?: Element;
}

interface FlavorVideoProps extends VideoHTMLAttributes<HTMLVideoElement>, Partial<typeof FlavorLiteHost.defaultProps> {}

declare function forwardRef<Ref, Props>(render: (props: Props, ref: Ref) => unknown): unknown;
declare function useSyncProps(target: object, props: object, defaults: object): object;

export const FlavorVideo = forwardRef<HTMLVideoElement, FlavorVideoProps>(function FlavorVideo(props, ref) {
  useSyncProps({}, props, FlavorLiteHost.defaultProps);
  return { ref };
});
