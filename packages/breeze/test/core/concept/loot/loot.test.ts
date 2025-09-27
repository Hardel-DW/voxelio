import type { Compiler } from "@/core/engine/Compiler";
import { VoxelToLootDataDriven } from "@/core/schema/loot/Compiler";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import type { LootTableProps, MinecraftLootTable } from "@/core/schema/loot/types";
import type { DataDrivenRegistryElement } from "@/core/Element";
import { describe, it, expect, beforeEach } from "vitest";
import { DATA_DRIVEN_TEMPLATE_LOOT_TABLE } from "@test/mock/loot/DataDriven";
import { VOXEL_TEMPLATE_LOOT_TABLE } from "@test/mock/loot/VoxelDriven";

describe("LootTable Schema", () => {
	describe("Data Driven to Voxel Element", () => {
		const simpleLootTable = DATA_DRIVEN_TEMPLATE_LOOT_TABLE[0];
		const extremeLootTable = DATA_DRIVEN_TEMPLATE_LOOT_TABLE[1];
		const referenceLootTable = DATA_DRIVEN_TEMPLATE_LOOT_TABLE[2];

		describe("Should parse simple loot table", () => {
			let parsed: LootTableProps;

			beforeEach(() => {
				parsed = LootDataDrivenToVoxelFormat({ element: simpleLootTable });
			});

			it("should be defined", () => {
				expect(parsed).toBeDefined();
			});

			it("should have correct type", () => {
				expect(parsed.type).toBe("minecraft:entity");
			});

			it("should have one item", () => {
				expect(parsed.items).toHaveLength(1);
			});

			it("should have no groups", () => {
				expect(parsed.groups).toHaveLength(0);
			});

			it("should parse item correctly", () => {
				const item = parsed.items[0];
				expect(item.name).toBe("minecraft:experience_bottle");
				expect(item.poolIndex).toBe(0);
				expect(item.entryIndex).toBe(0);

				// Check that conditions are stored as complete objects
				expect(item.conditions).toHaveLength(1);
				expect(item.conditions?.[0]).toEqual({
					condition: "minecraft:random_chance",
					chance: 0.5
				});

				// Check that functions are stored as complete objects
				expect(item.functions).toHaveLength(1);
				expect(item.functions?.[0]).toEqual({
					function: "minecraft:set_count",
					count: {
						min: 1,
						max: 3
					}
				});
			});
		});

		describe("Should parse complex nested groups", () => {
			let parsed: LootTableProps;

			beforeEach(() => {
				parsed = LootDataDrivenToVoxelFormat({ element: extremeLootTable });
			});

			it("should have correct items count", () => {
				expect(parsed.items).toHaveLength(2);
			});

			it("should have correct groups count", () => {
				expect(parsed.groups).toHaveLength(3);
			});

			it("should parse alternatives group", () => {
				const alternativesGroup = parsed.groups.find((g) => g.type === "alternatives");
				expect(alternativesGroup).toBeDefined();
				expect(alternativesGroup?.id).toBe("group_0");
			});

			it("should parse group type", () => {
				const groupType = parsed.groups.find((g) => g.type === "group");
				expect(groupType).toBeDefined();
				expect(groupType?.id).toBe("group_1");
			});

			it("should parse sequence group", () => {
				const sequenceGroup = parsed.groups.find((g) => g.type === "sequence");
				expect(sequenceGroup).toBeDefined();
				expect(sequenceGroup?.id).toBe("group_2");
				expect(sequenceGroup?.items).toContain("item_1");
			});

			it("should have random sequence", () => {
				expect(parsed.randomSequence).toBe("minecraft:entities/wither_skeleton");
			});
		});

		describe("Should parse multi-pool reference table", () => {
			let parsed: LootTableProps;

			beforeEach(() => {
				parsed = LootDataDrivenToVoxelFormat({ element: referenceLootTable });
			});

			it("should have three items in different pools", () => {
				expect(parsed.items).toHaveLength(3);
				expect(parsed.items[0].poolIndex).toBe(0);
				expect(parsed.items[1].poolIndex).toBe(1);
				expect(parsed.items[2].poolIndex).toBe(2);
			});

			it("should parse loot table references", () => {
				expect(parsed.items[0].name).toBe("yggdrasil:generic/equipment/ominous/item/sword");
				expect(parsed.items[1].name).toBe("yggdrasil:generic/equipment/ominous/item/helmet");
				expect(parsed.items[2].name).toBe("yggdrasil:generic/equipment/ominous/item/chestplate");
			});

			it("should have equipment type", () => {
				expect(parsed.type).toBe("minecraft:equipment");
			});
		});
	});

	describe("Voxel Element to Data Driven", () => {
		const simpleVoxelElement = VOXEL_TEMPLATE_LOOT_TABLE[0];
		const extremeVoxelElement = VOXEL_TEMPLATE_LOOT_TABLE[1];
		const referenceVoxelElement = VOXEL_TEMPLATE_LOOT_TABLE[2];

		describe("Should compile simple loot table", () => {
			let compiled: ReturnType<Compiler<LootTableProps, MinecraftLootTable>>;

			beforeEach(() => {
				compiled = VoxelToLootDataDriven(simpleVoxelElement.data, "loot_table");
			});

			it("should compile", () => {
				expect(compiled).toBeDefined();
			});

			it("should have correct type", () => {
				expect(compiled.element.data.type).toBe("minecraft:entity");
			});

			it("should have one pool", () => {
				expect(compiled.element.data.pools).toHaveLength(1);
			});

			it("should have one entry in pool", () => {
				expect(compiled.element.data.pools?.[0].entries).toHaveLength(1);
			});

			it("should have correct item entry", () => {
				const entry = compiled.element.data.pools?.[0].entries[0];
				expect(entry?.type).toBe("minecraft:item");
				expect(entry?.name).toBe("minecraft:experience_bottle");
			});
		});

		describe("Should compile complex nested groups", () => {
			let compiled: ReturnType<Compiler<LootTableProps, MinecraftLootTable>>;

			beforeEach(() => {
				compiled = VoxelToLootDataDriven(extremeVoxelElement.data, "loot_table");
			});

			it("should have correct random sequence", () => {
				expect(compiled.element.data.random_sequence).toBe("minecraft:entities/wither_skeleton");
			});

			it("should have one pool", () => {
				expect(compiled.element.data.pools).toHaveLength(1);
			});

			it("should recreate nested group structure", () => {
				const pool = compiled.element.data.pools?.[0];
				expect(pool?.entries).toHaveLength(1); // Only the top-level alternatives group

				// Check that the alternatives group contains nested structure
				const topLevelEntry = pool?.entries[0];
				expect(topLevelEntry?.type).toBe("minecraft:alternatives");
				expect(topLevelEntry?.children).toHaveLength(2); // dynamic + group
			});
		});

		describe("Should compile multi-pool reference table", () => {
			let compiled: ReturnType<Compiler<LootTableProps, MinecraftLootTable>>;

			beforeEach(() => {
				compiled = VoxelToLootDataDriven(referenceVoxelElement.data, "loot_table");
			});

			it("should have three pools", () => {
				expect(compiled.element.data.pools).toHaveLength(3);
			});

			it("should have loot_table entries", () => {
				const entries = compiled.element.data.pools?.map((p) => p.entries[0]);
				if (entries) {
					for (const entry of entries) {
						expect(entry.type).toBe("minecraft:loot_table");
					}
				}
			});
		});

		describe("Should handle tags correctly", () => {
			it("should return empty tags array", () => {
				const compiled = VoxelToLootDataDriven(simpleVoxelElement.data, "loot_table");
				expect(compiled.tags).toEqual([]);
			});
		});
	});

	describe("Round-trip conversion", () => {
		it("should maintain data integrity for simple table", () => {
			const original = DATA_DRIVEN_TEMPLATE_LOOT_TABLE[0];
			const voxel = LootDataDrivenToVoxelFormat({ element: original });
			const compiled = VoxelToLootDataDriven(voxel, "loot_table", original);

			expect(compiled.element.data.type).toBe(original.data.type);
			expect(compiled.element.data.pools).toHaveLength(original.data.pools?.length || 0);
		});

		it("should maintain data integrity for complex table", () => {
			const original = DATA_DRIVEN_TEMPLATE_LOOT_TABLE[1];
			const voxel = LootDataDrivenToVoxelFormat({ element: original });
			const compiled = VoxelToLootDataDriven(voxel, "loot_table", original);

			expect(compiled.element.data.type).toBe(original.data.type);
			expect(compiled.element.data.random_sequence).toBe(original.data.random_sequence);
		});
	});

	describe("Mod compatibility", () => {
		it("should preserve unknown fields from mod entries", () => {
			// Create a mock loot table with mod fields
			const modLootTable: DataDrivenRegistryElement<MinecraftLootTable> = {
				identifier: { namespace: "test", registry: "loot_table", resource: "mod_test" },
				data: {
					type: "minecraft:chest",
					// Mod field at table level
					mod_custom_field: "some_mod_value",
					pools: [
						{
							rolls: 1,
							// Mod field at pool level
							mod_pool_setting: true,
							entries: [
								{
									type: "modname:custom_entry",
									name: "modname:custom_item",
									weight: 10,
									// Mod fields at entry level
									mod_special_property: 42,
									mod_config: { enabled: true, level: 5 }
								}
							]
						}
					]
				}
			};

			// Parse to Voxel format
			const parsed = LootDataDrivenToVoxelFormat({ element: modLootTable });

			// Verify unknown fields are preserved
			expect(parsed.unknownFields).toBeDefined();
			expect(parsed.unknownFields?.mod_custom_field).toBe("some_mod_value");

			expect(parsed.pools).toHaveLength(1);
			expect(parsed.pools?.[0].unknownFields).toBeDefined();
			expect(parsed.pools?.[0].unknownFields?.mod_pool_setting).toBe(true);

			expect(parsed.items).toHaveLength(1);
			const item = parsed.items[0];
			expect(item.entryType).toBe("modname:custom_entry");
			expect(item.unknownFields).toBeDefined();
			expect(item.unknownFields?.mod_special_property).toBe(42);
			expect(item.unknownFields?.mod_config).toEqual({ enabled: true, level: 5 });

			// Compile back to Minecraft format
			const compiled = VoxelToLootDataDriven(parsed, "loot_table", modLootTable.data);

			// Verify unknown fields are restored
			expect(compiled.element.data.mod_custom_field).toBe("some_mod_value");
			expect(compiled.element.data.pools?.[0].mod_pool_setting).toBe(true);

			const compiledEntry = compiled.element.data.pools?.[0].entries[0];
			expect(compiledEntry?.type).toBe("modname:custom_entry");
			expect(compiledEntry?.mod_special_property).toBe(42);
			expect(compiledEntry?.mod_config).toEqual({ enabled: true, level: 5 });
		});
	});
});
