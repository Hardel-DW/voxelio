import { describe, expect, it } from "vitest";
import { Datapack } from "@/core/Datapack";
import type { TagType } from "@/core/Tag";
import { DatapackError } from "@/core/DatapackError";
import { createZipFile, prepareFiles, createFilesFromElements } from "@test/mock/utils";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { enchantplusTags, vanillaTags } from "@test/mock/tags/enchant";

const enchantmentFiles = createFilesFromElements([...Object.values(originalEnchantments), ...enchantplusTags, ...vanillaTags]);

describe("Datapack", () => {
	it("should create a datapack instance from files", () => {
		const datapack = new Datapack(enchantmentFiles);
		expect(datapack).toBeInstanceOf(Datapack);
	});

	it("should throw error if pack.mcmeta is missing", () => {
		const nonValidMcmetaZip = prepareFiles({}, -1);
		const testMcMetaNotExists = {
			"data/enchantplus/enchantment/test.json": new TextEncoder().encode(JSON.stringify({}, null, 2))
		};

		expect(() => new Datapack(testMcMetaNotExists)).toThrow(DatapackError);
		expect(() => new Datapack(nonValidMcmetaZip)).toThrow(DatapackError);
	});

	it("should parse datapack from file", async () => {
		const file = await createZipFile(enchantmentFiles);
		const datapack = await Datapack.from(file);
		const parsed = datapack.parse();
		expect(datapack).toBeInstanceOf(Datapack);
		expect(parsed).toBeDefined();
		expect(parsed.elements).toBeDefined();
	});

	describe("getNamespaces", () => {
		it("should return unique namespaces from data folder", () => {
			const datapack = new Datapack(enchantmentFiles);
			const namespaces = datapack.getNamespaces();
			expect(namespaces).toContain("enchantplus");
			expect(namespaces).toContain("minecraft");
			expect(namespaces).toHaveLength(new Set(namespaces).size); // Check uniqueness
		});
	});

	describe("getPackFormat", () => {
		it("should return pack format from pack.mcmeta", () => {
			const datapack = new Datapack(enchantmentFiles);
			expect(datapack.getPackFormat()).toBe(61);
		});

		it("should throw error if pack format is missing", () => {
			const invalidMcmeta = {
				...enchantmentFiles,
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: {} }))
			};
			expect(() => new Datapack(invalidMcmeta)).toThrow("failed_to_get_pack_format");
		});
	});

	describe("getVersion", () => {
		it("should return formatted version based on pack format", () => {
			const datapack = new Datapack(enchantmentFiles);
			expect(datapack.getVersion()).toMatch(/^\d+\.\d+(\.\d+)?$/);
		});
	});

	describe("getDescription", () => {
		it("should return description from pack.mcmeta", () => {
			const datapack = new Datapack(enchantmentFiles);
			expect(datapack.getDescription()).toBe("lorem ipsum");
		});

		it("should return fallback if description is missing", () => {
			const invalidMcmeta = {
				...enchantmentFiles,
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61 } }))
			};
			const datapack = new Datapack(invalidMcmeta);
			expect(datapack.getDescription("fallback")).toBe("fallback");
		});
	});

	describe("getRelatedTags", () => {
		it("should find tags containing an identifier", () => {
			const datapack = new Datapack(enchantmentFiles);
			const identifier = { namespace: "enchantplus", registry: "enchantment", resource: "sword/poison_aspect" };
			const tags = datapack.getRelatedTags("tags/enchantment", identifier);
			expect(tags).toContain("#enchantplus:exclusive_set/aspect");
			expect(tags).toContain("#minecraft:curse");
		});

		it("should return empty array for non-existent registry", () => {
			const datapack = new Datapack(enchantmentFiles);
			const identifier = { namespace: "test", registry: "none", resource: "test" };
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
			const datapack = new Datapack(enchantmentFiles);
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
			const datapack = new Datapack(enchantmentFiles);
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
			const datapack = new Datapack(enchantmentFiles);
			const content = datapack.readFile({
				namespace: "enchantplus",
				registry: "enchantment",
				resource: "sword/poison_aspect"
			});

			expect(content).toBeDefined();
			expect(content).toHaveProperty("description");
		});

		it("should return undefined for non-existent file", () => {
			const datapack = new Datapack(enchantmentFiles);
			const content = datapack.readFile({
				namespace: "non_existent",
				registry: "none",
				resource: "nothing"
			});

			expect(content).toBeUndefined();
		});
	});

	describe("getRegistryDepth", () => {
		it("should return 1 for single-level registries", () => {
			expect(Datapack.getRegistryDepth("enchantment")).toBe(1);
			expect(Datapack.getRegistryDepth("advancement")).toBe(1);
			expect(Datapack.getRegistryDepth("recipe")).toBe(1);
		});

		it("should return 2 for worldgen registries", () => {
			expect(Datapack.getRegistryDepth("worldgen")).toBe(2);
		});

		it("should return 2 for tag/tags registries", () => {
			expect(Datapack.getRegistryDepth("tags")).toBe(2);
		});
	});

	describe("getRegistry with multi-level registries", () => {
		it("should correctly parse single-level registry path (enchantment)", () => {
			const files = {
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } })),
				"data/namespace/enchantment/sword/fury.json": new TextEncoder().encode(JSON.stringify({ type: "test" }))
			};
			const datapack = new Datapack(files);
			const registry = datapack.getRegistry("enchantment");

			expect(registry).toHaveLength(1);
			expect(registry[0].identifier).toEqual({
				namespace: "namespace",
				registry: "enchantment",
				resource: "sword/fury"
			});
		});

		it("should correctly parse two-level registry path (worldgen/noise)", () => {
			const files = {
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } })),
				"data/namespace/worldgen/noise/overworld.json": new TextEncoder().encode(JSON.stringify({ type: "test" }))
			};
			const datapack = new Datapack(files);
			const registry = datapack.getRegistry("worldgen/noise");

			expect(registry).toHaveLength(1);
			expect(registry[0].identifier).toEqual({
				namespace: "namespace",
				registry: "worldgen/noise",
				resource: "overworld"
			});
		});
	});

	describe("getRegistries with multi-level registries", () => {
		it("should correctly detect both single and two-level registries", () => {
			const files = {
				"pack.mcmeta": new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } })),
				"data/namespace/enchantment/sword/fury.json": new TextEncoder().encode(JSON.stringify({ type: "test" })),
				"data/namespace/worldgen/noise/overworld.json": new TextEncoder().encode(JSON.stringify({ type: "test" })),
				"data/namespace/tags/enchantment/aspect.json": new TextEncoder().encode(JSON.stringify({ type: "test" }))
			};
			const datapack = new Datapack(files);
			const registries = datapack.getRegistries();

			expect(registries).toContain("enchantment");
			expect(registries).toContain("worldgen/noise");
			expect(registries).toContain("tags/enchantment");
			expect(registries.size).toBe(3);
		});
	});
});
