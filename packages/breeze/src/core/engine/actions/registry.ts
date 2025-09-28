import { CORE_ACTION_CLASSES } from "@/core/engine/actions/domains/CoreAction";
import { ENCHANTMENT_ACTION_CLASSES } from "@/core/engine/actions/domains/EnchantmentAction";
import { LOOT_TABLE_ACTION_CLASSES } from "@/core/engine/actions/domains/LootTableAction";
import { RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/RecipeAction";
import { STRUCTURE_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureAction";
import { STRUCTURE_SET_ACTION_CLASSES } from "@/core/engine/actions/domains/StructureSetAction";
import type { ActionHandler } from "@/core/engine/actions/types";
import { ActionCodecRegistry, type ActionClass } from "@/core/engine/actions/ActionCodecRegistry";
import { type ActionLike, isEngineAction, type ActionExecutionContext } from "@/core/engine/actions/EngineAction";

const DOMAIN_ACTION_GROUPS: readonly (readonly ActionClass[])[] = [
	CORE_ACTION_CLASSES,
	ENCHANTMENT_ACTION_CLASSES,
	LOOT_TABLE_ACTION_CLASSES,
	RECIPE_ACTION_CLASSES,
	STRUCTURE_ACTION_CLASSES,
	STRUCTURE_SET_ACTION_CLASSES
];

class ClassBasedActionHandler implements ActionHandler<ActionLike> {
	constructor(
		private readonly registry: ActionRegistry,
		private readonly codec: ActionCodecRegistry
	) {}

	async execute(action: ActionLike, element: Record<string, unknown>, version?: number): Promise<Record<string, unknown> | undefined> {
		const instance = isEngineAction(action) ? action : this.codec.decode(action);
		const context: ActionExecutionContext = {
			version,
			invoke: (nextAction, nextElement) => this.registry.execute(nextAction, nextElement, version)
		};

		return instance.execute(element, context);
	}
}

export class ActionRegistry {
	private readonly handlers = new Map<string, ActionHandler>();
	private readonly codec = new ActionCodecRegistry();

	constructor() {
		for (const actionClasses of DOMAIN_ACTION_GROUPS) {
			for (const actionClass of actionClasses) {
				const handler = this.registerClass(actionClass);
				this.handlers.set(actionClass.type, handler);
			}
		}
	}

	registerClass<TActionClass extends ActionClass>(actionClass: TActionClass): ActionHandler {
		this.codec.register(actionClass);
		return new ClassBasedActionHandler(this, this.codec);
	}

	async execute<T extends Record<string, unknown>>(action: ActionLike, element: T, version?: number): Promise<Partial<T> | undefined> {
		const actionType = isEngineAction(action) ? action.type : action.type;
		const handler = this.handlers.get(actionType);

		if (!handler) {
			throw new Error(`Unknown action type: ${actionType}`);
		}

		const normalizedAction = handler instanceof ClassBasedActionHandler ? action : isEngineAction(action) ? action.toJSON() : action;

		return handler.execute(normalizedAction as any, element, version) as Partial<T> | undefined;
	}

	has(type: string): boolean {
		return this.handlers.has(type);
	}
}
