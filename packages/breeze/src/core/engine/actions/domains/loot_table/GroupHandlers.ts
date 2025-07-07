import type { LootGroup, LootTableProps } from "@/core/schema/loot/types";
import type { ActionHandler } from "../../types";
import type { LootTableAction } from "./types";

let globalGroupCounter = 0;

export class CreateLootGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.create_loot_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const newGroup: LootGroup = {
			id: `group_${globalGroupCounter++}`,
			type: action.groupType,
			items: action.itemIds,
			poolIndex: action.poolIndex,
			entryIndex: action.entryIndex || 0
		};
		lootTable.groups.push(newGroup);
		return lootTable;
	}
}

export class ModifyLootGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.modify_loot_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const group = lootTable.groups.find((g) => g.id === action.groupId);
		if (group) {
			switch (action.operation) {
				case "add_item":
					if (!group.items.includes(action.value as string)) {
						group.items.push(action.value as string);
					}
					break;
				case "remove_item":
					group.items = group.items.filter((itemId) => itemId !== action.value);
					break;
				case "change_type":
					group.type = action.value as "alternatives" | "group" | "sequence";
					break;
			}
		}
		return lootTable;
	}
}

export class DissolveLootGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.dissolve_loot_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;
		lootTable.groups = lootTable.groups.filter((group) => group.id !== action.groupId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== action.groupId);
		}
		return lootTable;
	}
}

export class ConvertItemToGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.convert_item_to_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const item = lootTable.items.find((item) => item.id === action.itemId);
		if (item) {
			const newGroup: LootGroup = {
				id: `group_${globalGroupCounter++}`,
				type: action.groupType,
				items: [action.itemId, ...(action.additionalItems || [])],
				poolIndex: item.poolIndex,
				entryIndex: item.entryIndex
			};
			lootTable.groups.push(newGroup);
		}
		return lootTable;
	}
}

export class ConvertGroupToItemHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.convert_group_to_item" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const group = lootTable.groups.find((group) => group.id === action.groupId);
		if (group && group.items.length > 0) {
			if (action.keepFirstItem) {
				lootTable.groups = lootTable.groups.filter((g) => g.id !== action.groupId);
				for (const g of lootTable.groups) {
					g.items = g.items.filter((itemId) => itemId !== action.groupId);
				}
			} else {
				for (const itemId of group.items) {
					lootTable.items = lootTable.items.filter((item) => item.id !== itemId);
				}
				lootTable.groups = lootTable.groups.filter((g) => g.id !== action.groupId);
			}
		}
		return lootTable;
	}
}

export class NestGroupInGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.nest_group_in_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		const parentGroup = lootTable.groups.find((group) => group.id === action.parentGroupId);
		if (parentGroup) {
			const position = action.position ?? parentGroup.items.length;
			parentGroup.items.splice(position, 0, action.childGroupId);
		}
		return lootTable;
	}
}

export class UnnestGroupHandler implements ActionHandler<LootTableAction> {
	execute(
		action: Extract<LootTableAction, { type: "loot_table.unnest_group" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const lootTable = structuredClone(element) as LootTableProps;

		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== action.groupId);
		}
		return lootTable;
	}
}
