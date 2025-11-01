import { describe, expect, it } from "vitest";
import { LootTableAppearanceProbability } from "@/core/calculation/LootTableAppearanceProbability";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import { simulation, finalBoss } from "@test/mock/loot";

const simpleSimulationLootTable = LootDataDrivenToVoxelFormat({ element: simulation });
const extremeLootTable = LootDataDrivenToVoxelFormat({ element: finalBoss });

describe("LootTableProbabilityCalculator - Basic Weight Tests", () => {
	const calculator = new LootTableAppearanceProbability(simpleSimulationLootTable);

	// 85 -> Total weight: 1+2+3+4+5+6+7+8+9+10+10+10+10 and all probabilities should be 1
	it("should calculate correct probabilities for basic weights", () => {
		const results = calculator.calculateProbabilities();
		const totalWeight = 85;
		expect(results).toHaveLength(13);

		const diamond_pickaxe = results.find((r) => r.name === "minecraft:diamond_pickaxe");
		expect(diamond_pickaxe?.probability).toBeCloseTo(1 / totalWeight, 5);

		const diamond_shovel = results.find((r) => r.name === "minecraft:diamond_shovel");
		expect(diamond_shovel?.probability).toBeCloseTo(2 / totalWeight, 5);

		const crossbow1 = results.filter((r) => r.name === "minecraft:crossbow")[0];
		expect(crossbow1?.probability).toBeCloseTo(3 / totalWeight, 5);

		const ancient_debris = results.find((r) => r.name === "minecraft:ancient_debris");
		expect(ancient_debris?.probability).toBeCloseTo(6 / totalWeight, 5);

		const golden_apple = results.find((r) => r.name === "minecraft:golden_apple");
		expect(golden_apple?.probability).toBeCloseTo(10 / totalWeight, 5);

		const totalProbability = results.reduce((sum, r) => sum + r.probability, 0);
		expect(totalProbability).toBeCloseTo(1, 5);
	});

	it("should have correct itemIndex and poolIndex", () => {
		const results = calculator.calculateProbabilities();

		for (const result of results) {
			expect(result.itemIndex).toBeGreaterThanOrEqual(0);
			expect(result.itemIndex).toBeLessThan(simpleSimulationLootTable.items.length);
			expect(result.poolIndex).toBe(0);

			const item = calculator.getItemByIndex(result.itemIndex);
			expect(item).toBeDefined();
			expect(item?.name).toBe(result.name);
		}
	});

	// probability should be higher with luck - Weight should be: 1 + (2 * 3) = 7 instead of 1
	// New total weight: (1+6)+2+3+4+5+6+7+8+9+10+10+10+10 = 91 and Diamond pickaxe probability with luck: 7/91
	it("should handle luck modifier correctly", () => {
		const modifiedTable = {
			...simpleSimulationLootTable,
			items: simpleSimulationLootTable.items.map((item, index) => (index === 0 ? { ...item, quality: 2 } : item))
		};

		const modifiedCalculator = new LootTableAppearanceProbability(modifiedTable);
		const resultsNoLuck = modifiedCalculator.calculateProbabilities({ luck: 0 });
		const diamondPickaxeNoLuck = resultsNoLuck.find((r) => r.name === "minecraft:diamond_pickaxe");
		const resultsWithLuck = modifiedCalculator.calculateProbabilities({ luck: 3 });
		const diamondPickaxeWithLuck = resultsWithLuck.find((r) => r.name === "minecraft:diamond_pickaxe");
		expect(diamondPickaxeWithLuck?.probability).toBeGreaterThan(diamondPickaxeNoLuck?.probability || 0);
		expect(diamondPickaxeWithLuck?.probability).toBeCloseTo(7 / 91, 5);
	});

	it("should exclude items by ID", () => {
		const item0Id = simpleSimulationLootTable.items[0].id;
		const item1Id = simpleSimulationLootTable.items[1].id;
		const results = calculator.calculateProbabilities({
			excludedItemIds: [item0Id, item1Id]
		});

		expect(results).toHaveLength(11);
		const excludedItems = results.filter((r) => r.itemId === item0Id || r.itemId === item1Id);
		expect(excludedItems).toHaveLength(0);
		const totalProbability = results.reduce((sum, r) => sum + r.probability, 0);
		expect(totalProbability).toBeCloseTo(1, 5);
	});

	it("should handle edge case with all items excluded", () => {
		const allItemIds = simpleSimulationLootTable.items.map((item) => item.id);
		const results = calculator.calculateProbabilities({
			excludedItemIds: allItemIds
		});

		expect(results).toHaveLength(0);
	});

	it("should handle edge case with single item", () => {
		const singleItemTable = {
			...simpleSimulationLootTable,
			items: [simpleSimulationLootTable.items[0]]
		};

		const singleCalculator = new LootTableAppearanceProbability(singleItemTable);
		const results = singleCalculator.calculateProbabilities();

		expect(results).toHaveLength(1);
		expect(results[0].probability).toBe(1);
		expect(results[0].name).toBe("minecraft:diamond_pickaxe");
	});
});

