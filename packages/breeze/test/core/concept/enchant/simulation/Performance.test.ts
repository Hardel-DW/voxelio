import { describe, it, expect } from "vitest";
import { type EnchantmentOption, EnchantmentSimulator, type ItemData } from "@/core/calculation/EnchantmentSimulation";
import type { Enchantment } from "@/core/schema/enchant/types";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { simulationTags } from "@test/mock/tags/enchant";

const enchantments = new Map<string, Enchantment>(
	Object.values(originalEnchantments).map((element) => [
		`${element.identifier.namespace}:${element.identifier.resource}`,
		element.data
	])
);
const simulator = new EnchantmentSimulator(enchantments, simulationTags);

const testItem: ItemData = {
	id: "minecraft:diamond_sword",
	enchantability: 10,
	tags: ["minecraft:enchantable/sword", "minecraft:enchantable/sharp_weapon", "minecraft:enchantable/weapon"]
};

describe("EnchantmentSimulator Performance", () => {
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
