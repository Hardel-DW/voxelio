import { describe, it, expect, beforeEach } from "vitest";
import { EnchantmentSimulator } from "@/core/calculation/EnchantmentSimulation";
import { enchantment } from "@test/mock/enchant/EnchantmentSimulation";
import { itemTags } from "@test/mock/tags/Item";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";

describe("EnchantmentSimulator - getFlattenedPrimaryItems", () => {
	let simulator: EnchantmentSimulator;
	let enchantments: Map<string, Enchantment>;
	let mockItemTags: DataDrivenRegistryElement<TagType>[];

	beforeEach(() => {
		enchantments = new Map();
		for (const [id, ench] of Object.entries(enchantment)) {
			enchantments.set(`minecraft:${id}`, ench);
		}

		mockItemTags = itemTags;
		simulator = new EnchantmentSimulator(enchantments);
	});

	describe("Basic functionality", () => {
		it("should return an array of item identifiers", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);

			expect(Array.isArray(items)).toBe(true);
			expect(items.length).toBeGreaterThan(0);

			// All items should be strings
			for (const item of items) {
				expect(typeof item).toBe("string");
			}
		});

		it("should return sorted items", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);
			const sortedItems = [...items].sort();

			expect(items).toEqual(sortedItems);
		});

		it("should return unique items (no duplicates)", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);
			const uniqueItems = [...new Set(items)];

			expect(items).toEqual(uniqueItems);
		});
	});

	describe("Primary items field handling", () => {
		it("should use primary_items when available", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);

			// Check that items from primary_items field are included
			// bane_of_arthropods has primary_items: "#minecraft:enchantable/sword"
			expect(items).toContain("minecraft:wooden_sword");
			expect(items).toContain("minecraft:stone_sword");
			expect(items).toContain("minecraft:iron_sword");
			expect(items).toContain("minecraft:diamond_sword");
			expect(items).toContain("minecraft:netherite_sword");
			expect(items).toContain("minecraft:golden_sword");
		});

		it("should fallback to supported_items when primary_items is not defined", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);

			// aqua_affinity only has supported_items: "#minecraft:enchantable/head_armor"
			expect(items).toContain("minecraft:leather_helmet");
			expect(items).toContain("minecraft:chainmail_helmet");
			expect(items).toContain("minecraft:iron_helmet");
			expect(items).toContain("minecraft:diamond_helmet");
			expect(items).toContain("minecraft:netherite_helmet");
			expect(items).toContain("minecraft:golden_helmet");
			expect(items).toContain("minecraft:turtle_helmet");
		});
	});

	describe("Tag resolution", () => {
		it("should resolve item tags to concrete items", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);

			// sharpness has primary_items: "#minecraft:enchantable/sword"
			// This tag should resolve to all sword items
			expect(items).toContain("minecraft:wooden_sword");
			expect(items).toContain("minecraft:stone_sword");
			expect(items).toContain("minecraft:iron_sword");
			expect(items).toContain("minecraft:diamond_sword");
			expect(items).toContain("minecraft:netherite_sword");
			expect(items).toContain("minecraft:golden_sword");
		});

		it("should resolve nested tags", () => {
			const items = simulator.getFlattenedPrimaryItems(mockItemTags);

			// Some enchantments use tags that reference other tags
			// enchantable/sharp_weapon includes enchantable/sword + trident
			expect(items).toContain("minecraft:trident");
		});

		it("should handle direct item IDs", () => {
			// Create a test enchantment with direct item ID
			const testEnchantments = new Map(enchantments);
			testEnchantments.set("test:direct_item", {
				description: "Test Direct Item",
				supported_items: "minecraft:stick", // Direct item ID
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(mockItemTags);

			expect(items).toContain("minecraft:stick");
		});
	});

	describe("Array handling", () => {
		it("should handle array of items", () => {
			const testEnchantments = new Map();
			testEnchantments.set("test:array_items", {
				description: "Test Array Items",
				supported_items: ["minecraft:apple", "minecraft:bread"],
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(mockItemTags);

			expect(items).toContain("minecraft:apple");
			expect(items).toContain("minecraft:bread");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty enchantments map", () => {
			const emptySimulator = new EnchantmentSimulator(new Map());
			const items = emptySimulator.getFlattenedPrimaryItems(mockItemTags);
			expect(items).toEqual([]);
		});

		it("should throw error when enchantment has neither primary_items nor supported_items", () => {
			const testEnchantments = new Map();
			const incompleteEnchantment = {
				description: "Incomplete Enchantment",
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			} as any; // Force type to allow missing supported_items

			testEnchantments.set("test:incomplete", incompleteEnchantment);
			const testSimulator = new EnchantmentSimulator(testEnchantments);

			// Should throw an error for critical misconfiguration
			expect(() => {
				testSimulator.getFlattenedPrimaryItems(mockItemTags);
			}).toThrow("Enchantment test:incomplete has neither primary_items nor supported_items defined");
		});

		it("should handle unknown tags gracefully", () => {
			const testEnchantments = new Map();
			testEnchantments.set("test:unknown_tag", {
				description: "Test Unknown Tag",
				supported_items: "#unknown:nonexistent_tag",
				weight: 1,
				max_level: 1,
				min_cost: { base: 1, per_level_above_first: 0 },
				max_cost: { base: 50, per_level_above_first: 0 },
				anvil_cost: 1,
				slots: ["mainhand"]
			});

			const testSimulator = new EnchantmentSimulator(testEnchantments);
			const items = testSimulator.getFlattenedPrimaryItems(mockItemTags);

			// Should not crash when tag doesn't exist
			expect(Array.isArray(items)).toBe(true);
			expect(items).toEqual([]);
		});
	});
});
