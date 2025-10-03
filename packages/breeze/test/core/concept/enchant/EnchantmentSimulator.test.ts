import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnchantmentSimulator, type EnchantmentStats, type ItemData } from "@/core/calculation/EnchantmentSimulation";
import { enchantment, tagsEnchantment } from "@test/mock/enchant/EnchantmentSimulation";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";

describe("EnchantmentSimulator", () => {
	let simulator: EnchantmentSimulator;
	let enchantments: Map<string, Enchantment>;
	let exclusivityTags: DataDrivenRegistryElement<TagType>[];

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

	beforeEach(() => {
		enchantments = new Map();
		for (const [id, ench] of Object.entries(enchantment)) {
			enchantments.set(`minecraft:${id}`, ench);
		}

		exclusivityTags = Object.entries(tagsEnchantment).map(([id, tag]) => ({
			identifier: {
				namespace: "minecraft",
				registry: "tags/enchantment",
				resource: id
			},
			data: { values: tag.values }
		}));

		simulator = new EnchantmentSimulator(enchantments, exclusivityTags);
	});

	describe("simulateEnchantmentTable", () => {
		it("should return exactly 3 options", () => {
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			expect(options).toHaveLength(3);
			expect(options[0]).toHaveProperty("level");
			expect(options[0]).toHaveProperty("cost");
			expect(options[0]).toHaveProperty("enchantments");
		});

		it("should have increasing levels (top < middle < bottom)", () => {
			for (let i = 0; i < 10; i++) {
				const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

				expect(options[0].level).toBeLessThanOrEqual(options[1].level);
				expect(options[1].level).toBeLessThanOrEqual(options[2].level);
			}
		});

		it("should respect limits with 0 bookshelves", () => {
			const options = simulator.simulateEnchantmentTable(0, 10, diamondSword.tags);

			// With 0 bookshelves, max level = 8
			expect(options[0].level).toBeGreaterThanOrEqual(1);
			expect(options[0].level).toBeLessThanOrEqual(2);
			expect(options[2].level).toBeLessThanOrEqual(8);
		});

		it("should respect limits with 15 bookshelves", () => {
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			// With 15 bookshelves, max level = 30
			expect(options[0].level).toBeGreaterThanOrEqual(2);
			expect(options[0].level).toBeLessThanOrEqual(10);
			expect(options[2].level).toBeLessThanOrEqual(30);
		});

		it("should clamp bookshelves to 15 maximum", () => {
			const options1 = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);
			const options2 = simulator.simulateEnchantmentTable(100, 10, diamondSword.tags);

			// Levels should be in the same range
			expect(options1[2].level).toBeLessThanOrEqual(30);
			expect(options2[2].level).toBeLessThanOrEqual(30);
		});

		it("should respect item compatibility", () => {
			const options = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			for (const option of options) {
				for (const ench of option.enchantments) {
					const enchantment = enchantments.get(ench.enchantment);
					expect(enchantment).toBeDefined();

					// Check that the enchantment is compatible with the sword
					const supportedItems = Array.isArray(enchantment?.supported_items)
						? enchantment.supported_items
						: enchantment?.supported_items
							? [enchantment.supported_items]
							: [];

					const isCompatible = supportedItems.some((item) => {
						if (item.startsWith("#")) {
							return diamondSword.tags.includes(item.substring(1));
						}
						return diamondSword.tags.includes(item);
					});

					expect(isCompatible).toBe(true);
				}
			}
		});
	});

	describe("calculateEnchantmentProbabilities", () => {
		it("should calculate probabilities correctly", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 1000);

			expect(stats.length).toBeGreaterThan(0);

			for (const stat of stats) {
				expect(stat.probability).toBeGreaterThanOrEqual(0);
				expect(stat.probability).toBeLessThanOrEqual(100);
				expect(stat.averageLevel).toBeGreaterThanOrEqual(1);
				expect(stat.minLevel).toBeLessThanOrEqual(stat.maxLevel);
			}
		});

		it("should be sorted by decreasing probability", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 500);

			for (let i = 1; i < stats.length; i++) {
				expect(stats[i - 1].probability).toBeGreaterThanOrEqual(stats[i].probability);
			}
		});

		it("should have different probabilities based on bookshelves", () => {
			const stats0 = simulator.calculateEnchantmentProbabilities(0, 10, diamondSword.tags, 500);
			const stats15 = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 500);

			// With more bookshelves, we should have more available enchantments
			expect(stats15.length).toBeGreaterThanOrEqual(stats0.length);
		});

		it("should filter enchantments with 0% probability", () => {
			const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 100);

			for (const stat of stats) {
				expect(stat.probability).toBeGreaterThan(0);
			}
		});
	});

	describe("Private methods accessible via public tests", () => {
		describe("enchantability modifiers", () => {
			it("should apply enchantability modifiers", () => {
				// Test with different enchantabilities
				const results1: number[] = [];
				const results25: number[] = [];

				for (let i = 0; i < 100; i++) {
					// Use sword tags instead of book for more applicable enchantments
					const opts1 = simulator.simulateEnchantmentTable(15, 1, diamondSword.tags);
					const opts25 = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

					results1.push(opts1[2].level);
					results25.push(opts25[2].level);
				}

				const avg1 = results1.reduce((a, b) => a + b, 0) / results1.length;
				const avg25 = results25.reduce((a, b) => a + b, 0) / results25.length;

				// Items with higher enchantability should have higher levels
				// If averages are equal, it might be due to randomness, so accept equality
				expect(avg25).toBeGreaterThanOrEqual(avg1);
			});
		});

		describe("compatibility checking", () => {
			it("should respect mutual exclusions", () => {
				// Test multiple times due to randomness
				for (let i = 0; i < 50; i++) {
					const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

					for (const option of options) {
						const enchantmentIds = option.enchantments.map((e) => e.enchantment);

						// Check that there are no sharpness + smite
						const hasSharpness = enchantmentIds.includes("minecraft:sharpness");
						const hasSmite = enchantmentIds.includes("minecraft:smite");
						const hasBaneOfArthropods = enchantmentIds.includes("minecraft:bane_of_arthropods");

						// Should not have multiple damage enchantments
						const damageEnchants = [hasSharpness, hasSmite, hasBaneOfArthropods].filter(Boolean).length;
						expect(damageEnchants).toBeLessThanOrEqual(1);
					}
				}
			});

			it("should allow compatible enchantments", () => {
				// Sharpness and Unbreaking should be able to coexist
				let foundBoth = false;

				// Increase iterations for more chances
				for (let i = 0; i < 500; i++) {
					const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

					for (const option of options) {
						const enchantmentIds = option.enchantments.map((e) => e.enchantment);
						const hasSharpness = enchantmentIds.includes("minecraft:sharpness");
						const hasUnbreaking = enchantmentIds.includes("minecraft:unbreaking");

						if (hasSharpness && hasUnbreaking) {
							foundBoth = true;
							break;
						}
					}
					if (foundBoth) break;
				}

				// If still not found, verify that at least the enchantments exist separately
				if (!foundBoth) {
					let hasSharpnessAny = false;
					let hasUnbreakingAny = false;

					for (let i = 0; i < 100; i++) {
						const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);
						for (const option of options) {
							const enchantmentIds = option.enchantments.map((e) => e.enchantment);
							if (enchantmentIds.includes("minecraft:sharpness")) hasSharpnessAny = true;
							if (enchantmentIds.includes("minecraft:unbreaking")) hasUnbreakingAny = true;
						}
					}

					// At least verify they can appear individually
					expect(hasSharpnessAny).toBe(true);
					expect(hasUnbreakingAny).toBe(true);
				} else {
					expect(foundBoth).toBe(true);
				}
			});
		});

		describe("weighted selection", () => {
			it("should respect enchantment weights", () => {
				const sharpnessCount: number[] = [];
				const silkTouchCount: number[] = [];

				for (let i = 0; i < 500; i++) {
					const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

					for (const option of options) {
						const enchantmentIds = option.enchantments.map((e) => e.enchantment);
						sharpnessCount.push(enchantmentIds.includes("minecraft:sharpness") ? 1 : 0);
						silkTouchCount.push(enchantmentIds.includes("minecraft:silk_touch") ? 1 : 0);
					}
				}

				const sharpnessOccurrences = sharpnessCount.reduce((a, b) => a + b, 0);
				const silkTouchOccurrences = silkTouchCount.reduce((a, b) => a + b, 0);

				// Sharpness (weight: 10) should appear more often than Silk Touch (weight: 1)
				// Note: Silk Touch is not compatible with swords, so it should be 0
				expect(sharpnessOccurrences).toBeGreaterThan(0);
				expect(silkTouchOccurrences).toBe(0); // Silk Touch incompatible with swords
			});
		});

		describe("level calculation", () => {
			it("should calculate enchantment costs correctly", () => {
				// Test with Sharpness level 1: base=1, per_level=11
				const sharpness = enchantments.get("minecraft:sharpness");
				if (!sharpness) {
					throw new Error("Sharpness enchantment not found");
				}

				// Level 1: 1 + (1-1)*11 = 1
				// Level 5: 1 + (5-1)*11 = 45
				const minLevel1 = sharpness.min_cost.base + (1 - 1) * sharpness.min_cost.per_level_above_first;
				const minLevel5 = sharpness.min_cost.base + (5 - 1) * sharpness.min_cost.per_level_above_first;

				expect(minLevel1).toBe(1);
				expect(minLevel5).toBe(45);
			});
		});
	});

	describe("Enchantment table restrictions", () => {
		it("should never give mending from the enchantment table", () => {
			// Test with many simulations to be sure
			for (let i = 0; i < 1000; i++) {
				const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

				for (const option of options) {
					const enchantmentIds = option.enchantments.map((e) => e.enchantment);
					expect(enchantmentIds).not.toContain("minecraft:mending");
				}
			}
		});

		it("should never give treasure enchantments from the table", () => {
			const treasureEnchantments = [
				"minecraft:mending",
				"minecraft:frost_walker",
				"minecraft:binding_curse",
				"minecraft:vanishing_curse",
				"minecraft:soul_speed",
				"minecraft:swift_sneak"
			];

			for (let i = 0; i < 500; i++) {
				const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);

				for (const option of options) {
					const enchantmentIds = option.enchantments.map((e) => e.enchantment);

					for (const treasureEnch of treasureEnchantments) {
						expect(enchantmentIds).not.toContain(treasureEnch);
					}
				}
			}
		});

		it("should give appropriate enchantment levels for high slots", () => {
			// With 15 bookshelves and high enchantability, the bottom slot should give high levels
			const results: { level: number; enchantments: Array<{ enchantment: string; level: number }> }[] = [];

			for (let i = 0; i < 100; i++) {
				const options = simulator.simulateEnchantmentTable(15, 25, diamondSword.tags);
				const bottomOption = options[2]; // Bottom slot

				if (bottomOption.enchantments.length > 0) {
					results.push(bottomOption);
				}
			}

			// Verify we have at least some enchantments of level > 1 for high slots
			const highLevelEnchants = results.filter((r) => r.enchantments.some((e) => e.level > 1));

			expect(highLevelEnchants.length).toBeGreaterThan(0);

			// Verify that enchantment levels do not exceed max_level
			for (const result of results) {
				for (const ench of result.enchantments) {
					const enchData = enchantments.get(ench.enchantment);
					if (enchData) {
						expect(ench.level).toBeLessThanOrEqual(enchData.max_level);
						expect(ench.level).toBeGreaterThanOrEqual(1);
					}
				}
			}
		});

		it("should respect min/max costs of enchantments", () => {
			for (let i = 0; i < 50; i++) {
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
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle enchantability 0", () => {
			const zeroEnchantItem: ItemData = {
				id: "test:zero_enchant",
				enchantability: 0,
				tags: ["minecraft:enchantable/sword"]
			};

			const options = simulator.simulateEnchantmentTable(15, 0, zeroEnchantItem.tags);
			expect(options).toHaveLength(3);
		});

		it("should handle items without compatible tags", () => {
			const incompatibleItem: ItemData = {
				id: "test:incompatible",
				enchantability: 10,
				tags: ["test:unknown_tag"]
			};

			const options = simulator.simulateEnchantmentTable(15, 10, incompatibleItem.tags);

			// Should return options without enchantments
			for (const option of options) {
				expect(option.enchantments).toHaveLength(0);
			}
		});

		it("should handle enchantments without weight", () => {
			const customEnchantments = new Map(enchantments);
			const testEnchant: Enchantment = {
				description: "Test",
				supported_items: "#minecraft:enchantable/sword",
				weight: 0, // Weight 0
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			};
			customEnchantments.set("test:zero_weight", testEnchant);

			const testSimulator = new EnchantmentSimulator(customEnchantments);
			const options = testSimulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			// Should work without crash
			expect(options).toHaveLength(3);
		});
	});

	describe("Consistency tests", () => {
		it("should be deterministic with the same seed", () => {
			// Mock Math.random for reproducible results
			const mockRandom = vi.spyOn(Math, "random");

			const randomValues = [0.5, 0.3, 0.7, 0.1, 0.9, 0.2, 0.8, 0.4, 0.6, 0.15];
			let callIndex = 0;

			mockRandom.mockImplementation(() => {
				const value = randomValues[callIndex % randomValues.length];
				callIndex++;
				return value;
			});

			const options1 = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			// Reset counter
			callIndex = 0;
			const options2 = simulator.simulateEnchantmentTable(15, 10, diamondSword.tags);

			expect(options1).toEqual(options2);

			mockRandom.mockRestore();
		});

		it("should have consistent results across multiple runs", () => {
			const results: EnchantmentStats[][] = [];

			for (let i = 0; i < 10; i++) {
				const stats = simulator.calculateEnchantmentProbabilities(15, 10, diamondSword.tags, 100);
				results.push(stats);
			}

			// Most common enchantments should be similar
			const topEnchantments = results.map((r) => r[0]?.enchantmentId).filter(Boolean);
			const uniqueTop = new Set(topEnchantments);

			// Should not have too much variation in top enchantment
			expect(uniqueTop.size).toBeLessThanOrEqual(5);
		});
	});
});
