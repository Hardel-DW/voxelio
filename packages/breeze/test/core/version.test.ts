import { describe, expect, it } from "vitest";
import { getMinecraftVersion, LATEST_PACK_FORMAT } from "@/core/Version";

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

		it("should know the versions up to 26.3", () => {
			expect(getMinecraftVersion(88)).toBe("1.21.9");
			expect(getMinecraftVersion(94)).toBe("1.21.11");
			expect(getMinecraftVersion(101)).toBe("26.1");
			expect(getMinecraftVersion(107)).toBe("26.2");
			expect(getMinecraftVersion(121)).toBe("26.3");
		});

		it("should give a snapshot format the release it leads to", () => {
			expect(getMinecraftVersion(99)).toBe("26.1");
			expect(getMinecraftVersion(115)).toBe("26.3");
		});

		it("should throw error for unsupported version", () => {
			expect(() => getMinecraftVersion(999)).toThrow("Unsupported pack_format: 999");
			expect(() => getMinecraftVersion(LATEST_PACK_FORMAT + 1)).toThrow("Unsupported pack_format");
			expect(() => getMinecraftVersion(0)).toThrow("Unsupported pack_format: 0");
		});
	});
});
