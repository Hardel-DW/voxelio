import { updateData } from "@/core/engine/actions";
import { LootTableAction } from "@/core/engine/actions/domains/LootTableAction";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect, beforeEach } from "vitest";

function updateLootTable(action: any, lootTable: LootTableProps, packVersion = 48): LootTableProps {
	const result = updateData(action, lootTable, packVersion);
	expect(result).toBeDefined();
	return result as LootTableProps;
}

function createMockLootTable(overrides: Partial<LootTableProps> = {}): LootTableProps {
	return {
		identifier: { namespace: "test", registry: "loot_table", resource: "test_loot" },
		type: "minecraft:entity",
		items: [
			{
				id: "item_0",
				name: "minecraft:experience_bottle",
				weight: 1,
				quality: 0,
				poolIndex: 0,
				entryIndex: 0,
				entryType: "minecraft:item",
				conditions: [],
				functions: []
			}
		],
		disabled: false,
		groups: [],
		pools: [
			{
				poolIndex: 0,
				rolls: 1,
				unknownFields: {}
			}
		],
		...overrides
	};
}

function createComplexLootTable(): LootTableProps {
	return {
		identifier: { namespace: "test", registry: "loot_table", resource: "complex_loot" },
		type: "minecraft:chest",
		disabled: false,
		items: [
			{
				id: "item_0",
				name: "minecraft:diamond",
				weight: 1,
				quality: 10,
				poolIndex: 0,
				entryIndex: 0,
				entryType: "minecraft:item",
				conditions: [{ condition: "minecraft:random_chance", chance: 0.1 }],
				functions: [{ function: "minecraft:set_count", count: { min: 1, max: 3 } }]
			},
			{
				id: "item_1",
				name: "minecraft:emerald",
				weight: 5,
				quality: 5,
				poolIndex: 0,
				entryIndex: 1,
				entryType: "minecraft:item",
				conditions: [],
				functions: []
			},
			{
				id: "item_2",
				name: "minecraft:gold_ingot",
				weight: 10,
				quality: 0,
				poolIndex: 1,
				entryIndex: 0,
				entryType: "minecraft:item",
				conditions: [],
				functions: []
			}
		],
		groups: [
			{
				id: "group_0",
				type: "alternatives",
				items: ["item_0", "item_1"],
				poolIndex: 0,
				entryIndex: 2,
				conditions: [],
				functions: []
			}
		],
		pools: [
			{
				poolIndex: 0,
				rolls: { min: 1, max: 3 },
				bonus_rolls: 0,
				unknownFields: {}
			},
			{
				poolIndex: 1,
				rolls: 1,
				unknownFields: {}
			}
		]
	};
}

