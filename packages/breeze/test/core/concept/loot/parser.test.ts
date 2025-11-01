import { describe, expect, it } from "vitest";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import { simple, extreme, reference } from "@test/mock/concept/loot";

describe("Data Driven to Voxel Element", () => {
    describe("Should parse simple loot table", () => {
        it("should parse simple loot table", () => {
            const parsed = LootDataDrivenToVoxelFormat({ element: simple });
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
            const parsed = LootDataDrivenToVoxelFormat({ element: extreme });
            expect(parsed.items).toHaveLength(2);
            expect(parsed.groups).toHaveLength(3);

            const group2Id = parsed.groups[2].id;
            const alternativesGroup = parsed.groups.find((g) => g.type === "alternatives");
            const groupType = parsed.groups.find((g) => g.type === "group");
            const sequenceGroup = parsed.groups.find((g) => g.type === "sequence");
            expect(alternativesGroup).toBeDefined();
            expect(groupType).toBeDefined();
            expect(sequenceGroup).toBeDefined();

            expect(alternativesGroup?.id).toBe(group2Id);
            expect(parsed.randomSequence).toBe("minecraft:entities/wither_skeleton");
        });
    });

    describe("Should parse multi-pool reference table", () => {
        it("should have three items in different pools", () => {
            const parsed = LootDataDrivenToVoxelFormat({ element: reference });
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