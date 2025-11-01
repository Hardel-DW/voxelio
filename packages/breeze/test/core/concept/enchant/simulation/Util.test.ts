import { describe, it, expect, vi } from "vitest";
import { EnchantmentSimulator } from "@/core/calculation/EnchantmentSimulation";
import { originalEnchantments } from "@test/mock/enchant/DataDriven";
import type { Enchantment } from "@/core/schema/enchant/types";

const enchantments = new Map<string, Enchantment>([
	["minecraft:sharpness", originalEnchantments.sharpness.data],
	["minecraft:smite", originalEnchantments.smite.data],
	["minecraft:unbreaking", originalEnchantments.unbreaking.data]
]);
const simulator = new EnchantmentSimulator(enchantments);

describe("EnchantmentSimulator Utils", () => {
	describe("calculateEnchantmentCost", () => {
		it("should calculate the cost correctly", () => {
			const cost = { base: 10, per_level_above_first: 5 };

			// Level 1: 10 + (1-1)*5 = 10
			// @ts-expect-error - Testing private method
			const result1 = simulator.calculateEnchantmentCost(cost, 1);
			expect(result1).toBe(10);

			// Level 3: 10 + (3-1)*5 = 20
			// @ts-expect-error - Testing private method
			const result3 = simulator.calculateEnchantmentCost(cost, 3);
			expect(result3).toBe(20);

			// Level 5: 10 + (5-1)*5 = 30
			// @ts-expect-error - Testing private method
			const result5 = simulator.calculateEnchantmentCost(cost, 5);
			expect(result5).toBe(30);
		});

		it("should handle cases with per_level_above_first = 0", () => {
			const cost = { base: 15, per_level_above_first: 0 };

			// @ts-expect-error - Testing private method
			const result1 = simulator.calculateEnchantmentCost(cost, 1);
			expect(result1).toBe(15);

			// @ts-expect-error - Testing private method
			const result10 = simulator.calculateEnchantmentCost(cost, 10);
			expect(result10).toBe(15);
		});
	});

	describe("weightedRandomSelect", () => {
		it("should select according to weights", () => {
			const items = [
				{ id: "a", weight: 1 },
				{ id: "b", weight: 9 }
			];

			const mockRandom = vi.spyOn(Math, "random");

			mockRandom.mockReturnValueOnce(0.05);
			// @ts-expect-error - Testing private method
			const result1 = simulator.weightedRandomSelect(items);
			expect(result1?.id).toBe("a");
			mockRandom.mockReturnValueOnce(0.5);

			// @ts-expect-error - Testing private method
			const result2 = simulator.weightedRandomSelect(items);
			expect(result2?.id).toBe("b");

			mockRandom.mockRestore();
		});

		it("should handle empty arrays", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.weightedRandomSelect([]);
			expect(result).toBeNull();
		});

		it("should handle zero weights", () => {
			const items = [
				{ id: "a", weight: 0 },
				{ id: "b", weight: 0 }
			];

			// @ts-expect-error - Testing private method
			const result = simulator.weightedRandomSelect(items);
			expect(["a", "b"]).toContain(result?.id);
		});

		it("should handle a single item", () => {
			const items = [{ id: "only", weight: 5 }];

			// @ts-expect-error - Testing private method
			const result = simulator.weightedRandomSelect(items);
			expect(result?.id).toBe("only");
		});
	});

	describe("areEnchantmentsCompatible", () => {
		it("should allow enchantments without exclusive_set", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.areEnchantmentsCompatible("minecraft:unbreaking", ["minecraft:sharpness"]);
			expect(result).toBe(true);
		});

		it("should forbid enchantments from the same exclusive group", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.areEnchantmentsCompatible("minecraft:sharpness", ["minecraft:smite"]);
			expect(result).toBe(false);
		});

		it("should allow enchantments from different groups", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.areEnchantmentsCompatible("minecraft:unbreaking", ["minecraft:sharpness"]);
			expect(result).toBe(true);
		});

		it("should handle non-existent enchantments", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.areEnchantmentsCompatible("minecraft:unknown", ["minecraft:sharpness"]);
			expect(result).toBe(true);
		});

		it("should handle empty lists of existing enchantments", () => {
			// @ts-expect-error - Testing private method
			const result = simulator.areEnchantmentsCompatible("minecraft:sharpness", []);
			expect(result).toBe(true);
		});
	});

	describe("applyEnchantabilityModifiers", () => {
		// randomInt(0, floor(10/4)) + 1 = randomInt(0, 2) + 1
		// modifier1 and modifier2 will be between 1 and 3
		// baseLevel=10, enchantability=10
		// modifiedLevel = 10 + 2 + 2 = 14
		// randomBonus = 1 + (0.5 + 0.5 - 1) * 0.15 = 1.0
		// result = Math.max(1, Math.round(14 * 1.0)) = 14
		it("should apply modifiers correctly", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValueOnce(0.5);
			mockRandom.mockReturnValueOnce(0.5);
			mockRandom.mockReturnValueOnce(0.5);
			mockRandom.mockReturnValueOnce(0.5);

			// @ts-expect-error - Testing private method
			const result = simulator.applyEnchantabilityModifiers(10, 10);
			expect(result).toBe(14);

			mockRandom.mockRestore();
		});

		it("should guarantee a minimum of 1", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0);
			// @ts-expect-error - Testing private method
			const result = simulator.applyEnchantabilityModifiers(0, 0);
			expect(result).toBeGreaterThanOrEqual(1);

			mockRandom.mockRestore();
		});

		it("should vary according to enchantability", () => {
			const results1: number[] = [];
			const results25: number[] = [];

			for (let i = 0; i < 50; i++) {
				// @ts-expect-error - Testing private method
				results1.push(simulator.applyEnchantabilityModifiers(10, 1));
				// @ts-expect-error - Testing private method
				results25.push(simulator.applyEnchantabilityModifiers(10, 25));
			}

			const avg1 = results1.reduce((a, b) => a + b, 0) / results1.length;
			const avg25 = results25.reduce((a, b) => a + b, 0) / results25.length;
			expect(avg25).toBeGreaterThan(avg1);
		});
	});

	describe("Base level calculation", () => {
		// Test with 15 shelves
		// base = randomInt(1,8) + floor(15/2) + randomInt(0,15)
		// base = randomInt(1,8) + 7 + randomInt(0,15)
		// base = 1 + 7 + 0 = 8
		// topSlot = floor(max(8/3, 1)) = floor(max(2.67, 1)) = 2
		// middleSlot = floor((8*2)/3 + 1) = floor(5.33 + 1) = 6
		// bottomSlot = floor(max(8, 15*2)) = floor(max(8, 30)) = 30
		it("should calculate the base level according to Minecraft formula", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValueOnce(0);
			mockRandom.mockReturnValueOnce(0);
			mockRandom.mockReturnValue(0.5);

			const options = simulator.simulateEnchantmentTable(15, 10, []);
			expect(options[0].level).toBeLessThanOrEqual(options[1].level);
			expect(options[1].level).toBeLessThanOrEqual(options[2].level);
			mockRandom.mockRestore();
		});
	});
});
