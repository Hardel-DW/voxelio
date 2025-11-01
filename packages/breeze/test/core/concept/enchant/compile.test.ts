import { Identifier } from "@/core/Identifier";
import { VoxelToEnchantmentDataDriven } from "@/core/schema/enchant/Compiler";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { describe, expect, it } from "vitest";

describe("Voxel Element to Data Driven", () => {
    it("should preserve enchantment data integrity through parse and compile cycle", () => {
        const original = originalEnchantments.attack_speed;
        const voxel = EnchantmentDataDrivenToVoxelFormat({ element: original });
        const compiled = VoxelToEnchantmentDataDriven(voxel, "enchantment", original.data);

        expect(compiled.element.data.description).toEqual(original.data.description);
        expect(compiled.element.data.exclusive_set).toBe(original.data.exclusive_set);
        expect(compiled.element.data.supported_items).toBe(original.data.supported_items);
        expect(compiled.element.data.weight).toBe(original.data.weight);
        expect(compiled.element.data.max_level).toBe(original.data.max_level);
        expect(compiled.element.data.anvil_cost).toBe(original.data.anvil_cost);
        expect(compiled.element.data.slots).toEqual(original.data.slots);
        expect(compiled.element.data.min_cost).toEqual(original.data.min_cost);
        expect(compiled.element.data.max_cost).toEqual(original.data.max_cost);
        expect(compiled.element.data.effects).toEqual(original.data.effects);
    });

    it("should compile simple voxel element", () => {
        const element = originalEnchantments.accuracy_shot_with_disabled;
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.accuracy_shot_with_disabled });
        const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment", element.data);
        expect(compiled).toBeDefined();
        expect(compiled.element.data.description).toBeDefined();
        expect(compiled.element.data.supported_items).toBeDefined();
        expect(compiled.element.data.weight).toBe(2);
        expect(compiled.element.data.max_level).toBe(1);
    });

    it("should compile with original data and preserve fields", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.accuracy_shot_with_disabled });
        const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment", originalEnchantments.accuracy_shot_with_disabled.data);
        expect(compiled.element.data.exclusive_set).toBe("#enchantplus:exclusive_set/bow");
        expect(compiled.element.data.min_cost).toEqual({ base: 20, per_level_above_first: 9 });
        expect(compiled.element.data.max_cost).toEqual({ base: 65, per_level_above_first: 9 });
        expect(compiled.element.data.effects).toBeDefined();
    });

    it("should handle disabled effects when compiling", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.accuracy_shot_with_disabled });
        parsed.disabledEffects = ["bar"];
        const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment", originalEnchantments.accuracy_shot_with_disabled.data);
        expect(compiled.element.data.effects).toBeDefined();
        expect(Object.keys(compiled.element.data.effects ?? {})).toContain("foo");
        expect(Object.keys(compiled.element.data.effects ?? {})).not.toContain("bar");
    });

    describe("Only Creative Compilation", () => {
        it("should filter out non-functionality tags in only_creative mode", () => {
            const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.agility_only_creative, tags: ["#minecraft:curse", "#minecraft:double_trade_price"] });
            const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment");

            expect(compiled.tags.find(tag =>
                new Identifier(tag).equalsObject(Identifier.of("minecraft:double_trade_price", "tags/enchantment"))
            )).toBeUndefined();
            expect(compiled.tags.find(tag =>
                new Identifier(tag).equalsObject(Identifier.of("minecraft:curse", "tags/enchantment"))
            )).toBeUndefined();
        });
    });

    describe("Soft Delete Compilation", () => {
        it("should remove exclusive_set and effects in soft_delete mode", () => {
            const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.armored_soft_delete, tags: [] });
            const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment");
            expect(compiled.tags).toEqual([]);
            expect(compiled.element.data.exclusive_set).toBeUndefined();
            expect(compiled.element.data.effects).toBeUndefined();
        });
    });
}); 
