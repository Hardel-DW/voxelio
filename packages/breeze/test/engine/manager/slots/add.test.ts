import { addSlot, flattenSlots } from "@/core/engine/managers/SlotManager";
import { describe, expect, test } from "vitest";

describe("Add Slot with key", () => {
	test('should return "hand" when adding "offhand" to "mainhand"', () => {
		const result = addSlot(["mainhand"], "offhand");
		expect(result).toContain("hand");
		expect(result.length).toBe(1);
	});

	test('should return "offhand" when adding "offhand" to an empty list', () => {
		const result = addSlot([], "offhand");
		expect(result).toContain("offhand");
		expect(result.length).toBe(1);
	});

	test('should return "mainhand" when adding "mainhand" to an empty list', () => {
		const result = addSlot([], "mainhand");
		expect(result).toContain("mainhand");
		expect(result.length).toBe(1);
	});

	test('should return "armor" when adding "legs" to "head", "chest", and "feet"', () => {
		const result = addSlot(["head", "chest", "feet"], "legs");
		expect(result).toContain("armor");
		expect(result.length).toBe(1);
	});

	test('should return ["hand", "armor"] when adding "feet" to "hand", "head", "chest", and "legs" (missing body, saddle)', () => {
		const result = addSlot(["hand", "head", "chest", "legs"], "feet");
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});

	test('should return "armor" when adding "armor" to an empty list', () => {
		const result = addSlot([], "armor");
		expect(result).toContain("armor");
		expect(result.length).toBe(1);
	});

	test('should return "any" when adding "any" to any list', () => {
		const result = addSlot(["mainhand", "armor"], "any");
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});

	test('should return "mainhand" and "armor" when adding "legs" to "mainhand", "head", "chest", and "feet"', () => {
		const result = addSlot(["mainhand", "head", "chest", "feet"], "legs");
		expect(result).toEqual(expect.arrayContaining(["mainhand", "armor"]));
		expect(result.length).toBe(2);
	});

	test('should return "head", "chest", and "feet" when adding "feet" to "head" and "chest"', () => {
		const result = addSlot(["head", "chest"], "feet");
		expect(result).toEqual(expect.arrayContaining(["head", "chest", "feet"]));
		expect(result.length).toBe(3);
	});

	test('should return "offhand" and "armor" when adding "offhand" to "armor"', () => {
		const result = addSlot(["armor"], "offhand");
		expect(result).toEqual(expect.arrayContaining(["armor", "offhand"]));
		expect(result.length).toBe(2);
	});
});

describe("Any Slot Logic - should only appear when ALL 8 individual slots are selected", () => {
	test("should NOT return 'any' when adding offhand to mainhand, head, chest, legs, feet (missing body, saddle)", () => {
		const result = addSlot(["mainhand", "head", "chest", "legs", "feet"], "offhand");
		expect(result).not.toContain("any");
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("should NOT return 'any' when having 6 slots (missing body, saddle)", () => {
		const result = addSlot(["mainhand", "offhand", "head", "chest", "legs"], "feet");
		expect(result).not.toContain("any");
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("should NOT return 'any' when having 7 slots (missing saddle)", () => {
		const result = addSlot(["mainhand", "offhand", "head", "chest", "legs", "feet"], "body");
		expect(result).not.toContain("any");
		expect(result).toEqual(expect.arrayContaining(["hand", "armor", "body"]));
		expect(result.length).toBe(3);
	});

	test("should return 'any' ONLY when all 8 individual slots are present", () => {
		const result = addSlot(["mainhand", "offhand", "head", "chest", "legs", "feet", "body"], "saddle");
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});

	test("should return 'any' when adding the last missing slot to 7 existing slots", () => {
		const result = addSlot(["mainhand", "offhand", "head", "chest", "legs", "feet", "saddle"], "body");
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});

	test("should return 'any' when using normalized groups and adding missing slots", () => {
		const result = addSlot(["hand", "armor", "body"], "saddle");
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});

	test("should NOT return 'any' when using hand + armor only (missing body, saddle)", () => {
		const result = addSlot(["hand"], "armor");
		expect(result).not.toContain("any");
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});
});

describe("Flatten Slots", () => {
	test("should flatten individual slots", () => {
		const result = flattenSlots(["mainhand", "offhand", "head"]);
		expect(result).toEqual(expect.arrayContaining(["mainhand", "offhand", "head"]));
		expect(result.length).toBe(3);
	});

	test("should flatten 'hand' group to individual slots", () => {
		const result = flattenSlots(["hand"]);
		expect(result).toEqual(expect.arrayContaining(["mainhand", "offhand"]));
		expect(result.length).toBe(2);
	});

	test("should flatten 'armor' group to individual slots", () => {
		const result = flattenSlots(["armor"]);
		expect(result).toEqual(expect.arrayContaining(["head", "chest", "legs", "feet"]));
		expect(result.length).toBe(4);
	});

	test("should flatten 'any' to all 8 individual slots", () => {
		const result = flattenSlots(["any"]);
		expect(result).toEqual(expect.arrayContaining(["mainhand", "offhand", "head", "chest", "legs", "feet", "body", "saddle"]));
		expect(result.length).toBe(8);
	});

	test("should flatten mixed groups and individual slots", () => {
		const result = flattenSlots(["hand", "armor", "body"]);
		expect(result).toEqual(expect.arrayContaining(["mainhand", "offhand", "head", "chest", "legs", "feet", "body"]));
		expect(result.length).toBe(7);
	});

	test("should remove duplicates when flattening", () => {
		const result = flattenSlots(["mainhand", "hand"]);
		expect(result).toEqual(expect.arrayContaining(["mainhand", "offhand"]));
		expect(result.length).toBe(2);
	});
});
