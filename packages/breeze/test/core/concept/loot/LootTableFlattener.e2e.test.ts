import { describe, expect, it, beforeAll } from "vitest";
import { LootTableFlattener } from "@/core/calculation/LootTableFlattener";
import type { LootTableProps } from "@/core/schema/loot/types";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";
import { Datapack } from "@/core/Datapack";
import { createZipFile, prepareFiles } from "@test/mock/utils";
import { completeLootTable, advancedLootTable, ultimateTestLootTable, finalBossOfLootTable } from "@test/mock/loot/DataDriven";

const lootTableFiles = {
	"data/test/loot_table/test.json": completeLootTable,
	"data/test/loot_table/advanced.json": advancedLootTable,
	"data/test/loot_table/ultimate.json": ultimateTestLootTable,
	"data/test/loot_table/final_boss.json": finalBossOfLootTable
};

describe("LootTableFlattener – E2E", () => {
	let lootTables: LootTableProps[];
	let files: Record<string, Uint8Array>;
	let datapack: Datapack;

	beforeAll(async () => {
		const lootTableZip = await createZipFile(prepareFiles(lootTableFiles));
		const datapackInstance = await Datapack.from(lootTableZip);
		const parsed = datapackInstance.parse();
		lootTables = Array.from(parsed.elements.values()).filter(
			(element): element is LootTableProps => element.identifier.registry === "loot_table"
		);
		files = parsed.files;
		datapack = new Datapack(files);
		expect(lootTables.length).toBeGreaterThan(0);
	});

	it("flattens a simple datapack loot table", () => {
		const table = lootTables.find((lt) => lt.identifier.resource === "test");
		if (!table) throw new Error("expected test loot table");
		const flattener = new LootTableFlattener([table]);
		const result = flattener.flatten(table.identifier);
		expect(result).toHaveLength(1);
		const entry = result[0];
		expect(entry.name).toBe("minecraft:acacia_sapling");
		expect(entry.probability).toBe(1);
		expect(entry.path).toEqual(["test:test"]);
	});

	it("resolves tags from datapack when provided", () => {
		const table = lootTables.find((lt) => lt.identifier.resource === "ultimate");
		if (!table) throw new Error("expected ultimate loot table");
		const itemTags = datapack.getRegistry<TagType>("tags/item") as DataDrivenRegistryElement<TagType>[];
		const flattener = new LootTableFlattener([table], itemTags);
		const result = flattener.flatten(table.identifier);
		expect(result.some((entry) => entry.name.includes("minecraft:cherry_"))).toBe(true);
	});

	it("keeps nested loot table paths for real datapack", () => {
		const table = lootTables.find((lt) => lt.identifier.resource === "ultimate");
		if (!table) throw new Error("expected ultimate loot table");
		const itemTags = datapack.getRegistry<TagType>("tags/item") as DataDrivenRegistryElement<TagType>[];
		const flattener = new LootTableFlattener([table], itemTags);
		const entries = flattener.flatten(table.identifier);
		const nestedLoot = entries.find((entry) => entry.path.length > 1 && entry.name.startsWith("minecraft:blocks"));
		expect(nestedLoot).toBeDefined();
	});
});
