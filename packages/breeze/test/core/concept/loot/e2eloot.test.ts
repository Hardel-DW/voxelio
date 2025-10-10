import { updateData } from "@/core/engine/actions";
import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect, beforeEach } from "vitest";
import { LootTableAction } from "@/core/engine/actions/domains/LootTableAction";
import { createZipFile, prepareFiles } from "@test/mock/utils";
import { completeLootTable, advancedLootTable, ultimateTestLootTable, finalBossOfLootTable } from "@test/mock/loot/DataDriven";
import { Datapack } from "@/core/Datapack";

const lootFiles = {
	"data/test/loot_table/test.json": completeLootTable,
	"data/test/loot_table/advanced.json": advancedLootTable,
	"data/test/loot_table/ultimate.json": ultimateTestLootTable,
	"data/test/loot_table/final_boss.json": finalBossOfLootTable
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

				// Verify group with empty child
				const groupEntry = pool1?.entries.find((e) => e.type === "minecraft:group");
				expect(groupEntry).toBeDefined();
				expect(groupEntry?.children).toHaveLength(1);
				expect(groupEntry?.children?.[0]?.type).toBe("minecraft:empty");

				// Verify regular items
				const acaciaSignEntry = pool1?.entries.find((e) => e.type === "minecraft:item" && e.name === "minecraft:acacia_sign");
				expect(acaciaSignEntry).toBeDefined();
				const alliumEntry = pool1?.entries.find((e) => e.type === "minecraft:item" && e.name === "minecraft:allium");
				expect(alliumEntry).toBeDefined();

				// Verify loot table entries (both string and object)
				const lootTableEntries = pool1?.entries.filter((e) => e.type === "minecraft:loot_table");
				expect(lootTableEntries).toHaveLength(2);
				const stringLootTable = lootTableEntries?.find((e) => typeof e.value === "string");
				expect(stringLootTable?.value).toBe("minecraft:blocks/acacia_slab");
				const objectLootTable = lootTableEntries?.find((e) => typeof e.value === "object");
				expect(objectLootTable?.value).toEqual({ type: "minecraft:block", pools: [{ rolls: 1, entries: [] }] });

				// Verify sequence with deeply nested structure
				const sequenceEntry = pool1?.entries.find((e) => e.type === "minecraft:sequence");
				expect(sequenceEntry).toBeDefined();
				expect(sequenceEntry?.children).toHaveLength(1);
				const nestedGroup = sequenceEntry?.children?.[0];
				expect(nestedGroup?.type).toBe("minecraft:group");
				expect(nestedGroup?.children).toHaveLength(1);
				const nestedAlternatives = nestedGroup?.children?.[0];
				expect(nestedAlternatives?.type).toBe("minecraft:alternatives");
				expect(nestedAlternatives?.children).toHaveLength(2);

				// Verify tag entry with properties
				const tagEntry = pool1?.entries.find((e) => e.type === "minecraft:tag");
				expect(tagEntry).toBeDefined();
				expect(tagEntry?.name).toBe("minecraft:buttons");
				expect(tagEntry?.expand).toBe(true);
				expect(tagEntry?.weight).toBe(1);
				expect(tagEntry?.quality).toBe(10);

				// Verify pool functions and conditions
				expect(pool1?.functions).toHaveLength(1);
				expect(pool1?.functions?.[0]?.function).toBe("minecraft:apply_bonus");
				expect(pool1?.conditions).toHaveLength(1);
				expect(pool1?.conditions?.[0]?.condition).toBe("minecraft:weather_check");

				// Verify second pool (simple pool)
				const pool2 = compiled.element.data.pools?.[1];
				expect(pool2).toBeDefined();
				expect(pool2?.rolls).toBe(1);
				expect(pool2?.bonus_rolls).toBe(1);
				expect(pool2?.entries).toHaveLength(0);

				// Verify table-level functions
				const tableFunction = compiled.element.data.functions?.[0];
				expect(tableFunction).toBeDefined();
				expect(tableFunction?.function).toBe("minecraft:apply_bonus");
				expect(tableFunction?.enchantment).toBe("minecraft:luck_of_the_sea");

				// Verify identifier preservation
				expect(compiled.element.identifier).toEqual(finalBossLootTable.identifier);
			});

			it("should identify data loss in simple loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/test.json"];
				const compiled = VoxelToLootDataDriven(simpleLootTable, "loot_table");
				const compiledData = compiled.element.data;
				expect(compiledData.pools).toHaveLength(originalJson.pools.length);
				expect(compiledData.functions).toHaveLength(originalJson.functions.length);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.rolls).toBe(originalJson.pools[0].rolls);
				expect(originalJson.pools[0].rolls).toBe(0);

				expect(compiledData.pools?.[0]?.entries).toHaveLength(originalJson.pools[0].entries.length);
				expect(compiledData.pools?.[0]?.functions).toHaveLength(originalJson.pools[0].functions.length);

				const originalEntry = originalJson.pools[0].entries[0];
				const compiledEntry = compiledData.pools?.[0]?.entries[0];
				expect(compiledEntry?.type).toBe(originalEntry.type);
				expect(compiledEntry?.name).toBe(originalEntry.name);
			});

			it("should identify data loss in advanced loot table", () => {
				const originalJson = lootFiles["data/test/loot_table/advanced.json"];
				const compiled = VoxelToLootDataDriven(advancedLootTable, "loot_table");
				const compiledData = compiled.element.data;

				// Compare key structures
				expect(compiledData.pools).toHaveLength(originalJson.pools.length);
				expect(compiledData.functions).toHaveLength(originalJson.functions.length);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(originalJson.pools[0].entries.length);

				const originalGroupEntry = originalJson.pools[0].entries.find((e: any) => e.type === "minecraft:group");
				const compiledGroupEntry = compiledData.pools?.[0]?.entries.find((e) => e.type === "minecraft:group");
				expect(compiledGroupEntry).toBeDefined();
				expect(originalGroupEntry).toBeDefined();
				expect(compiledGroupEntry?.children).toHaveLength(1);
				expect(originalGroupEntry?.children?.length).toBe(1);
				expect(compiledGroupEntry?.functions).toHaveLength(1);
				expect(originalGroupEntry?.functions?.length).toBe(1);

				// The original tag is lost during parsing/compilation
				const originalTag = originalGroupEntry?.children?.[0];
				expect(originalTag?.type).toBe("minecraft:tag");
				expect(originalTag?.name).toBe("minecraft:bundles");
				expect(originalTag?.expand).toBe(true);
			});

			it("should identify data loss in ultimate loot table", () => {
				// Get the original JSON from the template
				const originalJson = lootFiles["data/test/loot_table/ultimate.json"];

				// Compile back to Minecraft format
				const compiled = VoxelToLootDataDriven(ultimateLootTable, "loot_table");
				const compiledData = compiled.element.data;
				expect(compiledData.pools).toHaveLength(originalJson.pools.length);
				expect(compiledData.functions).toHaveLength(originalJson.functions.length);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(5);
				expect(originalJson.pools[0].entries.length).toBe(5);

				// Verify entry types - all are preserved
				const originalTypes = originalJson.pools[0].entries.map((e: any) => e.type);
				const compiledTypes = compiledData.pools?.[0]?.entries.map((e) => e.type) || [];
				expect(compiledTypes).toContain("minecraft:item");
				expect(compiledTypes).toContain("minecraft:group");
				expect(compiledTypes).toContain("minecraft:loot_table");
				expect(compiledTypes).toContain("minecraft:alternatives");
				expect(compiledTypes).toContain("minecraft:empty");
				expect(originalTypes).toContain("minecraft:empty");
			});

			it("should identify data preservation in final boss loot table", () => {
				// Get the original JSON from the template
				const originalJson = lootFiles["data/test/loot_table/final_boss.json"];

				// Compile back to Minecraft format
				const compiled = VoxelToLootDataDriven(finalBossLootTable, "loot_table");
				const compiledData = compiled.element.data;

				// Compare key structures
				expect(compiledData.pools).toHaveLength(originalJson.pools.length);
				expect(compiledData.functions).toHaveLength(originalJson.functions.length);
				expect(compiledData.random_sequence).toBe(originalJson.random_sequence);
				expect(compiledData.pools?.[0]?.rolls).toBe(originalJson.pools[0].rolls);
				expect(compiledData.pools?.[0]?.bonus_rolls).toEqual(originalJson.pools[0].bonus_rolls);
				expect(compiledData.pools?.[0]?.entries).toHaveLength(9);
				expect(originalJson.pools[0].entries.length).toBe(9);

				// Verify all complex entry types are preserved
				const _originalTypes = originalJson.pools[0].entries.map((e: any) => e.type);
				const compiledTypes = compiledData.pools?.[0]?.entries.map((e) => e.type) || [];
				expect(compiledTypes).toContain("minecraft:alternatives");
				expect(compiledTypes).toContain("minecraft:dynamic");
				expect(compiledTypes).toContain("minecraft:group");
				expect(compiledTypes).toContain("minecraft:item");
				expect(compiledTypes).toContain("minecraft:loot_table");
				expect(compiledTypes).toContain("minecraft:sequence");
				expect(compiledTypes).toContain("minecraft:tag");

				const originalAlternatives = originalJson.pools[0].entries.find((e: any) => e.type === "minecraft:alternatives");
				const compiledAlternatives = compiledData.pools?.[0]?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(compiledAlternatives).toBeDefined();
				expect(originalAlternatives).toBeDefined();
				expect(originalAlternatives?.children).toBeDefined();
				expect(compiledAlternatives?.children).toBeDefined();
				expect(compiledAlternatives?.children).toHaveLength(originalAlternatives?.children?.length || 0);

				const originalLootTables = originalJson.pools[0].entries.filter((e: any) => e.type === "minecraft:loot_table");
				const compiledLootTables = compiledData.pools?.[0]?.entries.filter((e) => e.type === "minecraft:loot_table");
				expect(compiledLootTables).toHaveLength(originalLootTables.length);

				// Verify embedded object loot table is preserved
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
				expect(compiledData.pools?.[1]?.rolls).toBe(originalJson.pools[1].rolls);
				expect(compiledData.pools?.[1]?.bonus_rolls).toBe(originalJson.pools[1].bonus_rolls);
				expect(compiledData.pools?.[1]?.entries).toHaveLength(originalJson.pools[1].entries.length);
			});
		});

		describe("Simple loot table workflow", () => {
			it("should parse simple loot table correctly", () => {
				expect(simpleLootTable.identifier.namespace).toBe("test");
				expect(simpleLootTable.identifier.resource).toBe("test");
				expect(simpleLootTable.items).toHaveLength(1);
				expect(simpleLootTable.groups).toHaveLength(0);

				const item = simpleLootTable.items[0];
				expect(item.name).toBe("minecraft:acacia_sapling");
				expect(item.poolIndex).toBe(0);
			});

			it("should add items through actions", () => {
				const addDiamondAction = LootTableAction.addLootItem(0, {
					name: "minecraft:diamond",
					weight: 1,
					quality: 10
				});

				const result1 = updateLootTable(addDiamondAction, simpleLootTable);
				expect(result1.items).toHaveLength(2);
				expect(result1.items[1].name).toBe("minecraft:diamond");
				expect(result1.items[1].weight).toBe(1);
				expect(result1.items[1].quality).toBe(10);

				const addEmeraldAction = LootTableAction.addLootItem(1, {
					name: "minecraft:emerald",
					weight: 5,
					quality: 5
				});

				const result2 = updateLootTable(addEmeraldAction, result1);
				expect(result2.items).toHaveLength(3);
				expect(result2.items[2].name).toBe("minecraft:emerald");
				expect(result2.items[2].poolIndex).toBe(1);
			});

			it("should create groups and compile correctly", () => {
				let result = simpleLootTable;

				const addActions = [
					LootTableAction.addLootItem(0, {
						name: "minecraft:diamond",
						weight: 1,
						quality: 10
					}),
					LootTableAction.addLootItem(0, {
						name: "minecraft:emerald",
						weight: 5,
						quality: 5
					}),
					LootTableAction.addLootItem(0, {
						name: "minecraft:gold_ingot",
						weight: 10,
						quality: 1
					})
				];

				for (const action of addActions) {
					result = updateLootTable(action, result);
				}

				expect(result.items).toHaveLength(4); // Original + 3 new items
				const createRareGroupAction = LootTableAction.createLootGroup("alternatives", ["item_1", "item_2"], 0);

				result = updateLootTable(createRareGroupAction, result);
				expect(result.groups).toHaveLength(1);
				expect(result.groups[0].type).toBe("alternatives");
				expect(result.groups[0].items).toEqual(["item_1", "item_2"]);

				// Compile back to Minecraft format
				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);

				const pool = compiled.element.data.pools?.[0];
				expect(pool).toBeDefined();
				expect(pool?.entries).toHaveLength(4);

				// Find the alternatives group entry
				const alternativesEntry = pool?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(alternativesEntry).toBeDefined();
				expect(alternativesEntry?.children).toBeDefined();

				const childNames = alternativesEntry?.children?.map((c) => c.name) || [];
				expect(childNames.length).toBeGreaterThan(0);
			});
		});

		describe("Advanced loot table workflow", () => {
			it("should parse advanced loot table with groups", () => {
				expect(advancedLootTable.items).toHaveLength(2); // acacia_sapling + tag (tag is processed as item)
				expect(advancedLootTable.groups).toHaveLength(1); // group containing the tag

				const group = advancedLootTable.groups[0];
				expect(group.type).toBe("group");
				expect(group.items).toHaveLength(1);
				expect(advancedLootTable.items[0].name).toBe("minecraft:acacia_sapling");
				expect(advancedLootTable.items[1].name).toBe("#minecraft:bundles"); // Tag item
			});

			it("should modify groups and move items between pools", () => {
				let result = advancedLootTable;

				// Add a new item to pool 1
				const addItemAction = LootTableAction.addLootItem(1, {
					name: "minecraft:netherite_ingot",
					weight: 1,
					quality: 20
				});

				result = updateLootTable(addItemAction, result);
				expect(result.items).toHaveLength(3); // acacia_sapling + tag + netherite_ingot
			});
		});

		describe("Ultimate loot table workflow", () => {
			it("should parse complex nested structure", () => {
				expect(ultimateLootTable.items).toHaveLength(5); // acacia_sapling, bundles tag, loot_table, empty, cherry_logs tag
				expect(ultimateLootTable.groups).toHaveLength(3); // Nested group structure

				// Should have alternatives, group, and nested groups
				const groupTypes = ultimateLootTable.groups.map((g) => g.type);
				expect(groupTypes).toContain("alternatives");
				expect(groupTypes).toContain("group");

				// Find loot_table reference
				const lootTableItem = ultimateLootTable.items.find((item) => item.name === "minecraft:blocks/acacia_wood");
				expect(lootTableItem).toBeDefined();
			});

			it("should handle complex group operations", () => {
				let result = ultimateLootTable;

				// Dissolve one of the nested groups
				const dissolveGroupAction = LootTableAction.dissolveLootGroup("group_1");

				result = updateLootTable(dissolveGroupAction, result);
				expect(result.groups).toHaveLength(2); // One group dissolved

				// Create a new sequence group with remaining items
				const createSequenceAction = LootTableAction.createLootGroup("sequence", ["item_0", "item_1"], 0);

				result = updateLootTable(createSequenceAction, result);
				expect(result.groups).toHaveLength(3);

				const sequenceGroup = result.groups.find((g) => g.type === "sequence");
				expect(sequenceGroup).toBeDefined();
				expect(sequenceGroup?.items).toEqual(["item_0", "item_1"]);

				// Duplicate an item to another pool
				const duplicateAction = LootTableAction.duplicateLootItem("item_0", 1);

				result = updateLootTable(duplicateAction, result);
				expect(result.items).toHaveLength(6); // Original 5 + 1 duplicate

				const duplicatedItem = result.items.find((item) => item.name === "minecraft:acacia_sapling" && item.poolIndex === 1);
				expect(duplicatedItem).toBeDefined();
				expect(duplicatedItem?.id).not.toBe("item_0"); // Should have different ID

				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(2);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				// Verify table-level functions are preserved
				expect(compiled.element.data.functions).toHaveLength(1);
				const firstFunction = compiled.element.data.functions?.[0];
				expect(firstFunction).toBeDefined();
				expect(firstFunction?.function).toBe("minecraft:enchant_with_levels");
			});
		});

		describe("Final Boss loot table workflow", () => {
			it("should parse final boss loot table with complex structures correctly", () => {
				// Verify parsing of complex structures
				expect(finalBossLootTable.identifier.namespace).toBe("test");
				expect(finalBossLootTable.identifier.resource).toBe("final_boss");

				// Should have many items due to complex nesting (alternatives, groups, sequences, etc.)
				expect(finalBossLootTable.items.length).toBeGreaterThan(5);
				expect(finalBossLootTable.groups.length).toBeGreaterThan(2);

				// Verify pools data is preserved
				expect(finalBossLootTable.pools).toHaveLength(2);
				expect(finalBossLootTable.pools?.[0]?.rolls).toBe(1);
				expect(finalBossLootTable.pools?.[0]?.bonus_rolls).toEqual({
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

				// Find specific items
				const acaciaSignItem = finalBossLootTable.items.find((item) => item.name === "minecraft:acacia_sign");
				expect(acaciaSignItem).toBeDefined();

				const alliumItem = finalBossLootTable.items.find((item) => item.name === "minecraft:allium");
				expect(alliumItem).toBeDefined();

				const dynamicItem = finalBossLootTable.items.find((item) => item.name === "minecraft:sherds");
				expect(dynamicItem).toBeDefined();

				const tagItem = finalBossLootTable.items.find((item) => item.name === "#minecraft:buttons");
				expect(tagItem).toBeDefined();
				expect(tagItem?.expand).toBe(true);
				expect(tagItem?.weight).toBe(1);
				expect(tagItem?.quality).toBe(10);

				// Find loot table items
				const lootTableItems = finalBossLootTable.items.filter((item) => item.name.includes("minecraft:blocks/"));
				expect(lootTableItems.length).toBeGreaterThan(0);
			});

			it("should handle complex actions on final boss loot table", () => {
				let result = finalBossLootTable;
				const originalItemCount = result.items.length;
				const originalGroupCount = result.groups.length;

				// Add a new legendary item to pool 0
				const addLegendaryAction = LootTableAction.addLootItem(0, {
					name: "minecraft:netherite_sword",
					weight: 1,
					quality: 100
				});

				result = updateLootTable(addLegendaryAction, result);
				expect(result.items).toHaveLength(originalItemCount + 1);
				const createRareGroupAction = LootTableAction.createLootGroup(
					"alternatives",
					[result.items[result.items.length - 1].id],
					0
				);

				result = updateLootTable(createRareGroupAction, result);
				expect(result.groups).toHaveLength(originalGroupCount + 1);

				const moveItemAction = LootTableAction.moveItemBetweenPools(result.items[0].id, 1);

				result = updateLootTable(moveItemAction, result);
				const movedItem = result.items.find((item) => item.poolIndex === 1 && item.id === result.items[0].id);
				expect(movedItem).toBeDefined();

				const compiled = VoxelToLootDataDriven(result, "loot_table");
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
				let result = finalBossLootTable;
				const complexGroup = result.groups.find((g) => g.items.length > 0);

				if (complexGroup) {
					const originalItems = [...complexGroup.items];
					const dissolveAction = LootTableAction.dissolveLootGroup(complexGroup.id);
					result = updateLootTable(dissolveAction, result);
					for (const itemId of originalItems) {
						const item = result.items.find((i) => i.id === itemId);
						expect(item).toBeDefined();
					}
				}

				// Compile and verify structure integrity
				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(2);
				expect(compiled.element.data.functions).toHaveLength(1);
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");

				// Verify that complex NumberProviders are still intact
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
				// Start with ultimate loot table (most complex)
				let result = ultimateLootTable;
				const originalItemCount = result.items.length;
				const originalGroupCount = result.groups.length;

				// Apply a series of actions
				const actions = [
					LootTableAction.addLootItem(0, {
						name: "minecraft:diamond_block",
						weight: 1,
						quality: 15
					}),
					LootTableAction.modifyLootItem("item_0", "weight", 100),
					LootTableAction.createLootGroup("alternatives", ["item_0", "item_4"], 0),
					LootTableAction.moveItemBetweenPools("item_1", 1)
				];

				// Apply all actions
				for (const action of actions) {
					result = updateLootTable(action, result);
				}

				// Verify intermediate state
				expect(result.items).toHaveLength(originalItemCount + 1);
				expect(result.groups).toHaveLength(originalGroupCount + 1);

				// Compile to Minecraft format
				const compiled = VoxelToLootDataDriven(result, "loot_table");

				// Verify compilation success
				expect(compiled.element.data).toBeDefined();
				expect(compiled.element.data.pools).toHaveLength(2); // Pool 0 + Pool 1 (item moved)
				expect(compiled.element.identifier).toEqual(ultimateLootTable.identifier);

				// Verify specific modifications are preserved
				const pool0 = compiled.element.data.pools?.[0];
				expect(pool0).toBeDefined();

				// Pool 0 should contain the new alternatives group
				const alternativesEntry = pool0?.entries.find((e) => e.type === "minecraft:alternatives");
				expect(alternativesEntry).toBeDefined();

				// Verify that the alternatives group exists and has some content
				expect(alternativesEntry?.children).toBeDefined();
				expect(alternativesEntry?.children?.length).toBeGreaterThan(0);

				// Verify table-level properties are preserved
				expect(compiled.element.data.random_sequence).toBe(ultimateLootTable.randomSequence);
				expect(compiled.element.data.functions).toEqual(ultimateLootTable.functions);
			});
		});

		describe("Error handling and edge cases", () => {
			it("should handle invalid actions gracefully", () => {
				const invalidRemoveAction = LootTableAction.removeLootItem("non_existent_item");

				const result1 = updateLootTable(invalidRemoveAction, simpleLootTable);
				expect(result1.items).toHaveLength(simpleLootTable.items.length); // No change

				// Try to modify non-existent item
				const invalidModifyAction = LootTableAction.modifyLootItem("non_existent_item", "weight", 50);

				const result2 = updateLootTable(invalidModifyAction, simpleLootTable);
				expect(result2.items).toEqual(simpleLootTable.items); // No change

				// Try to create group with non-existent items - this might actually create an empty group
				const invalidGroupAction = LootTableAction.createLootGroup("alternatives", ["non_existent_1", "non_existent_2"], 0);

				const result3 = updateLootTable(invalidGroupAction, simpleLootTable);
				expect(result3).toBeDefined();
			});

			it("should handle empty groups correctly", () => {
				let result = advancedLootTable;
				const dissolveGroupAction = LootTableAction.dissolveLootGroup("group_0");

				result = updateLootTable(dissolveGroupAction, result);

				expect(result.groups).toHaveLength(0);
				const compiled = VoxelToLootDataDriven(result, "loot_table");
				expect(compiled.element.data.pools).toHaveLength(1);
				const firstPool = compiled.element.data.pools?.[0];
				expect(firstPool).toBeDefined();
				expect(firstPool?.entries).toHaveLength(2); // acacia_sapling + tag (group was dissolved)
			});
		});
	});
});
