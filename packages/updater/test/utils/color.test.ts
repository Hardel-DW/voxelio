import { describe, expect, it } from "vitest";
import { intToHex } from "@/utils/color";

describe("intToHex", () => {
	it("should convert int color to hex string", () => {
		expect(intToHex(4159204)).toBe("#3f76e4");
	});

	it("should pad with zeros for small values", () => {
		expect(intToHex(255)).toBe("#0000ff");
		expect(intToHex(0)).toBe("#000000");
	});
});
