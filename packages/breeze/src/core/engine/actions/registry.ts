import { CORE_ACTION_CLASSES } from "@/core/engine/actions/domains/CoreAction";
import { ENCHANTMENT_ACTION_CLASSES } from "@/core/engine/actions/domains/EnchantmentAction";
import { LOOT_TABLE_ACTION_CLASSES } from "@/core/engine/actions/domains/LootTableAction";
import { RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/RecipeAction";
import { STRUCTURE_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureAction";
import { STRUCTURE_SET_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureSetAction";
import { type Action, isAction } from "@/core/engine/actions/EngineAction";
import type { ActionLike } from "@/core/engine/actions/index";

// Liste de toutes les classes d'actions disponibles
const ALL_ACTION_CLASSES = [
	...CORE_ACTION_CLASSES,
	...ENCHANTMENT_ACTION_CLASSES,
	...LOOT_TABLE_ACTION_CLASSES,
	...RECIPE_ACTION_CLASSES,
	...STRUCTURE_ACTION_CLASSES,
	...STRUCTURE_SET_ACTION_CLASSES,
] as const;

// Registry simplifié - génération automatique du Map type -> Constructor
const ACTION_REGISTRY = new Map<string, new (params: any) => Action>(
	ALL_ACTION_CLASSES.map(ActionClass => {
		const instance = new ActionClass({} as any); // Juste pour récupérer le type
		return [instance.type, ActionClass];
	})
);

/**
 * Execution universelle des actions
 */
export function executeAction(
	actionLike: ActionLike,
	element: Record<string, unknown>,
	version?: number
): Record<string, unknown> | undefined {
	if (isAction(actionLike)) {
		return actionLike.apply(element, version);
	}

	// Reconstruction depuis JSON pour replay logs
	const { type, ...params } = actionLike;
	const ActionClass = ACTION_REGISTRY.get(type);
	if (!ActionClass) {
		throw new Error(`Unknown action type: ${type}`);
	}

	const action = new ActionClass(params);
	return action.apply(element, version);
}

/**
 * Registry class pour compatibilité (à supprimer progressivement)
 */
export class ActionRegistry {
	execute<T extends Record<string, unknown>>(action: ActionLike, element: T, version?: number): Partial<T> | undefined {
		return executeAction(action, element, version) as Partial<T> | undefined;
	}

	has(type: string): boolean {
		return ACTION_REGISTRY.has(type);
	}
}
