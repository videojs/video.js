/**
 * Mock React media component.
 *
 * Exercises the source conventions used by real media components:
 * native React video props, a forwarded native-element ref, and the host's
 * `static defaultProps` passed to useSyncProps for Video.js-specific props.
 */
import { ComplexHost } from '../../../../media/src/dom/complex';

interface VideoHTMLAttributes<Element> {
  element?: Element;
}

interface MediaRefProps<Media> {
  mediaRef?: Media;
}

interface ComplexVideoProps
  extends VideoHTMLAttributes<HTMLVideoElement>, Partial<typeof ComplexHost.defaultProps>, MediaRefProps<HTMLVideoElement> {}

declare function forwardRef<Ref, Props>(render: (props: Props, ref: Ref) => unknown): unknown;
declare function useSyncProps(target: object, props: object, defaults: object): object;

export const ComplexVideo = forwardRef<HTMLVideoElement, ComplexVideoProps>(function ComplexVideo(props, ref) {
  useSyncProps({}, props, ComplexHost.defaultProps);
  return { ref };
});
