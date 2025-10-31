import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import { describe, it, expect } from "vitest";
import { simple, extreme, reference } from "@test/mock/loot/DataDriven";

describe("LootTable Schema", () => {
	describe("Data Driven to Voxel Element", () => {
		const simpleLootTable = simple;
		const extremeLootTable = extreme;
		const referenceLootTable = reference;

		describe("Should parse simple loot table", () => {
			it("should parse simple loot table", () => {
				const parsed = LootDataDrivenToVoxelFormat({ element: simpleLootTable });
				expect(parsed).toBeDefined();
				expect(parsed.type).toBe("minecraft:entity");
				expect(parsed.items).toHaveLength(1);
				expect(parsed.groups).toHaveLength(0);

				const item = parsed.items[0];
				expect(item.name).toBe("minecraft:experience_bottle");
				expect(item.poolIndex).toBe(0);
				expect(item.entryIndex).toBe(0);
				expect(item.conditions).toHaveLength(1);
				expect(item.conditions?.[0]).toEqual({ condition: "minecraft:random_chance", chance: 0.5 });
				expect(item.functions).toHaveLength(1);
				expect(item.functions?.[0]).toEqual({ function: "minecraft:set_count", count: { min: 1, max: 3 } });
			});
		});

		describe("Should parse complex nested groups", () => {
			it("should have correct items count", () => {
				const parsed = LootDataDrivenToVoxelFormat({ element: extremeLootTable });
				expect(parsed.items).toHaveLength(2);
				expect(parsed.groups).toHaveLength(3);

				const alternativesGroup = parsed.groups.find((g) => g.type === "alternatives");
				expect(alternativesGroup).toBeDefined();
				expect(alternativesGroup?.id).toBe("group_0");

				const groupType = parsed.groups.find((g) => g.type === "group");
				expect(groupType).toBeDefined();
				expect(groupType?.id).toBe("group_1");

				const sequenceGroup = parsed.groups.find((g) => g.type === "sequence");
				expect(sequenceGroup).toBeDefined();
				expect(sequenceGroup?.id).toBe("group_2");
				expect(sequenceGroup?.items).toContain("item_1");
				expect(parsed.randomSequence).toBe("minecraft:entities/wither_skeleton");
			});
		});

		describe("Should parse multi-pool reference table", () => {
			it("should have three items in different pools", () => {
				const parsed = LootDataDrivenToVoxelFormat({ element: referenceLootTable });
				expect(parsed.items).toHaveLength(3);
				expect(parsed.items[0].poolIndex).toBe(0);
				expect(parsed.items[1].poolIndex).toBe(1);
				expect(parsed.items[2].poolIndex).toBe(2);
				expect(parsed.items[0].name).toBe("yggdrasil:generic/equipment/ominous/item/sword");
				expect(parsed.items[1].name).toBe("yggdrasil:generic/equipment/ominous/item/helmet");
				expect(parsed.items[2].name).toBe("yggdrasil:generic/equipment/ominous/item/chestplate");
				expect(parsed.type).toBe("minecraft:equipment");
			});
		});
	});

	describe("Voxel Element to Data Driven", () => {
		const simpleVoxel = LootDataDrivenToVoxelFormat({ element: simple });
		const extremeVoxel = LootDataDrivenToVoxelFormat({ element: extreme });
		const referenceVoxel = LootDataDrivenToVoxelFormat({ element: reference });

		describe("Should compile simple loot table", () => {
			it("should compile", () => {
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
		});

		describe("Should compile complex nested groups", () => {
			it("should have correct random sequence", () => {
				const compiled = VoxelToLootDataDriven(extremeVoxel, "loot_table");
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");
				expect(compiled.element.data.pools).toHaveLength(1);

				const pool = compiled.element.data.pools?.[0];
				expect(pool?.entries).toHaveLength(1);

				const topLevelEntry = pool?.entries[0];
				expect(topLevelEntry?.type).toBe("minecraft:alternatives");
				expect(topLevelEntry?.children).toHaveLength(2);
			});
		});

		describe("Should compile multi-pool reference table", () => {
			it("should have three pools", () => {
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
	});

	describe("Round-trip conversion", () => {
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
	});
});
