import { toggleSlot } from "@/core/engine/managers/SlotManager";
import { describe, expect, test } from "vitest";

describe("Toggle Slot with key", () => {
	test("Should remove the key, if it is found", () => {
		const result = toggleSlot(["mainhand"], "mainhand");
		expect(result).toEqual([]);
		expect(result.length).toBe(0);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = toggleSlot(["hand"], "mainhand");
		expect(result).toEqual(["offhand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, if it is not found", () => {
		const result = toggleSlot([], "mainhand");
		expect(result).toEqual(["mainhand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = toggleSlot(["mainhand"], "offhand");
		expect(result).toEqual(["hand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = toggleSlot(["head", "chest", "legs"], "feet");
		expect(result).toEqual(["armor"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = toggleSlot(["hand", "head", "chest", "legs"], "feet");
		expect(result).toContain("any");
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = toggleSlot(["offhand", "head", "chest", "legs", "feet"], "mainhand");
		expect(result).toContain("any");
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = toggleSlot(["any"], "mainhand");
		expect(result).toEqual(expect.arrayContaining(["offhand", "armor"]));
		expect(result.length).toBeGreaterThanOrEqual(2);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = toggleSlot(["any"], "feet");
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "legs"]));
		expect(result.length).toBe(4);
	});

	test("Should remove the key, if it is found", () => {
		const result = toggleSlot(["mainhand", "feet", "head"], "feet");
		expect(result).toEqual(expect.arrayContaining(["mainhand", "head"]));
		expect(result.length).toBe(2);
	});
});
