import { type SlotRegistryType, removeSlot } from "@/core/engine/managers/SlotManager";
import { describe, expect, test } from "vitest";

const singleItemTests = ["head", "chest", "legs", "feet", "mainhand", "offhand"] as SlotRegistryType[];
const armorTests = ["head", "chest", "legs", "feet"] as SlotRegistryType[];
const handTests = ["mainhand", "offhand"] as SlotRegistryType[];

describe("Remove Slot with key", () => {
	test("should return an empty list if a list is already empty", () => {
		for (const item of singleItemTests) {
			const result = removeSlot([], item);
			expect(result).toEqual([]);
			expect(result.length).toBe(0);
		}
	});

	test("should remove the item from the list", () => {
		for (const item of singleItemTests) {
			const result = removeSlot([item], item);
			expect(result).toEqual([]);
			expect(result.length).toBe(0);
		}
	});

	test("should remove the value from the list", () => {
		for (const armor of armorTests) {
			for (const hand of handTests) {
				const result1 = removeSlot([armor, hand], hand);
				expect(result1).toContain(armor);
				expect(result1.length).toBe(1);

				const result2 = removeSlot([armor, hand], armor);
				expect(result2).toContain(hand);
				expect(result2.length).toBe(1);
			}
		}
	});

	test("should remove an armor piece, leaving other armor pieces intact", () => {
		for (const armor of armorTests) {
			const result = removeSlot(armorTests, armor);
			expect(result).toEqual(expect.arrayContaining(armorTests.filter((item) => item !== armor)));
			expect(result.length).toBe(armorTests.length - 1);
		}
	});

	test("should remove a hand piece, leaving other hand pieces intact", () => {
		for (const hand of handTests) {
			const result = removeSlot(handTests, hand);
			expect(result).toEqual(expect.arrayContaining(handTests.filter((item) => item !== hand)));
			expect(result.length).toBe(handTests.length - 1);
		}
	});

	test("should remove 'mainhand' from 'any', leaving 'offhand' and 'armor'", () => {
		const result = removeSlot(["any"], "mainhand");
		expect(result).toEqual(expect.arrayContaining(["offhand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'offhand' from 'any', leaving 'mainhand' and 'armor'", () => {
		const result = removeSlot(["any"], "offhand");
		expect(result).toEqual(expect.arrayContaining(["mainhand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'head' from 'any', leaving 'hand', 'chest', 'legs', 'feet'", () => {
		const result = removeSlot(["any"], "head");
		expect(result).toEqual(expect.arrayContaining(["hand", "chest", "legs", "feet"]));
		expect(result.length).toBe(4);
	});

	test("should remove 'chest' from 'any', leaving 'hand', 'feet', 'head', 'legs'", () => {
		const result = removeSlot(["any"], "chest");
		expect(result).toEqual(expect.arrayContaining(["hand", "feet", "head", "legs"]));
		expect(result.length).toBe(4);
	});

	test("should remove 'legs' from 'any', leaving 'hand', 'head', 'chest', 'feet'", () => {
		const result = removeSlot(["any"], "legs");
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "feet"]));
		expect(result.length).toBe(4);
	});

	test("should remove 'feet' from 'any', leaving 'hand', 'head', 'chest', 'legs'", () => {
		const result = removeSlot(["any"], "feet");
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "legs"]));
		expect(result.length).toBe(4);
	});

	test('should return "head" and "feet" when removing "chest" from ["head", "chest", "feet"]', () => {
		const result = removeSlot(["head", "chest", "feet"], "chest");
		expect(result).toEqual(expect.arrayContaining(["head", "feet"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'chest' from ['hand', 'chest', 'legs', 'feet']", () => {
		const result = removeSlot(["hand", "chest", "legs", "feet"], "chest");
		expect(result).toEqual(expect.arrayContaining(["hand", "legs", "feet"]));
		expect(result.length).toBe(3);
	});

	test("should remove 'legs' from ['hand', 'legs', 'feet']", () => {
		const result = removeSlot(["hand", "legs", "feet"], "legs");
		expect(result).toEqual(expect.arrayContaining(["hand", "feet"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'feet' from ['hand', 'feet']", () => {
		const result = removeSlot(["hand", "feet"], "feet");
		expect(result).toEqual(expect.arrayContaining(["hand"]));
		expect(result.length).toBe(1);
	});

	test("should remove 'chest' from ['hand', 'head', 'chest']", () => {
		const result = removeSlot(["hand", "head", "chest"], "chest");
		expect(result).toEqual(expect.arrayContaining(["hand", "head"]));
		expect(result.length).toBe(2);
	});
});
