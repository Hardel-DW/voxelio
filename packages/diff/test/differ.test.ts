import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Differ", () => {
	describe("diff", () => {
		it("should detect simple property changes", () => {
			const differ = new Differ();
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Bob", age: 30 };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("Alice");
			expect(result).toContain("Bob");
		});

		it("should detect added properties", () => {
			const differ = new Differ();
			const obj1 = { name: "Alice" };
			const obj2 = { name: "Alice", age: 30 };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("+");
			expect(result).toContain("age");
		});

		it("should detect removed properties", () => {
			const differ = new Differ();
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Alice" };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("-");
			expect(result).toContain("age");
		});

		it("should handle nested objects", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("Developer");
			expect(result).toContain("Senior Developer");
		});

		it("should handle arrays", () => {
			const differ = new Differ();
			const obj1 = { items: [1, 2, 3] };
			const obj2 = { items: [1, 3, 4] };

			const result = differ.diff(obj1, obj2);
			expect(result).toContain("@@");
		});

		it("should handle empty objects", () => {
			const differ = new Differ();
			const obj1 = {};
			const obj2 = { name: "Alice" };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("+");
			expect(result).toContain("name");
		});

		it("should handle identical objects", () => {
			const differ = new Differ();
			const obj1 = { name: "Alice", age: 30 };
			const obj2 = { name: "Alice", age: 30 };

			const result = differ.diff(obj1, obj2);
			expect(result).toBe("");
		});

		it("should handle null values", () => {
			const differ = new Differ();
			const obj1 = { value: null };
			const obj2 = { value: "something" };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
		});

		it("should handle array with objects", () => {
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
		});

		it("should handle type changes", () => {
			const differ = new Differ();
			const obj1 = { value: "string" };
			const obj2 = { value: 123 };

			const result = differ.diff(obj1, obj2);

			expect(result).toContain("@@");
			expect(result).toContain("string");
			expect(result).toContain("123");
		});

		it("should handle complex nested structures", () => {
			const differ = new Differ();
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

			const result = differ.diff(obj1, obj2);
			console.log(result);

			expect(result).toContain("@@");
			expect(result).toContain("3000");
			expect(result).toContain("8080");
		});
	});

	describe("apply", () => {
		it("should apply simple patch", () => {
			const differ = new Differ();
			const before = { name: "Alice", age: 30 };
			const after = { name: "Bob", age: 30 };
			const patch = differ.diff(before, after);
			console.log(patch);

			const result = Differ.apply(before, patch);
			expect(result).toEqual({ name: "Bob", age: 30 });
			expect(result).toBeDefined();
		});

		it("should handle empty patch", () => {
			const obj = { name: "Alice" };
			const patch = "";

			const result = Differ.apply(obj, patch);
			expect(result).toEqual({ name: "Alice" });
			expect(result).toBeDefined();
		});
	});

	describe("export diff file", () => {
		it("should export a complete diff file for complex objects", () => {
			const differ = new Differ();
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

			const diff = differ.diff(before, after);
			writeFileSync("test/output/example.diff", diff, "utf-8");
			expect(diff).toContain("@@");
			expect(diff).toContain("1.0.0");
			expect(diff).toContain("2.0.0");
			expect(diff).toContain("3000");
			expect(diff).toContain("8080");
		});
	});
});