describe("Loot Table Actions", () => {
	let mockLootTable: LootTableProps;
	let complexLootTable: LootTableProps;

	beforeEach(() => {
		mockLootTable = createMockLootTable();
		complexLootTable = createComplexLootTable();
	});

	describe("Loot Table Domain Actions", () => {
		describe("add_loot_item", () => {
			it("should add item to existing pool", () => {
				expect(mockLootTable.items).toHaveLength(1);
				const action = LootTableAction.addLootItem(0, {
					name: "minecraft:diamond",
					weight: 10,
					quality: 5
				});

				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(2);

				const newItem = result.items[1];
				expect(newItem.name).toBe("minecraft:diamond");
				expect(newItem.weight).toBe(10);
				expect(newItem.quality).toBe(5);
				expect(newItem.poolIndex).toBe(0);
				expect(newItem.id).toBeDefined();
				expect(mockLootTable.items).toHaveLength(1);
				expect(result).not.toBe(mockLootTable);
			});

			it("should add item to new pool", () => {
				const action = LootTableAction.addLootItem(1, {
					name: "minecraft:emerald",
					weight: 5
				});

				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(2);

				const newItem = result.items[1];
				expect(newItem.poolIndex).toBe(1);
				expect(newItem.entryIndex).toBe(0);
			});

			it("should add item with conditions and functions", () => {
				const action = LootTableAction.addLootItem(0, {
					name: "minecraft:netherite_ingot",
					weight: 1,
					quality: 15,
					conditions: ["minecraft:killed_by_player"],
					functions: ["minecraft:enchant_randomly"]
				});

				const result = updateLootTable(action, mockLootTable);
				const newItem = result.items[1];

				expect(newItem.conditions).toContain("minecraft:killed_by_player");
				expect(newItem.functions).toContain("minecraft:enchant_randomly");
			});
		});

		describe("remove_loot_item", () => {
			it("should remove existing item", () => {
				expect(mockLootTable.items).toHaveLength(1);
				expect(mockLootTable.items[0].id).toBe("item_0");

				const action = LootTableAction.removeLootItem("item_0");
				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(0);
				expect(mockLootTable.items).toHaveLength(1);
				expect(result).not.toBe(mockLootTable);
			});

			it("should handle removing non-existent item gracefully", () => {
				const action = LootTableAction.removeLootItem("non_existent");
				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(1);
				expect(result.items[0].id).toBe("item_0");
			});
		});

		describe("modify_loot_item", () => {
			it("should modify item weight", () => {
				expect(mockLootTable.items[0].weight).toBe(1);

				const action = LootTableAction.modifyLootItem("item_0", "weight", 50);
				const result = updateLootTable(action, mockLootTable);
				expect(result.items[0].weight).toBe(50);
				expect(mockLootTable.items[0].weight).toBe(1);
				expect(result).not.toBe(mockLootTable);
			});

			it("should modify item quality", () => {
				const action = LootTableAction.modifyLootItem("item_0", "quality", 15);
				const result = updateLootTable(action, mockLootTable);
				expect(result.items[0].quality).toBe(15);
			});

			it("should modify item name", () => {
				const action = LootTableAction.modifyLootItem("item_0", "name", "minecraft:diamond_sword");
				const result = updateLootTable(action, mockLootTable);
				expect(result.items[0].name).toBe("minecraft:diamond_sword");
			});
		});

		describe("create_loot_group", () => {
			it("should create alternatives group", () => {
				const addAction = LootTableAction.addLootItem(0, { name: "minecraft:emerald", weight: 5 });

				let result = updateLootTable(addAction, mockLootTable);
				expect(result.items).toHaveLength(2);

				const groupAction = LootTableAction.createLootGroup("alternatives", ["item_0", result.items[1].id], 0);
				result = updateLootTable(groupAction, result);
				expect(result.groups).toHaveLength(1);

				const group = result.groups[0];
				expect(group.type).toBe("alternatives");
				expect(group.items).toHaveLength(2);
				expect(group.poolIndex).toBe(0);
				expect(group.id).toBeDefined();
			});

			it("should create sequence group", () => {
				const action = LootTableAction.createLootGroup("sequence", ["item_0"], 0);
				const result = updateLootTable(action, mockLootTable);
				expect(result.groups).toHaveLength(1);
				expect(result.groups[0].type).toBe("sequence");
			});

			it("should create group at specific entry index", () => {
				const action = LootTableAction.createLootGroup("group", ["item_0"], 0, 5);
				const result = updateLootTable(action, mockLootTable);
				expect(result.groups[0].entryIndex).toBe(5);
			});
		});

		describe("dissolve_loot_group", () => {
			it("should dissolve existing group", () => {
				expect(complexLootTable.groups).toHaveLength(1);
				expect(complexLootTable.groups[0].id).toBe("group_0");

				const action = LootTableAction.dissolveLootGroup("group_0");
				const result = updateLootTable(action, complexLootTable);
				expect(result.groups).toHaveLength(0);
				expect(complexLootTable.groups).toHaveLength(1);
				expect(result).not.toBe(complexLootTable);
			});

			it("should handle dissolving non-existent group gracefully", () => {
				const action = LootTableAction.dissolveLootGroup("non_existent");
				const result = updateLootTable(action, mockLootTable);
				expect(result.groups).toHaveLength(0);
			});
		});

		describe("move_item_between_pools", () => {
			it("should move item to different pool", () => {
				expect(complexLootTable.items[2].poolIndex).toBe(1);

				const action = LootTableAction.moveItemBetweenPools("item_2", 0);
				const result = updateLootTable(action, complexLootTable);
				const movedItem = result.items.find((item) => item.id === "item_2");
				expect(movedItem?.poolIndex).toBe(0);
				expect(complexLootTable.items[2].poolIndex).toBe(1);
				expect(result).not.toBe(complexLootTable);
			});

			it("should handle moving to same pool gracefully", () => {
				const action = LootTableAction.moveItemBetweenPools("item_0", 0);
				const result = updateLootTable(action, complexLootTable);
				const item = result.items.find((item) => item.id === "item_0");
				expect(item?.poolIndex).toBe(0);
			});
		});

		describe("duplicate_loot_item", () => {
			it("should duplicate item in same pool", () => {
				expect(mockLootTable.items).toHaveLength(1);

				const action = LootTableAction.duplicateLootItem("item_0");
				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(2);

				const original = result.items[0];
				const duplicate = result.items[1];
				expect(original.name).toBe(duplicate.name);
				expect(original.weight).toBe(duplicate.weight);
				expect(original.poolIndex).toBe(duplicate.poolIndex);
				expect(original.id).not.toBe(duplicate.id);
			});

			it("should duplicate item to different pool", () => {
				const action = LootTableAction.duplicateLootItem("item_0", 1);

				const result = updateLootTable(action, mockLootTable);
				expect(result.items).toHaveLength(2);

				const duplicate = result.items[1];
				expect(duplicate.poolIndex).toBe(1);
				expect(duplicate.entryIndex).toBe(0);
			});
		});

		describe("bulk_modify_items", () => {
			it("should multiply weights of multiple items", () => {
				const action = LootTableAction.bulkModifyItems(["item_0", "item_1"], "weight", "multiply", 2);
				const result = updateLootTable(action, complexLootTable);
				const item0 = result.items.find((item) => item.id === "item_0");
				const item1 = result.items.find((item) => item.id === "item_1");
				expect(item0?.weight).toBe(2);
				expect(item1?.weight).toBe(10);
			});

			it("should add to quality of multiple items", () => {
				const action = LootTableAction.bulkModifyItems(["item_0", "item_1"], "quality", "add", 5);
				const result = updateLootTable(action, complexLootTable);
				const item0 = result.items.find((item) => item.id === "item_0");
				const item1 = result.items.find((item) => item.id === "item_1");
				expect(item0?.quality).toBe(15); // 10 + 5
				expect(item1?.quality).toBe(10); // 5 + 5
			});

			it("should set weight of multiple items", () => {
				const action = LootTableAction.bulkModifyItems(["item_0", "item_1", "item_2"], "weight", "set", 25);
				const result = updateLootTable(action, complexLootTable);
				const items = result.items.filter((item) => ["item_0", "item_1", "item_2"].includes(item.id));
				for (const item of items) {
					expect(item.weight).toBe(25);
				}
			});
		});
	});

	describe("Complex Loot Operations", () => {
		it("should preserve identifier through loot actions", () => {
			const action = LootTableAction.addLootItem(0, { name: "minecraft:coal" });
			const result = updateLootTable(action, mockLootTable);
			expect(result.identifier).toBeDefined();
			expect(mockLootTable.identifier).toEqual(result.identifier);
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid item IDs gracefully", () => {
			const action = LootTableAction.modifyLootItem("invalid_id", "weight", 50);
			const result = updateLootTable(action, mockLootTable);
			expect(result.items).toEqual(mockLootTable.items);
		});

		it("should handle invalid group IDs gracefully", () => {
			const action = LootTableAction.dissolveLootGroup("invalid_group");
			const result = updateLootTable(action, mockLootTable);
			expect(result.groups).toEqual(mockLootTable.groups);
		});

		it("should handle negative pool indices", () => {
			const action = LootTableAction.addLootItem(-1, { name: "minecraft:dirt" });
			const result = updateLootTable(action, mockLootTable);
			expect(result).toBeDefined();
		});
	});
});
