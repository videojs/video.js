import { defineRule } from "vite-plus/lint/plugins";

import type { ESTree } from "vite-plus/lint/plugins";

/** Core methods that store render inputs on the instance. */
const MUTATORS = new Set([
	"setProps",
	"setMedia",
	"setInput",
	"setFormatLocale",
	"setImageLoadState",
	"setDocumentModal",
	"setTitleId",
	"setDescriptionId",
]);

/** `getState()` and variants such as `getSliderState()`. */
const READER = /^get\w*State$/u;

type FunctionNode = ESTree.FunctionDeclaration | ESTree.FunctionExpression | ESTree.ArrowFunctionExpression;

interface Usage {
	mutations: Map<string, ESTree.CallExpression[]>;
	readers: Set<string>;
}

function isNode(value: unknown): value is ESTree.Node {
	return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function isFunction(node: ESTree.Node): node is FunctionNode {
	return (
		node.type === "FunctionDeclaration" ||
		node.type === "FunctionExpression" ||
		node.type === "ArrowFunctionExpression"
	);
}

function* children(node: ESTree.Node): Generator<ESTree.Node> {
	for (const key of Object.keys(node)) {
		if (key === "parent" || key === "loc" || key === "range") continue;

		const value = (node as unknown as Record<string, unknown>)[key];

		if (Array.isArray(value)) {
			for (const item of value) if (isNode(item)) yield item;
		} else if (isNode(value)) {
			yield value;
		}
	}
}

/** `receiver.method(...)` with a plain identifier receiver, or null for anything else. */
function memberCall(node: ESTree.CallExpression): { receiver: string; method: string } | null {
	const { callee } = node;
	if (callee.type !== "MemberExpression" || callee.computed) return null;

	if (callee.property.type !== "Identifier" || callee.object.type !== "Identifier") return null;

	return { receiver: callee.object.name, method: callee.property.name };
}

function collect(node: ESTree.Node, usage: Usage): void {
	if (node.type === "CallExpression") {
		const call = memberCall(node);

		if (call && MUTATORS.has(call.method)) {
			const calls = usage.mutations.get(call.receiver) ?? [];

			calls.push(node);
			usage.mutations.set(call.receiver, calls);
		} else if (call && READER.test(call.method)) {
			usage.readers.add(call.receiver);
		}
	}

	for (const child of children(node)) collect(child, usage);
}

/**
 * Keep a core's mutation and its `getState()` read inside one component or hook.
 *
 * React Compiler treats `core.setMedia(volume)` as an opaque mutation of a stable object and groups it with the
 * `getState()` read in the same function, so every input becomes a dependency. Split across components, the reading
 * side only depends on `core` and memoises stale state. A mutation counts as split when the function never reads the
 * core itself while another function in the same file reads a core of that name. Cores consumed only through other
 * methods or subscriptions are fine. Custom elements set in `willUpdate` and read in `update`, so class bodies are
 * left alone.
 */
export const noOrphanCoreMutationRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description:
				"Require a function that mutates a core with set* methods to read that core's getState() in the same function when another component reads it.",
		},
		messages: {
			orphanMutation:
				"`{{receiver}}.{{method}}()` mutates a core that another component reads with `getState()`. Mutate and read a core in the same component or hook so React Compiler sees every input; read elsewhere, the state memoises stale.",
		},
	},
	create(context) {
		const usages: Usage[] = [];

		function visit(node: ESTree.Node): void {
			if (node.type === "ClassDeclaration" || node.type === "ClassExpression") return;

			if (isFunction(node)) {
				const usage: Usage = { mutations: new Map(), readers: new Set() };

				collect(node.body, usage);
				usages.push(usage);
				return;
			}

			for (const child of children(node)) visit(child);
		}

		return {
			Program(node) {
				visit(node);

				const readAnywhere = new Set(usages.flatMap((usage) => [...usage.readers]));

				for (const usage of usages) {
					for (const [receiver, calls] of usage.mutations) {
						if (usage.readers.has(receiver)) continue;

						if (!readAnywhere.has(receiver)) continue;

						for (const call of calls) {
							const method = memberCall(call)?.method ?? "";

							context.report({ node: call, messageId: "orphanMutation", data: { receiver, method } });
						}
					}
				}
			},
		};
	},
});
