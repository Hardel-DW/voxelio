import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Case Sensitivity", () => {
	it("should treat keys with different case as different keys", () => {
		const differ = new Differ();
		const obj1 = {
			name: "Alice", // minuscule
			age: 30
		};
		const obj2 = {
			Name: "Alice", // Majuscule
			age: 30
		};

		const patch = differ.diff(obj1, obj2);

		// Les clés "name" et "Name" sont différentes
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "add",
			path: "/Name",
			value: "Alice"
		});
		expect(patch).toContainEqual({
			op: "remove",
			path: "/name"
		});
	});

	it("should treat keys with different case as different keys", () => {
		const differ = new Differ();
		const obj1 = {
			name: "Alice", // minuscule
			age: 30
		};
		const obj2 = {
			name: "Alice", // minuscule
			Name: "Alice", // Majuscule
			age: 30
		};

		const patch = differ.diff(obj1, obj2);

		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "add",
			path: "/Name",
			value: "Alice"
		});
	});

	it("should treat string values with different case as different", () => {
		const differ = new Differ();
		const obj1 = { message: "hello" };
		const obj2 = { message: "HELLO" };

		const patch = differ.diff(obj1, obj2);
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "replace",
			path: "/message",
			value: "HELLO"
		});
	});

	it("should handle multiple case-different keys", () => {
		const differ = new Differ();
		const obj1 = {
			firstName: "John",
			lastName: "Doe"
		};
		const obj2 = {
			FirstName: "John",
			LastName: "Doe"
		};

		const patch = differ.diff(obj1, obj2);
		expect(Array.isArray(patch)).toBe(true);
		expect(patch).toContainEqual({
			op: "add",
			path: "/FirstName",
			value: "John"
		});
		expect(patch).toContainEqual({
			op: "add",
			path: "/LastName",
			value: "Doe"
		});
		expect(patch).toContainEqual({
			op: "remove",
			path: "/firstName"
		});
		expect(patch).toContainEqual({
			op: "remove",
			path: "/lastName"
		});
	});
});
