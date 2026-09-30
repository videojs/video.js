import { generateSourceMediaInstallCode, getAdapterPackage } from '@videojs/installation';
import type { CSSProperties } from 'react';

import PackageManagerTabs from '@/components/installation/PackageManagerTabs';
import { withSelectionMarker } from '@/components/installation/withSelectionMarker';
import { shared } from '@/components/typography/styles';
import { VJS10_VERSION } from '@/consts';

import { useSelection } from '../installation/useSelection';

function SourceMediaInstall() {
  const renderer = useSelection('media');
  const selectedExtensions = useSelection('extensions');
  const install = generateSourceMediaInstallCode(renderer, VJS10_VERSION, selectedExtensions);
  if (!install) return <span id="install-the-media-adapter" hidden data-conditional-heading-placeholder />;

  const hasAdapter = getAdapterPackage(renderer) !== null;
  const title = hasAdapter
    ? selectedExtensions.length > 0
      ? 'Install the media adapter and extensions'
      : 'Install the media adapter'
    : 'Install the extensions';

  return (
    <section className="mx-auto mt-8 w-full max-w-3xl" aria-labelledby="install-the-media-adapter">
      {/* A step of the guide's manual installation, styled as its other step headings are. */}
      <h3
        id="install-the-media-adapter"
        className="font-display text-h3 my-8 leading-tight @lg:text-(length:--lg-text)"
        // SAFETY: React's style type lists no custom properties, and `--lg-text` is only read by the class above.
        style={{ '--lg-text': '1.25rem' } as CSSProperties}
      >
        {title}
      </h3>
      <p className={`${shared.p} ${shared.prose}`}>
        Install the supporting packages at the version that matches this Video.js release.
      </p>
      <PackageManagerTabs commands={install} />
    </section>
  );
}

export default withSelectionMarker(SourceMediaInstall);
