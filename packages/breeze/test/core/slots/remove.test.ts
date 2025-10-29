import { type SlotRegistryType, SlotManager } from "@/core/SlotManager";
import { describe, expect, test } from "vitest";

const singleItemTests = ["head", "chest", "legs", "feet", "mainhand", "offhand"] as SlotRegistryType[];
const armorTests = ["head", "chest", "legs", "feet"] as SlotRegistryType[];
const handTests = ["mainhand", "offhand"] as SlotRegistryType[];

describe("Remove Slot with key", () => {
	test("should return an empty list if a list is already empty", () => {
		for (const item of singleItemTests) {
			const result = new SlotManager([]).remove(item).toArray();
			expect(result).toEqual([]);
			expect(result.length).toBe(0);
		}
	});

	test("should remove the item from the list", () => {
		for (const item of singleItemTests) {
			const result = new SlotManager([item]).remove(item).toArray();
			expect(result).toEqual([]);
			expect(result.length).toBe(0);
		}
	});

	test("should remove the value from the list", () => {
		for (const armor of armorTests) {
			for (const hand of handTests) {
				const result1 = new SlotManager([armor, hand]).remove(hand).toArray();
				expect(result1).toContain(armor);
				expect(result1.length).toBe(1);

				const result2 = new SlotManager([armor, hand]).remove(armor).toArray();
				expect(result2).toContain(hand);
				expect(result2.length).toBe(1);
			}
		}
	});

	test("should remove an armor piece, leaving other armor pieces intact", () => {
		for (const armor of armorTests) {
			const result = new SlotManager(armorTests).remove(armor).toArray();
			expect(result).toEqual(expect.arrayContaining(armorTests.filter((item) => item !== armor)));
			expect(result.length).toBe(armorTests.length - 1);
		}
	});

	test("should remove a hand piece, leaving other hand pieces intact", () => {
		for (const hand of handTests) {
			const result = new SlotManager(handTests).remove(hand).toArray();
			expect(result).toEqual(expect.arrayContaining(handTests.filter((item) => item !== hand)));
			expect(result.length).toBe(handTests.length - 1);
		}
	});

	test("should remove 'mainhand' from 'any', leaving 'offhand', 'armor', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("mainhand").toArray();
		expect(result).toEqual(expect.arrayContaining(["offhand", "armor", "body", "saddle"]));
		expect(result.length).toBe(4);
	});

	test("should remove 'offhand' from 'any', leaving 'mainhand', 'armor', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("offhand").toArray();
		expect(result).toEqual(expect.arrayContaining(["mainhand", "armor", "body", "saddle"]));
		expect(result.length).toBe(4);
	});

	test("should remove 'head' from 'any', leaving 'hand', 'chest', 'legs', 'feet', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("head").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "chest", "legs", "feet", "body", "saddle"]));
		expect(result.length).toBe(6);
	});

	test("should remove 'chest' from 'any', leaving 'hand', 'feet', 'head', 'legs', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("chest").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "feet", "head", "legs", "body", "saddle"]));
		expect(result.length).toBe(6);
	});

	test("should remove 'legs' from 'any', leaving 'hand', 'head', 'chest', 'feet', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("legs").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "feet", "body", "saddle"]));
		expect(result.length).toBe(6);
	});

	test("should remove 'feet' from 'any', leaving 'hand', 'head', 'chest', 'legs', 'body', 'saddle'", () => {
		const result = new SlotManager(["any"]).remove("feet").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "legs", "body", "saddle"]));
		expect(result.length).toBe(6);
	});

	test('should return "head" and "feet" when removing "chest" from ["head", "chest", "feet"]', () => {
		const result = new SlotManager(["head", "chest", "feet"]).remove("chest").toArray();
		expect(result).toEqual(expect.arrayContaining(["head", "feet"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'chest' from ['hand', 'chest', 'legs', 'feet']", () => {
		const result = new SlotManager(["hand", "chest", "legs", "feet"]).remove("chest").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "legs", "feet"]));
		expect(result.length).toBe(3);
	});

	test("should remove 'legs' from ['hand', 'legs', 'feet']", () => {
		const result = new SlotManager(["hand", "legs", "feet"]).remove("legs").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "feet"]));
		expect(result.length).toBe(2);
	});

	test("should remove 'feet' from ['hand', 'feet']", () => {
		const result = new SlotManager(["hand", "feet"]).remove("feet").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand"]));
		expect(result.length).toBe(1);
	});

	test("should remove 'chest' from ['hand', 'head', 'chest']", () => {
		const result = new SlotManager(["hand", "head", "chest"]).remove("chest").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "head"]));
		expect(result.length).toBe(2);
	});
});
