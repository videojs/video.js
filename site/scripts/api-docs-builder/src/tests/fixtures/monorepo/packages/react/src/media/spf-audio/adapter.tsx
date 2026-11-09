/**
 * Mock React audio media component — mirrors react/src/media/hls-audio.
 *
 * Exercises: an audio component whose host defaults include a video-only member (`poster`), which the reference
 * leaves out of the React props.
 */
import { SpfAudioHost } from '../../../../media/src/dom/spf-audio';

interface AudioHTMLAttributes<Element> {
  element?: Element;
}

interface SpfAudioProps extends AudioHTMLAttributes<HTMLAudioElement>, Partial<typeof SpfAudioHost.defaultProps> {}

declare function forwardRef<Ref, Props>(render: (props: Props, ref: Ref) => unknown): unknown;
declare function useSyncProps(target: object, props: object, defaults: object): object;

export const SpfAudio = forwardRef<HTMLAudioElement, SpfAudioProps>(function SpfAudio(props, ref) {
  useSyncProps({}, props, SpfAudioHost.defaultProps);
  return { ref };
});
