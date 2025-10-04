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

		const result = differ.diff(obj1, obj2);

		// Les clés "name" et "Name" sont différentes
		expect(result).toContain("@@");
		expect(result).toContain("-");
		expect(result).toContain("+"); // "Name" est ajouté
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

		const result = differ.diff(obj1, obj2);

		console.log(result);
		expect(result).toContain("@@");
		expect(result).not.toContain('- ');
		expect(result).toContain("name");
		expect(result).toContain("Name");
		expect(result).toContain("age");
		expect(result).toContain("+"); // "Name" est ajouté
	});

	it("should treat string values with different case as different", () => {
		const differ = new Differ();
		const obj1 = { message: "hello" };
		const obj2 = { message: "HELLO" };

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("@@");
		expect(result).toContain("hello");
		expect(result).toContain("HELLO");
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

		const result = differ.diff(obj1, obj2);
		expect(result).toContain("firstName");
		expect(result).toContain("lastName");
		expect(result).toContain("FirstName");
		expect(result).toContain("LastName");
	});
});
