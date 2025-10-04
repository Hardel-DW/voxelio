import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Deep Equality Comparison", () => {
	it("should detect identical nested objects as equal (no diff)", () => {
		const differ = new Differ();
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

		const result = differ.diff(obj1, obj2);
		expect(result).toBe("");
	});

	it("should detect differences in deeply nested objects", () => {
		const differ = new Differ();
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

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("Alice");
		expect(result).toContain("Bob");
	});

	it("should detect identical arrays as equal (no diff)", () => {
		const differ = new Differ();
		const obj1 = { items: [1, 2, 3] };
		const obj2 = { items: [1, 2, 3] };

		const result = differ.diff(obj1, obj2);
		expect(result).toBe("");
	});

	it("should detect differences in arrays", () => {
		const differ = new Differ();
		const obj1 = { items: [1, 2, 3] };
		const obj2 = { items: [1, 2, 4] };  // 3 → 4

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
	});

	it("should compare nested arrays with deep equality", () => {
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

	it("should detect changes in nested arrays with objects", () => {
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
				{ id: 2, name: "Charlie" }
			]
		};

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("Bob");
		expect(result).toContain("Charlie");
	});

	it("should handle deeply nested structures (3+ levels)", () => {
		const differ = new Differ();
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

		const result = differ.diff(obj1, obj2);
		expect(result).toBe("");
	});

	it("should detect changes at any depth level", () => {
		const differ = new Differ();
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

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("deep");
		expect(result).toContain("deeper");
	});
});
