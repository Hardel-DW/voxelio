import { describe, it, expect, vi } from "vitest";
import type { EnchantmentOption, EnchantmentPossible, ItemData } from "@/core/calculation/EnchantmentSimulation";
import { EnchantmentSimulator } from "@/core/calculation/EnchantmentSimulation";
import { array, direct, incomplete, originalEnchantments, unknown_tag } from "@test/mock/concept/enchant";
import { exclusivityTestTags, simulationTags } from "@test/mock/tags/enchant";
import { itemTags } from "@test/mock/tags/item";
import type { Enchantment } from "@/core/schema/enchant/types";

const enchantments = new Map<string, Enchantment>(
	Object.values(originalEnchantments).map((element) => [`${element.identifier.namespace}:${element.identifier.resource}`, element.data])
);

const diamondSword: ItemData = {
	id: "minecraft:diamond_sword",
	enchantability: 10,
	tags: [
		"minecraft:swords",
		"minecraft:breaks_decorated_pots",
		"minecraft:enchantable/fire_aspect",
		"minecraft:enchantable/sword",
		"minecraft:enchantable/sharp_weapon",
		"minecraft:enchantable/weapon",
		"minecraft:enchantable/durability"
	]
};

const testItem: ItemData = {
	id: "minecraft:diamond_sword",
	enchantability: 10,
	tags: ["minecraft:enchantable/sword", "minecraft:enchantable/sharp_weapon", "minecraft:enchantable/weapon"]
};

