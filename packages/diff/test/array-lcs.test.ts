import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Array LCS (Longest Common Subsequence)", () => {
	describe("Simple arrays", () => {
		it("should detect element removed from middle", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 2, 3, 4] };
			const obj2 = { items: [1, 2, 4] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("3");
			expect(result).toContain("1");
			expect(result).toContain("2");
			expect(result).toContain("4");
		});

		it("should detect element added to middle", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 3, 4] };
			const obj2 = { items: [1, 2, 3, 4] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("+");
			expect(result).toContain("2");
		});

		it("should handle multiple changes in array", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 2, 3, 4, 5] };
			const obj2 = { items: [1, 3, 4, 6] };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("+");
		});

		it("should handle completely different arrays", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [4, 5, 6] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("1");
			expect(result).toContain("2");
			expect(result).toContain("3");
			expect(result).toContain("4");
			expect(result).toContain("5");
			expect(result).toContain("6");
		});
	});

	describe("Arrays with objects - Identical objects", () => {
		it("should recognize identical objects in arrays", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			expect(result).toBe("");
		});

		it("should detect when object is removed from array", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("Bob");
		});

		it("should detect when object is added to array", () => {
			const differ = new Differ();
			const obj1 = {
				users: [
					{ id: 1, name: "Alice" }
				]
			};
			const obj2 = {
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" }
				]
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("+");
			expect(result).toContain("Bob");
		});
	});

	describe("Arrays with objects - Similar objects (>50% similarity)", () => {
		it("should detect changes in similar objects (same id, different name)", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("Bob");
			expect(result).toContain("Charlie");
		});

		it("should compare objects with >50% common keys", () => {
			const differ = new Differ();
			const obj1 = {
				items: [
					{ a: 1, b: 2, c: 3, d: 4 }
				]
			};
			const obj2 = {
				items: [
					{ a: 1, b: 2, c: 3, d: 5 }
				]
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("4");
			expect(result).toContain("5");
		});
	});

	describe("Arrays with objects - Different objects (<50% similarity)", () => {
		it("should treat completely different objects as add/remove", () => {
			const differ = new Differ();
			const obj1 = {
				users: [
					{ id: 1, name: "Alice" }
				]
			};
			const obj2 = {
				users: [
					{ uid: 2, username: "Bob" }
				]
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("+");
			expect(result).toContain("Alice");
			expect(result).toContain("Bob");
		});

		it("should handle objects with <50% common keys as different", () => {
			const differ = new Differ();
			const obj1 = {
				items: [
					{ a: 1, b: 2 }
				]
			};
			const obj2 = {
				items: [
					{ a: 1, c: 3, d: 4 }
				]
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
		});
	});

	describe("Minecraft-like scenarios", () => {
		it("should handle item list with removed item in middle", () => {
			const differ = new Differ();
			const obj1 = {
				items: ["diamond_sword", "iron_sword", "bow", "arrow"]
			};
			const obj2 = {
				items: ["diamond_sword", "bow", "arrow"]
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("iron_sword");
			expect(result).toContain("diamond_sword");
			expect(result).toContain("bow");
		});

		it("should handle enchantments array changes", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("3");
			expect(result).toContain("5");
		});

		it("should handle complex nested item with components", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("0");
			expect(result).toContain("10");
			expect(result).toContain("mending");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty arrays", () => {
			const differ = new Differ();
			const obj1 = { items: [] };
			const obj2 = { items: [1, 2, 3] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("+");
		});

		it("should handle array to empty array", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("-");
		});

		it("should handle nested arrays in objects", () => {
			const differ = new Differ();
			const obj1 = {
				data: {
					items: [
						{ values: [1, 2, 3] }
					]
				}
			};
			const obj2 = {
				data: {
					items: [
						{ values: [1, 3, 4] } // 2 supprimé, 4 ajouté
					]
				}
			};

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
		});

		it("should handle arrays with mixed types", () => {
			const differ = new Differ();
			const obj1 = { items: [1, "string", true, { key: "value" }] };
			const obj2 = { items: [1, "string", false, { key: "value" }] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
			expect(result).toContain("true");
			expect(result).toContain("false");
		});
	});
});
