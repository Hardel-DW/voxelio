import { parseDatapack } from "@/core/engine/Parser";
import { lootTableZip } from "@test/template/datapack";
import { describe, it, expect } from "vitest";

describe("Parser", () => {
	it("should parse a datapack", () => {
		const result = parseDatapack(lootTableZip);
		expect(result).toBeDefined();
	});
});
