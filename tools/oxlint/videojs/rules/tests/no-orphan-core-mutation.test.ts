import { RuleTester } from "vite-plus/lint/plugins-dev";
import { describe, it } from "vite-plus/test";

import { noOrphanCoreMutationRule } from "../no-orphan-core-mutation.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: "ts" } },
});

ruleTester.run("no-orphan-core-mutation", noOrphanCoreMutationRule, {
	valid: [
		{
			name: "mutation and read in the same component",
			code: `function PlayButton(props: Props) {
  const media = usePlayer(selectPlayback);
  const [core] = useState(() => new PlayButtonCore(props));
  core.setProps(props);
  core.setMedia(media);
  const state = core.getState();
  return renderElement('button', { state });
}`,
		},
		{
			name: "read happens in a callback owned by the same component",
			code: `function SliderRoot(props: Props) {
  const [core] = useState(() => new SliderCore());
  core.setProps(props);
  const { state } = useSlider({
    computeState: (input) => {
      core.setInput(input);
      return core.getState();
    },
  });
  return state;
}`,
		},
		{
			name: "custom elements set in willUpdate and read in update",
			code: `class VolumeSliderElement extends UIElement {
  #core = new VolumeSliderCore();
  willUpdate(changed: PropertyValues) {
    this.#core.setProps(this);
  }
  update(changed: PropertyValues) {
    const state = this.#core.getState();
    apply(this, state);
  }
}`,
		},
		{
			name: "no core mutation at all",
			code: `function Title() {
  const [core] = useState(() => new TitleCore());
  return core.getState();
}`,
		},
		{
			name: "a core consumed through its own subscription instead of getState",
			code: `function StatusAnnouncer(props: Props) {
  const [core] = useState(() => new StatusAnnouncerCore());
  core.setProps({ closeDelay: props.closeDelay });
  const state = useSyncExternalStore(
    (callback) => core.state.subscribe(callback),
    () => core.state.current,
    () => core.state.current
  );
  return state.message;
}`,
		},
		{
			name: "a core read through a variant state getter",
			code: `function SliderRoot(props: Props) {
  const [core] = useState(() => new SliderCore());
  core.setProps(props);
  const { state } = useSlider({
    computeState: (input) => {
      core.setInput(input);
      return core.getSliderState(props.value);
    },
  });
  return state;
}`,
		},
		{
			name: "a behaviour core whose props feed methods, never state",
			code: `function TooltipProvider({ delay, children }: Props) {
  const [group] = useState(() => new TooltipGroupCore());
  group.setProps({ delay });
  return createElement(TooltipGroupContext.Provider, { value: group }, children);
}`,
		},
		{
			name: "a second core consumed by its methods while the first is read",
			code: `function Root(props: Props) {
  const [core] = useState(() => new PopoverCore(props));
  const [tooltip] = useState(() => new TooltipCore(props));
  core.setProps(props);
  tooltip.setInput(props.input);
  return [core.getState(), tooltip.getTriggerAttrs()];
}`,
		},
		{
			name: "two cores, each read where it is mutated",
			code: `function Root(props: Props) {
  const [core] = useState(() => new PopoverCore(props));
  const [tooltip] = useState(() => new TooltipCore(props));
  core.setProps(props);
  tooltip.setProps(props);
  return [core.getState(), tooltip.getState()];
}`,
		},
	],
	invalid: [
		{
			name: "one component mutates, another reads through a shared core",
			code: `function VolumePopoverRoot({ children, ...props }: Props) {
  const volume = usePlayer(selectVolume);
  const [core] = useState(() => new VolumePopoverCore(props));
  core.setProps(props);
  core.setMedia(volume ?? unavailableVolume);
  return createElement(VolumePopoverState, { core }, children);
}

function VolumePopoverState({ core, children }: StateProps) {
  const state = core.getState();
  return createElement(Provider, { value: { state } }, children);
}`,
			errors: [{ messageId: "orphanMutation" }, { messageId: "orphanMutation" }],
		},
		{
			name: "a hook mutates a core that a component in the same file reads",
			code: `function useControlsCore(controls: ControlsState | undefined) {
  const [core] = useState(() => new ControlsCore());
  core.setMedia(controls ?? null);
  return core;
}

function ControlsRoot(props: Props) {
  const controls = usePlayer(selectControls);
  const core = useControlsCore(controls);
  const state = core.getState();
  return createElement(Provider, { value: { state } }, props.children);
}`,
			errors: [{ messageId: "orphanMutation" }],
		},
	],
});
