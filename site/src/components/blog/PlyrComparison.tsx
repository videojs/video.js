import plyr1 from '@/assets/blog/2026-10-08-videojs-v10-skin-design/plyr-v1.webp';
import plyr2 from '@/assets/blog/2026-10-08-videojs-v10-skin-design/plyr-v2.webp';
import plyr3 from '@/assets/blog/2026-10-08-videojs-v10-skin-design/plyr-v3.webp';
import Comparison from '@/components/Comparison/Comparison';

const images = [
  {
    image: plyr1,
    alt: 'White controls bar below the video and separate restart, rewind, play, and fast-forward buttons.',
  },
  {
    image: plyr2,
    alt: 'Controls over a surfer riding a wave, with a blue progress slider and a blue central play button outlined in white.',
  },
  {
    image: plyr3,
    alt: 'Controls over island scenery, with a blue central play button, captions, and a thumbnail preview above the seek slider.',
  },
];

export default function PlyrComparison() {
  return (
    <Comparison
      label="Plyr skin design evolution"
      className="mx-auto max-w-3xl"
      aspectRatio="960 / 588"
      interactive={false}
      items={images.map(({ image, alt }, index) => ({
        label: `Plyr v${index + 1}`,
        content: (
          <div
            style={
              index === 2
                ? {
                    position: 'absolute',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    top: 0,
                    overflow: 'hidden',
                  }
                : { width: '100%', height: '100%' }
            }
          >
            <img
              src={image.src}
              width={image.width}
              height={image.height}
              alt={alt}
              loading="lazy"
              style={
                index === 2
                  ? {
                      // Crop the transparent padding around the 1600 × 900 player in the 1660 × 1017 image.
                      position: 'absolute',
                      width: `${(1660 / 1600) * 100}%`,
                      maxWidth: 'none',
                      height: `${(1017 / 900) * 100}%`,
                      left: `${(-30 / 1600) * 100}%`,
                      top: `${(-30 / 900) * 100}%`,
                    }
                  : { width: '100%', height: '100%' }
              }
            />
          </div>
        ),
      }))}
    />
  );
}
