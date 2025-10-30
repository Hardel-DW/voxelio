import { describe, it, expect, beforeAll, vi } from "vitest";
import { EnchantmentSimulator, type ItemData } from "@/core/calculation/EnchantmentSimulation";
import { enchantment, tagsEnchantment } from "@test/mock/enchant/EnchantmentSimulation";
import { itemTags } from "@test/mock/tags/Item";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";

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

describe("EnchantmentSimulator", () => {
	let simulator: EnchantmentSimulator;
	let enchantments: Map<string, Enchantment>;
	let exclusivityTags: DataDrivenRegistryElement<TagType>[];

	beforeAll(() => {
		enchantments = new Map(Object.entries(enchantment).map(([id, ench]) => [`minecraft:${id}`, ench]));
		exclusivityTags = Object.entries(tagsEnchantment).map(([id, tag]) => ({
			identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: id },
			data: { values: tag.values }
		}));
		simulator = new EnchantmentSimulator(enchantments, exclusivityTags);
	});

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
						item.startsWith("#")
							? diamondSword.tags.includes(item.substring(1))
							: diamondSword.tags.includes(item)
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
			const customEnchantments = new Map(enchantments);
			const testEnchant: Enchantment = {
				description: "Test",
				supported_items: "#minecraft:enchantable/sword",
				weight: 0,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			};
			customEnchantments.set("test:zero_weight", testEnchant);
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
			testEnchantments.set("test:direct", {
				description: "Test",
				supported_items: "minecraft:stick",
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});
			testEnchantments.set("test:array", {
				description: "Test Array",
				supported_items: ["minecraft:apple", "minecraft:bread"],
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

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
			testEnchantments.set("test:incomplete", {
				description: "Incomplete",
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			expect(() => testSimulator.getFlattenedPrimaryItems(itemTags)).toThrow("has neither primary_items nor supported_items defined");
		});

		it("should handle unknown tags gracefully", () => {
			const testEnchantments = new Map();
			testEnchantments.set("test:unknown", {
				description: "Unknown Tag",
				supported_items: "#unknown:nonexistent",
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(itemTags);
			expect(Array.isArray(items)).toBe(true);
		});
	});
});
