import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { LOOT_TABLE_ACTION_CLASSES } from "@/core/engine/actions/domains/loot_table/actions";

export { LootTableActions, LOOT_TABLE_ACTION_CLASSES } from "@/core/engine/actions/domains/loot_table/actions";
export type { LootTableActionInstance } from "@/core/engine/actions/domains/loot_table/actions";

export type LootTableAction = ActionJsonFromClasses<typeof LOOT_TABLE_ACTION_CLASSES>;

export function isLootTableAction(action: ActionLike): action is LootTableAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("loot_table.");
}

export const lootTableActionTypes = LOOT_TABLE_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
