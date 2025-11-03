import { describe, expect, it } from "vitest";
import { Differ } from "../src/Differ";

describe("reorder with cleanNewEmptyCollections option", () => {
	it("should remove empty array added in target", () => {
		const original = {
			name: "stone",
			type: "minecraft:block"
		};

		const target = {
			name: "stone",
			type: "minecraft:block",
			conditions: [],
			functions: []
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			type: "minecraft:block"
		});
	});

	it("should keep empty array if it existed in original", () => {
		const original = {
			name: "stone",
			conditions: []
		};

		const target = {
			name: "stone",
			conditions: []
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			conditions: []
		});
	});

	it("should keep empty array if original had values", () => {
		const original = {
			name: "stone",
			conditions: [{ condition: "minecraft:survives_explosion" }]
		};

		const target = {
			name: "stone",
			conditions: []
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			conditions: []
		});
	});

	it("should remove empty object added in target", () => {
		const original = {
			name: "stone",
			type: "minecraft:block"
		};

		const target = {
			name: "stone",
			type: "minecraft:block",
			metadata: {}
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			type: "minecraft:block"
		});
	});

	it("should keep empty object if it existed in original", () => {
		const original = {
			name: "stone",
			metadata: {}
		};

		const target = {
			name: "stone",
			metadata: {}
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			metadata: {}
		});
	});

	it("should work recursively on nested objects", () => {
		const original = {
			pools: [
				{
					rolls: 1,
					entries: []
				}
			]
		};

		const target = {
			pools: [
				{
					rolls: 1,
					entries: [],
					conditions: [],
					functions: []
				}
			]
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			pools: [
				{
					rolls: 1,
					entries: []
				}
			]
		});
	});

	it("should handle deeply nested structures", () => {
		const original = {
			pools: [
				{
					entries: [
						{
							type: "minecraft:item",
							name: "stone"
						}
					]
				}
			]
		};

		const target = {
			pools: [
				{
					entries: [
						{
							type: "minecraft:item",
							name: "stone",
							conditions: [],
							functions: []
						}
					],
					conditions: []
				}
			]
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });

		expect(result).toEqual({
			pools: [
				{
					entries: [
						{
							type: "minecraft:item",
							name: "stone"
						}
					]
				}
			]
		});
	});

	it("should handle arrays of different lengths", () => {
		const original = {
			items: [{ id: 1 }]
		};

		const target = {
			items: [
				{ id: 1, meta: {} },
				{ id: 2, tags: [] }
			]
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			items: [{ id: 1 }, { id: 2 }]
		});
	});

	it("should not remove non-empty arrays or objects", () => {
		const original = {
			name: "stone"
		};

		const target = {
			name: "stone",
			conditions: [{ condition: "minecraft:survives_explosion" }],
			metadata: { custom: true }
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });
		expect(result).toEqual({
			name: "stone",
			conditions: [{ condition: "minecraft:survives_explosion" }],
			metadata: { custom: true }
		});
	});

	it("should handle mixed empty and non-empty collections", () => {
		const original = {
			name: "stone",
			existing_empty: []
		};

		const target = {
			name: "stone",
			existing_empty: [],
			new_empty: [],
			non_empty: [1, 2, 3]
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });

		expect(result).toEqual({
			name: "stone",
			existing_empty: [],
			non_empty: [1, 2, 3]
		});
	});

	it("should preserve primitives and non-collection types and keep reordered fields", () => {
		const original = {
			name: "stone",
			count: 1
		};

		const target = {
			count: 1,
			name: "stone",
			enabled: true,
			tags: []
		};

		const result = new Differ(original, target).reorder({ cleanNewEmptyCollections: true });

		expect(result).toEqual({
			name: "stone",
			count: 1,
			enabled: true
		});
	});
});
