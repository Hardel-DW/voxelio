import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Deep Equality Comparison", () => {
	it("should detect identical nested objects as equal (no diff)", () => {
		const obj1 = {
			user: {
				profile: {
					name: "Alice",
					age: 30
				}
			}
		};
		const obj2 = {
			user: {
				profile: {
					name: "Alice",
					age: 30
				}
			}
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch.length).toBe(0);
	});

	it("should detect differences in deeply nested objects", () => {
		const obj1 = {
			user: {
				profile: {
					name: "Alice",
					age: 30
				}
			}
		};
		const obj2 = {
			user: {
				profile: {
					name: "Bob",
					age: 30
				}
			}
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/user/profile/name",
			value: "Bob"
		});
	});

	it("should detect identical arrays as equal (no diff)", () => {
		const obj1 = { items: [1, 2, 3] };
		const obj2 = { items: [1, 2, 3] };

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch.length).toBe(0);
	});

	it("should detect differences in arrays", () => {
		const obj1 = { items: [1, 2, 3] };
		const obj2 = { items: [1, 2, 4] }; // 3 → 4

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/items/2",
			value: 4
		});
	});

	it("should compare nested arrays with deep equality", () => {
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

	it("should detect changes in nested arrays with objects", () => {
		const obj1 = {
			users: [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" }
			]
		};
		const obj2 = {
			users: [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Charlie" }
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

	it("should handle deeply nested structures (3+ levels)", () => {
		const obj1 = {
			level1: {
				level2: {
					level3: {
						value: "deep"
					}
				}
			}
		};
		const obj2 = {
			level1: {
				level2: {
					level3: {
						value: "deep"
					}
				}
			}
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch.length).toBe(0);
	});

	it("should detect changes at any depth level", () => {
		const obj1 = {
			level1: {
				level2: {
					level3: {
						value: "deep"
					}
				}
			}
		};
		const obj2 = {
			level1: {
				level2: {
					level3: {
						value: "deeper"
					}
				}
			}
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/level1/level2/level3/value",
			value: "deeper"
		});
	});
});