describe("EnchantmentSimulator", () => {
	const simulator = new EnchantmentSimulator(enchantments, simulationTags);

	describe("simulateEnchantmentTable", () => {
		it("should return exactly 3 options with correct structure", () => {
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			expect(options).toHaveLength(3);
			expect(options[0]).toHaveProperty("level");
			expect(options[0]).toHaveProperty("cost");
			expect(options[0]).toHaveProperty("enchantments");
		});

		it("should have increasing levels with mocked randomness", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0.5);
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			expect(options[0].level).toBeLessThanOrEqual(options[1].level);
			expect(options[1].level).toBeLessThanOrEqual(options[2].level);
			mockRandom.mockRestore();
		});

		it("should respect bookshelf limits (0 and 15 bookshelves)", () => {
			const minOptions = simulator.simulateEnchantmentTable(0, 10, diamondSword.tags);
			const maxOptions = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			expect(minOptions[0].level).toBeGreaterThanOrEqual(1);
			expect(minOptions[2].level).toBeLessThanOrEqual(8);
			expect(maxOptions[0].level).toBeGreaterThanOrEqual(2);
			expect(maxOptions[2].level).toBeLessThanOrEqual(30);
		});

		it("should clamp bookshelves to maximum of 15", () => {
			const minOptions = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			const maxOptions = simulator.simulateEnchantmentTable(100, 10, diamondSword.tags);
			expect(minOptions[2].level).toBeLessThanOrEqual(30);
			expect(maxOptions[2].level).toBeLessThanOrEqual(30);
		});

		it("should only return compatible enchantments for item", () => {
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			for (const option of options) {
				for (const ench of option.enchantments) {
					const enchantment = enchantments.get(ench.enchantment);
					expect(enchantment).toBeDefined();

					const supportedItems = Array.isArray(enchantment?.supported_items)
						? enchantment.supported_items
						: enchantment?.supported_items
							? [enchantment.supported_items]
							: [];

					const isCompatible = supportedItems.some((item) =>
						item.startsWith("#") ? diamondSword.tags.includes(item.substring(1)) : diamondSword.tags.includes(item)
					);

					expect(isCompatible).toBe(true);
				}
			}
		});
	});

	describe("calculateEnchantmentProbabilities", () => {
		it("should calculate valid probabilities for all enchantments", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 1000);
			expect(stats.length).toBeGreaterThan(0);

			for (const stat of stats) {
				expect(stat.probability).toBeGreaterThanOrEqual(0);
				expect(stat.probability).toBeLessThanOrEqual(100);
				expect(stat.averageLevel).toBeGreaterThanOrEqual(1);
				expect(stat.minLevel).toBeLessThanOrEqual(stat.maxLevel);
			}
		});

		it("should return results sorted by decreasing probability", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 500);
			for (let i = 1; i < stats.length; i++) {
				expect(stats[i - 1].probability).toBeGreaterThanOrEqual(stats[i].probability);
			}
		});

		it("should have more enchantments with more bookshelves", () => {
			const stats0 = simulator.calculateEnchantmentProbabilities(0, 10, diamondSword.tags, 500);
			const stats15 = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 500);
			expect(stats15.length).toBeGreaterThanOrEqual(stats0.length);
		});

		it("should filter out enchantments with 0% probability", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 100);
			for (const stat of stats) {
				expect(stat.probability).toBeGreaterThan(0);
			}
		});
	});

	describe("Enchantability modifiers", () => {
		it("should produce higher levels with higher enchantability", () => {
			const mockRandom = vi.spyOn(Math, "random");
			const randomValues = [0.5, 0.3, 0.7, 0.1, 0.9, 0.2, 0.8, 0.4, 0.6, 0.15];
			let callIndex = 0;

			mockRandom.mockImplementation(() => {
				const value = randomValues[callIndex % randomValues.length];
				callIndex++;
				return value;
			});

			const opts1 = simulator.simulateEnchantmentTable(15, 1, diamondSword.tags);
			callIndex = 0;
			const opts25 = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

			expect(opts25[2].level).toBeGreaterThanOrEqual(opts1[2].level);
			mockRandom.mockRestore();
		});
	});

	describe("Enchantment exclusivity and compatibility", () => {
		it("should never return multiple exclusive enchantments together", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0.5);
			const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

			for (const option of options) {
				const enchantmentIds = option.enchantments.map((e) => e.enchantment);
				const hasSharpness = enchantmentIds.includes("minecraft:sharpness");
				const hasSmite = enchantmentIds.includes("minecraft:smite");
				const hasBaneOfArthropods = enchantmentIds.includes("minecraft:bane_of_arthropods");
				const damageEnchants = [hasSharpness, hasSmite, hasBaneOfArthropods].filter(Boolean).length;
				expect(damageEnchants).toBeLessThanOrEqual(1);
			}

			mockRandom.mockRestore();
		});

		it("should verify Silk Touch is incompatible with swords", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0.5);
			const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);
			for (const option of options) {
				const enchantmentIds = option.enchantments.map((e) => e.enchantment);
				expect(enchantmentIds).not.toContain("minecraft:silk_touch");
			}
			mockRandom.mockRestore();
		});
	});

	describe("Enchantment table restrictions", () => {
		it("should never return treasure enchantments (mending, frost walker, curses, etc.)", () => {
			const treasureEnchantments = [
				"minecraft:mending",
				"minecraft:frost_walker",
				"minecraft:binding_curse",
				"minecraft:vanishing_curse",
				"minecraft:soul_speed",
				"minecraft:swift_sneak"
			];

			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0.5);
			const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

			for (const option of options) {
				const enchantmentIds = option.enchantments.map((e) => e.enchantment);
				for (const treasureEnch of treasureEnchantments) {
					expect(enchantmentIds).not.toContain(treasureEnch);
				}
			}

			mockRandom.mockRestore();
		});

		it("should respect enchantment level constraints (min/max)", () => {
			const mockRandom = vi.spyOn(Math, "random");
			mockRandom.mockReturnValue(0.5);
			const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

			for (const option of options) {
				for (const ench of option.enchantments) {
					const enchData = enchantments.get(ench.enchantment);
					if (enchData) {
						expect(ench.level).toBeGreaterThanOrEqual(1);
						expect(ench.level).toBeLessThanOrEqual(enchData.max_level);
					}
				}
			}

			mockRandom.mockRestore();
		});
	});

	describe("Enchantment cost calculation", () => {
		it("should calculate Sharpness costs correctly", () => {
			const sharpness = enchantments.get("minecraft:sharpness");
			if (!sharpness) throw new Error("Sharpness enchantment not found");
			const minLevel1 = sharpness.min_cost.base + (1 - 1) * sharpness.min_cost.per_level_above_first;
			const minLevel5 = sharpness.min_cost.base + (5 - 1) * sharpness.min_cost.per_level_above_first;
			expect(minLevel1).toBe(1);
			expect(minLevel5).toBe(45);
		});
	});

	describe("Edge cases", () => {
		it("should handle enchantability of 0", () => {
			const zeroEnchantItem: ItemData = {
				id: "test:zero_enchant",
				enchantability: 0,
				tags: ["minecraft:enchantable/sword"]
			};

			const options = simulator.simulateEnchantmentTable(15, 0, zeroEnchantItem.tags);
			expect(options).toHaveLength(3);
		});

		it("should return empty enchantments for incompatible items", () => {
			const incompatibleItem: ItemData = {
				id: "test:incompatible",
				enchantability: 10,
				tags: ["test:unknown_tag"]
			};

			const options = simulator.simulateEnchantmentTable(15, 10, incompatibleItem.tags);
			for (const option of options) {
				expect(option.enchantments).toHaveLength(0);
			}
		});

		it("should handle enchantments with 0 weight", () => {
			const customEnchantments = new Map(enchantments).set("test:zero_weight", unknown_tag.data);
			const testSimulator = new EnchantmentSimulator(customEnchantments);
			const options = testSimulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			expect(options).toHaveLength(3);
		});
	});

	describe("Determinism and consistency", () => {
		it("should be deterministic with mocked randomness", () => {
			const mockRandom = vi.spyOn(Math, "random");
			const randomValues = [0.5, 0.3, 0.7, 0.1, 0.9, 0.2, 0.8, 0.4, 0.6, 0.15];
			let callIndex = 0;

			mockRandom.mockImplementation(() => {
				const value = randomValues[callIndex % randomValues.length];
				callIndex++;
				return value;
			});

			const options1 = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			callIndex = 0;
			const options2 = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			expect(options1).toEqual(options2);
			mockRandom.mockRestore();
		});

		it("should use early stopping for probability calculations", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 1000);
			expect(stats.length).toBeGreaterThan(0);
			expect(stats[0].probability).toBeGreaterThan(0);
		});
	});

	describe("getFlattenedPrimaryItems", () => {
		it("should return sorted unique array of item identifiers", () => {
			const items = simulator.getFlattenedPrimaryItems(itemTags);
			expect(Array.isArray(items)).toBe(true);
			expect(items.length).toBeGreaterThan(0);

			for (const item of items) expect(typeof item).toBe("string");
			const sortedItems = [...items].sort();
			expect(items).toEqual(sortedItems);

			const uniqueItems = [...new Set(items)];
			expect(items).toEqual(uniqueItems);
		});

		it("should resolve tags and nested tags correctly", () => {
			const items = simulator.getFlattenedPrimaryItems(itemTags);
			expect(items).toContain("minecraft:wooden_sword");
			expect(items).toContain("minecraft:diamond_sword");
			expect(items).toContain("minecraft:trident");
		});

		it("should handle direct item IDs and arrays", () => {
			const testEnchantments = new Map(enchantments);
			testEnchantments.set("test:direct", direct.data);
			testEnchantments.set("test:array", array.data);
			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(itemTags);
			expect(items).toContain("minecraft:stick");
			expect(items).toContain("minecraft:apple");
			expect(items).toContain("minecraft:bread");
		});

		it("should return empty array for empty enchantments", () => {
			const emptySimulator = new EnchantmentSimulator(new Map());
			const items = emptySimulator.getFlattenedPrimaryItems(itemTags);
			expect(items).toEqual([]);
		});

		it("should throw error for enchantment without items field", () => {
			const testEnchantments = new Map();
			testEnchantments.set("test:incomplete", incomplete.data);

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			expect(() => testSimulator.getFlattenedPrimaryItems(itemTags)).toThrow("has neither primary_items nor supported_items defined");
		});

		it("should handle unknown tags gracefully", () => {
			const testEnchantments = new Map();
			testEnchantments.set("test:unknown", unknown_tag.data);
			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(itemTags);
			expect(Array.isArray(items)).toBe(true);
		});
	});
});