describe("LootTableProbabilityCalculator - Complex Table Tests", () => {
	const complexCalculator = new LootTableAppearanceProbability(extremeLootTable);

	it("should handle complex loot table structure", () => {
		const results = complexCalculator.calculateProbabilities();
		expect(results.length).toBeGreaterThan(0);
		for (const result of results) {
			expect(result.probability).toBeGreaterThanOrEqual(0);
			expect(result.probability).toBeLessThanOrEqual(1);
			expect(Number.isFinite(result.probability)).toBe(true);
		}
		const totalProbability = results.reduce((sum, r) => sum + r.probability, 0);
		expect(totalProbability).toBeLessThanOrEqual(1.01);
	});

	it("should handle groups and alternatives correctly", () => {
		const results = complexCalculator.calculateProbabilities();
		const itemEntries = results.filter((r) => r.entryType === "minecraft:item");
		const lootTableEntries = results.filter((r) => r.entryType === "minecraft:loot_table");
		const tagEntries = results.filter((r) => r.entryType === "minecraft:tag");
		const emptyEntries = results.filter((r) => r.entryType === "minecraft:empty");
		expect(itemEntries.length).toBeGreaterThan(0);
		expect(lootTableEntries.length).toBeGreaterThan(0);
		expect(tagEntries.length).toBeGreaterThan(0);
		expect(emptyEntries.length).toBeGreaterThanOrEqual(0);

		const acaciaSign = results.find((r) => r.name === "minecraft:acacia_sign");
		const allium = results.find((r) => r.name === "minecraft:allium");
		expect(acaciaSign).toBeDefined();
		expect(allium).toBeDefined();
	});

	it("should exclude by condition type", () => {
		const results = complexCalculator.calculateProbabilities({
			excludeConditionTypes: ["minecraft:weather_check"]
		});

		const resultsWithoutExclusion = complexCalculator.calculateProbabilities();
		expect(results.length).toBeLessThanOrEqual(resultsWithoutExclusion.length);
	});

	it("should handle luck with quality items", () => {
		const resultsNoLuck = complexCalculator.calculateProbabilities({ luck: 0 });
		const resultsWithLuck = complexCalculator.calculateProbabilities({ luck: 5 });
		const qualityItems = extremeLootTable.items.filter((item) => item.quality && item.quality > 0);

		if (qualityItems.length > 0) {
			let hasChangedProbability = false;
			for (const qualityItem of qualityItems) {
				const noLuckResult = resultsNoLuck.find((r) => r.itemId === qualityItem.id);
				const withLuckResult = resultsWithLuck.find((r) => r.itemId === qualityItem.id);
				if (noLuckResult && withLuckResult && noLuckResult.probability !== withLuckResult.probability) {
					hasChangedProbability = true;
					break;
				}
			}

			expect(hasChangedProbability).toBe(true);
		}
	});

	it("should handle multiple pools correctly", () => {
		const results = complexCalculator.calculateProbabilities();
		const poolCounts = new Map<number, number>();

		for (const result of results) {
			const count = poolCounts.get(result.poolIndex) || 0;
			poolCounts.set(result.poolIndex, count + 1);
		}

		expect(poolCounts.has(0)).toBe(true);
		expect(poolCounts.get(0)).toBeGreaterThan(0);
	});

	it("should handle nested groups correctly", () => {
		const results = complexCalculator.calculateProbabilities();
		for (const result of results) {
			expect(result.itemId).toBeDefined();
			expect(result.name).toBeDefined();
			expect(typeof result.probability).toBe("number");
			expect(result.poolIndex).toBeGreaterThanOrEqual(0);
		}
		const nestedAllium = results.filter((r) => r.name === "minecraft:allium");
		expect(nestedAllium.length).toBeGreaterThan(0);
	});
});
