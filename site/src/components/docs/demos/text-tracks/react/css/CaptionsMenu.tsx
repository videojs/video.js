import { Menu, useCaptionsOptions } from '@videojs/react';

export default function CaptionsMenu() {
  const captions = useCaptionsOptions();
  if (captions?.state.availability !== 'available') return null;

  return (
    <Menu.Root side="top" align="end">
      <Menu.Trigger render={<button type="button" />}>{captions.label}</Menu.Trigger>
      <Menu.Popup>
        <Menu.Content>
          <Menu.RadioGroup value={captions.value} onValueChange={captions.setValue} aria-label={captions.label}>
            {captions.options.map((option) => (
              <Menu.RadioItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
