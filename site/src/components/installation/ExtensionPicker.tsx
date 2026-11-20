import {
  getInstallationExtension,
  installationExtensionsFor,
  INSTALLATION_EXTENSIONS,
  type InstallationExtension,
} from '@videojs/installation';
import type { ReactNode } from 'react';

import Cast from '@/assets/icons/cast.svg?react';
import Graph from '@/assets/icons/graph.svg?react';
import MuxLogo from '@/assets/logos/mux-small.svg?react';
import CardCheckboxGroup from '@/components/CardCheckboxGroup';
import { extensions } from '@/stores/installation';

import { useSelection } from './useSelection';
import { withSelectionMarker } from './withSelectionMarker';

const EXTENSION_MEDIA = {
  'google-analytics': <Graph className="size-6" />,
  'google-cast': <Cast className="size-6" />,
  'mux-data': <MuxLogo className="w-7" />,
} satisfies Record<InstallationExtension, ReactNode>;

const EXTENSION_OPTIONS = INSTALLATION_EXTENSIONS.map((extension) => {
  const definition = getInstallationExtension(extension);

  return {
    value: extension,
    label: definition.label,
    description: definition.description,
    media: EXTENSION_MEDIA[extension],
  };
});

function ExtensionPicker() {
  const selected = useSelection('extensions');
  const useCase = useSelection('useCase');
  const skin = useSelection('skin');
  const renderer = useSelection('media');
  const available = installationExtensionsFor(useCase, skin, renderer);

  if (available.length === 0) {
    return <p className="text-muted text-p3">No optional extensions apply to these selections.</p>;
  }

  return (
    <CardCheckboxGroup
      value={selected}
      onChange={(values) =>
        extensions.set(
          INSTALLATION_EXTENSIONS.filter((extension) => values.includes(extension) && available.includes(extension))
        )
      }
      options={EXTENSION_OPTIONS.filter((option) => available.includes(option.value))}
      aria-label="Select extensions"
    />
  );
}

export default withSelectionMarker(ExtensionPicker);
