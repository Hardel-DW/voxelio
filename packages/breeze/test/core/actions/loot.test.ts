import { type Action, updateData } from "@/core/engine/actions";
import { LootTableAction } from "@/core/engine/actions/domains/LootTableAction";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect } from "vitest";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import { simple, complete, advanced, ultimate } from "@test/mock/loot/DataDriven";
import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";

function updateLootTable(action: Action, lootTable: LootTableProps, packVersion = 48): LootTableProps {
	const result = updateData(action, lootTable, packVersion);
	expect(result).toBeDefined();
	return result as LootTableProps;
}

describe("Loot Table Actions", () => {
	describe("addLootItem", () => {
		it("should add item with all properties", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.addLootItem(0, {
					name: "minecraft:diamond",
					weight: 10,
					quality: 5,
					conditions: ["minecraft:random_chance"],
					functions: ["minecraft:set_count"]
				}),
				simpleLoot
			);
			expect(result.items).toHaveLength(2);
			const newItem = result.items[1];
			expect(newItem.name).toBe("minecraft:diamond");
			expect(newItem.weight).toBe(10);
			expect(newItem.quality).toBe(5);
			expect(newItem.conditions).toEqual(["minecraft:random_chance"]);
			expect(newItem.functions).toEqual(["minecraft:set_count"]);
			expect(newItem.poolIndex).toBe(0);
		});

		it("should add item without optional properties", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.addLootItem(0, { name: "minecraft:emerald" }),
				simpleLoot
			);
			expect(result.items).toHaveLength(2);
			const newItem = result.items[1];
			expect(newItem.name).toBe("minecraft:emerald");
			expect(newItem.weight).toBeUndefined();
			expect(newItem.quality).toBeUndefined();
			expect(newItem.poolIndex).toBe(0);
		});

		it("should add item to different pool", () => {
			const advancedLoot = LootDataDrivenToVoxelFormat({ element: advanced });
			const result = updateLootTable(
				LootTableAction.addLootItem(1, { name: "minecraft:netherite_ingot", weight: 1 }),
				advancedLoot
			);
			const newItem = result.items.find((item) => item.name === "minecraft:netherite_ingot");
			expect(newItem).toBeDefined();
			expect(newItem?.poolIndex).toBe(1);
		});
	});

	describe("removeLootItem", () => {
		it("should remove item by id", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(LootTableAction.removeLootItem(itemId), simpleLoot);
			expect(result.items).toHaveLength(0);
		});

		it("should clean up empty groups when last item is deleted", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const itemInGroup = ultimateLoot.groups[0]?.items[0];
			if (!itemInGroup) throw new Error("No item in group");

			const initialGroupCount = ultimateLoot.groups.length;
			const result = updateLootTable(LootTableAction.removeLootItem(itemInGroup), ultimateLoot);
			const group = result.groups.find((g) => g.id === ultimateLoot.groups[0].id);
			expect(group).toBeUndefined();
			expect(result.groups.length).toBeLessThan(initialGroupCount);
		});

		it("should handle removing non-existent item gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(LootTableAction.removeLootItem("non_existent"), simpleLoot);
			expect(result.items).toEqual(simpleLoot.items);
		});
	});

	describe("modifyLootItem", () => {
		it("should modify item name", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(
				LootTableAction.modifyLootItem(itemId, "name", "minecraft:diamond_block"),
				simpleLoot
			);
			expect(result.items[0].name).toBe("minecraft:diamond_block");
		});

		it("should modify item weight", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(
				LootTableAction.modifyLootItem(itemId, "weight", 50),
				simpleLoot
			);
			expect(result.items[0].weight).toBe(50);
		});

		it("should modify item quality", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(
				LootTableAction.modifyLootItem(itemId, "quality", 15),
				simpleLoot
			);
			expect(result.items[0].quality).toBe(15);
		});

		it("should handle modifying non-existent item gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.modifyLootItem("non_existent", "name", "test"),
				simpleLoot
			);
			expect(result.items).toEqual(simpleLoot.items);
		});
	});

	describe("duplicateLootItem", () => {
		it("should duplicate item in same pool", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(LootTableAction.duplicateLootItem(itemId), simpleLoot);
			expect(result.items).toHaveLength(2);
			expect(result.items[1].name).toBe(simpleLoot.items[0].name);
			expect(result.items[1].poolIndex).toBe(simpleLoot.items[0].poolIndex);
			expect(result.items[1].id).not.toBe(itemId);
		});

		it("should duplicate item to different pool", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const result = updateLootTable(LootTableAction.duplicateLootItem(itemId, 1), simpleLoot);
			expect(result.items).toHaveLength(2);
			expect(result.items[1].poolIndex).toBe(1);
		});

		it("should handle duplicating non-existent item gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(LootTableAction.duplicateLootItem("non_existent"), simpleLoot);
			expect(result.items).toEqual(simpleLoot.items);
		});
	});

	describe("bulkModifyItems", () => {
		it("should multiply weight of multiple items", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const itemIds = ultimateLoot.items.slice(0, 2).map((item) => item.id);
			ultimateLoot.items[0].weight = 10;
			ultimateLoot.items[1].weight = 5;

			const result = updateLootTable(
				LootTableAction.bulkModifyItems(itemIds, "weight", "multiply", 2),
				ultimateLoot
			);
			expect(result.items[0].weight).toBe(20);
			expect(result.items[1].weight).toBe(10);
		});

		it("should add to quality of multiple items", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const itemIds = ultimateLoot.items.slice(0, 2).map((item) => item.id);
			ultimateLoot.items[0].quality = 10;
			ultimateLoot.items[1].quality = 5;

			const result = updateLootTable(
				LootTableAction.bulkModifyItems(itemIds, "quality", "add", 5),
				ultimateLoot
			);
			expect(result.items[0].quality).toBe(15);
			expect(result.items[1].quality).toBe(10);
		});

		it("should set weight of multiple items", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const itemIds = ultimateLoot.items.slice(0, 3).map((item) => item.id);

			const result = updateLootTable(
				LootTableAction.bulkModifyItems(itemIds, "weight", "set", 25),
				ultimateLoot
			);
			for (const itemId of itemIds) {
				const item = result.items.find((i) => i.id === itemId);
				expect(item?.weight).toBe(25);
			}
		});
	});

	describe("createLootGroup", () => {
		it("should create alternatives group", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemIds = [simpleLoot.items[0].id];
			const result = updateLootTable(
				LootTableAction.createLootGroup("alternatives", itemIds, 0),
				simpleLoot
			);
			expect(result.groups).toHaveLength(1);
			expect(result.groups[0].type).toBe("alternatives");
			expect(result.groups[0].items).toEqual(itemIds);
			expect(result.groups[0].poolIndex).toBe(0);
		});

		it("should create group with entryIndex", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.createLootGroup("sequence", [], 0, 5),
				simpleLoot
			);
			expect(result.groups[0].entryIndex).toBe(5);
		});

		it("should create group without entryIndex", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.createLootGroup("group", [], 0),
				simpleLoot
			);
			expect(result.groups[0].entryIndex).toBe(0);
		});
	});

	describe("modifyLootGroup", () => {
		it("should add item to group", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const newItemId = "item_new";

			const result = updateLootTable(
				LootTableAction.modifyLootGroup(groupId, "add_item", newItemId),
				ultimateLoot
			);
			const group = result.groups.find((g) => g.id === groupId);
			expect(group?.items).toContain(newItemId);
		});

		it("should remove item from group", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const itemToRemove = ultimateLoot.groups[0].items[0];

			const result = updateLootTable(
				LootTableAction.modifyLootGroup(groupId, "remove_item", itemToRemove),
				ultimateLoot
			);
			const group = result.groups.find((g) => g.id === groupId);
			expect(group?.items).not.toContain(itemToRemove);
		});

		it("should change group type", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;

			const result = updateLootTable(
				LootTableAction.modifyLootGroup(groupId, "change_type", "sequence"),
				ultimateLoot
			);
			const group = result.groups.find((g) => g.id === groupId);
			expect(group?.type).toBe("sequence");
		});

		it("should handle modifying non-existent group gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.modifyLootGroup("non_existent", "add_item", "test"),
				simpleLoot
			);
			expect(result.groups).toEqual(simpleLoot.groups);
		});
	});

	describe("dissolveLootGroup", () => {
		it("should dissolve group", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const originalLength = ultimateLoot.groups.length;

			const result = updateLootTable(LootTableAction.dissolveLootGroup(groupId), ultimateLoot);
			expect(result.groups).toHaveLength(originalLength - 1);
			expect(result.groups.find((g) => g.id === groupId)).toBeUndefined();
		});

		it("should handle dissolving non-existent group gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(LootTableAction.dissolveLootGroup("non_existent"), simpleLoot);
			expect(result.groups).toEqual(simpleLoot.groups);
		});
	});

	describe("convertItemToGroup", () => {
		it("should convert item to group with additional items", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;

			const result = updateLootTable(
				LootTableAction.convertItemToGroup(itemId, "alternatives", ["item_2", "item_3"]),
				simpleLoot
			);
			expect(result.groups).toHaveLength(1);
			expect(result.groups[0].items).toEqual([itemId, "item_2", "item_3"]);
		});

		it("should convert item to group without additional items", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;

			const result = updateLootTable(
				LootTableAction.convertItemToGroup(itemId, "group"),
				simpleLoot
			);
			expect(result.groups).toHaveLength(1);
			expect(result.groups[0].items).toEqual([itemId]);
		});

		it("should handle converting non-existent item gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.convertItemToGroup("non_existent", "alternatives"),
				simpleLoot
			);
			expect(result.groups).toEqual(simpleLoot.groups);
		});
	});

	describe("convertGroupToItem", () => {
		it("should convert group to item keeping first item", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const originalLength = ultimateLoot.groups.length;

			const result = updateLootTable(
				LootTableAction.convertGroupToItem(groupId, true),
				ultimateLoot
			);
			expect(result.groups).toHaveLength(originalLength - 1);
		});

		it("should convert group to item removing all items", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const itemsInGroup = ultimateLoot.groups[0].items;

			const result = updateLootTable(
				LootTableAction.convertGroupToItem(groupId, false),
				ultimateLoot
			);
			expect(result.groups.find((g) => g.id === groupId)).toBeUndefined();
			for (const itemId of itemsInGroup) {
				expect(result.items.find((i) => i.id === itemId)).toBeUndefined();
			}
		});

		it("should handle converting non-existent group gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.convertGroupToItem("non_existent"),
				simpleLoot
			);
			expect(result.groups).toEqual(simpleLoot.groups);
		});
	});

	describe("nestGroupInGroup", () => {
		it("should nest group in parent with position", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			if (ultimateLoot.groups.length < 2) throw new Error("Need at least 2 groups");

			const childId = ultimateLoot.groups[0].id;
			const parentId = ultimateLoot.groups[1].id;

			const result = updateLootTable(
				LootTableAction.nestGroupInGroup(childId, parentId, 0),
				ultimateLoot
			);
			const parent = result.groups.find((g) => g.id === parentId);
			expect(parent?.items[0]).toBe(childId);
		});

		it("should nest group in parent without position", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			if (ultimateLoot.groups.length < 2) throw new Error("Need at least 2 groups");

			const childId = ultimateLoot.groups[0].id;
			const parentId = ultimateLoot.groups[1].id;
			const originalLength = ultimateLoot.groups[1].items.length;

			const result = updateLootTable(
				LootTableAction.nestGroupInGroup(childId, parentId),
				ultimateLoot
			);
			const parent = result.groups.find((g) => g.id === parentId);
			expect(parent?.items).toHaveLength(originalLength + 1);
			expect(parent?.items[originalLength]).toBe(childId);
		});

		it("should handle nesting in non-existent parent gracefully", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const childId = ultimateLoot.groups[0].id;

			const result = updateLootTable(
				LootTableAction.nestGroupInGroup(childId, "non_existent"),
				ultimateLoot
			);
			expect(result.groups).toEqual(ultimateLoot.groups);
		});
	});

	describe("unnestGroup", () => {
		it("should remove group from all parent groups", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			if (ultimateLoot.groups.length < 2) throw new Error("Need at least 2 groups");

			const childId = ultimateLoot.groups[0].id;
			const parentId = ultimateLoot.groups[1].id;

			// First nest the group
			let result = updateLootTable(
				LootTableAction.nestGroupInGroup(childId, parentId),
				ultimateLoot
			);
			let parent = result.groups.find((g) => g.id === parentId);
			expect(parent?.items).toContain(childId);

			// Then unnest it
			result = updateLootTable(LootTableAction.unnestGroup(childId), result);
			parent = result.groups.find((g) => g.id === parentId);
			expect(parent?.items).not.toContain(childId);
		});
	});

	describe("moveItemBetweenPools", () => {
		it("should move item to different pool", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;
			const originalPool = simpleLoot.items[0].poolIndex;

			const result = updateLootTable(
				LootTableAction.moveItemBetweenPools(itemId, 1),
				simpleLoot
			);
			const item = result.items.find((i) => i.id === itemId);
			expect(item?.poolIndex).toBe(1);
			expect(item?.poolIndex).not.toBe(originalPool);
		});

		it("should handle moving non-existent item gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.moveItemBetweenPools("non_existent", 1),
				simpleLoot
			);
			expect(result.items).toEqual(simpleLoot.items);
		});
	});

	describe("moveGroupBetweenPools", () => {
		it("should move group to different pool", () => {
			const ultimateLoot = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupId = ultimateLoot.groups[0].id;
			const originalPool = ultimateLoot.groups[0].poolIndex;

			const result = updateLootTable(
				LootTableAction.moveGroupBetweenPools(groupId, 1),
				ultimateLoot
			);
			const group = result.groups.find((g) => g.id === groupId);
			expect(group?.poolIndex).toBe(1);
			expect(group?.poolIndex).not.toBe(originalPool);
		});

		it("should handle moving non-existent group gracefully", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.moveGroupBetweenPools("non_existent", 1),
				simpleLoot
			);
			expect(result.groups).toEqual(simpleLoot.groups);
		});
	});

	describe("balanceWeights", () => {
		it("should balance weights with target total", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			// Add more items to pool 0
			simpleLoot.items.push(
				{ id: "item_1", name: "minecraft:diamond", poolIndex: 0, entryIndex: 1, entryType: "minecraft:item", conditions: [], functions: [] },
				{ id: "item_2", name: "minecraft:emerald", poolIndex: 0, entryIndex: 2, entryType: "minecraft:item", conditions: [], functions: [] }
			);

			const result = updateLootTable(
				LootTableAction.balanceWeights(0, 90),
				simpleLoot
			);
			const poolItems = result.items.filter((item) => item.poolIndex === 0);
			const expectedWeight = Math.floor(90 / poolItems.length);

			for (const item of poolItems) {
				expect(item.weight).toBe(expectedWeight);
			}
		});

		it("should balance weights without target total", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			simpleLoot.items.push(
				{ id: "item_1", name: "minecraft:diamond", poolIndex: 0, entryIndex: 1, entryType: "minecraft:item", conditions: [], functions: [] },
				{ id: "item_2", name: "minecraft:emerald", poolIndex: 0, entryIndex: 2, entryType: "minecraft:item", conditions: [], functions: [] }
			);

			const result = updateLootTable(
				LootTableAction.balanceWeights(0),
				simpleLoot
			);
			const poolItems = result.items.filter((item) => item.poolIndex === 0);
			const expectedWeight = Math.floor(100 / poolItems.length);

			for (const item of poolItems) {
				expect(item.weight).toBe(expectedWeight);
			}
		});
	});

	describe("Core Actions on Loot Tables", () => {
		it("should set loot table values using core.set_value", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				CoreAction.setValue("randomSequence", "minecraft:custom/sequence"),
				simpleLoot
			);
			expect(result.randomSequence).toBe("minecraft:custom/sequence");

			const compiled = VoxelToLootDataDriven(result, "loot_table");
			expect(compiled.element.data.random_sequence).toBe("minecraft:custom/sequence");
		});

		it("should toggle loot table values using core.toggle_value", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				CoreAction.toggleValue("disabled", true),
				simpleLoot
			);
			expect(result.disabled).toBe(true);

			const compiled = VoxelToLootDataDriven(result, "loot_table");
			expect(compiled.element.data).toBeDefined();
		});

		it("should use core.set_undefined to remove properties", () => {
			const completeLoot = LootDataDrivenToVoxelFormat({ element: complete });
			const result = updateLootTable(
				CoreAction.setUndefined("randomSequence"),
				completeLoot
			);
			expect(result.randomSequence).toBeUndefined();

			const compiled = VoxelToLootDataDriven(result, "loot_table");
			expect(compiled.element.data.random_sequence).toBeUndefined();
		});
	});

	describe("Complex workflow scenarios", () => {
		it("should handle action chain on loot table", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const itemId = simpleLoot.items[0].id;

			const withNewItem = updateLootTable(
				LootTableAction.addLootItem(0, { name: "minecraft:diamond", weight: 10 }),
				simpleLoot
			);
			const withModified = updateLootTable(
				LootTableAction.modifyLootItem(itemId, "weight", 50),
				withNewItem
			);
			const withGroup = updateLootTable(
				LootTableAction.createLootGroup("alternatives", [itemId], 0),
				withModified
			);

			expect(withGroup.items).toHaveLength(2);
			expect(withGroup.items[0].weight).toBe(50);
			expect(withGroup.groups).toHaveLength(1);

			const compiled = VoxelToLootDataDriven(withGroup, "loot_table");
			expect(compiled.element.data.pools).toBeDefined();
		});

		it("should preserve identifier through loot table actions", () => {
			const simpleLoot = LootDataDrivenToVoxelFormat({ element: simple });
			const result = updateLootTable(
				LootTableAction.addLootItem(0, { name: "minecraft:coal" }),
				simpleLoot
			);
			expect(result.identifier).toBeDefined();
			expect(simpleLoot.identifier).toEqual(result.identifier);
		});
	});
});
