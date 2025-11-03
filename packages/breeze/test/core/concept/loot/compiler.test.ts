import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import { advanced, complete, extreme, finalBoss, reference, simple, ultimate } from "@test/mock/concept/loot";
import { describe, expect, it } from "vitest";

describe("Voxel Element to Data Driven", () => {
	it("should maintain data integrity for simple table", () => {
		const voxel = LootDataDrivenToVoxelFormat({ element: simple });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table", simple.data);
		expect(compiled.element.data.type).toBe(simple.data.type);
		expect(compiled.element.data.pools).toHaveLength(simple.data.pools?.length || 0);
	});

	it("should maintain data integrity for complex table", () => {
		const voxel = LootDataDrivenToVoxelFormat({ element: extreme });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table", extreme.data);
		expect(compiled.element.data.type).toBe(extreme.data.type);
		expect(compiled.element.data.random_sequence).toBe(extreme.data.random_sequence);
	});

	it("should compile", () => {
		const simpleVoxel = LootDataDrivenToVoxelFormat({ element: simple });
		const compiled = VoxelToLootDataDriven(simpleVoxel, "loot_table");
		expect(compiled).toBeDefined();
		expect(compiled.element.data.type).toBe("minecraft:entity");
		expect(compiled.element.data.pools).toHaveLength(1);
		expect(compiled.element.data.pools?.[0].entries).toHaveLength(1);
		expect(compiled.tags).toEqual([]);

		const entry = compiled.element.data.pools?.[0].entries[0];
		expect(entry?.type).toBe("minecraft:item");
		expect(entry?.name).toBe("minecraft:experience_bottle");
	});

	it("should have correct random sequence", () => {
		const extremeVoxel = LootDataDrivenToVoxelFormat({ element: extreme });
		const compiled = VoxelToLootDataDriven(extremeVoxel, "loot_table");
		expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");
		expect(compiled.element.data.pools).toHaveLength(1);

		const pool = compiled.element.data.pools?.[0];
		expect(pool?.entries).toHaveLength(1);

		const topLevelEntry = pool?.entries[0];
		expect(topLevelEntry?.type).toBe("minecraft:alternatives");
		expect(topLevelEntry?.children).toHaveLength(2);
	});

	it("should have three pools", () => {
		const referenceVoxel = LootDataDrivenToVoxelFormat({ element: reference });
		const compiled = VoxelToLootDataDriven(referenceVoxel, "loot_table");
		expect(compiled.element.data.pools).toHaveLength(3);
		const entries = compiled.element.data.pools?.map((p) => p.entries[0]);
		if (entries) {
			for (const entry of entries) {
				expect(entry.type).toBe("minecraft:loot_table");
			}
		}
	});
});

describe("Round-trip purity (Parse → Compile without actions)", () => {
	it("should preserve simple loot table data perfectly", () => {
		const simpleLootTable = LootDataDrivenToVoxelFormat({ element: complete });
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
		const voxel = LootDataDrivenToVoxelFormat({ element: advanced });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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

		expect(compiled.element.identifier).toEqual(voxel.identifier);
	});

	it("should preserve ultimate loot table with complex nesting perfectly", () => {
		const voxel = LootDataDrivenToVoxelFormat({ element: ultimate });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
		expect(compiled.element.identifier).toEqual(voxel.identifier);
	});

	it("should preserve final boss loot table with complex NumberProviders and nested structures perfectly", () => {
		const voxel = LootDataDrivenToVoxelFormat({ element: finalBoss });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
		expect(compiled.element.identifier).toEqual(voxel.identifier);
	});

	it("should identify data loss in simple loot table", () => {
		const originalJson = complete.data;
		const voxel = LootDataDrivenToVoxelFormat({ element: complete });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
		const originalJson = advanced.data;
		const voxel = LootDataDrivenToVoxelFormat({ element: advanced });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
		const originalJson = ultimate.data;
		const voxel = LootDataDrivenToVoxelFormat({ element: ultimate });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
		const originalJson = finalBoss.data;
		const voxel = LootDataDrivenToVoxelFormat({ element: finalBoss });
		const compiled = VoxelToLootDataDriven(voxel, "loot_table");
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
