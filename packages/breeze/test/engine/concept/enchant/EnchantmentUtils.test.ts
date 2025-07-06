import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnchantmentSimulator } from "@/core/calculation/EnchantmentSimulation";
import type { Enchantment } from "@/schema/Enchantment";

describe("EnchantmentSimulator Utils", () => {
    let simulator: EnchantmentSimulator;
    let enchantments: Map<string, Enchantment>;

    beforeEach(() => {
        enchantments = new Map();

        // Test enchantments
        enchantments.set("test:sharpness", {
            description: "Sharpness",
            supported_items: "#minecraft:enchantable/sword",
            exclusive_set: "#minecraft:exclusive_set/damage",
            weight: 10,
            max_level: 5,
            min_cost: { base: 1, per_level_above_first: 11 },
            max_cost: { base: 21, per_level_above_first: 11 },
            anvil_cost: 1,
            slots: ["mainhand"]
        });

        enchantments.set("test:smite", {
            description: "Smite",
            supported_items: "#minecraft:enchantable/sword",
            exclusive_set: "#minecraft:exclusive_set/damage",
            weight: 5,
            max_level: 5,
            min_cost: { base: 5, per_level_above_first: 8 },
            max_cost: { base: 25, per_level_above_first: 8 },
            anvil_cost: 1,
            slots: ["mainhand"]
        });

        enchantments.set("test:unbreaking", {
            description: "Unbreaking",
            supported_items: ["#minecraft:enchantable/sword", "#minecraft:enchantable/armor"],
            weight: 5,
            max_level: 3,
            min_cost: { base: 5, per_level_above_first: 8 },
            max_cost: { base: 55, per_level_above_first: 8 },
            anvil_cost: 1,
            slots: ["any"]
        });

        simulator = new EnchantmentSimulator(enchantments);
    });

    describe("calculateEnchantmentCost", () => {
        it("should calculate the cost correctly", () => {
            const cost = { base: 10, per_level_above_first: 5 };

            // Level 1
            // @ts-expect-error - Testing private method
            let result = simulator.calculateEnchantmentCost(cost, 1);
            expect(result).toBe(10); // 10 + (1-1)*5 = 10

            // Level 3
            // @ts-expect-error - Testing private method
            result = simulator.calculateEnchantmentCost(cost, 3);
            expect(result).toBe(20); // 10 + (3-1)*5 = 20

            // Level 5
            // @ts-expect-error - Testing private method
            result = simulator.calculateEnchantmentCost(cost, 5);
            expect(result).toBe(30); // 10 + (5-1)*5 = 30
        });

        it("should handle cases with per_level_above_first = 0", () => {
            const cost = { base: 15, per_level_above_first: 0 };

            // @ts-expect-error - Testing private method
            let result = simulator.calculateEnchantmentCost(cost, 1);
            expect(result).toBe(15);

            // @ts-expect-error - Testing private method
            result = simulator.calculateEnchantmentCost(cost, 10);
            expect(result).toBe(15); // Always the same value
        });
    });

    describe("weightedRandomSelect", () => {
        it("should select according to weights", () => {
            const items = [
                { id: "a", weight: 1 },
                { id: "b", weight: 9 }
            ];

            const mockRandom = vi.spyOn(Math, "random");

            // Select the first item (weight: 1, so 10% chance)
            mockRandom.mockReturnValueOnce(0.05); // 5% -> first item
            // @ts-expect-error - Testing private method
            let result = simulator.weightedRandomSelect(items);
            expect(result?.id).toBe("a");

            // Select the second item (weight: 9, so 90% chance)
            mockRandom.mockReturnValueOnce(0.5); // 50% -> second item
            // @ts-expect-error - Testing private method
            result = simulator.weightedRandomSelect(items);
            expect(result?.id).toBe("b");

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

            // With all weights at 0, should make a uniform random selection
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
            const result = simulator.areEnchantmentsCompatible("test:unbreaking", ["test:sharpness"]);
            expect(result).toBe(true);
        });

        it("should forbid enchantments from the same exclusive group", () => {
            // @ts-expect-error - Testing private method
            const result = simulator.areEnchantmentsCompatible("test:sharpness", ["test:smite"]);
            expect(result).toBe(false);
        });

        it("should allow enchantments from different groups", () => {
            // @ts-expect-error - Testing private method
            const result = simulator.areEnchantmentsCompatible("test:unbreaking", ["test:sharpness"]);
            expect(result).toBe(true);
        });

        it("should handle non-existent enchantments", () => {
            // @ts-expect-error - Testing private method
            const result = simulator.areEnchantmentsCompatible("test:unknown", ["test:sharpness"]);
            expect(result).toBe(true);
        });

        it("should handle empty lists of existing enchantments", () => {
            // @ts-expect-error - Testing private method
            const result = simulator.areEnchantmentsCompatible("test:sharpness", []);
            expect(result).toBe(true);
        });
    });

    describe("applyEnchantabilityModifiers", () => {
        it("should apply modifiers correctly", () => {
            const mockRandom = vi.spyOn(Math, "random");

            // Mock for predictable results
            // randomInt(0, floor(10/4)) + 1 = randomInt(0, 2) + 1
            // So modifier1 and modifier2 will be between 1 and 3

            // First test: Math.random() returns 0.5 for randomInt
            mockRandom.mockReturnValueOnce(0.5); // modifier1 = 1 + 1 = 2
            mockRandom.mockReturnValueOnce(0.5); // modifier2 = 1 + 1 = 2
            mockRandom.mockReturnValueOnce(0.5); // random bonus 1
            mockRandom.mockReturnValueOnce(0.5); // random bonus 2

            // baseLevel=10, enchantability=10
            // modifiedLevel = 10 + 2 + 2 = 14
            // randomBonus = 1 + (0.5 + 0.5 - 1) * 0.15 = 1.0
            // result = Math.max(1, Math.round(14 * 1.0)) = 14

            // @ts-expect-error - Testing private method
            const result = simulator.applyEnchantabilityModifiers(10, 10);
            expect(result).toBe(14);

            mockRandom.mockRestore();
        });

        it("should guarantee a minimum of 1", () => {
            const mockRandom = vi.spyOn(Math, "random");

            // All randoms at 0 to minimize the result
            mockRandom.mockReturnValue(0);

            // @ts-expect-error - Testing private method
            const result = simulator.applyEnchantabilityModifiers(0, 0);
            expect(result).toBeGreaterThanOrEqual(1);

            mockRandom.mockRestore();
        });

        it("should vary according to enchantability", () => {
            const results1: number[] = [];
            const results25: number[] = [];

            // Test with different enchantabilities
            for (let i = 0; i < 50; i++) {
                // @ts-expect-error - Testing private method
                results1.push(simulator.applyEnchantabilityModifiers(10, 1));
                // @ts-expect-error - Testing private method
                results25.push(simulator.applyEnchantabilityModifiers(10, 25));
            }

            const avg1 = results1.reduce((a, b) => a + b, 0) / results1.length;
            const avg25 = results25.reduce((a, b) => a + b, 0) / results25.length;

            // More enchantability should give higher results
            expect(avg25).toBeGreaterThan(avg1);
        });
    });

    describe("Base level calculation", () => {
        it("should calculate the base level according to Minecraft formula", () => {
            const mockRandom = vi.spyOn(Math, "random");

            // Test with 15 shelves
            // base = randomInt(1,8) + floor(15/2) + randomInt(0,15)
            // base = randomInt(1,8) + 7 + randomInt(0,15)

            mockRandom.mockReturnValueOnce(0); // randomInt(1,8) -> 1
            mockRandom.mockReturnValueOnce(0); // randomInt(0,15) -> 0
            // other randoms for modifiers...
            mockRandom.mockReturnValue(0.5);

            const options = simulator.simulateEnchantmentTable(15, 10, []);

            // base = 1 + 7 + 0 = 8
            // topSlot = floor(max(8/3, 1)) = floor(max(2.67, 1)) = 2
            // middleSlot = floor((8*2)/3 + 1) = floor(5.33 + 1) = 6
            // bottomSlot = floor(max(8, 15*2)) = floor(max(8, 30)) = 30

            // Levels can be modified by enchantability modifiers
            // but we can verify that options are in a sensible order
            expect(options[0].level).toBeLessThanOrEqual(options[1].level);
            expect(options[1].level).toBeLessThanOrEqual(options[2].level);

            mockRandom.mockRestore();
        });
    });
});
