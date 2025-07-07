import { addSlot } from "@/core/engine/managers/SlotManager";
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

	test('should return "any" when adding "feet" to "hand", "head", "chest", and "legs"', () => {
		const result = addSlot(["hand", "head", "chest", "legs"], "feet");
		expect(result).toContain("any");
		expect(result.length).toBe(1);
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
