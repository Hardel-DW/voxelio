import { describe, expect, it } from "vitest";
import { StructureDataDrivenToVoxelFormat } from "@/core/schema/structure/Parser";
import { VoxelToStructureDataDriven } from "@/core/schema/structure/Compiler";
import { village, mineshaft } from "@test/mock/structure";

describe("Structure Parsing and Compiling", () => {
	describe("Jigsaw Structure (Village)", () => {
		it("should parse Minecraft village to Voxel format", () => {
			const voxelStructure = StructureDataDrivenToVoxelFormat({ element: village });
			expect(voxelStructure.type).toBe("minecraft:village");
			expect(voxelStructure.biomes).toEqual(["#minecraft:village_biomes"]);
			expect(voxelStructure.step).toBe("surface_structures");
			expect(voxelStructure.terrainAdaptation).toBe("beard_thin");
			expect(voxelStructure.startPool).toBe("minecraft:village/common");
			expect(voxelStructure.size).toBe(6);
			expect(voxelStructure.maxDistanceFromCenter).toBe(80);
			expect(voxelStructure.useExpansionHack).toBe(false);
			expect(voxelStructure.spawnOverrides).toHaveLength(1);
			expect(voxelStructure.spawnOverrides?.[0].mobCategory).toBe("monster");
		});

		it("should compile Voxel village back to Minecraft format", () => {
			const voxelStructure = StructureDataDrivenToVoxelFormat({ element: village });
			const { element: minecraftStructure } = VoxelToStructureDataDriven(voxelStructure, "worldgen/structure");
			expect(minecraftStructure.data.type).toBe("minecraft:village");
			expect(minecraftStructure.data.biomes).toBe("#minecraft:village_biomes");
			expect(minecraftStructure.data.step).toBe("surface_structures");
			expect(minecraftStructure.data.terrain_adaptation).toBe("beard_thin");
			expect(minecraftStructure.data.start_pool).toBe("minecraft:village/common");
			expect(minecraftStructure.data.size).toBe(6);
			expect(minecraftStructure.data.max_distance_from_center).toBe(80);
			expect(minecraftStructure.data.use_expansion_hack).toBe(false);
			expect(minecraftStructure.data.spawn_overrides?.monster).toBeDefined();
		});
	});

	describe("Legacy Structure (Mineshaft)", () => {
		it("should parse Minecraft mineshaft to Voxel format", () => {
			const voxelStructure = StructureDataDrivenToVoxelFormat({ element: mineshaft });
			expect(voxelStructure.type).toBe("minecraft:mineshaft");
			expect(voxelStructure.biomes).toEqual(["#minecraft:mineshaft_biomes"]);
			expect(voxelStructure.step).toBe("underground_structures");
			expect(voxelStructure.typeSpecific?.mineshaft_type).toBe("normal");
			expect(voxelStructure.typeSpecific?.probability).toBe(0.004);
			expect(voxelStructure.startPool).toBeUndefined();
			expect(voxelStructure.size).toBeUndefined();
		});

		it("should compile Voxel mineshaft back to Minecraft format", () => {
			const voxelStructure = StructureDataDrivenToVoxelFormat({ element: mineshaft });
			const { element: minecraftStructure } = VoxelToStructureDataDriven(voxelStructure, "worldgen/structure");
			expect(minecraftStructure.data.type).toBe("minecraft:mineshaft");
			expect(minecraftStructure.data.mineshaft_type).toBe("normal");
			expect(minecraftStructure.data.probability).toBe(0.004);
			expect(minecraftStructure.data.start_pool).toBeUndefined();
			expect(minecraftStructure.data.size).toBeUndefined();
		});
	});

	describe("Bidirectional Conversion", () => {
		it("should maintain data integrity through parse -> compile cycle", () => {
			const originalVillage = village;
			const voxelStructure = StructureDataDrivenToVoxelFormat({ element: originalVillage });
			const { element: compiledStructure } = VoxelToStructureDataDriven(voxelStructure, "worldgen/structure", originalVillage.data);
			expect(compiledStructure.data.type).toBe(originalVillage.data.type);
			expect(compiledStructure.data.biomes).toBe("#minecraft:village_biomes");
			expect(compiledStructure.data.step).toBe(originalVillage.data.step);
			expect(compiledStructure.data.start_pool).toBe(originalVillage.data.start_pool);
			expect(compiledStructure.data.size).toBe(originalVillage.data.size);
		});
	});
});
