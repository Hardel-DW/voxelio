import { describe, it, expect } from "vitest";
import { type EnchantmentPossible, EnchantmentSimulator } from "@/core/calculation/EnchantmentSimulation";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { exclusivityTestTags } from "@test/mock/tags/enchant";
import type { Enchantment } from "@/core/schema/enchant/types";

const enchantments = new Map<string, Enchantment>(
	Object.values(originalEnchantments).map((element) => [
		`${element.identifier.namespace}:${element.identifier.resource}`,
		element.data
	])
);

const simulator = new EnchantmentSimulator(enchantments, exclusivityTestTags);

describe("EnchantmentSimulator - Exclusivity and Primary Items", () => {
	describe("Exclusive Set Compatibility", () => {
		it("should reject enchantments with same exclusive_set (string vs tag)", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:sharpness_v2", ["minecraft:sharpness"]);
			expect(compatible).toBe(false);
		});

		it("should reject enchantments with same exclusive_set (tag vs tag)", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:damage_boost", ["minecraft:sharpness"]);
			expect(compatible).toBe(false);
		});

		it("should reject enchantments with overlapping exclusive_set (array)", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:multi_exclusive", ["minecraft:sharpness"]);
			expect(compatible).toBe(false);
		});

		it("should allow enchantments with different exclusive_sets", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:universal", ["minecraft:sharpness"]);
			expect(compatible).toBe(true);
		});

		it("should allow enchantments when neither has exclusive_set", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:universal", ["minecraft:unbreaking"]);
			expect(compatible).toBe(true);
		});

		it("should handle multiple existing enchantments", () => {
			// @ts-expect-error - Testing private method areEnchantmentsCompatible
			const compatible = simulator.areEnchantmentsCompatible("test:multi_exclusive", ["minecraft:sharpness", "minecraft:unbreaking"]);
			expect(compatible).toBe(false);
		});
	});

	describe("Primary Items vs Supported Items", () => {
		it("should use primary_items when both primary_items and supported_items are defined", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("minecraft:diamond_sword")).toContain("test:primary_wins");
			expect(itemMap.get("minecraft:stone_sword")).toBeUndefined();
		});

		it("should use supported_items when primary_items is not defined", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("minecraft:diamond_sword")).toContain("test:supported_only_string");
		});

		it("should handle string format for items", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("minecraft:diamond_sword")).toContain("test:supported_only_string");
		});

		it("should handle tag format for items", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("#minecraft:enchantable/sword")).toContain("test:supported_only_tag");
		});

		it("should handle array format for items", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;

			expect(itemMap.get("minecraft:diamond_sword")).toContain("test:supported_only_array");
			expect(itemMap.get("minecraft:iron_sword")).toContain("test:supported_only_array");
		});

		it("should handle primary_items as tag", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("#minecraft:enchantable/sword")).toContain("test:primary_tag");
		});

		it("should handle primary_items as array", () => {
			// @ts-expect-error - Testing private method buildItemTagToEnchantmentsMap
			simulator.buildItemTagToEnchantmentsMap();
			// @ts-expect-error - Accessing private property itemTagToEnchantmentsMap
			const itemMap = simulator.itemTagToEnchantmentsMap;
			expect(itemMap.get("minecraft:diamond_sword")).toContain("test:primary_array");
			expect(itemMap.get("minecraft:netherite_sword")).toContain("test:primary_array");
		});
	});

	describe("Integration Tests", () => {
		const swordTags = [
			"#minecraft:swords",
			"#minecraft:enchantable/sword",
			"#minecraft:enchantable/weapon",
			"#minecraft:enchantable/durability"
		];

		it("should find enchantments for sword items", () => {
			// @ts-expect-error - Testing private method findPossibleEnchantments
			const possible = simulator.findPossibleEnchantments(30, new Set(swordTags));
			const enchantmentIds = possible.map((p: EnchantmentPossible) => p.id);
			expect(enchantmentIds).toContain("test:supported_only_tag");
			expect(enchantmentIds).toContain("test:primary_tag");
		});

		it("should respect exclusive sets in simulation", () => {
			let foundConflict = false;

			for (let i = 0; i < 100; i++) {
				const options = simulator.simulateEnchantmentTable(15, 10, swordTags);

				for (const option of options) {
					const enchIds = option.enchantments.map((e) => e.enchantment);

					const hasSharpness = enchIds.includes("minecraft:sharpness");
					const hasSmite = enchIds.includes("minecraft:smite");
					const hasTestDamage = enchIds.includes("test:damage_boost");

					if ((hasSharpness && hasSmite) || (hasSharpness && hasTestDamage) || (hasSmite && hasTestDamage)) {
						foundConflict = true;
						break;
					}
				}

				if (foundConflict) break;
			}

			expect(foundConflict).toBe(false);
		});
	});
});
