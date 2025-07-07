import { compileDatapack } from "@/core/engine/Compiler";
import { VOXEL_ELEMENTS } from "@test/template/concept/enchant/VoxelDriven";
import { enchantmentFile } from "@test/template/datapack";
import { prepareFiles } from "@test/template/utils";
import { describe, expect, it } from "vitest";

describe("Compiler", () => {
	describe("compileDatapack", () => {
		it("should compile elements correctly", () => {
			const result = compileDatapack({
				elements: VOXEL_ELEMENTS,
				files: prepareFiles(enchantmentFile)
			});

			expect(Array.isArray(result)).toBe(true);
		});
	});
});
