import type { Skin } from '@videojs/installation';

interface SkinPreviewProps {
  skin: Skin;
  className?: string;
}

/**
 * One-glance glyphs for the skin picker: a frame with a control bar for the default skin, a frame with a single play
 * button for the neutral skin, a plain bar for Compat, dashed controls for Scaffold, and an empty dashed frame for
 * bring-your-own-UI.
 */
export default function SkinPreview({ skin, className }: SkinPreviewProps) {
  const isNeutral = skin === 'neutral-video' || skin === 'neutral-audio';
  const isScaffold = skin === 'scaffold-video' || skin === 'scaffold-audio';
  const isCompat = skin === 'compat-video' || skin === 'compat-audio';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.75"
        y="4.75"
        width="18.5"
        height="14.5"
        rx={isScaffold ? 0 : 3}
        strokeDasharray={skin === 'none' || isScaffold ? '2.5 2.5' : undefined}
      />
      {skin !== 'none' && !isNeutral && !isCompat && !isScaffold && (
        <>
          <path d="M6.5 15.25h3" />
          <path d="M12.5 15.25h5" />
          <path d="M9.75 9.25l3.25 1.9-3.25 1.9z" fill="currentColor" stroke="none" />
        </>
      )}
      {isNeutral && <path d="M10.25 9.25l4 2.75-4 2.75z" fill="currentColor" stroke="none" />}
      {isScaffold && <path d="M7 9h4v4H7zM6.5 16h11" />}
      {isCompat && <path d="M6.5 15.25h11" />}
    </svg>
  );
}
