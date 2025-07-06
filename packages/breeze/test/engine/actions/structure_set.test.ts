import { describe, expect, it } from "vitest";
import { updateData } from "@/core/engine/actions";
import type { StructureSetProps } from "@/core/schema/structure_set/types";

describe("StructureSet Actions", () => {
    const baseStructureSet: StructureSetProps = {
        identifier: { namespace: "test", resource: "test_structure_set", registry: "worldgen/structure_set" },
        structures: [
            {
                structure: "minecraft:village_plains",
                weight: 10
            }
        ],
        placementType: "minecraft:random_spread",
        salt: 12345,
        spacing: 32,
        separation: 8,
        tags: []
    };

    describe("structure_set.add_structure", () => {
        it("should add structure at the end by default", async () => {
            const result = await updateData(
                {
                    type: "structure_set.add_structure",
                    structure: "minecraft:village_desert",
                    weight: 5
                },
                baseStructureSet
            );

            expect(result?.structures).toHaveLength(2);
            expect(result?.structures?.[1]).toEqual({
                structure: "minecraft:village_desert",
                weight: 5
            });
        });

        it("should add structure at specific position", async () => {
            const result = await updateData(
                {
                    type: "structure_set.add_structure",
                    structure: "minecraft:village_desert",
                    weight: 5,
                    position: 0
                },
                baseStructureSet
            );

            expect(result?.structures).toHaveLength(2);
            expect(result?.structures?.[0]).toEqual({
                structure: "minecraft:village_desert",
                weight: 5
            });
            expect(result?.structures?.[1]).toEqual({
                structure: "minecraft:village_plains",
                weight: 10
            });
        });
    });

    describe("structure_set.remove_structure", () => {
        it("should remove structure by ID", async () => {
            const extendedStructureSet = {
                ...baseStructureSet,
                structures: [...baseStructureSet.structures, { structure: "minecraft:village_desert", weight: 5 }]
            };

            const result = await updateData(
                {
                    type: "structure_set.remove_structure",
                    structureId: "structure_1"
                },
                extendedStructureSet
            );

            expect(result?.structures).toHaveLength(1);
            expect(result?.structures?.[0]).toEqual({
                structure: "minecraft:village_plains",
                weight: 10
            });
        });
    });

    describe("structure_set.modify_structure", () => {
        it("should modify structure weight", async () => {
            const result = await updateData(
                {
                    type: "structure_set.modify_structure",
                    structureId: "structure_0",
                    property: "weight",
                    value: 15
                },
                baseStructureSet
            );

            expect(result?.structures?.[0]).toEqual({
                structure: "minecraft:village_plains",
                weight: 15
            });
        });

        it("should modify structure ID", async () => {
            const result = await updateData(
                {
                    type: "structure_set.modify_structure",
                    structureId: "structure_0",
                    property: "structure",
                    value: "minecraft:village_desert"
                },
                baseStructureSet
            );

            expect(result?.structures?.[0]).toEqual({
                structure: "minecraft:village_desert",
                weight: 10
            });
        });
    });

    describe("structure_set.set_placement_type", () => {
        it("should change placement type", async () => {
            const result = await updateData(
                {
                    type: "structure_set.set_placement_type",
                    placementType: "minecraft:concentric_rings"
                },
                baseStructureSet
            );

            expect(result?.placementType).toBe("minecraft:concentric_rings");
        });
    });

    describe("structure_set.configure_placement", () => {
        it("should configure placement properties", async () => {
            const result = await updateData(
                {
                    type: "structure_set.configure_placement",
                    salt: 54321,
                    frequencyReductionMethod: "legacy_type_1",
                    frequency: 0.5,
                    locateOffset: [1, 2, 3]
                },
                baseStructureSet
            );

            expect(result?.salt).toBe(54321);
            expect(result?.frequencyReductionMethod).toBe("legacy_type_1");
            expect(result?.frequency).toBe(0.5);
            expect(result?.locateOffset).toEqual([1, 2, 3]);
        });
    });

    describe("structure_set.set_exclusion_zone", () => {
        it("should set exclusion zone", async () => {
            const result = await updateData(
                {
                    type: "structure_set.set_exclusion_zone",
                    otherSet: "minecraft:strongholds",
                    chunkCount: 10
                },
                baseStructureSet
            );

            expect(result?.exclusionZone).toEqual({
                otherSet: "minecraft:strongholds",
                chunkCount: 10
            });
        });
    });

    describe("structure_set.remove_exclusion_zone", () => {
        it("should remove exclusion zone", async () => {
            const structureSetWithExclusion = {
                ...baseStructureSet,
                exclusionZone: {
                    otherSet: "minecraft:strongholds",
                    chunkCount: 10
                }
            };

            const result = await updateData(
                {
                    type: "structure_set.remove_exclusion_zone"
                },
                structureSetWithExclusion
            );

            expect(result?.exclusionZone).toBeUndefined();
        });
    });

    describe("structure_set.configure_concentric_rings", () => {
        it("should configure concentric rings properties", async () => {
            const result = await updateData(
                {
                    type: "structure_set.configure_concentric_rings",
                    distance: 32,
                    spread: 3,
                    count: 128,
                    preferredBiomes: ["#minecraft:stronghold_biased_to"]
                },
                baseStructureSet
            );

            expect(result?.distance).toBe(32);
            expect(result?.spread).toBe(3);
            expect(result?.count).toBe(128);
            expect(result?.preferredBiomes).toEqual(["#minecraft:stronghold_biased_to"]);
        });
    });

    describe("structure_set.configure_random_spread", () => {
        it("should configure random spread properties", async () => {
            const result = await updateData(
                {
                    type: "structure_set.configure_random_spread",
                    spacing: 40,
                    separation: 15,
                    spreadType: "linear"
                },
                baseStructureSet
            );

            expect(result?.spacing).toBe(40);
            expect(result?.separation).toBe(15);
            expect(result?.spreadType).toBe("linear");
        });
    });

    describe("structure_set.reorder_structures", () => {
        it("should reorder structures", async () => {
            const extendedStructureSet = {
                ...baseStructureSet,
                structures: [
                    { structure: "minecraft:village_plains", weight: 10 },
                    { structure: "minecraft:village_desert", weight: 5 },
                    { structure: "minecraft:village_savanna", weight: 8 }
                ]
            };

            const result = await updateData(
                {
                    type: "structure_set.reorder_structures",
                    structureIds: ["structure_2", "structure_0", "structure_1"]
                },
                extendedStructureSet
            );

            expect(result?.structures).toEqual([
                { structure: "minecraft:village_savanna", weight: 8 },
                { structure: "minecraft:village_plains", weight: 10 },
                { structure: "minecraft:village_desert", weight: 5 }
            ]);
        });
    });
});
