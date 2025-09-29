import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import { Action } from "@/core/engine/actions/Action";

let globalItemCounter = 0;
let globalGroupCounter = 0;

export class AddLootItemAction extends Action<{
	poolIndex: number;
	item: {
		name: string;
		weight?: number;
		quality?: number;
		conditions?: string[];
		functions?: string[];
	};
}> {
	readonly type = "loot_table.add_loot_item" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const item: LootItem = {
			id: `item_${globalItemCounter++}`,
			name: this.params.item.name,
			weight: this.params.item.weight,
			quality: this.params.item.quality,
			conditions: this.params.item.conditions || [],
			functions: this.params.item.functions || [],
			poolIndex: this.params.poolIndex,
			entryIndex: 0,
			entryType: "minecraft:item"
		};

		lootTable.items.push(item);
		return lootTable;
	}
}

export class RemoveLootItemAction extends Action<{ itemId: string }> {
	readonly type = "loot_table.remove_loot_item" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		lootTable.items = lootTable.items.filter((item) => item.id !== this.params.itemId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.params.itemId);
		}
		lootTable.groups = lootTable.groups.filter((group) => group.items.length > 0);
		return lootTable;
	}
}

export class ModifyLootItemAction extends Action<{ itemId: string; property: "name" | "weight" | "quality"; value: unknown }> {
	readonly type = "loot_table.modify_loot_item" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const item = lootTable.items.find((candidate) => candidate.id === this.params.itemId);
		if (item) {
			switch (this.params.property) {
				case "name":
					item.name = this.params.value as string;
					break;
				case "weight":
					item.weight = this.params.value as number;
					break;
				case "quality":
					item.quality = this.params.value as number;
					break;
			}
		}
		return lootTable;
	}
}

export class DuplicateLootItemAction extends Action<{ itemId: string; targetPoolIndex?: number }> {
	readonly type = "loot_table.duplicate_loot_item" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const source = lootTable.items.find((candidate) => candidate.id === this.params.itemId);
		if (source) {
			const duplicate: LootItem = {
				...source,
				id: `item_${globalItemCounter++}`,
				poolIndex: this.params.targetPoolIndex ?? source.poolIndex
			};
			lootTable.items.push(duplicate);
		}
		return lootTable;
	}
}

export class BulkModifyItemsAction extends Action<{
	itemIds: string[];
	property: "weight" | "quality";
	operation: "multiply" | "add" | "set";
	value: number;
}> {
	readonly type = "loot_table.bulk_modify_items" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		for (const itemId of this.params.itemIds) {
			const item = lootTable.items.find((candidate) => candidate.id === itemId);
			if (!item) continue;

			const current = (this.params.property === "weight" ? item.weight : item.quality) ?? 0;
			let next = current;
			switch (this.params.operation) {
				case "multiply":
					next = current * this.params.value;
					break;
				case "add":
					next = current + this.params.value;
					break;
				case "set":
					next = this.params.value;
					break;
			}
			if (this.params.property === "weight") item.weight = next;
			else item.quality = next;
		}
		return lootTable;
	}
}

export class CreateLootGroupAction extends Action<{
	groupType: "alternatives" | "group" | "sequence";
	itemIds: string[];
	poolIndex: number;
	entryIndex?: number;
}> {
	readonly type = "loot_table.create_loot_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const group: LootGroup = {
			id: `group_${globalGroupCounter++}`,
			type: this.params.groupType,
			items: [...this.params.itemIds],
			poolIndex: this.params.poolIndex,
			entryIndex: this.params.entryIndex ?? 0
		};
		lootTable.groups.push(group);
		return lootTable;
	}
}

export class ModifyLootGroupAction extends Action<{
	groupId: string;
	operation: "add_item" | "remove_item" | "change_type";
	value: unknown;
}> {
	readonly type = "loot_table.modify_loot_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const group = lootTable.groups.find((candidate) => candidate.id === this.params.groupId);
		if (!group) return lootTable;

		switch (this.params.operation) {
			case "add_item": {
				const value = this.params.value as string;
				if (!group.items.includes(value)) group.items.push(value);
				break;
			}
			case "remove_item": {
				const value = this.params.value as string;
				group.items = group.items.filter((itemId) => itemId !== value);
				break;
			}
			case "change_type":
				group.type = this.params.value as LootGroup["type"];
				break;
		}
		return lootTable;
	}
}

