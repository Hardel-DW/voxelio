import { describe, it, expect } from "vitest";
import { VoxelToEnchantmentDataDriven } from "@/core/schema/enchant/Compiler";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/enchant/DataDriven";
import { Identifier } from "@/core/Identifier";

describe("Enchantment Schema", () => {
	describe("Data Driven to Voxel (Parser)", () => {
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

		describe("Mode Detection", () => {
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
	});

	describe("Voxel to Data Driven (Compiler)", () => {
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
			parsed.disabledEffects = ["minecraft:damage"];
			const compiled = VoxelToEnchantmentDataDriven(parsed, "enchantment", originalEnchantments.accuracy_shot_with_disabled.data);
			expect(compiled.element.data.effects).toBeDefined();
			expect(Object.keys(compiled.element.data.effects ?? {})).toContain("minecraft:projectile_spawned");
			expect(Object.keys(compiled.element.data.effects ?? {})).not.toContain("minecraft:damage");
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
});
