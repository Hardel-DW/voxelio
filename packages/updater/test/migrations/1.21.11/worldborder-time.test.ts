import { describe, expect, it } from "vitest";
import { createContext } from "@/context";
import { worldborderTime } from "@/migrations/1.21.11/worldborder-time";

function applyMigration(content: string): string {
	const files: Record<string, Uint8Array> = {
		"data/test/function/test.mcfunction": new TextEncoder().encode(content),
	};
	const ctx = createContext(files, []);
	worldborderTime.migrate(ctx);
	return new TextDecoder().decode(files["data/test/function/test.mcfunction"]);
}

describe("worldborderTime", () => {
	it("should add 's' suffix to worldborder set command", () => {
		expect(applyMigration("worldborder set 10 5")).toBe("worldborder set 10 5s");
	});

	it("should add 's' suffix to worldborder add command", () => {
		expect(applyMigration("worldborder add 1 10")).toBe("worldborder add 1 10s");
	});

	it("should add 's' suffix to worldborder warning time command", () => {
		expect(applyMigration("worldborder warning time 30")).toBe("worldborder warning time 30s");
	});

	it("should not modify command without time argument", () => {
		expect(applyMigration("worldborder set 100")).toBe("worldborder set 100");
	});

	it("should not modify command that already has a suffix", () => {
		expect(applyMigration("worldborder set 10 5t")).toBe("worldborder set 10 5t");
		expect(applyMigration("worldborder set 10 5s")).toBe("worldborder set 10 5s");
		expect(applyMigration("worldborder set 10 5d")).toBe("worldborder set 10 5d");
	});
});
