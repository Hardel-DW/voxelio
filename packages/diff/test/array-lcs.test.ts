import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Array LCS (Longest Common Subsequence)", () => {
	describe("Simple arrays", () => {
		it("should detect element removed from middle", () => {
			const obj1 = { items: [1, 2, 3, 4] };
			const obj2 = { items: [1, 2, 4] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);

			const applied = Differ.apply(obj1, patch);
			expect(applied).toEqual(obj2);
		});

		it("should detect element added to middle", () => {
			const obj1 = { items: [1, 3, 4] };
			const obj2 = { items: [1, 2, 3, 4] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);

			// Verify apply works
			const applied = Differ.apply(obj1, patch);
			expect(applied).toEqual(obj2);
		});

		it("should handle multiple changes in array", () => {
			const obj1 = { items: [1, 2, 3, 4, 5] };
			const obj2 = { items: [1, 3, 4, 6] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle completely different arrays", () => {
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [4, 5, 6] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});
	});

	describe("Arrays with objects - Identical objects", () => {
		it("should recognize identical objects in arrays", () => {
			const obj1 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" }
				]
			};
			const obj2 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" }
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBe(0);
		});

		it("should detect when object is removed from array", () => {
			const obj1 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" },
					{ id: 3, name: "Charlie" }
				]
			};
			const obj2 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 3, name: "Charlie" }
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should detect when object is added to array", () => {
			const obj1 = {
				users: [{ id: 1, name: "Alice" }]
			};
			const obj2 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" }
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "add",
				path: "/users/1",
				value: { id: 2, name: "Bob" }
			});
		});
	});

	describe("Arrays with objects - Similar objects (>50% similarity)", () => {
		it("should detect changes in similar objects (same id, different name)", () => {
			const obj1 = {
				users: [
					{ id: 1, name: "Alice", age: 30 },
					{ id: 2, name: "Bob", age: 25 }
				]
			};
			const obj2 = {
				users: [
					{ id: 1, name: "Alice", age: 30 },
					{ id: 2, name: "Charlie", age: 25 }
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/users/1/name",
				value: "Charlie"
			});
		});

		it("should compare objects with >50% common keys", () => {
			const obj1 = {
				items: [{ a: 1, b: 2, c: 3, d: 4 }]
			};
			const obj2 = {
				items: [{ a: 1, b: 2, c: 3, d: 5 }]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/items/0/d",
				value: 5
			});
		});
	});

	describe("Arrays with objects - Different objects (<50% similarity)", () => {
		it("should treat completely different objects as add/remove", () => {
			const obj1 = {
				users: [{ id: 1, name: "Alice" }]
			};
			const obj2 = {
				users: [{ uid: 2, username: "Bob" }]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle objects with <50% common keys as different", () => {
			const obj1 = {
				items: [{ a: 1, b: 2 }]
			};
			const obj2 = {
				items: [{ a: 1, c: 3, d: 4 }]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});
	});

	describe("Minecraft-like scenarios", () => {
		it("should handle item list with removed item in middle", () => {
			const obj1 = {
				items: ["diamond_sword", "iron_sword", "bow", "arrow"]
			};
			const obj2 = {
				items: ["diamond_sword", "bow", "arrow"]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);

			// Verify apply works
			const applied = Differ.apply(obj1, patch);
			expect(applied).toEqual(obj2);
		});

		it("should handle enchantments array changes", () => {
			const obj1 = {
				enchantments: [
					{ id: "minecraft:sharpness", lvl: 3 },
					{ id: "minecraft:unbreaking", lvl: 2 }
				]
			};
			const obj2 = {
				enchantments: [
					{ id: "minecraft:sharpness", lvl: 5 },
					{ id: "minecraft:unbreaking", lvl: 2 }
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/enchantments/0/lvl",
				value: 5
			});
		});

		it("should handle complex nested item with components", () => {
			const obj1 = {
				items: [
					{
						id: "minecraft:diamond_sword",
						components: {
							damage: 0,
							enchantments: ["sharpness", "unbreaking"]
						}
					}
				]
			};
			const obj2 = {
				items: [
					{
						id: "minecraft:diamond_sword",
						components: {
							damage: 10,
							enchantments: ["sharpness", "unbreaking", "mending"]
						}
					}
				]
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/items/0/components/damage",
				value: 10
			});
			expect(patch).toContainEqual({
				op: "add",
				path: "/items/0/components/enchantments/2",
				value: "mending"
			});
		});
	});

	describe("Edge cases", () => {
		it("should handle empty arrays", () => {
			const obj1 = { items: [] };
			const obj2 = { items: [1, 2, 3] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle array to empty array", () => {
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle nested arrays in objects", () => {
			const obj1 = {
				data: {
					items: [{ values: [1, 2, 3] }]
				}
			};
			const obj2 = {
				data: {
					items: [
						{ values: [1, 3, 4] } // 2 supprimé, 4 ajouté
					]
				}
			};

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle arrays with mixed types", () => {
			const obj1 = { items: [1, "string", true, { key: "value" }] };
			const obj2 = { items: [1, "string", false, { key: "value" }] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/items/2",
				value: false
			});
		});
	});
});
