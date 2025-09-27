import { compileDatapack } from "@/core/engine/Compiler";
import { VOXEL_ELEMENTS } from "@test/mock/enchant/VoxelDriven";
import { enchantmentFile } from "@test/mock/datapack";
import { prepareFiles } from "@test/mock/utils";
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
