import { describe, it, expect } from "vitest";
import { deepDiff } from "@/core/engine/migrations/differ";

describe("Differ System", () => {
	describe("deepDiff", () => {
		it("should detect no changes when objects are identical", () => {
			const before = { name: "test", value: 42 };
			const after = { name: "test", value: 42 };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(0);
		});

		it("should detect value changes", () => {
			const before = { name: "test", value: 42 };
			const after = { name: "test", value: 100 };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "set",
				path: "value",
				value: 100,
				origin_value: 42
			});
		});

		it("should detect added properties", () => {
			const before = { name: "test" };
			const after = { name: "test", value: 42 };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "add",
				path: "value",
				value: 42
			});
		});

		it("should detect removed properties", () => {
			const before = { name: "test", value: 42 };
			const after = { name: "test" };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "remove",
				path: "value",
				origin_value: 42
			});
		});

		it("should detect nested changes", () => {
			const before = {
				config: {
					settings: {
						debug: true,
						level: 5
					}
				}
			};
			const after = {
				config: {
					settings: {
						debug: false,
						level: 5
					}
				}
			};

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "set",
				path: "config.settings.debug",
				value: false,
				origin_value: true
			});
		});

		it("should detect array changes", () => {
			const before = { items: ["a", "b"] };
			const after = { items: ["a", "b", "c"] };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "add",
				path: "items.2",
				value: "c"
			});
		});

		it("should detect array item removal", () => {
			const before = { items: ["a", "b", "c"] };
			const after = { items: ["a", "b"] };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "remove",
				path: "items.2",
				origin_value: "c"
			});
		});

		it("should detect array item changes", () => {
			const before = { items: ["a", "b", "c"] };
			const after = { items: ["a", "X", "c"] };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "set",
				path: "items.1",
				value: "X",
				origin_value: "b"
			});
		});

		it("should handle complex nested array changes", () => {
			const before = {
				pools: [
					{ rolls: 1, entries: [{ name: "diamond" }] },
					{ rolls: 2, entries: [{ name: "gold" }] }
				]
			};
			const after = {
				pools: [
					{ rolls: 1, entries: [{ name: "diamond" }, { name: "emerald" }] },
					{ rolls: 3, entries: [{ name: "gold" }] }
				]
			};

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(2);

			// Should detect new entry added to first pool
			const addDiff = differences.find((d) => d.type === "add");
			expect(addDiff).toEqual({
				type: "add",
				path: "pools.0.entries.1",
				value: { name: "emerald" }
			});

			// Should detect rolls change in second pool
			const setDiff = differences.find((d) => d.type === "set");
			expect(setDiff).toEqual({
				type: "set",
				path: "pools.1.rolls",
				value: 3,
				origin_value: 2
			});
		});

		it("should handle type changes", () => {
			const before = { value: "string" };
			const after = { value: 42 };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "set",
				path: "value",
				value: 42,
				origin_value: "string"
			});
		});

		it("should handle object to array changes", () => {
			const before = { data: { a: 1, b: 2 } };
			const after = { data: [1, 2] };

			const differences = deepDiff(before, after);

			expect(differences).toHaveLength(1);
			expect(differences[0]).toEqual({
				type: "set",
				path: "data",
				value: [1, 2],
				origin_value: { a: 1, b: 2 }
			});
		});

		it("should handle realistic migration scenario with loot table changes", () => {
			const beforeLootTable = {
				identifier: { namespace: "test", resource: "chest" },
				type: "minecraft:entity",
				pools: [
					{
						rolls: 1,
						bonus_rolls: 0,
						entries: [{ type: "minecraft:item", name: "minecraft:diamond", weight: 10 }]
					}
				]
			};

			const afterLootTable = {
				identifier: { namespace: "test", resource: "chest" },
				type: "minecraft:chest",
				pools: [
					{
						rolls: 3,
						bonus_rolls: 1,
						entries: [
							{ type: "minecraft:item", name: "minecraft:diamond", weight: 10 },
							{ type: "minecraft:item", name: "minecraft:emerald", weight: 5 }
						]
					}
				]
			};

			const differences = deepDiff(beforeLootTable, afterLootTable);

			expect(differences).toHaveLength(4);

			// Should detect type change
			const typeChange = differences.find((d) => d.path === "type");
			expect(typeChange).toEqual({
				type: "set",
				path: "type",
				value: "minecraft:chest",
				origin_value: "minecraft:entity"
			});

			// Should detect rolls change
			const rollsChange = differences.find((d) => d.path === "pools.0.rolls");
			expect(rollsChange).toEqual({
				type: "set",
				path: "pools.0.rolls",
				value: 3,
				origin_value: 1
			});

			// Should detect bonus_rolls change
			const bonusRollsChange = differences.find((d) => d.path === "pools.0.bonus_rolls");
			expect(bonusRollsChange).toEqual({
				type: "set",
				path: "pools.0.bonus_rolls",
				value: 1,
				origin_value: 0
			});

			// Should detect new entry addition
			const newEntryChange = differences.find((d) => d.path === "pools.0.entries.1");
			expect(newEntryChange).toEqual({
				type: "add",
				path: "pools.0.entries.1",
				value: { type: "minecraft:item", name: "minecraft:emerald", weight: 5 }
			});
		});
	});
});
