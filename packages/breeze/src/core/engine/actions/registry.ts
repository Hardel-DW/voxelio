import { CORE_ACTION_CLASSES } from "@/core/engine/actions/domains/CoreAction";
import { ENCHANTMENT_ACTION_CLASSES } from "@/core/engine/actions/domains/EnchantmentAction";
import { LOOT_TABLE_ACTION_CLASSES } from "@/core/engine/actions/domains/LootTableAction";
import { RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/RecipeAction";
import { STRUCTURE_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureAction";
import { STRUCTURE_SET_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureSetAction";
import { type Action, isAction } from "@/core/engine/actions/Action";
import type { IdentifierObject } from "@/core/Identifier";

export const ALL_ACTION_CLASSES = [
	...CORE_ACTION_CLASSES,
	...ENCHANTMENT_ACTION_CLASSES,
	...LOOT_TABLE_ACTION_CLASSES,
	...RECIPE_ACTION_CLASSES,
	...STRUCTURE_ACTION_CLASSES,
	...STRUCTURE_SET_ACTION_CLASSES
] as const;

type ExtractActionType<T> = T extends new (...args: any[]) => infer R ? (R extends Action<any> ? R : never) : never;

type ExtractParams<T> = T extends Action<infer P> ? P : never;

type ActionInstances = ExtractActionType<(typeof ALL_ACTION_CLASSES)[number]>;

export type ActionLike =
	| Action
	| {
		[K in ActionInstances as K["type"]]: ExtractParams<K> & {
			type: K["type"];
		};
	}[ActionInstances["type"]];

export type ActionValue = string | number | boolean | IdentifierObject | unknown;

const ACTION_REGISTRY = new Map<string, new (params: any) => Action>(
	ALL_ACTION_CLASSES.map((ActionClass) => {
		const instance = new ActionClass({} as any);
		return [instance.type, ActionClass];
	})
);

/**
 * Utility function to create an action like object
 * Help TS to know the type of the action
 */
export function action<T extends ActionInstances["type"]>(
	type: T,
	params: ExtractParams<Extract<ActionInstances, { type: T }>>
): Extract<ActionLike, { type: T }> {
	return { type, ...params } as Extract<ActionLike, { type: T }>;
}

/**
 * Execute an action on an element
 */
export function executeAction(
	actionLike: ActionLike,
	element: Record<string, unknown>,
	version?: number
): Record<string, unknown> | undefined {
	if (isAction(actionLike)) {
		return actionLike.apply(element, version);
	}

	const { type, ...params } = actionLike;
	const ActionClass = ACTION_REGISTRY.get(type);
	if (!ActionClass) {
		throw new Error(`Unknown action type: ${type}`);
	}

	const action = new ActionClass(params);
	return action.apply(element, version);
}
