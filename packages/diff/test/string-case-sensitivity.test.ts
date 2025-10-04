import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("String Values Case Sensitivity", () => {
	it("should treat string values with different case as different", () => {
		const differ = new Differ();
		const obj1 = { message: "hello" };
		const obj2 = { message: "HELLO" };

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("-");
		expect(result).toContain("+");
		expect(result).toContain("hello");
		expect(result).toContain("HELLO");
	});

	it("should treat identical string values (same case) as equal", () => {
		const differ = new Differ();
		const obj1 = { message: "Hello World" };
		const obj2 = { message: "Hello World" };

		const result = differ.diff(obj1, obj2);
		expect(result).toBe("");
	});

	it("should detect partial case changes in strings", () => {
		const differ = new Differ();
		const obj1 = { text: "Hello World" };
		const obj2 = { text: "Hello world" };  // W → w

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("World");
		expect(result).toContain("world");
	});

	it("should handle multiple string values with different cases", () => {
		const differ = new Differ();
		const obj1 = {
			name: "alice",
			city: "PARIS",
			country: "France"
		};
		const obj2 = {
			name: "ALICE",  // alice → ALICE
			city: "paris",  // PARIS → paris
			country: "France"  // Inchangé
		};

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("alice");
		expect(result).toContain("ALICE");
		expect(result).toContain("PARIS");
		expect(result).toContain("paris");
	});

	it("should handle case sensitivity in nested string values", () => {
		const differ = new Differ();
		const obj1 = {
			user: {
				name: "John Doe",
				email: "john@example.com"
			}
		};
		const obj2 = {
			user: {
				name: "John Doe",
				email: "JOHN@EXAMPLE.COM"  // Email en majuscules
			}
		};

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("john@example.com");
		expect(result).toContain("JOHN@EXAMPLE.COM");
	});

	it("should handle case sensitivity in array string values", () => {
		const differ = new Differ();
		const obj1 = { tags: ["javascript", "typescript", "node"] };
		const obj2 = { tags: ["JavaScript", "TypeScript", "Node"] };

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("javascript");
		expect(result).toContain("JavaScript");
		expect(result).toContain("typescript");
		expect(result).toContain("TypeScript");
		expect(result).toContain("node");
		expect(result).toContain("Node");
	});

	it("should handle mixed case scenarios", () => {
		const differ = new Differ();
		const obj1 = {
			status: "active",
			role: "ADMIN",
			type: "User"
		};
		const obj2 = {
			status: "ACTIVE",  // Changé
			role: "ADMIN",     // Inchangé
			type: "user"       // Changé
		};

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("active");
		expect(result).toContain("ACTIVE");
		expect(result).toContain("User");
		expect(result).toContain("user");
	});

	it("should handle empty strings and whitespace with case sensitivity", () => {
		const differ = new Differ();
		const obj1 = { text: "Hello World" };
		const obj2 = { text: "hello world" };

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("Hello World");
		expect(result).toContain("hello world");
	});
});
