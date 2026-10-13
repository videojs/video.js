import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from 'cn';

function Slider({
  className,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-valuetext': valueText,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const values = value ?? defaultValue ?? min;
  const count = Array.isArray(values) ? values.length : 1;

  return (
    <SliderPrimitive.Root
      className={cn('data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full', className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-full w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="bg-muted relative grow overflow-hidden rounded-full select-none data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            aria-label={label}
            aria-labelledby={labelledBy}
            aria-valuetext={valueText}
            className="border-primary/30 hover:border-primary/60 focus-visible:border-primary/60 active:border-primary/60 ring-ring/50 relative block size-3.5 shrink-0 rounded-full border bg-white bg-clip-padding transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
