import { defineComponent } from 'vjsc/components';

/** Skin authoring contract; the runtime sender is supplied by @videojs/fcast. */
export default defineComponent<{
  sender?: unknown;
  src?: string | undefined;
  contentType?: string | undefined;
}>({
  name: 'FCastButton',
});
