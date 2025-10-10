import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";

describe("parse()", () => {
	it("should parse basic key=value", () => {
		const result = parse("KEY=value");
		expect(result.KEY).toBe("value");
	});

	it("should handle empty values", () => {
		const result = parse("EMPTY=");
		expect(result.EMPTY).toBe("");
	});

	it("should handle double quotes", () => {
		const result = parse('QUOTED="hello world"');
		expect(result.QUOTED).toBe("hello world");
	});

	it("should handle single quotes", () => {
		const result = parse("QUOTED='hello world'");
		expect(result.QUOTED).toBe("hello world");
	});

	it("should expand newlines in double quotes", () => {
		const result = parse('MULTILINE="line1\\nline2"');
		expect(result.MULTILINE).toBe("line1\nline2");
	});

	it("should NOT expand newlines in single quotes", () => {
		const result = parse("MULTILINE='line1\\nline2'");
		expect(result.MULTILINE).toBe("line1\\nline2");
	});

	it("should handle export prefix", () => {
		const result = parse("export KEY=value");
		expect(result.KEY).toBe("value");
	});

	it("should skip comments", () => {
		const result = parse("# This is a comment\nKEY=value");
		expect(result.KEY).toBe("value");
		expect(Object.keys(result)).toHaveLength(1);
	});

	it("should handle inline comments", () => {
		const result = parse("KEY=value # inline comment");
		expect(result.KEY).toBe("value");
	});

	it("should handle whitespace", () => {
		const result = parse("  KEY  =  value  ");
		expect(result.KEY).toBe("value");
	});

	it("should handle multiple lines", () => {
		const result = parse("KEY1=value1\nKEY2=value2\nKEY3=value3");
		expect(result.KEY1).toBe("value1");
		expect(result.KEY2).toBe("value2");
		expect(result.KEY3).toBe("value3");
	});

	it("should handle CRLF line endings", () => {
		const result = parse("KEY1=value1\r\nKEY2=value2");
		expect(result.KEY1).toBe("value1");
		expect(result.KEY2).toBe("value2");
	});

	it("should handle CR line endings", () => {
		const result = parse("KEY1=value1\rKEY2=value2");
		expect(result.KEY1).toBe("value1");
		expect(result.KEY2).toBe("value2");
	});

	it("should skip empty lines", () => {
		const result = parse("KEY1=value1\n\n\nKEY2=value2");
		expect(result.KEY1).toBe("value1");
		expect(result.KEY2).toBe("value2");
		expect(Object.keys(result)).toHaveLength(2);
	});

	it("should handle Buffer input", () => {
		const buffer = Buffer.from("KEY=value");
		const result = parse(buffer);
		expect(result.KEY).toBe("value");
	});

	it("should throw on file too large", () => {
		const huge = "X".repeat(2 * 1024 * 1024); // 2MB
		expect(() => parse(huge)).toThrow("File too large");
	});

	it("should handle keys with dots and dashes", () => {
		const result = parse("my-key.name=value");
		expect(result["my-key.name"]).toBe("value");
	});

	it("should handle equals signs in values", () => {
		const result = parse("KEY=value=with=equals");
		expect(result.KEY).toBe("value=with=equals");
	});

	it("should preserve spaces in quoted values", () => {
		const result = parse('SPACED="  hello  "');
		expect(result.SPACED).toBe("  hello  ");
	});

	it("should handle special characters in quoted values", () => {
		const result = parse('SPECIAL="@#$%^&*()"');
		expect(result.SPECIAL).toBe("@#$%^&*()");
	});

	it("should handle email addresses", () => {
		const result = parse("EMAIL=user@example.com");
		expect(result.EMAIL).toBe("user@example.com");
	});

	it("should handle JSON-like values", () => {
		const result = parse('JSON={"key":"value"}');
		expect(result.JSON).toBe('{"key":"value"}');
	});
});
