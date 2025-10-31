import { updateData } from "@/core/engine/actions";
import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect, beforeEach } from "vitest";
import { LootTableAction } from "@/core/engine/actions/domains/LootTableAction";
import { createZipFile, prepareFiles } from "@test/mock/utils";
import { complete, advanced, ultimate, finalBoss } from "@test/mock/loot/DataDriven";
import { Datapack } from "@/core/Datapack";

const lootFiles = {
	"data/test/loot_table/test.json": complete.data,
	"data/test/loot_table/advanced.json": advanced.data,
	"data/test/loot_table/ultimate.json": ultimate.data,
	"data/test/loot_table/final_boss.json": finalBoss.data
};

function updateLootTable(action: any, lootTable: LootTableProps, packVersion = 48): LootTableProps {
	const result = updateData(action, lootTable, packVersion);
	expect(result).toBeDefined();
	return result as LootTableProps;
}

describe("LootTable E2E Tests", () => {
	describe("Complete workflow: Parse → Actions → Compile", () => {
		let parsedDatapack: ReturnType<Datapack["parse"]>;
		let simpleLootTable: LootTableProps;
		let advancedLootTable: LootTableProps;
		let ultimateLootTable: LootTableProps;
		let finalBossLootTable: LootTableProps;

		beforeEach(async () => {
			const lootTableZip = await createZipFile(prepareFiles(lootFiles));
			const datapack = await Datapack.from(lootTableZip);
			parsedDatapack = datapack.parse();

			const lootTables = Array.from(parsedDatapack.elements.values()).filter(
				(element): element is LootTableProps => element.identifier.registry === "loot_table"
			);

			expect(lootTables).toBeDefined();
			expect(lootTables).toHaveLength(4);

			const foundSimple = lootTables.find((lt) => lt.identifier.resource === "test");
			const foundAdvanced = lootTables.find((lt) => lt.identifier.resource === "advanced");
			const foundUltimate = lootTables.find((lt) => lt.identifier.resource === "ultimate");
			const foundFinalBoss = lootTables.find((lt) => lt.identifier.resource === "final_boss");

			expect(foundSimple).toBeDefined();
			expect(foundAdvanced).toBeDefined();
			expect(foundUltimate).toBeDefined();
			expect(foundFinalBoss).toBeDefined();

			simpleLootTable = foundSimple as LootTableProps;
			advancedLootTable = foundAdvanced as LootTableProps;
			ultimateLootTable = foundUltimate as LootTableProps;
			finalBossLootTable = foundFinalBoss as LootTableProps;
		});

		describe("Round-trip purity (Parse → Compile without actions)", () => {
			it("should preserve simple loot table data perfectly", () => {
				const compiled = VoxelToLootDataDriven(simpleLootTable, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);
				expect(compiled.element.data.functions).toHaveLength(1);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				const pool = compiled.element.data.pools?.[0];
				expect(pool).toBeDefined();
				expect(pool?.entries).toHaveLength(1);
				expect(pool?.rolls).toEqual(0);
				expect(pool?.functions).toHaveLength(1);
				expect(pool?.conditions).toHaveLength(0);

				const entry = pool?.entries[0];
				expect(entry).toBeDefined();
				expect(entry?.type).toBe("minecraft:item");
				expect(entry?.name).toBe("minecraft:acacia_sapling");

				const poolFunction = pool?.functions?.[0];
				expect(poolFunction).toBeDefined();
				expect(poolFunction?.function).toBe("minecraft:set_count");
				expect(poolFunction?.count).toBe(2);
				expect(poolFunction?.conditions).toHaveLength(1);

				const tableFunction = compiled.element.data.functions?.[0];
				expect(tableFunction).toBeDefined();
				expect(tableFunction?.function).toBe("minecraft:enchant_with_levels");
				expect(tableFunction?.levels).toBe(10);
				expect(compiled.element.identifier).toEqual(simpleLootTable.identifier);
			});

			it("should preserve advanced loot table with groups perfectly", () => {
				const compiled = VoxelToLootDataDriven(advancedLootTable, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);
				expect(compiled.element.data.functions).toHaveLength(1);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				const pool = compiled.element.data.pools?.[0];
				expect(pool).toBeDefined();
				expect(pool?.entries).toHaveLength(2);
				expect(pool?.rolls).toEqual(0);

				const acaciaEntry = pool?.entries.find((e) => e.type === "minecraft:item");
				expect(acaciaEntry).toBeDefined();
				expect(acaciaEntry?.name).toBe("minecraft:acacia_sapling");

				const groupEntry = pool?.entries.find((e) => e.type === "minecraft:group");
				expect(groupEntry).toBeDefined();
				if (groupEntry) {
					expect(groupEntry.children).toHaveLength(1);
					expect(groupEntry.functions).toHaveLength(1);
				}

				expect(compiled.element.identifier).toEqual(advancedLootTable.identifier);
			});

			it("should preserve ultimate loot table with complex nesting perfectly", () => {
				const compiled = VoxelToLootDataDriven(ultimateLootTable, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);
				expect(compiled.element.data.functions).toHaveLength(1);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				const pool = compiled.element.data.pools?.[0];
				expect(pool).toBeDefined();
				expect(pool?.entries).toHaveLength(5);
				expect(pool?.rolls).toEqual(0);

				const acaciaEntry = pool?.entries.find((e) => e.type === "minecraft:item" && e.name === "minecraft:acacia_sapling");
				expect(acaciaEntry).toBeDefined();

				const groupEntry = pool?.entries.find((e) => e.type === "minecraft:group");
				expect(groupEntry).toBeDefined();
				if (groupEntry) {
					expect(groupEntry.children).toHaveLength(1);
					expect(groupEntry.functions).toHaveLength(0);
				}

				const lootTableEntry = pool?.entries.find((e) => e.type === "minecraft:loot_table");
				expect(lootTableEntry).toBeDefined();
				expect(lootTableEntry?.value).toBe("minecraft:blocks/acacia_wood");

				const emptyEntry = pool?.entries.find((e) => e.type === "minecraft:empty");
				expect(emptyEntry).toBeDefined();

				const alternativesEntry = pool?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(alternativesEntry).toBeDefined();
				expect(alternativesEntry?.children).toHaveLength(1);

				const nestedGroup = alternativesEntry?.children?.[0];
				expect(nestedGroup).toBeDefined();
				expect(nestedGroup?.type).toBe("minecraft:group");
				expect(nestedGroup?.children).toHaveLength(1);

				const tableFunction = compiled.element.data.functions?.[0];
				expect(tableFunction).toBeDefined();
				expect(tableFunction?.function).toBe("minecraft:enchant_with_levels");
				expect(tableFunction?.levels).toBe(10);

				const poolFunction = pool?.functions?.[0];
				expect(poolFunction).toBeDefined();
				expect(poolFunction?.function).toBe("minecraft:set_count");
				expect(poolFunction?.count).toBe(2);
				expect(compiled.element.identifier).toEqual(ultimateLootTable.identifier);
			});

			it("should preserve final boss loot table with complex NumberProviders and nested structures perfectly", () => {
				const compiled = VoxelToLootDataDriven(finalBossLootTable, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(2);
				expect(compiled.element.data.functions).toHaveLength(1);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				const pool1 = compiled.element.data.pools?.[0];
				expect(pool1).toBeDefined();
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

				expect(pool1?.entries).toHaveLength(9);

				const alternativesEntry = pool1?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(alternativesEntry).toBeDefined();
				expect(alternativesEntry?.children).toHaveLength(1);

				const emptyInAlternatives = alternativesEntry?.children?.[0];
				expect(emptyInAlternatives?.type).toBe("minecraft:empty");
				expect(emptyInAlternatives?.weight).toBe(1);
				expect(emptyInAlternatives?.quality).toBe(10);
				expect(emptyInAlternatives?.functions).toHaveLength(1);
				expect(emptyInAlternatives?.conditions).toHaveLength(1);

				const dynamicEntry = pool1?.entries.find((e) => e.type === "minecraft:dynamic");
				expect(dynamicEntry).toBeDefined();
				expect(dynamicEntry?.name).toBe("minecraft:sherds");

				const groupEntry = pool1?.entries.find((e) => e.type === "minecraft:group");
				expect(groupEntry).toBeDefined();
				expect(groupEntry?.children).toHaveLength(1);
				expect(groupEntry?.children?.[0]?.type).toBe("minecraft:empty");

				const acaciaSignEntry = pool1?.entries.find((e) => e.type === "minecraft:item" && e.name === "minecraft:acacia_sign");
				expect(acaciaSignEntry).toBeDefined();

				const alliumEntry = pool1?.entries.find((e) => e.type === "minecraft:item" && e.name === "minecraft:allium");
				expect(alliumEntry).toBeDefined();

				const lootTableEntries = pool1?.entries.filter((e) => e.type === "minecraft:loot_table");
				expect(lootTableEntries).toHaveLength(2);

				const stringLootTable = lootTableEntries?.find((e) => typeof e.value === "string");
				expect(stringLootTable?.value).toBe("minecraft:blocks/acacia_slab");

				const objectLootTable = lootTableEntries?.find((e) => typeof e.value === "object");
				expect(objectLootTable?.value).toEqual({ type: "minecraft:block", pools: [{ rolls: 1, entries: [] }] });

				const sequenceEntry = pool1?.entries.find((e) => e.type === "minecraft:sequence");
				expect(sequenceEntry).toBeDefined();
				expect(sequenceEntry?.children).toHaveLength(1);

				const nestedGroup = sequenceEntry?.children?.[0];
				expect(nestedGroup?.type).toBe("minecraft:group");
				expect(nestedGroup?.children).toHaveLength(1);

				const nestedAlternatives = nestedGroup?.children?.[0];
				expect(nestedAlternatives?.type).toBe("minecraft:alternatives");
				expect(nestedAlternatives?.children).toHaveLength(2);

				const tagEntry = pool1?.entries.find((e) => e.type === "minecraft:tag");
				expect(tagEntry).toBeDefined();
				expect(tagEntry?.name).toBe("minecraft:buttons");
				expect(tagEntry?.expand).toBe(true);
				expect(tagEntry?.weight).toBe(1);
				expect(tagEntry?.quality).toBe(10);
				expect(pool1?.functions).toHaveLength(1);
				expect(pool1?.functions?.[0]?.function).toBe("minecraft:apply_bonus");
				expect(pool1?.conditions).toHaveLength(1);
				expect(pool1?.conditions?.[0]?.condition).toBe("minecraft:weather_check");

				const pool2 = compiled.element.data.pools?.[1];
				expect(pool2).toBeDefined();
				expect(pool2?.rolls).toBe(1);
				expect(pool2?.bonus_rolls).toBe(1);
				expect(pool2?.entries).toHaveLength(0);

				const tableFunction = compiled.element.data.functions?.[0];
				expect(tableFunction).toBeDefined();
				expect(tableFunction?.function).toBe("minecraft:apply_bonus");
				expect(tableFunction?.enchantment).toBe("minecraft:luck_of_the_sea");
				expect(compiled.element.identifier).toEqual(finalBossLootTable.identifier);
			});

			it("should identify data loss in simple loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/test.json"];
				const compiled = VoxelToLootDataDriven(simpleLootTable, "loot_table");
				const compiledData = compiled.element.data;
				expect(compiledData.pools).toHaveLength(originalJson.pools?.length ?? 0);
				expect(compiledData.functions).toHaveLength(originalJson.functions?.length ?? 0);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.rolls).toBe(originalJson.pools?.[0]?.rolls);
				expect(originalJson.pools?.[0]?.rolls).toBe(0);

				expect(compiledData.pools?.[0]?.entries).toHaveLength(originalJson.pools?.[0]?.entries?.length ?? 0);
				expect(compiledData.pools?.[0]?.functions).toHaveLength(originalJson.pools?.[0]?.functions?.length ?? 0);

				const originalEntry = originalJson.pools?.[0]?.entries?.[0];
				const compiledEntry = compiledData.pools?.[0]?.entries[0];
				expect(compiledEntry?.type).toBe(originalEntry?.type);
				expect(compiledEntry?.name).toBe(originalEntry?.name);
			});

			it("should identify data loss in advanced loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/advanced.json"];
				const compiled = VoxelToLootDataDriven(advancedLootTable, "loot_table");
				const compiledData = compiled.element.data;
				expect(compiledData.pools).toHaveLength(originalJson.pools?.length ?? 0);
				expect(compiledData.functions).toHaveLength(originalJson.functions?.length ?? 0);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(originalJson.pools?.[0]?.entries?.length ?? 0);

				const originalGroupEntry = originalJson.pools?.[0]?.entries?.find((e: any) => e.type === "minecraft:group");
				const compiledGroupEntry = compiledData.pools?.[0]?.entries.find((e) => e.type === "minecraft:group");
				expect(compiledGroupEntry).toBeDefined();
				expect(originalGroupEntry).toBeDefined();
				expect(compiledGroupEntry?.children).toHaveLength(1);
				expect(originalGroupEntry?.children?.length).toBe(1);
				expect(compiledGroupEntry?.functions).toHaveLength(1);
				expect(originalGroupEntry?.functions?.length).toBe(1);

				const originalTag = originalGroupEntry?.children?.[0];
				expect(originalTag?.type).toBe("minecraft:tag");
				expect(originalTag?.name).toBe("minecraft:bundles");
				expect(originalTag?.expand).toBe(true);
			});

			it("should identify data loss in ultimate loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/ultimate.json"];
				const compiled = VoxelToLootDataDriven(ultimateLootTable, "loot_table");
				const compiledData = compiled.element.data;
				expect(compiledData.pools).toHaveLength(originalJson.pools?.length ?? 0);
				expect(compiledData.functions).toHaveLength(originalJson.functions?.length ?? 0);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(5);
				expect(originalJson.pools?.[0]?.entries?.length).toBe(5);

				const originalTypes = originalJson.pools?.[0]?.entries?.map((e: any) => e.type) ?? [];
				const compiledTypes = compiledData.pools?.[0]?.entries.map((e) => e.type) || [];
				expect(compiledTypes).toContain("minecraft:item");
				expect(compiledTypes).toContain("minecraft:group");
				expect(compiledTypes).toContain("minecraft:loot_table");
				expect(compiledTypes).toContain("minecraft:alternatives");
				expect(compiledTypes).toContain("minecraft:empty");
				expect(originalTypes).toContain("minecraft:empty");
			});

			it("should identify data preservation in final boss loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/final_boss.json"];
				const compiled = VoxelToLootDataDriven(finalBossLootTable, "loot_table");
				const compiledData = compiled.element.data;

				expect(compiledData.pools).toHaveLength(originalJson.pools?.length ?? 0);
				expect(compiledData.functions).toHaveLength(originalJson.functions?.length ?? 0);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.rolls).toBe(originalJson.pools?.[0]?.rolls);
				expect(compiledData.pools?.[0]?.bonus_rolls).toEqual(originalJson.pools?.[0]?.bonus_rolls);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(9);
				expect(originalJson.pools?.[0]?.entries?.length).toBe(9);

				const compiledTypes = compiledData.pools?.[0]?.entries.map((e) => e.type) || [];
				expect(compiledTypes).toContain("minecraft:alternatives");
				expect(compiledTypes).toContain("minecraft:dynamic");
				expect(compiledTypes).toContain("minecraft:group");
				expect(compiledTypes).toContain("minecraft:item");
				expect(compiledTypes).toContain("minecraft:loot_table");
				expect(compiledTypes).toContain("minecraft:sequence");
				expect(compiledTypes).toContain("minecraft:tag");

				const originalAlternatives = originalJson.pools?.[0]?.entries?.find((e: any) => e.type === "minecraft:alternatives");
				const compiledAlternatives = compiledData.pools?.[0]?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(compiledAlternatives).toBeDefined();
				expect(originalAlternatives).toBeDefined();
				expect(originalAlternatives?.children).toBeDefined();
				expect(compiledAlternatives?.children).toBeDefined();
				expect(compiledAlternatives?.children).toHaveLength(originalAlternatives?.children?.length || 0);

				const originalLootTables = originalJson.pools?.[0]?.entries?.filter((e: any) => e.type === "minecraft:loot_table") ?? [];
				const compiledLootTables = compiledData.pools?.[0]?.entries.filter((e) => e.type === "minecraft:loot_table");
				expect(compiledLootTables).toHaveLength(originalLootTables.length);

				const embeddedLootTable = compiledLootTables?.find((e) => typeof e.value === "object");
				const originalEmbedded = originalLootTables.find((e: any) => typeof e.value === "object");
				expect(embeddedLootTable).toBeDefined();
				expect(embeddedLootTable?.value).toBeDefined();
				expect(originalEmbedded).toBeDefined();
				expect(originalEmbedded?.value).toBeDefined();

				expect(embeddedLootTable?.value).toEqual(originalEmbedded?.value);
				expect(compiledData.pools?.[0]?.functions).toBeDefined();
				expect(compiledData.pools?.[0]?.conditions).toBeDefined();
				expect(compiledData.pools?.[0]?.functions).toHaveLength(originalJson?.pools?.[0]?.functions?.length || 0);
				expect(compiledData.pools?.[0]?.conditions).toHaveLength(originalJson?.pools?.[0]?.conditions?.length || 0);
				expect(compiledData.pools?.[1]?.rolls).toBe(originalJson.pools?.[1]?.rolls);
				expect(compiledData.pools?.[1]?.bonus_rolls).toBe(originalJson.pools?.[1]?.bonus_rolls);
				expect(compiledData.pools?.[1]?.entries).toHaveLength(originalJson.pools?.[1]?.entries?.length ?? 0);
			});
		});

		describe("Ultimate loot table workflow", () => {
			it("should handle complex group operations", () => {
				const dissolveGroupAction = LootTableAction.dissolveLootGroup("group_1");
				const resultAfterDissolve = updateLootTable(dissolveGroupAction, ultimateLootTable);
				expect(resultAfterDissolve.groups).toHaveLength(2);

				const createSequenceAction = LootTableAction.createLootGroup("sequence", ["item_0", "item_1"], 0);
				const resultAfterSequence = updateLootTable(createSequenceAction, resultAfterDissolve);
				expect(resultAfterSequence.groups).toHaveLength(3);

				const sequenceGroup = resultAfterSequence.groups.find((g) => g.type === "sequence");
				expect(sequenceGroup).toBeDefined();
				expect(sequenceGroup?.items).toEqual(["item_0", "item_1"]);

				const duplicateAction = LootTableAction.duplicateLootItem("item_0", 1);
				const resultAfterDuplicate = updateLootTable(duplicateAction, resultAfterSequence);
				expect(resultAfterDuplicate.items).toHaveLength(6);

				const duplicatedItem = resultAfterDuplicate.items.find((item) => item.name === "minecraft:acacia_sapling" && item.poolIndex === 1);
				expect(duplicatedItem).toBeDefined();
				expect(duplicatedItem?.id).not.toBe("item_0");

				const compiled = VoxelToLootDataDriven(resultAfterDuplicate, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(2);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");
				expect(compiled.element.data.functions).toHaveLength(1);

				const firstFunction = compiled.element.data.functions?.[0];
				expect(firstFunction).toBeDefined();
				expect(firstFunction?.function).toBe("minecraft:enchant_with_levels");
			});
		});

		describe("Final Boss loot table workflow", () => {
			it("should handle complex actions on final boss loot table", () => {
				const table = finalBossLootTable;
				const originalItemCount = table.items.length;
				const originalGroupCount = table.groups.length;
				const addLegendaryAction = LootTableAction.addLootItem(0, {
					name: "minecraft:netherite_sword",
					weight: 1,
					quality: 100
				});

				const result = updateLootTable(addLegendaryAction, table);
				expect(result.items).toHaveLength(originalItemCount + 1);

				const createRareGroupAction = LootTableAction.createLootGroup(
					"alternatives",
					[result.items[result.items.length - 1].id],
					0
				);

				const updatedTable = updateLootTable(createRareGroupAction, table);
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
				const table = finalBossLootTable;
				const complexGroup = table.groups.find((g) => g.items.length > 0);

				if (complexGroup) {
					const originalItems = [...complexGroup.items];
					const dissolveAction = LootTableAction.dissolveLootGroup(complexGroup.id);
					const dissolvedTable = updateLootTable(dissolveAction, table);
					for (const itemId of originalItems) {
						const item = dissolvedTable.items.find((i) => i.id === itemId);
						expect(item).toBeDefined();
					}
				}

				const compiled = VoxelToLootDataDriven(table, "loot_table");
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
		});

		describe("Round-trip integrity", () => {
			it("should maintain data integrity through full workflow", () => {
				const table = ultimateLootTable;
				const originalItemCount = table.items.length;
				const originalGroupCount = table.groups.length;

				const actions = [
					LootTableAction.addLootItem(0, { name: "minecraft:diamond_block", weight: 1, quality: 15 }),
					LootTableAction.modifyLootItem("item_0", "weight", 100),
					LootTableAction.createLootGroup("alternatives", ["item_0", "item_4"], 0),
					LootTableAction.moveItemBetweenPools("item_1", 1)
				];

				const result = actions.reduce((acc, action) => updateLootTable(action, acc), table);
				expect(result.items).toHaveLength(originalItemCount + 1);
				expect(result.groups).toHaveLength(originalGroupCount + 1);

				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data).toBeDefined();
				expect(compiled.element.data.pools).toHaveLength(2);
				expect(compiled.element.identifier).toEqual(ultimateLootTable.identifier);

				const pool0 = compiled.element.data.pools?.[0];
				expect(pool0).toBeDefined();

				const alternativesEntry = pool0?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(alternativesEntry).toBeDefined();
				expect(alternativesEntry?.children).toBeDefined();
				expect(alternativesEntry?.children?.length).toBeGreaterThan(0);
				expect(compiled.element.data.random_sequence).toBe(ultimateLootTable.randomSequence);
				expect(compiled.element.data.functions).toEqual(ultimateLootTable.functions);
			});
		});

		describe("Error handling and edge cases", () => {
			it("should handle empty groups correctly", () => {
				const table = advancedLootTable;
				const dissolveGroupAction = LootTableAction.dissolveLootGroup("group_0");
				const result = updateLootTable(dissolveGroupAction, table);
				expect(result.groups).toHaveLength(0);

				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);

				const firstPool = compiled.element.data.pools?.[0];
				expect(firstPool).toBeDefined();
				expect(firstPool?.entries).toHaveLength(2);
			});
		});
	});
});
