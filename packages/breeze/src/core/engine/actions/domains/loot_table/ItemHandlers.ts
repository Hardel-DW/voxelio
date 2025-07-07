import type { LootItem, LootTableProps } from "@/core/schema/loot/types";
import type { ActionHandler } from "../../types";
import type { LootTableAction } from "./types";

let globalItemCounter = 0;

export class AddLootItemHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.add_loot_item" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const newItem: LootItem = {
			id: `item_${globalItemCounter++}`,
			name: action.item.name,
			weight: action.item.weight,
			quality: action.item.quality,
			conditions: action.item.conditions || [],
			functions: action.item.functions || [],
			poolIndex: action.poolIndex,
			entryIndex: 0,
			entryType: "minecraft:item"
		};
		lootTable.items.push(newItem);
		return lootTable;
	}
}

export class RemoveLootItemHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.remove_loot_item" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		lootTable.items = lootTable.items.filter((item) => item.id !== action.itemId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== action.itemId);
		}
		lootTable.groups = lootTable.groups.filter((group) => group.items.length > 0);
		return lootTable;
	}
}

export class ModifyLootItemHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.modify_loot_item" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const item = lootTable.items.find((item) => item.id === action.itemId);
		if (item) {
			switch (action.property) {
				case "name":
					item.name = action.value as string;
					break;
				case "weight":
					item.weight = action.value as number;
					break;
				case "quality":
					item.quality = action.value as number;
					break;
			}
		}
		return lootTable;
	}
}

export class DuplicateLootItemHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.duplicate_loot_item" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const originalItem = lootTable.items.find((item) => item.id === action.itemId);
		if (originalItem) {
			const duplicatedItem: LootItem = {
				...originalItem,
				id: `item_${globalItemCounter++}`,
				poolIndex: action.targetPoolIndex ?? originalItem.poolIndex
			};
			lootTable.items.push(duplicatedItem);
		}
		return lootTable;
	}
}

export class BulkModifyItemsHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.bulk_modify_items" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		for (const itemId of action.itemIds) {
			const item = lootTable.items.find((item) => item.id === itemId);
			if (item) {
				const currentValue = (action.property === "weight" ? item.weight : item.quality) || 0;
				let newValue: number;

				switch (action.operation) {
					case "multiply":
						newValue = currentValue * action.value;
						break;
					case "add":
						newValue = currentValue + action.value;
						break;
					case "set":
						newValue = action.value;
						break;
					default:
						newValue = currentValue;
				}

				if (action.property === "weight") {
					item.weight = newValue;
				} else {
					item.quality = newValue;
				}
			}
		}
		return lootTable;
	}
}
