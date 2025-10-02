import { SlotManager } from "@/core/engine/managers/SlotManager";
import { describe, expect, test } from "vitest";

describe("Toggle Slot with key", () => {
	test("Should remove the key, if it is found", () => {
		const result = new SlotManager(["mainhand"]).toggle("mainhand").toArray();
		expect(result).toEqual([]);
		expect(result.length).toBe(0);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = new SlotManager(["hand"]).toggle("mainhand").toArray();
		expect(result).toEqual(["offhand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, if it is not found", () => {
		const result = new SlotManager([]).toggle("mainhand").toArray();
		expect(result).toEqual(["mainhand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = new SlotManager(["mainhand"]).toggle("offhand").toArray();
		expect(result).toEqual(["hand"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group if all keys are present", () => {
		const result = new SlotManager(["head", "chest", "legs"]).toggle("feet").toArray();
		expect(result).toEqual(["armor"]);
		expect(result.length).toBe(1);
	});

	test("Should add the key, and group but NOT 'any' when missing body and saddle", () => {
		const result = new SlotManager(["hand", "head", "chest", "legs"]).toggle("feet").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("Should add the key, and group but NOT 'any' when missing body and saddle", () => {
		const result = new SlotManager(["offhand", "head", "chest", "legs", "feet"]).toggle("mainhand").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "armor"]));
		expect(result.length).toBe(2);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = new SlotManager(["any"]).toggle("mainhand").toArray();
		expect(result).toEqual(expect.arrayContaining(["offhand", "armor", "body", "saddle"]));
		expect(result.length).toBe(4);
	});

	test("Should remove the key, if it is found in group and consequently destructuring the group", () => {
		const result = new SlotManager(["any"]).toggle("feet").toArray();
		expect(result).toEqual(expect.arrayContaining(["hand", "head", "chest", "legs", "body", "saddle"]));
		expect(result.length).toBe(6);
	});

	test("Should remove the key, if it is found", () => {
		const result = new SlotManager(["mainhand", "feet", "head"]).toggle("feet").toArray();
		expect(result).toEqual(expect.arrayContaining(["mainhand", "head"]));
		expect(result.length).toBe(2);
	});

	test("Should return 'any' when toggling to complete all 8 individual slots", () => {
		const result = new SlotManager(["mainhand", "offhand", "head", "chest", "legs", "feet", "body"]).toggle("saddle").toArray();
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});

	test("Should return 'any' when toggling to complete all group slots", () => {
		const result = new SlotManager(["hand", "armor", "body"]).toggle("saddle").toArray();
		expect(result).toContain("any");
		expect(result.length).toBe(1);
	});
});
