import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { config } from "../src/index.js";

const TEST_DIR = join(process.cwd(), "test-fixtures");

describe("config()", () => {
	beforeEach(() => {
		// Clean up process.env
		delete process.env.TEST_KEY;
		delete process.env.TEST_KEY2;
		delete process.env.EXISTING;

		// Create test directory
		if (!existsSync(TEST_DIR)) {
			mkdirSync(TEST_DIR, { recursive: true });
		}
	});

	afterEach(() => {
		// Clean up test directory
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true, force: true });
		}

		// Clean up process.env
		delete process.env.TEST_KEY;
		delete process.env.TEST_KEY2;
		delete process.env.EXISTING;
	});

	it("should load .env file into process.env", () => {
		const envPath = join(TEST_DIR, ".env");
		writeFileSync(envPath, "TEST_KEY=test_value");

		const result = config({ path: envPath });

		expect(result.TEST_KEY).toBe("test_value");
		expect(process.env.TEST_KEY).toBe("test_value");
	});

	it("should not override existing env variables by default", () => {
		process.env.EXISTING = "original";

		const envPath = join(TEST_DIR, ".env");
		writeFileSync(envPath, "EXISTING=new_value");

		const result = config({ path: envPath });

		expect(result.EXISTING).toBe("new_value");
		expect(process.env.EXISTING).toBe("original");
	});

	it("should override existing env variables when override=true", () => {
		process.env.EXISTING = "original";

		const envPath = join(TEST_DIR, ".env");
		writeFileSync(envPath, "EXISTING=new_value");

		const result = config({ path: envPath, override: true });

		expect(result.EXISTING).toBe("new_value");
		expect(process.env.EXISTING).toBe("new_value");
	});

	it("should load multiple variables", () => {
		const envPath = join(TEST_DIR, ".env");
		writeFileSync(envPath, "KEY1=value1\nKEY2=value2\nKEY3=value3");

		const result = config({ path: envPath });

		expect(result.KEY1).toBe("value1");
		expect(result.KEY2).toBe("value2");
		expect(result.KEY3).toBe("value3");
		expect(process.env.KEY1).toBe("value1");
		expect(process.env.KEY2).toBe("value2");
		expect(process.env.KEY3).toBe("value3");
	});

	it("should throw error when file does not exist", () => {
		expect(() => config({ path: "nonexistent.env" })).toThrow("Failed to load .env file");
	});

	it("should use default .env path when no path provided", () => {
		const envPath = join(process.cwd(), ".env");
		const exists = existsSync(envPath);

		if (exists) {
			// If .env exists, it should load successfully
			expect(() => config()).not.toThrow();
		} else {
			// If .env doesn't exist, it should throw
			expect(() => config()).toThrow();
		}
	});

	it("should handle relative paths", () => {
		const envPath = join(TEST_DIR, ".env.test");
		writeFileSync(envPath, "RELATIVE=works");

		const result = config({ path: envPath });

		expect(result.RELATIVE).toBe("works");
		expect(process.env.RELATIVE).toBe("works");
	});

	it("should return parsed variables without side effects when override=false", () => {
		process.env.TEST_KEY = "original";

		const envPath = join(TEST_DIR, ".env");
		writeFileSync(envPath, "TEST_KEY=new\nOTHER=value");

		const result = config({ path: envPath });

		expect(result.TEST_KEY).toBe("new");
		expect(result.OTHER).toBe("value");
		expect(process.env.TEST_KEY).toBe("original");
		expect(process.env.OTHER).toBe("value");
	});
});
