import { describe, expect, it } from "vitest";
import { toModId } from "@/modid";

describe("toModId", () => {
	it("should keep the id of a usual datapack name", () => {
		expect(toModId("Terralith_v2.6.5+26.3")).toBe("terralith_v2_6_5_26_3");
		expect(toModId("My Cool Datapack")).toBe("my_cool_datapack");
	});

	it("should start with a letter and keep at least two characters", () => {
		expect(toModId("1.21 Pack")).toBe("datapack_1_21_pack");
		expect(toModId("_hidden")).toBe("datapack__hidden");
		expect(toModId("a")).toBe("datapack_a");
		expect(toModId("")).toBe("datapack_");
	});

	it("should drop what loaders refuse and stay within 64 characters", () => {
		expect(toModId("My-Pack.Deluxe")).toBe("my_pack_deluxe");
		expect(toModId("x".repeat(100))).toHaveLength(64);
		expect(toModId("x".repeat(100))).toMatch(/^[a-z][a-z0-9_]{1,63}$/);
	});
});
