import { Label } from '@preview/shell/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@preview/shell/components/ui/select';
import { useId } from 'react';

type Option = { value: string; label: string; disabled?: boolean };

export type SelectFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: readonly Option[];
  optionGroups?: readonly { label: string; options: readonly Option[] }[];
  disabled?: boolean;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  optionGroups,
  disabled = false,
}: SelectFieldProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const items = (values: readonly Option[]) =>
    values.map((option) => (
      <SelectItem key={option.value} value={option.value} disabled={option.disabled ?? false}>
        {option.label}
      </SelectItem>
    ));

  return (
    <>
      <Label htmlFor={triggerId} className="text-muted-foreground shrink-0 font-normal">
        {label}
      </Label>
      <Select
        items={[...options, ...(optionGroups?.flatMap((group) => group.options) ?? [])]}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={triggerId} size="default">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {optionGroups ? (
            optionGroups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {items(group.options)}
              </SelectGroup>
            ))
          ) : (
            <SelectGroup>{items(options)}</SelectGroup>
          )}
        </SelectContent>
      </Select>
    </>
  );
}
