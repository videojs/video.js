import { BackgroundVideo } from '@videojs/react/media/background-video';
import { useEffect, useRef, useState } from 'react';

export default function BasicUsage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setMotionEnabled(!preference.matches);

    syncPreference();
    preference.addEventListener('change', syncPreference);

    return () => preference.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    if (motionEnabled) {
      video.play().catch(() => {
        if (!cancelled) setMotionEnabled(false);
      });
    } else {
      video.pause();
    }

    return () => {
      cancelled = true;
    };
  }, [motionEnabled]);

  return (
    <section className="add-background-video-react-demo" data-motion-enabled={motionEnabled ? '' : undefined}>
      <div className="add-background-video-react-demo__visual" aria-hidden="true">
        <img className="add-background-video-react-demo__poster" src="{{VJS10_DEMO_BACKGROUND_VIDEO_POSTER}}" alt="" />
        <BackgroundVideo
          ref={videoRef}
          className="add-background-video-react-demo__media"
          src="{{VJS10_DEMO_BACKGROUND_VIDEO_MP4}}"
          autoPlay={false}
        />
      </div>
      <div className="add-background-video-react-demo__content">
        <h3>Build the next great video experience</h3>
        <a href="#common-variations">Compare source options</a>
        <button
          type="button"
          className="add-background-video-react-demo__motion-toggle"
          onClick={() => setMotionEnabled((enabled) => !enabled)}
        >
          {motionEnabled ? 'Hide background motion' : 'Show background motion'}
        </button>
      </div>
    </section>
  );
}
