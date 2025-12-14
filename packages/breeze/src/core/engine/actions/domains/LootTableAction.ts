import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import { Action } from "@/core/engine/actions/index";
import { randomId } from "@/utils";

type BulkProperty = "weight" | "quality";
type Property = "name" | "weight" | "quality";
type Operation = "multiply" | "add" | "set";
type GroupType = "alternatives" | "group" | "sequence";
type ItemOperation = "add_item" | "remove_item" | "change_type";

export class LootTableAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return this.applyFn(element, this.params);
	}

	static addLootItem(
		poolIndex: number,
		item: { name: string; weight?: number; quality?: number; conditions?: string[]; functions?: string[] }
	): LootTableAction<{
		poolIndex: number;
		item: typeof item;
	}> {
		return new LootTableAction({ poolIndex, item }, (el, p: { poolIndex: number; item: typeof item }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const newItem: LootItem = {
				id: randomId("item"),
				name: p.item.name,
				weight: p.item.weight,
				quality: p.item.quality,
				conditions: p.item.conditions || [],
				functions: p.item.functions || [],
				poolIndex: p.poolIndex,
				entryIndex: 0,
				entryType: "minecraft:item"
			};
			lootTable.items.push(newItem);
			return lootTable;
		});
	}

	static removeLootItem(itemId: string): LootTableAction<{ itemId: string }> {
		return new LootTableAction({ itemId }, (el, p: { itemId: string }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			lootTable.items = lootTable.items.filter((item) => item.id !== p.itemId);
			for (const group of lootTable.groups) {
				group.items = group.items.filter((id) => id !== p.itemId);
			}
			lootTable.groups = lootTable.groups.filter((group) => group.items.length > 0);
			return lootTable;
		});
	}

	static modifyLootItem(
		itemId: string,
		property: Property,
		value: unknown
	): LootTableAction<{ itemId: string; property: Property; value: unknown }> {
		return new LootTableAction({ itemId, property, value }, (el, p: { itemId: string; property: Property; value: unknown }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const item = lootTable.items.find((candidate) => candidate.id === p.itemId);
			if (item) {
				switch (p.property) {
					case "name":
						item.name = p.value as string;
						break;
					case "weight":
						item.weight = p.value as number;
						break;
					case "quality":
						item.quality = p.value as number;
						break;
				}
			}
			return lootTable;
		});
	}

	static duplicateLootItem(itemId: string, targetPoolIndex?: number): LootTableAction<{ itemId: string; targetPoolIndex?: number }> {
		return new LootTableAction({ itemId, targetPoolIndex }, (el, p: { itemId: string; targetPoolIndex?: number }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const source = lootTable.items.find((candidate) => candidate.id === p.itemId);
			if (source) {
				const duplicate: LootItem = {
					...source,
					id: randomId("item"),
					poolIndex: p.targetPoolIndex ?? source.poolIndex
				};
				lootTable.items.push(duplicate);
			}
			return lootTable;
		});
	}

	static bulkModifyItems(
		itemIds: string[],
		property: BulkProperty,
		operation: Operation,
		value: number
	): LootTableAction<{ itemIds: string[]; property: BulkProperty; operation: Operation; value: number }> {
		return new LootTableAction(
			{ itemIds, property, operation, value },
			(el, p: { itemIds: string[]; property: BulkProperty; operation: Operation; value: number }) => {
				const lootTable = structuredClone(el) as LootTableProps;
				for (const itemId of p.itemIds) {
					const item = lootTable.items.find((candidate) => candidate.id === itemId);
					if (!item) continue;

					const current = (p.property === "weight" ? item.weight : item.quality) ?? 0;
					let next = current;
					switch (p.operation) {
						case "multiply":
							next = current * p.value;
							break;
						case "add":
							next = current + p.value;
							break;
						case "set":
							next = p.value;
							break;
					}
					if (p.property === "weight") item.weight = next;
					else item.quality = next;
				}
				return lootTable;
			}
		);
	}

	static createLootGroup(
		groupType: GroupType,
		itemIds: string[],
		poolIndex: number,
		entryIndex?: number
	): LootTableAction<{ groupType: GroupType; itemIds: string[]; poolIndex: number; entryIndex?: number }> {
		return new LootTableAction(
			{ groupType, itemIds, poolIndex, entryIndex },
			(el, p: { groupType: GroupType; itemIds: string[]; poolIndex: number; entryIndex?: number }) => {
				const lootTable = structuredClone(el) as LootTableProps;
				const group: LootGroup = {
					id: randomId("group"),
					type: p.groupType,
					items: [...p.itemIds],
					poolIndex: p.poolIndex,
					entryIndex: p.entryIndex ?? 0
				};
				lootTable.groups.push(group);
				return lootTable;
			}
		);
	}

	static modifyLootGroup(
		groupId: string,
		operation: ItemOperation,
		value: unknown
	): LootTableAction<{ groupId: string; operation: ItemOperation; value: unknown }> {
		return new LootTableAction(
			{ groupId, operation, value },
			(el, p: { groupId: string; operation: ItemOperation; value: unknown }) => {
				const lootTable = structuredClone(el) as LootTableProps;
				const group = lootTable.groups.find((candidate) => candidate.id === p.groupId);
				if (!group) return lootTable;

				switch (p.operation) {
					case "add_item": {
						const val = p.value as string;
						if (!group.items.includes(val)) group.items.push(val);
						break;
					}
					case "remove_item": {
						const val = p.value as string;
						group.items = group.items.filter((itemId) => itemId !== val);
						break;
					}
					case "change_type":
						group.type = p.value as LootGroup["type"];
						break;
				}
				return lootTable;
			}
		);
	}

	static dissolveLootGroup(groupId: string): LootTableAction<{ groupId: string }> {
		return new LootTableAction({ groupId }, (el, p: { groupId: string }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			lootTable.groups = lootTable.groups.filter((group) => group.id !== p.groupId);
			for (const group of lootTable.groups) {
				group.items = group.items.filter((itemId) => itemId !== p.groupId);
			}
			return lootTable;
		});
	}

	static convertItemToGroup(
		itemId: string,
		groupType: GroupType,
		additionalItems?: string[]
	): LootTableAction<{ itemId: string; groupType: GroupType; additionalItems?: string[] }> {
		return new LootTableAction(
			{ itemId, groupType, additionalItems },
			(el, p: { itemId: string; groupType: GroupType; additionalItems?: string[] }) => {
				const lootTable = structuredClone(el) as LootTableProps;
				const item = lootTable.items.find((candidate) => candidate.id === p.itemId);
				if (item) {
					const group: LootGroup = {
						id: randomId("group"),
						type: p.groupType,
						items: [p.itemId, ...(p.additionalItems ?? [])],
						poolIndex: item.poolIndex,
						entryIndex: item.entryIndex
					};
					lootTable.groups.push(group);
				}
				return lootTable;
			}
		);
	}

	static convertGroupToItem(groupId: string, keepFirstItem?: boolean): LootTableAction<{ groupId: string; keepFirstItem?: boolean }> {
		return new LootTableAction({ groupId, keepFirstItem }, (el, p: { groupId: string; keepFirstItem?: boolean }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const group = lootTable.groups.find((candidate) => candidate.id === p.groupId);
			if (!group || group.items.length === 0) return lootTable;

			if (p.keepFirstItem) {
				lootTable.groups = lootTable.groups.filter((g) => g.id !== p.groupId);
				for (const remaining of lootTable.groups) {
					remaining.items = remaining.items.filter((itemId) => itemId !== p.groupId);
				}
			} else {
				for (const itemId of group.items) {
					lootTable.items = lootTable.items.filter((item) => item.id !== itemId);
				}
				lootTable.groups = lootTable.groups.filter((g) => g.id !== p.groupId);
			}
			return lootTable;
		});
	}

	static nestGroupInGroup(
		childGroupId: string,
		parentGroupId: string,
		position?: number
	): LootTableAction<{ childGroupId: string; parentGroupId: string; position?: number }> {
		return new LootTableAction(
			{ childGroupId, parentGroupId, position },
			(el, p: { childGroupId: string; parentGroupId: string; position?: number }) => {
				const lootTable = structuredClone(el) as LootTableProps;
				const parent = lootTable.groups.find((candidate) => candidate.id === p.parentGroupId);
				if (parent) {
					const insertionIndex = p.position ?? parent.items.length;
					parent.items.splice(insertionIndex, 0, p.childGroupId);
				}
				return lootTable;
			}
		);
	}

	static unnestGroup(groupId: string): LootTableAction<{ groupId: string }> {
		return new LootTableAction({ groupId }, (el, p: { groupId: string }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			for (const group of lootTable.groups) {
				group.items = group.items.filter((itemId) => itemId !== p.groupId);
			}
			return lootTable;
		});
	}

	static moveItemBetweenPools(itemId: string, targetPoolIndex: number): LootTableAction<{ itemId: string; targetPoolIndex: number }> {
		return new LootTableAction({ itemId, targetPoolIndex }, (el, p: { itemId: string; targetPoolIndex: number }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const item = lootTable.items.find((candidate) => candidate.id === p.itemId);
			if (item) {
				item.poolIndex = p.targetPoolIndex;
			}
			return lootTable;
		});
	}

	static moveGroupBetweenPools(groupId: string, targetPoolIndex: number): LootTableAction<{ groupId: string; targetPoolIndex: number }> {
		return new LootTableAction({ groupId, targetPoolIndex }, (el, p: { groupId: string; targetPoolIndex: number }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const group = lootTable.groups.find((candidate) => candidate.id === p.groupId);
			if (group) {
				group.poolIndex = p.targetPoolIndex;
			}
			return lootTable;
		});
	}

	static balanceWeights(poolIndex: number, targetTotal?: number): LootTableAction<{ poolIndex: number; targetTotal?: number }> {
		return new LootTableAction({ poolIndex, targetTotal }, (el, p: { poolIndex: number; targetTotal?: number }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const poolItems = lootTable.items.filter((item) => item.poolIndex === p.poolIndex);
			const target = p.targetTotal ?? 100;
			if (poolItems.length > 0) {
				const weightPerItem = Math.floor(target / poolItems.length);
				for (const item of poolItems) {
					item.weight = weightPerItem;
				}
			}
			return lootTable;
		});
	}

	static setItemCount(
		itemId: string,
		count: { min: number; max: number } | number
	): LootTableAction<{ itemId: string; count: { min: number; max: number } | number }> {
		return new LootTableAction({ itemId, count }, (el, p: { itemId: string; count: { min: number; max: number } | number }) => {
			const lootTable = structuredClone(el) as LootTableProps;
			const item = lootTable.items.find((candidate) => candidate.id === p.itemId);
			if (!item) return lootTable;

			const countValue = typeof p.count === "number" ? { min: p.count, max: p.count } : p.count;
			const countProvider =
				countValue.min === countValue.max
					? { type: "minecraft:constant", value: countValue.min }
					: { type: "minecraft:uniform", min: countValue.min, max: countValue.max };

			item.functions ??= [];
			const existingIndex = item.functions.findIndex((func: { function: string }) => func.function === "minecraft:set_count");

			if (existingIndex >= 0) {
				item.functions[existingIndex] = { function: "minecraft:set_count", count: countProvider };
			} else {
				item.functions.push({ function: "minecraft:set_count", count: countProvider });
			}

			return lootTable;
		});
	}
}
