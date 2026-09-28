import { eslintCompatPlugin } from "vite-plus/lint/plugins";

import { noServiceConstructorImportsRule } from "./rules/no-service-constructor-imports.ts";

/** Opt-in Oxlint rules for Effect service and Layer architecture. */
const antiSlopEffectPlugin = eslintCompatPlugin({
	meta: { name: "anti-slop-effect" },
	rules: {
		"no-service-constructor-imports": noServiceConstructorImportsRule,
	},
});

export default antiSlopEffectPlugin;
