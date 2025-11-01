import { describe, it, expect } from "vitest";
import { VoxelToEnchantmentDataDriven } from "@/core/schema/enchant/Compiler";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/enchant/DataDriven";

describe("Enchantment E2E Tests", () => {
	describe("Complete workflow: Parse → Compile", () => {
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
	});
}); 
