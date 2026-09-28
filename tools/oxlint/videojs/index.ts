import { eslintCompatPlugin } from "vite-plus/lint/plugins";

import { noOrphanCoreMutationRule } from "./rules/no-orphan-core-mutation.ts";

/** Oxlint rules that encode Video.js architecture contracts, as opposed to the generic anti-slop set. */
const videojsPlugin = eslintCompatPlugin({
	meta: { name: "videojs" },
	rules: {
		"no-orphan-core-mutation": noOrphanCoreMutationRule,
	},
});

export default videojsPlugin;
