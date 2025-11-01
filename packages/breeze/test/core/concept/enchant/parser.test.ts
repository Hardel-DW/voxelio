import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { describe, expect, it } from "vitest";

describe("Data Driven to Voxel Element", () => {
    it("should parse accuracy_shot with effects", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.accuracy_shot, tags: ["#foo:bar"] });
        expect(parsed).toBeDefined();
        expect(parsed.description).toEqual({ translate: "enchantment.enchantplus.accuracy_shot", fallback: "Accuracy Shot" });
        expect(parsed.supportedItems).toBe("#voxel:enchantable/range");
        expect(parsed.weight).toBe(2);
        expect(parsed.maxLevel).toBe(1);
        expect(parsed.slots).toEqual(["mainhand", "offhand"]);
        expect(parsed.mode).toBe("normal");
    });

    it("should parse sharpness with exclusive_set and primary_items", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.sharpness });
        expect(parsed.exclusiveSet).toBe("#minecraft:exclusive_set/damage");
        expect(parsed.primaryItems).toBe("#minecraft:enchantable/sword");
        expect(parsed.supportedItems).toBe("#minecraft:enchantable/sharp_weapon");
        expect(parsed.weight).toBe(10);
        expect(parsed.maxLevel).toBe(5);
    });

    it("should detect soft_delete mode when no effects and no tags", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.armored_soft_delete, tags: [] });
        expect(parsed.mode).toBe("soft_delete");
        expect(parsed.effects).toBeUndefined();
    });

    it("should detect only_creative mode when only functionality tags", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({
            element: originalEnchantments.agility_only_creative,
            tags: ["#minecraft:curse", "#minecraft:double_trade_price"]
        });
        expect(parsed.mode).toBe("only_creative");
    });

    it("should detect normal mode when effects are present", () => {
        const parsed = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.accuracy_shot, tags: ["#foo:bar"] });
        expect(parsed.mode).toBe("normal");
        expect(parsed.effects).toBeDefined();
    });
});