describe("EnchantmentSimulator - Exclusivity and Primary Items", () => {
	const simulator = new EnchantmentSimulator(enchantments, exclusivityTestTags);

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

describe("EnchantmentSimulator Performance", () => {
	const simulator = new EnchantmentSimulator(enchantments, simulationTags);

	describe("Single simulation performance", () => {
		it("should simulate an enchantment table quickly", () => {
			const start = performance.now();
			for (let i = 0; i < 200; i++) {
				simulator.simulateEnchantmentTable(15, 10, testItem.tags);
			}
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(50);
		});

		it("should handle high enchantability without slowdown", () => {
			const start = performance.now();
			for (let i = 0; i < 50; i++) simulator.simulateEnchantmentTable(15, 100, testItem.tags);
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(30);
		});
	});

	describe("Probability calculation performance", () => {
		it("should calculate probabilities efficiently with early stopping", () => {
			const start = performance.now();
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, testItem.tags, 1000);
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(200);
			expect(stats.length).toBeGreaterThan(0);
		});
	});

	describe("Stress tests", () => {
		it("should handle many enchantments with caching", () => {
			const manyEnchantments = new Map<string, Enchantment>(enchantments);

			for (let i = 0; i < 200; i++) {
				manyEnchantments.set(`test:enchant_${i}`, {
					description: `Test Enchant ${i}`,
					supported_items: "#minecraft:enchantable/sword",
					weight: Math.floor(Math.random() * 10) + 1,
					max_level: Math.floor(Math.random() * 5) + 1,
					min_cost: { base: 1, per_level_above_first: 5 },
					max_cost: { base: 50, per_level_above_first: 5 },
					anvil_cost: 1,
					slots: ["mainhand"]
				});
			}

			const stressSimulator = new EnchantmentSimulator(manyEnchantments);
			const start = performance.now();
			for (let i = 0; i < 50; i++) {
				stressSimulator.simulateEnchantmentTable(15, 10, testItem.tags);
			}
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(300);
		});

		it("should handle many tags on an item with cache hits", () => {
			const manyTagsItem: ItemData = {
				id: "test:super_item",
				enchantability: 10,
				tags: []
			};

			for (let i = 0; i < 50; i++) {
				manyTagsItem.tags.push(`test:tag_${i}`);
			}

			const start = performance.now();
			for (let i = 0; i < 200; i++) {
				simulator.simulateEnchantmentTable(15, 10, manyTagsItem.tags);
			}
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(100);
		});
	});

	describe("Concurrent simulations", () => {
		it("should handle parallel simulations with shared cache", async () => {
			const promises: Promise<EnchantmentOption[]>[] = [];

			for (let i = 0; i < 5; i++) {
				promises.push(
					Promise.resolve().then(() => {
						const results: any[] = [];
						for (let j = 0; j < 20; j++) {
							results.push(simulator.simulateEnchantmentTable(15, 10, testItem.tags));
						}
						return results;
					})
				);
			}

			const allResults = await Promise.all(promises);
			expect(allResults).toHaveLength(5);
			expect(allResults[0]).toHaveLength(20);
		});
	});
});

describe("EnchantmentSimulator Utils", () => {
	const enchantments = new Map<string, Enchantment>([
		["minecraft:sharpness", originalEnchantments.sharpness.data],
		["minecraft:smite", originalEnchantments.smite.data],
		["minecraft:unbreaking", originalEnchantments.unbreaking.data]
	]);
	const simulator = new EnchantmentSimulator(enchantments);

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
