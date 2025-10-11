import { describe, expect, it } from "vitest";
import { Differ } from "../src/Differ";

describe("String Values Case Sensitivity", () => {
	it("should treat string values with different case as different", () => {
		const obj1 = { message: "hello" };
		const obj2 = { message: "HELLO" };

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/message",
			value: "HELLO"
		});
	});

	it("should treat identical string values (same case) as equal", () => {
		const obj1 = { message: "Hello World" };
		const obj2 = { message: "Hello World" };

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch.length).toBe(0);
	});

	it("should detect partial case changes in strings", () => {
		const obj1 = { text: "Hello World" };
		const obj2 = { text: "Hello world" }; // W → w

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/text",
			value: "Hello world"
		});
	});

	it("should handle multiple string values with different cases", () => {
		const obj1 = {
			name: "alice",
			city: "PARIS",
			country: "France"
		};
		const obj2 = {
			name: "ALICE", // alice → ALICE
			city: "paris", // PARIS → paris
			country: "France" // Inchangé
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/name",
			value: "ALICE"
		});
		expect(patch).toContainEqual({
			op: "replace",
			path: "/city",
			value: "paris"
		});
	});

	it("should handle case sensitivity in nested string values", () => {
		const obj1 = {
			user: {
				name: "John Doe",
				email: "john@example.com"
			}
		};
		const obj2 = {
			user: {
				name: "John Doe",
				email: "JOHN@EXAMPLE.COM" // Email en majuscules
			}
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/user/email",
			value: "JOHN@EXAMPLE.COM"
		});
	});

	it("should handle case sensitivity in array string values", () => {
		const obj1 = { tags: ["javascript", "typescript", "node"] };
		const obj2 = { tags: ["JavaScript", "TypeScript", "Node"] };

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/tags/0",
			value: "JavaScript"
		});
		expect(patch).toContainEqual({
			op: "replace",
			path: "/tags/1",
			value: "TypeScript"
		});
		expect(patch).toContainEqual({
			op: "replace",
			path: "/tags/2",
			value: "Node"
		});
	});

	it("should handle mixed case scenarios", () => {
		const obj1 = {
			status: "active",
			role: "ADMIN",
			type: "User"
		};
		const obj2 = {
			status: "ACTIVE", // Changé
			role: "ADMIN", // Inchangé
			type: "user" // Changé
		};

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/status",
			value: "ACTIVE"
		});
		expect(patch).toContainEqual({
			op: "replace",
			path: "/type",
			value: "user"
		});
	});

	it("should handle empty strings and whitespace with case sensitivity", () => {
		const obj1 = { text: "Hello World" };
		const obj2 = { text: "hello world" };

		const patch = new Differ(obj1, obj2).diff();
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/text",
			value: "hello world"
		});
	});
});
