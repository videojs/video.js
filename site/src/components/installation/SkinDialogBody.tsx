import InstallationPreview from './InstallationPreview';
import SkinPicker from './SkinPicker';

interface Props {
  includeNoSkin: boolean;
}

/** The guide's skin cards and live player preview, loaded when the prompt's skin dialog first opens. */
export default function SkinDialogBody({ includeNoSkin }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <SkinPicker includeNoSkin={includeNoSkin} />
      <InstallationPreview />
    </div>
  );
}
