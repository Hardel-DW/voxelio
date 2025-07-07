import { describe, expect, it } from "vitest";
import { getMinecraftVersion, getDescription } from "@/core/Version";

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

	describe("getDescription", () => {
		it("should return the version for a single version", () => {
			expect(getDescription(9)).toBe("1.18.2");
			expect(getDescription(61)).toBe("1.21.4");
		});

		it("should return version range for a version range", () => {
			expect(getDescription(48)).toBe("Version 1.21 - 1.21.1");
			expect(getDescription(57)).toBe("Version 1.21.2 - 1.21.3");
		});

		it("should return Future Version for versions above max", () => {
			expect(getDescription(150)).toBe("Future Version");
			expect(getDescription(999)).toBe("Future Version");
		});

		it("should return Snapshot with next version for versions between known versions", () => {
			expect(getDescription(60)).toBe("Snapshot - 1.21.4");
			expect(getDescription(58)).toBe("Snapshot - 1.21.4");
		});

		it("should throw error for versions below minimum", () => {
			expect(getDescription(1)).toBe("Version 1.12 - 1.12.2");
		});
	});
});
