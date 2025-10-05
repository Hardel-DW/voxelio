import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("reorderKeysLike", () => {
	it("should align top-level keys", () => {
		const source = {
			name: "item",
			components: {
				foo: 1,
				bar: 2,
			},
			tags: ["a"],
		};
		const target = {
			tags: ["a"],
			components: {
				bar: 2,
				foo: 1,
				extra: true,
			},
			name: "item",
			newField: 42,
		};

		const aligned = new Differ(source, target).reorder() as Record<string, unknown>;
		expect(Object.keys(aligned)).toEqual(["name", "components", "tags", "newField"]);
		expect(Object.keys((aligned.components as Record<string, unknown>))).toEqual(["foo", "bar", "extra",]);
	});

	it("should align arrays of objects index-wise", () => {
		const source = {
			pools: [
				{ name: "old", entries: { type: "minecraft:set_nbt", tag: "{}" } },
				{ name: "keep", entries: { type: "minecraft:item", name: "minecraft:stick" } },
			],
		};

		const target = {
			pools: [
				{
					entries: [
						{ type: "minecraft:item", name: "minecraft:stick" },
						{ type: "minecraft:item", name: "minecraft:emerald" },
					],
					name: "keep",
				},
				{
					bonus_rolls: { min: 0, max: 1 },
				},
			],
		};

		const aligned = new Differ(source, target).reorder() as { pools: Array<Record<string, unknown>> };

		expect(Object.keys(aligned.pools[0])).toEqual(["name", "entries"]);
		expect(Object.keys(aligned.pools[1])).toEqual(["bonus_rolls"]);
	});

	it("should preserve nested object ordering", () => {
		const source = {
			root: {
				alpha: { first: 1, second: 2 },
				beta: [
					{ id: 1, value: "one" },
					{ id: 2, value: "two" },
				],
				gamma: true,
			},
		};

		const target = {
			root: {
				gamma: true,
				beta: [
					{ value: "ONE", id: 1 },
					{ value: "TWO", id: 2 },
					{ value: "THREE", id: 3 },
				],
				alpha: { second: 22, first: 11, third: 33 },
			},
		};

		const aligned = new Differ(source, target).reorder() as Record<string, unknown>;
		const root = aligned.root as Record<string, unknown>;

		expect(Object.keys(root)).toEqual(["alpha", "beta", "gamma"]);
		expect(Object.keys((root.alpha as Record<string, unknown>))).toEqual([
			"first",
			"second",
			"third",
		]);
		const beta = root.beta as Array<Record<string, unknown>>;
		expect(Object.keys(beta[0])).toEqual(["id", "value"]);
		expect(Object.keys(beta[2])).toEqual(["id", "value"]);
	});

	it("should handle arrays longer than source by appending order", () => {
		const source = { list: [{ id: "A", foo: 1 }] };
		const target = {
			list: [
				{ foo: 2, id: "A" },
				{ bar: 10, id: "B" },
			],
		};

		const aligned = new Differ(source, target).reorder() as { list: Array<Record<string, unknown>> };

		expect(Object.keys(aligned.list[0])).toEqual(["id", "foo"]);
		expect(Object.keys(aligned.list[1])).toEqual(["id", "bar"]);
	});

	it("should leave unmatched structures untouched", () => {
		const source = { a: 1 };
		const target = { b: { c: 2 } };
		const aligned = new Differ(source, target).reorder() as Record<string, unknown>;
		expect(aligned).toEqual(target);
	});
});
