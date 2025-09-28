import { describe, expect, it } from "vitest";
import { updateData } from "@/core/engine/actions";
import type { StructureProps } from "@/core/schema/structure/types";

describe("Structure Actions", () => {
	const baseStructure: StructureProps = {
		identifier: { namespace: "test", resource: "test_structure", registry: "structure" },
		type: "minecraft:village",
		biomes: ["minecraft:plains"],
		step: "surface_structures",
		tags: []
	};

	describe("structure.set_biomes", () => {
		it("should replace biomes when replace is true", () => {
			const result = updateData(
				{
					type: "structure.set_biomes",
					biomes: ["minecraft:desert", "minecraft:savanna"],
					replace: true
				},
				baseStructure
			);

			expect(result?.biomes).toEqual(["minecraft:desert", "minecraft:savanna"]);
		});

		it("should add biomes when replace is false", () => {
			const result = updateData(
				{
					type: "structure.set_biomes",
					biomes: ["minecraft:desert", "minecraft:savanna"],
					replace: false
				},
				baseStructure
			);

			expect(result?.biomes).toEqual(["minecraft:plains", "minecraft:desert", "minecraft:savanna"]);
		});
	});

	describe("structure.add_spawn_override", () => {
		it("should add new spawn override", () => {
			const result = updateData(
				{
					type: "structure.add_spawn_override",
					mobCategory: "monster",
					boundingBox: "piece",
					spawns: [
						{
							type: "minecraft:zombie",
							weight: 1,
							minCount: 1,
							maxCount: 3
						}
					]
				},
				baseStructure
			);

			expect(result?.spawnOverrides).toHaveLength(1);
			expect((result?.spawnOverrides as any)?.[0]?.mobCategory).toBe("monster");
		});
	});

	describe("structure.set_jigsaw_config", () => {
		it("should set jigsaw configuration properties", () => {
			const result = updateData(
				{
					type: "structure.set_jigsaw_config",
					startPool: "minecraft:village/common",
					size: 6,
					maxDistanceFromCenter: 80,
					useExpansionHack: false
				},
				baseStructure
			);

			expect(result?.startPool).toBe("minecraft:village/common");
			expect(result?.size).toBe(6);
			expect(result?.maxDistanceFromCenter).toBe(80);
			expect(result?.useExpansionHack).toBe(false);
		});
	});
});
