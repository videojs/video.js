import { useMediaAttach } from '@videojs/react';
import { useEffect, useRef } from 'react';

import type { ChartMedia } from './chart-media';

export interface ChartMediaViewProps {
  media: ChartMedia;
  className?: string;
}

/** Plugs a `ChartMedia` into the surrounding player and gives it a canvas that fills this element's box. */
export function ChartMediaView({ media, className }: ChartMediaViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setMedia = useMediaAttach();

  useEffect(() => {
    setMedia?.(media);

    // Another media may have taken over by the time this one unmounts.
    return () => setMedia?.((current) => (current === media ? null : current));
  }, [media, setMedia]);

  useEffect(() => {
    const canvas = canvasRef.current!;

    // Size the drawing buffer in device pixels so the highway stays crisp.
    const observer = new ResizeObserver(() => {
      canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
      canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);
    });

    observer.observe(canvas);
    media.attachCanvas(canvas);

    return () => {
      observer.disconnect();
      media.attachCanvas(null);
    };
  }, [media]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
