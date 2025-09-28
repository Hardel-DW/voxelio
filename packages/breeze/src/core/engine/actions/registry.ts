import registerCore from "@/core/engine/actions/domains/core";
import registerEnchantment from "@/core/engine/actions/domains/enchantment";
import registerLootTable from "@/core/engine/actions/domains/loot_table";
import registerRecipe from "@/core/engine/actions/domains/recipe";
import registerStructure from "@/core/engine/actions/domains/structure";
import registerStructureSet from "@/core/engine/actions/domains/structure_set";
import type { ActionHandler } from "@/core/engine/actions/types";
import { ActionCodecRegistry, type ActionClass } from "@/core/engine/actions/ActionCodecRegistry";
import { type ActionLike, isEngineAction, type ActionExecutionContext } from "@/core/engine/actions/EngineAction";

type DomainRegistrar = (registry: ActionRegistry) => Map<string, ActionHandler>;

const DOMAIN_REGISTRARS: Record<string, DomainRegistrar> = {
	core: registerCore,
	enchantment: registerEnchantment,
	loot_table: registerLootTable,
	recipe: registerRecipe,
	structure: registerStructure,
	structure_set: registerStructureSet
};

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
		for (const registrar of Object.values(DOMAIN_REGISTRARS)) {
			const domainHandlers = registrar(this);
			for (const [type, handler] of domainHandlers) {
				this.handlers.set(type, handler);
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