export class DissolveLootGroupAction extends Action<{ groupId: string }> {
	readonly type = "loot_table.dissolve_loot_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		lootTable.groups = lootTable.groups.filter((group) => group.id !== this.params.groupId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.params.groupId);
		}
		return lootTable;
	}
}

export class ConvertItemToGroupAction extends Action<{
	itemId: string;
	groupType: "alternatives" | "group" | "sequence";
	additionalItems?: string[];
}> {
	readonly type = "loot_table.convert_item_to_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const item = lootTable.items.find((candidate) => candidate.id === this.params.itemId);
		if (item) {
			const group: LootGroup = {
				id: `group_${globalGroupCounter++}`,
				type: this.params.groupType,
				items: [this.params.itemId, ...(this.params.additionalItems ?? [])],
				poolIndex: item.poolIndex,
				entryIndex: item.entryIndex
			};
			lootTable.groups.push(group);
		}
		return lootTable;
	}
}

export class ConvertGroupToItemAction extends Action<{ groupId: string; keepFirstItem?: boolean }> {
	readonly type = "loot_table.convert_group_to_item" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const group = lootTable.groups.find((candidate) => candidate.id === this.params.groupId);
		if (!group || group.items.length === 0) return lootTable;

		if (this.params.keepFirstItem) {
			lootTable.groups = lootTable.groups.filter((g) => g.id !== this.params.groupId);
			for (const remaining of lootTable.groups) {
				remaining.items = remaining.items.filter((itemId) => itemId !== this.params.groupId);
			}
		} else {
			for (const itemId of group.items) {
				lootTable.items = lootTable.items.filter((item) => item.id !== itemId);
			}
			lootTable.groups = lootTable.groups.filter((g) => g.id !== this.params.groupId);
		}
		return lootTable;
	}
}

export class NestGroupInGroupAction extends Action<{ childGroupId: string; parentGroupId: string; position?: number }> {
	readonly type = "loot_table.nest_group_in_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const parent = lootTable.groups.find((candidate) => candidate.id === this.params.parentGroupId);
		if (parent) {
			const insertionIndex = this.params.position ?? parent.items.length;
			parent.items.splice(insertionIndex, 0, this.params.childGroupId);
		}
		return lootTable;
	}
}

export class UnnestGroupAction extends Action<{ groupId: string }> {
	readonly type = "loot_table.unnest_group" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.params.groupId);
		}
		return lootTable;
	}
}

export class MoveItemBetweenPoolsAction extends Action<{ itemId: string; targetPoolIndex: number }> {
	readonly type = "loot_table.move_item_between_pools" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const item = lootTable.items.find((candidate) => candidate.id === this.params.itemId);
		if (item) {
			item.poolIndex = this.params.targetPoolIndex;
		}
		return lootTable;
	}
}

export class MoveGroupBetweenPoolsAction extends Action<{ groupId: string; targetPoolIndex: number }> {
	readonly type = "loot_table.move_group_between_pools" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const group = lootTable.groups.find((candidate) => candidate.id === this.params.groupId);
		if (group) {
			group.poolIndex = this.params.targetPoolIndex;
		}
		return lootTable;
	}
}

export class BalanceWeightsAction extends Action<{ poolIndex: number; targetTotal?: number }> {
	readonly type = "loot_table.balance_weights" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = structuredClone(element) as LootTableProps;
		const poolItems = lootTable.items.filter((item) => item.poolIndex === this.params.poolIndex);
		const targetTotal = this.params.targetTotal ?? 100;
		if (poolItems.length > 0) {
			const weightPerItem = Math.floor(targetTotal / poolItems.length);
			for (const item of poolItems) {
				item.weight = weightPerItem;
			}
		}
		return lootTable;
	}
}

// Liste des classes d'actions LootTable - ajouter ici pour créer une nouvelle action
export const LOOT_TABLE_ACTION_CLASSES = [
	AddLootItemAction,
	RemoveLootItemAction,
	ModifyLootItemAction,
	DuplicateLootItemAction,
	BulkModifyItemsAction,
	CreateLootGroupAction,
	ModifyLootGroupAction,
	DissolveLootGroupAction,
	ConvertItemToGroupAction,
	ConvertGroupToItemAction,
	NestGroupInGroupAction,
	UnnestGroupAction,
	MoveItemBetweenPoolsAction,
	MoveGroupBetweenPoolsAction,
	BalanceWeightsAction
] as const;
