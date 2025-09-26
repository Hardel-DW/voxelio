import { describe, expect, it } from "vitest";
import { getMinecraftVersion } from "@/core/Version";

describe("Version", () => {
	describe("getMinecraftVersion", () => {
		it("should return the correct version for a single version", () => {
			expect(getMinecraftVersion(9)).toBe("1.18.2");
			expect(getMinecraftVersion(61)).toBe("1.21.4");
		});

		it("should return the start version for a version range", () => {
			expect(getMinecraftVersion(48)).toBe("1.21");
			expect(getMinecraftVersion(57)).toBe("1.21.2");
		});

		it("should throw error for unsupported version", () => {
			expect(() => getMinecraftVersion(999)).toThrow("Unsupported pack_format: 999");
		});
	});
});
