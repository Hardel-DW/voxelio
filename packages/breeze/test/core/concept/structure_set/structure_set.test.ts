import { describe, it, expect } from "vitest";
import { StructureSetDataDrivenToVoxelFormat } from "@/core/schema/structure_set/Parser";
import { VoxelToStructureSetDataDriven } from "@/core/schema/structure_set/Compiler";
import {
	villageStructureSet,
	strongholdStructureSet,
	ruinedPortalStructureSet,
	endCityStructureSet
} from "@test/mock/concept/structure_set";

describe("StructureSet Schema", () => {
	describe("Parser", () => {
		it("should parse village structure set with random spread", () => {
			const result = StructureSetDataDrivenToVoxelFormat({ element: villageStructureSet });
			expect(result.structures).toHaveLength(3);
			expect(result.structures[0]).toEqual({ structure: "minecraft:village_plains", weight: 10 });
			expect(result.placementType).toBe("minecraft:random_spread");
			expect(result.salt).toBe(10387312);
			expect(result.spacing).toBe(32);
			expect(result.separation).toBe(8);
			expect(result.spreadType).toBe("triangular");
		});

		it("should parse stronghold structure set with concentric rings", () => {
			const result = StructureSetDataDrivenToVoxelFormat({ element: strongholdStructureSet });
			expect(result.structures).toHaveLength(1);
			expect(result.structures[0]).toEqual({ structure: "minecraft:stronghold", weight: 1 });
			expect(result.placementType).toBe("minecraft:concentric_rings");
			expect(result.salt).toBe(0);
			expect(result.distance).toBe(32);
			expect(result.spread).toBe(3);
			expect(result.count).toBe(128);
			expect(result.preferredBiomes).toEqual(["#minecraft:stronghold_biased_to"]);
		});

		it("should parse ruined portal structure set with frequency settings", () => {
			const result = StructureSetDataDrivenToVoxelFormat({ element: ruinedPortalStructureSet });
			expect(result.structures).toHaveLength(7);
			expect(result.placementType).toBe("minecraft:random_spread");
			expect(result.frequencyReductionMethod).toBe("legacy_type_1");
			expect(result.frequency).toBe(0.01666667);
			expect(result.spacing).toBe(40);
			expect(result.separation).toBe(15);
		});

		it("should parse end city structure set with exclusion zone", () => {
			const result = StructureSetDataDrivenToVoxelFormat({ element: endCityStructureSet });
			expect(result.structures).toHaveLength(1);
			expect(result.placementType).toBe("minecraft:random_spread");
			expect(result.exclusionZone).toEqual({ otherSet: "minecraft:strongholds", chunkCount: 12 });
		});

		it("should handle preferred_biomes as single string", () => {
			const testStructureSet = {
				...strongholdStructureSet,
				data: {
					...strongholdStructureSet.data,
					placement: {
						...strongholdStructureSet.data.placement,
						preferred_biomes: "#minecraft:single_biome"
					}
				}
			};

			const result = StructureSetDataDrivenToVoxelFormat({ element: testStructureSet });
			expect(result.preferredBiomes).toEqual(["#minecraft:single_biome"]);
		});
	});

	describe("Compiler", () => {
		it("should compile village structure set to Minecraft format", () => {
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: villageStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set");
			expect(element.data.structures).toHaveLength(3);
			expect(element.data.structures[0]).toEqual({ structure: "minecraft:village_plains", weight: 10 });
			expect(element.data.placement.type).toBe("minecraft:random_spread");
			expect(element.data.placement.salt).toBe(10387312);
			expect(element.data.placement.spacing).toBe(32);
			expect(element.data.placement.separation).toBe(8);
			expect(element.data.placement.spread_type).toBe("triangular");
		});

		it("should compile stronghold structure set with single preferred biome", () => {
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: strongholdStructureSet });
			voxel.preferredBiomes = ["#minecraft:single_biome"];
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set");
			expect(element.data.placement.preferred_biomes).toEqual(["#minecraft:single_biome"]);
		});

		it("should compile structure set with multiple preferred biomes", () => {
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: strongholdStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set");
			expect(element.data.placement.preferred_biomes).toEqual(["#minecraft:stronghold_biased_to"]);
		});

		it("should preserve round-trip integrity for village structure set", () => {
			const original = villageStructureSet.data;
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: villageStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set", original);
			expect(element.data).toEqual(original);
		});

		it("should preserve round-trip integrity for stronghold structure set", () => {
			const original = strongholdStructureSet.data;
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: strongholdStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set", original);
			expect(element.data).toEqual(original);
		});

		it("should preserve round-trip integrity for ruined portal structure set", () => {
			const original = ruinedPortalStructureSet.data;
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: ruinedPortalStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set", original);
			expect(element.data).toEqual(original);
		});

		it("should preserve round-trip integrity for end city structure set", () => {
			const original = endCityStructureSet.data;
			const voxel = StructureSetDataDrivenToVoxelFormat({ element: endCityStructureSet });
			const { element } = VoxelToStructureSetDataDriven(voxel, "worldgen/structure_set", original);
			expect(element.data).toEqual(original);
		});
	});
});
