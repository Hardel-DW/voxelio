import { describe, expect, it } from "vitest";
import { Datapack } from "@/core/Datapack";
import type { TagType } from "@/schema/TagType";
import { DatapackError } from "@/core/DatapackError";
import type { Compiler } from "@/core/engine/Compiler";
import { attack_speed_element } from "@test/template/concept/enchant/VoxelDriven";
import type { DataDrivenRegistryElement, LabeledElement } from "@/core/Element";
import { mergeDataDrivenRegistryElement } from "@/core/Tag";
import { analyserCollection } from "@/core/engine/Analyser";
import { createZipFile, prepareFiles } from "@test/template/utils";
import { enchantmentFile, enchantmentWithTagFiles, nonValidMcmetaZip, testMcMetaNotExists } from "@test/template/datapack";

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

	describe("getFileName", () => {
		it("should handle versioning for new files", () => {
			const datapack = new Datapack(enchantmentWithTagFiles, "test.zip");
			expect(datapack.getFileName()).toBe("V0-test");
		});

		it("should increment version for versioned files", () => {
			const datapack = new Datapack(enchantmentWithTagFiles, "V1-test.zip");
			expect(datapack.getFileName()).toBe("V2-test");
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

	describe("getTag", () => {
		it("should return tag values for valid identifier", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "enchantplus",
				registry: "tags/enchantment",
				resource: "exclusive_set/aspect"
			};
			const tag = datapack.getTag(identifier);
			expect(tag).toHaveProperty("values");
			expect(tag.values).toBeInstanceOf(Array);
		});

		it("should return empty tag for non-existent identifier", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "test",
				registry: "tags/test",
				resource: "non-existent"
			};
			expect(datapack.getTag(identifier)).toEqual({ values: [] });
		});

		it("should filter blacklisted values", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifier = {
				namespace: "enchantplus",
				registry: "tags/enchantment",
				resource: "exclusive_set/aspect"
			};
			const blacklist = ["enchantplus:sword/poison_aspect"];
			const tag = datapack.getTag(identifier, blacklist);
			expect(tag.values).not.toContain("enchantplus:sword/poison_aspect");
		});
	});

	describe("generate", () => {
		it("should generate a new datapack with updated content", async () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const content: LabeledElement[] = [
				{
					type: "updated",
					element: {
						identifier: {
							namespace: "enchantplus",
							registry: "enchantment",
							resource: "sword/poison_aspect"
						},
						data: {
							description: "Updated enchantment",
							effects: {}
						}
					}
				}
			];

			const result = datapack.generate(content, { isMinified: false });
			expect(result).toBeInstanceOf(Response);
		});

		it("should handle deleted elements by keeping empty tags", async () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const content: LabeledElement[] = [
				{
					type: "deleted",
					identifier: {
						namespace: "enchantplus",
						registry: "tags/enchantment",
						resource: "exclusive_set/aspect"
					}
				}
			];

			const result = await datapack.generate(content, { isMinified: true });
			expect(result).toBeInstanceOf(Response);
		});
	});

	describe("labelElements", () => {
		it("should correctly label new, updated and deleted elements", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const newElements = [
				{
					identifier: {
						namespace: "enchantplus",
						registry: "enchantment",
						resource: "new_enchant"
					},
					data: { description: "New enchantment" }
				}
			];

			const result = datapack.labelElements("enchantment", newElements, undefined);

			expect(result.some((r) => r.type === "new")).toBe(true);
			expect(result.some((r) => r.type === "deleted")).toBe(true);
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

	describe("getCompiledTags", () => {
		it("should merge original and new tag values", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const elements: ReturnType<Compiler>[] = [
				{
					element: {
						identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
						data: {}
					},
					tags: [
						{ namespace: "enchantplus", registry: "tags/enchantment", resource: "non_treasure" },
						{ namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/aspect" }
					]
				},

				{
					element: {
						identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/poison_aspect" },
						data: {}
					},
					tags: [{ namespace: "enchantplus", registry: "tags/enchantment", resource: "non_treasure" }]
				},
				{
					element: {
						identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
						data: {}
					},
					tags: [{ namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/boots" }]
				}
			];

			const result = datapack.getCompiledTags(elements, "enchantment");
			expect(result).toBeInstanceOf(Array);
			expect(result.length).toBe(12);
		});
	});

	describe("getTags", () => {
		it("should get multiple tags", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifiers = [
				{
					namespace: "enchantplus",
					registry: "tags/enchantment",
					resource: "exclusive_set/aspect"
				},
				{
					namespace: "minecraft",
					registry: "tags/enchantment",
					resource: "curse"
				}
			];

			const tags = datapack.getTags(identifiers, []);
			expect(tags.length).toBe(2);
			expect(tags[0].identifier.resource).toBe("exclusive_set/aspect");
			expect(tags[0].data.values).toContain("enchantplus:sword/poison_aspect");

			expect(tags[1].identifier.resource).toBe("curse");
			expect(tags[1].data.values).toContain("enchantplus:sword/poison_aspect");

			expect(tags).toBeInstanceOf(Array);
		});

		it("should get multiple tags and handle blacklist", () => {
			const datapack = new Datapack(enchantmentWithTagFiles);
			const identifiers = [
				{
					namespace: "enchantplus",
					registry: "tags/enchantment",
					resource: "exclusive_set/aspect"
				},
				{
					namespace: "minecraft",
					registry: "tags/enchantment",
					resource: "curse"
				}
			];

			const blacklist = ["enchantplus:sword/poison_aspect"];
			const tags = datapack.getTags(identifiers, blacklist);
			expect(tags.length).toBe(2);
			expect(tags[0].identifier.resource).toBe("exclusive_set/aspect");
			expect(tags[0].data.values.length).toBe(2);
			expect(tags[0].data.values).toContain("enchantplus:sword/attack_speed");
			expect(tags[0].data.values).toContain("enchantplus:sword/death_touch");

			expect(tags[1].identifier.resource).toBe("curse");
			expect(tags[1].data.values).toEqual([]);
		});
	});

	describe("getTag with complex values", () => {
		it("should handle optional tag values", () => {
			const datapack = new Datapack({
				...enchantmentWithTagFiles,
				"data/enchantplus/tags/enchantment/test.json": new TextEncoder().encode(
					JSON.stringify({
						values: [{ id: "minecraft:test", required: false }, "minecraft:simple"]
					})
				)
			});

			const tag = datapack.getTag({
				namespace: "enchantplus",
				registry: "tags/enchantment",
				resource: "test"
			});

			expect(tag.values).toHaveLength(2);
			expect(tag.values).toContainEqual({ id: "minecraft:test", required: false });
			expect(tag.values).toContainEqual("minecraft:simple");
		});
	});

	describe("Should Remove Attack Speed from Tags", () => {
		it("Shoud merge two DataDrivenRegistryElement<TagType>", () => {
			const a: DataDrivenRegistryElement<TagType>[] = [
				{
					identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
					data: { values: ["enchantplus:sword/attack_speed"] }
				},
				{
					identifier: { namespace: "yggdrasil", registry: "tags/enchantment", resource: "equipment/item/sword" },
					data: { values: ["enchantplus:sword/attack_speed"] }
				},
				{
					identifier: { namespace: "yggdrasil", registry: "tags/enchantment", resource: "structure/alfheim_tree/random_loot" },
					data: { values: ["enchantplus:sword/attack_speed"] }
				}
			];
			const b: DataDrivenRegistryElement<TagType>[] = [
				{
					identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/sword_attribute" },
					data: { values: ["enchantplus:sword/reach", "enchantplus:sword/runic_despair", "enchantplus:sword/dimensional_hit"] }
				},
				{
					identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
					data: { values: ["minecraft:fire_aspect"] }
				},
				{
					identifier: { namespace: "yggdrasil", registry: "tags/enchantment", resource: "equipment/item/sword" },
					data: { values: ["minecraft:fire_aspect"] }
				}
			];

			const merge = mergeDataDrivenRegistryElement(a, b);
			expect(merge.length).toBe(4);

			const non_treasure = merge.find((t) => t.identifier.resource === "non_treasure");
			expect(non_treasure?.data.values).toContain("enchantplus:sword/attack_speed");
			expect(non_treasure?.data.values).toContain("minecraft:fire_aspect");

			const sword_attribute = merge.find((t) => t.identifier.resource === "exclusive_set/sword_attribute");
			expect(sword_attribute?.data.values).toContain("enchantplus:sword/reach");
			expect(sword_attribute?.data.values).toContain("enchantplus:sword/runic_despair");
			expect(sword_attribute?.data.values).toContain("enchantplus:sword/dimensional_hit");

			const equipment_item_sword = merge.find((t) => t.identifier.resource === "equipment/item/sword");
			expect(equipment_item_sword?.data.values).toContain("enchantplus:sword/attack_speed");
			expect(equipment_item_sword?.data.values).toContain("minecraft:fire_aspect");

			const structure_alfheim_tree_random_loot = merge.find((t) => t.identifier.resource === "structure/alfheim_tree/random_loot");
			expect(structure_alfheim_tree_random_loot?.data.values).toContain("enchantplus:sword/attack_speed");
		});

		it("Should Remove Attack Speed from Tags", () => {
			const files = prepareFiles(enchantmentFile);
			const datapack = new Datapack(files);
			const { compiler } = analyserCollection.enchantment;
			const compiledElements = attack_speed_element.map((element) =>
				compiler(element, "enchantment", datapack.readFile(element.identifier))
			);
			const compiledTags = datapack.getCompiledTags(compiledElements, "enchantment");

			expect(compiledTags.length).toBe(4);
			const non_treasure = compiledTags.find((t) => t.identifier.resource === "non_treasure");
			expect(non_treasure?.data.values).toContain("enchantplus:sword/attack_speed");
			expect(non_treasure?.data.values).toContain("minecraft:fire_aspect");

			const equipment_item_sword = compiledTags.find((t) => t.identifier.resource === "equipment/item/sword");
			expect(equipment_item_sword?.data.values).toContain("enchantplus:sword/attack_speed");
			expect(equipment_item_sword?.data.values).toContain("minecraft:fire_aspect");

			const structure_alfheim_tree_random_loot = compiledTags.find(
				(t) => t.identifier.resource === "structure/alfheim_tree/random_loot"
			);
			expect(structure_alfheim_tree_random_loot?.data.values).toContain("enchantplus:sword/attack_speed");

			const exclusive_set_sword_attribute = compiledTags.find((t) => t.identifier.resource === "exclusive_set/sword_attribute");
			expect(exclusive_set_sword_attribute?.data.values).toContain("enchantplus:sword/reach");
			expect(exclusive_set_sword_attribute?.data.values).toContain("enchantplus:sword/runic_despair");
			expect(exclusive_set_sword_attribute?.data.values).toContain("enchantplus:sword/dimensional_hit");
		});
	});
});
