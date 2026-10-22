import { MuxVideo } from '@videojs/react/media/mux-video';
import { useEffect, useRef, useState } from 'react';

import AnimationControls from '@/components/AnimationControls';

interface Props {
  playbackId: string;
  aspectRatio?: string;
}

export default function AnimationExample({ playbackId, aspectRatio = '16 / 9' }: Props) {
  const poster = `https://image.mux.com/${playbackId}/thumbnail.webp?time=0`;
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(25);
  const rate = speed / 100;

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setMotion(!query.matches);

      if (query.matches) setPlaying(false);
    };

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting));

    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = video.current;
    if (!media) return;

    if (visible && !paused) void media.play().catch(() => setPlaying(false));
    else media.pause();
  }, [motion, visible, paused]);

  useEffect(() => {
    if (video.current) video.current.playbackRate = rate;
  }, [motion, rate]);

  return (
    <div className="animation-example relative">
      <div ref={root} className="relative overflow-hidden rounded-3xl" style={{ aspectRatio }}>
        <div aria-hidden="true">
          <img src={poster} alt="" className="absolute inset-0 h-full w-full" loading="lazy" />
          {motion && (
            <MuxVideo
              ref={video}
              source={{ playbackId }}
              autoPlay={false}
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              poster={poster}
              className="absolute inset-0 h-full w-full"
              onCanPlay={() => {
                if (visible && !paused) void video.current?.play().catch(() => setPlaying(false));
              }}
              onLoadedMetadata={(event) => {
                event.currentTarget.playbackRate = rate;
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          )}
        </div>
      </div>
      <AnimationControls
        playing={playing}
        onToggle={() => {
          // Under reduced motion only the poster renders until the reader starts the animation.
          setMotion(true);
          setPaused(playing);
        }}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
