import { updateData } from "@/core/engine/actions";
import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect } from "vitest";
import { LootTableAction } from "@/core/engine/actions/domains/LootTableAction";
import { advanced, ultimate, finalBoss } from "@test/mock/concept/loot";

function updateLootTable(action: any, lootTable: LootTableProps, packVersion = 48): LootTableProps {
	const result = updateData(action, lootTable, packVersion);
	expect(result).toBeDefined();
	return result as LootTableProps;
}

describe("LootTable E2E Tests", () => {
	describe("Complete workflow: Parse → Actions → Compile", () => {
		it("should handle complex group operations", () => {
			const voxel = LootDataDrivenToVoxelFormat({ element: ultimate });
			const groupToDissolve = voxel.groups[1];
			const dissolveGroupAction = LootTableAction.dissolveLootGroup(groupToDissolve.id);
			const resultAfterDissolve = updateLootTable(dissolveGroupAction, voxel);
			expect(resultAfterDissolve.groups).toHaveLength(2);

			const item0Id = voxel.items[0].id;
			const item1Id = voxel.items[1].id;
			const createSequenceAction = LootTableAction.createLootGroup("sequence", [item0Id, item1Id], 0);
			const resultAfterSequence = updateLootTable(createSequenceAction, resultAfterDissolve);
			expect(resultAfterSequence.groups).toHaveLength(3);

			const sequenceGroup = resultAfterSequence.groups.find((g) => g.type === "sequence");
			expect(sequenceGroup).toBeDefined();
			expect(sequenceGroup?.items).toEqual([item0Id, item1Id]);

			const duplicateAction = LootTableAction.duplicateLootItem(item0Id, 1);
			const resultAfterDuplicate = updateLootTable(duplicateAction, resultAfterSequence);
			expect(resultAfterDuplicate.items).toHaveLength(6);

			const duplicatedItem = resultAfterDuplicate.items.find(
				(item) => item.name === "minecraft:acacia_sapling" && item.poolIndex === 1
			);
			expect(duplicatedItem).toBeDefined();
			expect(duplicatedItem?.id).not.toBe(item0Id);

			const compiled = VoxelToLootDataDriven(resultAfterDuplicate, "loot_table");
			expect(compiled.element.data.pools).toHaveLength(2);
			expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");
			expect(compiled.element.data.functions).toHaveLength(1);

			const firstFunction = compiled.element.data.functions?.[0];
			expect(firstFunction).toBeDefined();
			expect(firstFunction?.function).toBe("minecraft:enchant_with_levels");
		});

		it("should handle complex actions on final boss loot table", () => {
			const voxel = LootDataDrivenToVoxelFormat({ element: finalBoss });
			const originalItemCount = voxel.items.length;
			const originalGroupCount = voxel.groups.length;
			const addLegendaryAction = LootTableAction.addLootItem(0, {
				name: "minecraft:netherite_sword",
				weight: 1,
				quality: 100
			});

			const result = updateLootTable(addLegendaryAction, voxel);
			expect(result.items).toHaveLength(originalItemCount + 1);

			const createRareGroupAction = LootTableAction.createLootGroup("alternatives", [result.items[result.items.length - 1].id], 0);

			const updatedTable = updateLootTable(createRareGroupAction, voxel);
			expect(updatedTable.groups).toHaveLength(originalGroupCount + 1);

			const moveItemAction = LootTableAction.moveItemBetweenPools(updatedTable.items[0].id, 1);
			const movedTable = updateLootTable(moveItemAction, updatedTable);
			const movedItem = movedTable.items.find((item) => item.poolIndex === 1 && item.id === movedTable.items[0].id);
			expect(movedItem).toBeDefined();

			const compiled = VoxelToLootDataDriven(movedTable, "loot_table");
			expect(compiled.element.data.pools).toHaveLength(2);

			const pool0 = compiled.element.data.pools?.[0];
			const alternativesEntries = pool0?.entries.filter((e) => e.type === "minecraft:alternatives");
			expect(alternativesEntries?.length).toBeGreaterThan(0);
			expect(pool0?.bonus_rolls).toEqual({
				type: "minecraft:binomial",
				n: 1,
				p: {
					type: "minecraft:enchantment_level",
					amount: {
						type: "minecraft:lookup",
						values: [1, 1],
						fallback: 1
					}
				}
			});
		});

		it("should preserve complex nested structures through actions", () => {
			const voxel = LootDataDrivenToVoxelFormat({ element: finalBoss });
			const complexGroup = voxel.groups.find((g) => g.items.length > 0);

			if (complexGroup) {
				const originalItems = [...complexGroup.items];
				const dissolveAction = LootTableAction.dissolveLootGroup(complexGroup.id);
				const dissolvedTable = updateLootTable(dissolveAction, voxel);
				for (const itemId of originalItems) {
					const item = dissolvedTable.items.find((i) => i.id === itemId);
					expect(item).toBeDefined();
				}
			}

			const compiled = VoxelToLootDataDriven(voxel, "loot_table");
			expect(compiled.element.data.pools).toHaveLength(2);
			expect(compiled.element.data.functions).toHaveLength(1);
			expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

			const pool1 = compiled.element.data.pools?.[0];
			expect(pool1?.rolls).toBe(1);
			expect(pool1?.bonus_rolls).toEqual({
				type: "minecraft:binomial",
				n: 1,
				p: {
					type: "minecraft:enchantment_level",
					amount: {
						type: "minecraft:lookup",
						values: [1, 1],
						fallback: 1
					}
				}
			});
		});

		it("should maintain data integrity through full workflow", () => {
			const voxel = LootDataDrivenToVoxelFormat({ element: ultimate });
			const originalItemCount = voxel.items.length;
			const originalGroupCount = voxel.groups.length;
			const item0Id = voxel.items[0].id;
			const item4Id = voxel.items[4].id;

			const actions = [
				LootTableAction.addLootItem(0, { name: "minecraft:diamond_block", weight: 1, quality: 15 }),
				LootTableAction.modifyLootItem(item0Id, "weight", 100),
				LootTableAction.createLootGroup("alternatives", [item0Id, item4Id], 0),
				LootTableAction.moveItemBetweenPools(voxel.items[1].id, 1)
			];

			const result = actions.reduce((acc, action) => updateLootTable(action, acc), voxel);
			expect(result.items).toHaveLength(originalItemCount + 1);
			expect(result.groups).toHaveLength(originalGroupCount + 1);

			const compiled = VoxelToLootDataDriven(result, "loot_table");
			expect(compiled.element.data).toBeDefined();
			expect(compiled.element.data.pools).toHaveLength(2);
			expect(compiled.element.identifier).toEqual(voxel.identifier);

			const pool0 = compiled.element.data.pools?.[0];
			expect(pool0).toBeDefined();

			const alternativesEntry = pool0?.entries.find((e) => e.type === "minecraft:alternatives");
			expect(alternativesEntry).toBeDefined();
			expect(alternativesEntry?.children).toBeDefined();
			expect(alternativesEntry?.children?.length).toBeGreaterThan(0);
			expect(compiled.element.data.random_sequence).toBe(voxel.randomSequence);
			expect(compiled.element.data.functions).toEqual(voxel.functions);
		});

		it("should handle empty groups correctly", () => {
			const voxel = LootDataDrivenToVoxelFormat({ element: advanced });
			const dissolveGroupAction = LootTableAction.dissolveLootGroup(voxel.groups[0].id);
			const result = updateLootTable(dissolveGroupAction, voxel);
			expect(result.groups).toHaveLength(0);

			const compiled = VoxelToLootDataDriven(result, "loot_table");
			expect(compiled.element.data.pools).toHaveLength(1);

			const firstPool = compiled.element.data.pools?.[0];
			expect(firstPool).toBeDefined();
			expect(firstPool?.entries).toHaveLength(2);
		});
	});
});
