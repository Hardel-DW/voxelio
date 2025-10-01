import { describe, expect, it } from "vitest";
import { Datapack } from "@/core/Datapack";
import type { TagType } from "@/core/Tag";
import { DatapackError } from "@/core/DatapackError";
import { createZipFile } from "@test/mock/utils";
import { enchantmentWithTagFiles, nonValidMcmetaZip, testMcMetaNotExists } from "@test/mock/datapack";

describe("Datapack", () => {
	it("should create a datapack instance from files", () => {
		const datapack = new Datapack(enchantmentWithTagFiles);
		expect(datapack).toBeInstanceOf(Datapack);
	});

	it("should throw error if pack.mcmeta is missing", () => {
		expect(() => new Datapack(testMcMetaNotExists)).toThrow(DatapackError);
		expect(() => new Datapack(nonValidMcmetaZip)).toThrow(DatapackError);
	});

	it("should parse datapack from file", async () => {
		const file = await createZipFile(enchantmentWithTagFiles);
		const datapack = await Datapack.parse(file);
		expect(datapack).toBeInstanceOf(Datapack);
	});

	describe("getNamespaces", () => {
		it("should return unique namespaces from data folder", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const namespaces = datapack.getNamespaces();
			expect(namespaces).toContain("enchantplus");
			expect(namespaces).toContain("minecraft");
			expect(namespaces).toHaveLength(new Set(namespaces).size); // Check uniqueness
		});
	});

	describe("getPackFormat", () => {
		it("should return pack format from pack.mcmeta", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			expect(datapack.getPackFormat()).toBe(61);
		});

		it("should throw error if pack format is missing", () => {
			const invalidMcmeta = {
				...enchantmentWithTagFiles,
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: {} }))
			};
			expect(() => new Datapack(invalidMcmeta)).toThrow("tools.error.failed_to_get_pack_format");
		});
	});

	describe("getVersion", () => {
		it("should return formatted version based on pack format", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			expect(datapack.getVersion()).toMatch(/^\d+\.\d+(\.\d+)?$/);
		});
	});

	describe("getDescription", () => {
		it("should return description from pack.mcmeta", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			expect(datapack.getDescription()).toBe("lorem ipsum");
		});

		it("should return fallback if description is missing", () => {
			const invalidMcmeta = {
				...enchantmentWithTagFiles,
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61 } }))
			};
			const datapack = new Datapack(invalidMcmeta);
			expect(datapack.getDescription("fallback")).toBe("fallback");
		});
	});

	describe("getRelatedTags", () => {
		it("should find tags containing an identifier", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "enchantplus",
				registry: "enchantment",
				resource: "sword/poison_aspect"
			};
			const tags = datapack.getRelatedTags("tags/enchantment", identifier);
			expect(tags).toContain("#enchantplus:exclusive_set/aspect");
			expect(tags).toContain("#minecraft:curse");
		});

		it("should return empty array for non-existent registry", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "test",
				registry: "none",
				resource: "test"
			};
			expect(datapack.getRelatedTags(undefined, identifier)).toEqual([]);
		});
	});

	describe("getRegistry", () => {
		const smallFilesRecord = {
			"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "lorem ipsum" } }, null, 2)),
			"data/enchantplus/enchantment/bow/accuracy_shot.json": new TextEncoder().encode(JSON.stringify({}, null, 4)),
			"data/enchantplus/enchantment/sword/poison_aspect.json": new TextEncoder().encode(JSON.stringify({}, null, 4)),
			"data/enchantplus/tags/enchantment/exclusive_set/aspect.json": new TextEncoder().encode(JSON.stringify({}, null, 4)),
			"data/enchantplus/tags/enchantment/armor.json": new TextEncoder().encode(JSON.stringify({}, null, 4))
		};

		it("should return all elements from a registry", () => {
			const datapack = new Datapack(smallFilesRecord);
			const enchantments = datapack.getRegistry<TagType>("tags/enchantment");
			expect(enchantments).toBeInstanceOf(Array);
			expect(enchantments.length).toBeGreaterThan(0);
			expect(enchantments.length).toBe(2);
			expect(enchantments[0]).toHaveProperty("identifier");
			expect(enchantments[0]).toHaveProperty("data");
		});

		it("should return empty array for non-existent registry", () => {
			const datapack = new Datapack(smallFilesRecord);
			expect(datapack.getRegistry("non-existent")).toEqual([]);
		});
	});

	describe("readFile for tags", () => {
		it("should return tag values for valid identifier", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "enchantplus",
				registry: "tags/enchantment",
				resource: "exclusive_set/aspect"
			};
			const tag = datapack.readFile<TagType>(identifier);
			expect(tag).toBeDefined();
			expect(tag).toHaveProperty("values");
			expect(tag?.values).toBeInstanceOf(Array);
		});

		it("should return undefined for non-existent identifier", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "test",
				registry: "tags/test",
				resource: "non-existent"
			};
			expect(datapack.readFile(identifier)).toBeUndefined();
		});
	});

	describe("readFile", () => {
		it("should read and parse JSON file from datapack", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const content = datapack.readFile({
				namespace: "enchantplus",
				registry: "enchantment",
				resource: "sword/poison_aspect"
			});

			expect(content).toBeDefined();
			expect(content).toHaveProperty("description");
		});

		it("should return undefined for non-existent file", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const content = datapack.readFile({
				namespace: "non_existent",
				registry: "none",
				resource: "nothing"
			});

			expect(content).toBeUndefined();
		});
	});
});
