import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Differ", () => {
	describe("diff", () => {
		it("should detect simple property changes", () => {
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Bob", age: 30 };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/name",
				value: "Bob"
			});
		});

		it("should detect added properties", () => {
			const obj1 = { name: "Alice" };
			const obj2 = { name: "Alice", age: 30 };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "add",
				path: "/age",
				value: 30
			});
		});

		it("should detect removed properties", () => {
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Alice" };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "remove",
				path: "/age"
			});
		});

		it("should handle nested objects", () => {
			const obj1 = {
				user: {
					name: "Alice",
					profile: { bio: "Developer" }
				}
			};
			const obj2 = {
				user: {
					name: "Alice",
					profile: { bio: "Senior Developer" }
				}
			};

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/user/profile/bio",
				value: "Senior Developer"
			});
		});

		it("should handle arrays", () => {
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [1, 3, 4] };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);
		});

		it("should handle empty objects", () => {
			const obj1 = {};
			const obj2 = { name: "Alice" };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "add",
				path: "/name",
				value: "Alice"
			});
		});

		it("should handle identical objects", () => {
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Alice", age: 30 };

			const patch = new Differ(obj1, obj2).diff();
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBe(0);
		});

		it("should handle null values", () => {
			const obj1 = { value: null };
			const obj2 = { value: "something" };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/value",
				value: "something"
			});
		});

		it("should handle array with objects", () => {
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

		it("should handle type changes", () => {
			const obj1 = { value: "string" };
			const obj2 = { value: 123 };

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/value",
				value: 123
			});
		});

		it("should handle complex nested structures", () => {
			const obj1 = {
				config: {
					server: { port: 3000, host: "localhost" },
					database: { name: "test", user: "admin" }
				}
			};
			const obj2 = {
				config: {
					server: { port: 8080, host: "localhost" },
					database: { name: "production", user: "admin" }
				}
			};

			const patch = new Differ(obj1, obj2).diff();

			expect(Array.isArray(patch)).toBe(true);
			expect(patch).toContainEqual({
				op: "replace",
				path: "/config/server/port",
				value: 8080
			});
			expect(patch).toContainEqual({
				op: "replace",
				path: "/config/database/name",
				value: "production"
			});
		});
	});

	describe("apply", () => {
		it("should apply simple patch", () => {
			const before = { name: "Alice", age: 30 };
			const after = { name: "Bob", age: 30 };
			const patch = new Differ(before, after).diff();

			const result = Differ.apply(before, patch);
			expect(result).toEqual({ name: "Bob", age: 30 });
			expect(result).toBeDefined();
		});

		it("should handle empty patch", () => {
			const obj = { name: "Alice" };
			const patch = [];

			const result = Differ.apply(obj, patch);
			expect(result).toEqual({ name: "Alice" });
			expect(result).toBeDefined();
		});
	});

	describe("export diff file", () => {
		it("should export a complete diff file for complex objects", () => {
			const before = {
				version: "1.0.0",
				config: {
					server: {
						port: 3000,
						host: "localhost",
						ssl: false
					},
					api: {
						foo: "bar",
						bar: "foo",
						qux: "qux",
						version: "1.0.0"
					},
					database: {
						name: "dev_db",
						user: "admin",
						connections: 10
					}
				},
				features: ["auth", "api", "websocket"],
				metadata: {
					created: "2024-01-01",
					author: "Alice"
				}
			};

			const after = {
				version: "2.0.0",
				config: {
					server: {
						port: 8080,
						host: "0.0.0.0",
						ssl: true
					},
					api: {
						foo: "bar",
						bar: "foo",
						qux: "qux",
						version: "1.0.0"
					},
					database: {
						name: "prod_db",
						user: "admin",
						connections: 50
					}
				},
				features: ["auth", "api", "graphql"],
				metadata: {
					created: "2024-01-01",
					author: "Bob",
					updated: "2024-10-04"
				}
			};

			const patch = new Differ(before, after).diff();
			writeFileSync("test/output/example.json", JSON.stringify(patch, null, 2), "utf-8");
			expect(Array.isArray(patch)).toBe(true);
			expect(patch.length).toBeGreaterThan(0);

			// Verify apply works
			const applied = Differ.apply(before, patch);
			expect(applied).toEqual(after);
		});
	});
});
