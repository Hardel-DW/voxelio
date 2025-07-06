import type { LootTableProps } from "@/core/schema/loot/types";
import type { ActionHandler } from "../../types";
import type { LootTableAction } from "./types";

export class MoveItemBetweenPoolsHandler implements ActionHandler<LootTableAction> {
    execute(
        action: Extract<LootTableAction, { type: "loot_table.move_item_between_pools" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const lootTable = structuredClone(element) as LootTableProps;

        const item = lootTable.items.find((item) => item.id === action.itemId);
        if (item) {
            item.poolIndex = action.targetPoolIndex;
        }
        return lootTable;
    }
}

export class MoveGroupBetweenPoolsHandler implements ActionHandler<LootTableAction> {
    execute(
        action: Extract<LootTableAction, { type: "loot_table.move_group_between_pools" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const lootTable = structuredClone(element) as LootTableProps;

        const group = lootTable.groups.find((group) => group.id === action.groupId);
        if (group) {
            group.poolIndex = action.targetPoolIndex;
        }
        return lootTable;
    }
}

export class BalanceWeightsHandler implements ActionHandler<LootTableAction> {
    execute(
        action: Extract<LootTableAction, { type: "loot_table.balance_weights" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const lootTable = structuredClone(element) as LootTableProps;

        const poolItems = lootTable.items.filter((item) => item.poolIndex === action.poolIndex);
        const targetTotal = action.targetTotal || 100;
        const itemCount = poolItems.length;

        if (itemCount > 0) {
            const weightPerItem = Math.floor(targetTotal / itemCount);
            for (const item of poolItems) {
                item.weight = weightPerItem;
            }
        }
        return lootTable;
    }
}

export class ConditionalLootHandler implements ActionHandler<LootTableAction> {
    execute(
        action: Extract<LootTableAction, { type: "loot_table.conditional_loot" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const lootTable = structuredClone(element) as LootTableProps;

        let conditionMet = false;

        switch (action.condition.type) {
            case "pool_empty":
                if (action.condition.poolIndex !== undefined) {
                    const poolItems = lootTable.items.filter((item) => item.poolIndex === action.condition.poolIndex);
                    conditionMet = poolItems.length === 0;
                }
                break;
            case "item_count":
                conditionMet = lootTable.items.length >= (action.condition.count || 0);
                break;
            case "group_exists":
                conditionMet = lootTable.groups.some((group) => group.id === action.condition.groupId);
                break;
        }

        const actionToExecute = conditionMet ? action.thenAction : action.elseAction;
        if (actionToExecute) {
            // Recursive - we need to call the new action system
            // For now we just return clone, it will be fixed later
            return lootTable;
        }
        return lootTable;
    }
}
