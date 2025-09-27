import { describe, expect, it } from "vitest";
import { Tags, tagsToIdentifiers, isTag, mergeTags, createTagFromElement, isRegistryTag } from "@/core/Tag";
import { TagCompiler } from "@/core/TagCompiler";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { Compiler } from "@/core/engine/Compiler";
import type { TagType } from "@/core/Tag";
import {
	vanillaDatapackTags,
	customDatapackTags,
	replacingDatapackTags,
	advancedDatapackTags
} from "@test/mock/tags/Enchantment";

describe("Tag Functions", () => {
	describe("isPresentInTag", () => {
		const tag: DataDrivenRegistryElement<TagType> = {
			identifier: {
				namespace: "minecraft",
				registry: "tags/enchantment",
				resource: "test"
			},
			data: {
				values: ["minecraft:test", { id: "minecraft:optional", required: false }, "minecraft:other"]
			}
		};

		it("should find string value in tag", () => {
			expect(new Tags(tag.data).isPresentInTag("minecraft:test")).toBe(true);
		});

		it("should find object value in tag", () => {
			expect(new Tags(tag.data).isPresentInTag("minecraft:optional")).toBe(true);
		});

		it("should return false for non-existent value", () => {
			expect(new Tags(tag.data).isPresentInTag("minecraft:non_existent")).toBe(false);
		});
	});

	describe("tagsToIdentifiers", () => {
		it("should convert tag strings to identifiers", () => {
			const tags = ["#minecraft:test", "#minecraft:other"];
			const registry = "tags/enchantment";
			const result = tagsToIdentifiers(tags, registry);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				namespace: "minecraft",
				registry: "tags/enchantment",
				resource: "test"
			});
		});

		it("should handle tags without # prefix", () => {
			const tags = ["minecraft:test"];
			const registry = "tags/enchantment";
			const result = tagsToIdentifiers(tags, registry);

			expect(result[0]).toEqual({
				namespace: "minecraft",
				registry: "tags/enchantment",
				resource: "test"
			});
		});
	});

	describe("getTagsFromRegistry", () => {
		it("should extract tag values from registry", () => {
			const tag: TagType = {
				values: ["minecraft:test", { id: "minecraft:optional", required: false }, "minecraft:other"]
			};

			const result = new Tags(tag).fromRegistry();
			expect(result).toEqual(["minecraft:test", "minecraft:optional", "minecraft:other"]);
		});
	});

	describe("isRegistryTag", () => {
		it("should identify tag elements", () => {
			const tagElement = {
				identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "test" },
				data: { values: [] }
			};
			expect(isRegistryTag(tagElement)).toBe(true);
		});

		it("should reject non-tag elements", () => {
			const nonTagElement = {
				identifier: { namespace: "minecraft", registry: "enchantment", resource: "test" },
				data: {}
			};
			expect(isRegistryTag(nonTagElement)).toBe(false);
		});

		it("should reject empty objects", () => {
			const nonTagElement = {};
			expect(isTag(nonTagElement)).toBe(false);
		});
	});

	describe("mergeTags", () => {
		it("should merge two tags", () => {
			const tag1: TagType = {
				values: ["minecraft:test1", { id: "minecraft:optional1", required: false }]
			};
			const tag2: TagType = {
				values: ["minecraft:test2", { id: "minecraft:optional2", required: true }]
			};

			const result = mergeTags(tag1, tag2);
			expect(result.values).toHaveLength(4);
			expect(result.values).toContainEqual("minecraft:test1");
			expect(result.values).toContainEqual({ id: "minecraft:optional1", required: false });
			expect(result.values).toContainEqual("minecraft:test2");
			expect(result.values).toContainEqual({ id: "minecraft:optional2", required: true });
		});
	});

	describe("createTagFromElement", () => {
		it("should create tags from compiler elements", () => {
			const elements: ReturnType<Compiler>[] = [
				{
					element: {
						identifier: { namespace: "test", registry: "enchantment", resource: "first" },
						data: {}
					},
					tags: [
						{ namespace: "test", registry: "tags/enchantment", resource: "group1" },
						{ namespace: "test", registry: "tags/enchantment", resource: "group2" },
						{ namespace: "test", registry: "tags/enchantment", resource: "group3" }
					]
				},
				{
					element: {
						identifier: { namespace: "test", registry: "enchantment", resource: "second" },
						data: {}
					},
					tags: [{ namespace: "test", registry: "tags/enchantment", resource: "group1" }]
				}
			];

			const result = createTagFromElement(elements);
			expect(result).toHaveLength(3);

			// Vérifier le premier tag (group1)
			const group1 = result.find((tag) => tag.identifier.resource === "group1");
			expect(group1).toBeDefined();
			expect(group1?.data.values).toContain("test:first");
			expect(group1?.data.values).toContain("test:second");

			// Vérifier le second tag (group2)
			const group2 = result.find((tag) => tag.identifier.resource === "group2");
			expect(group2).toBeDefined();
			expect(group2?.data.values).toContain("test:first");
			expect(group2?.data.values).not.toContain("test:second");
		});

		it("should handle empty elements array", () => {
			const result = createTagFromElement([]);
			expect(result).toHaveLength(0);
		});
	});
});

describe("TagCompiler", () => {
	describe("compile with flattening enabled", () => {
		it("should merge tags from multiple datapacks and flatten references", () => {
			const compiler = new TagCompiler(true);
			const result = compiler.compile([
				{ id: "minecraft", tags: vanillaDatapackTags },
				{ id: "enchantplus", tags: customDatapackTags }
			]);

			expect(result).toHaveLength(4);

			const inEnchantingTable = result.find((tag) => tag.identifier.resource === "in_enchanting_table");
			expect(inEnchantingTable?.data.values).toContain("minecraft:sharpness");
			expect(inEnchantingTable?.data.values).toContain("enchantplus:bow/eternal_frost");
		});

		it("should handle replace property correctly", () => {
			const compiler = new TagCompiler(false);
			const result = compiler.compile([
				{ id: "minecraft", tags: vanillaDatapackTags },
				{ id: "replacing", tags: replacingDatapackTags }
			]);

			expect(result).toHaveLength(3);
			const nonTreasure = result.find((tag) => tag.identifier.resource === "non_treasure");
			expect(nonTreasure?.data.values).toEqual(["enchantplus:custom_only"]);
		});
	});

	describe("compile without flattening", () => {
		it("should merge tags but keep references intact", () => {
			const compiler = new TagCompiler(false);
			const result = compiler.compile([
				{ id: "minecraft", tags: vanillaDatapackTags },
				{ id: "enchantplus", tags: customDatapackTags }
			]);

			const inEnchantingTable = result.find((tag) => tag.identifier.resource === "in_enchanting_table");
			expect(inEnchantingTable?.data.values).toContain("#minecraft:non_treasure");
			expect(inEnchantingTable?.data.values).toContain("enchantplus:bow/eternal_frost");
		});
	});

	describe("datapack loading order", () => {
		it("should respect datapack order - later datapacks have higher priority", () => {
			const compiler = new TagCompiler(false);

			const firstOrder = compiler.compile([
				{ id: "vanilla", tags: vanillaDatapackTags },
				{ id: "custom", tags: customDatapackTags }
			]);

			const secondOrder = compiler.compile([
				{ id: "custom", tags: customDatapackTags },
				{ id: "vanilla", tags: vanillaDatapackTags }
			]);

			expect(firstOrder).not.toEqual(secondOrder);
		});
	});

	describe("complex tag flattening", () => {
		it("should flatten nested tag references correctly", () => {
			const compiler = new TagCompiler(true);
			const result = compiler.compile([
				{ id: "vanilla", tags: vanillaDatapackTags },
				{ id: "advanced", tags: advancedDatapackTags }
			]);

			const inEnchantingTable = result.find((tag) => tag.identifier.resource === "in_enchanting_table");

			const expectedValues = [
				"minecraft:sharpness",
				"minecraft:unbreaking",
				"minecraft:efficiency",
				"enchantplus:bow/eternal_frost",
				"enchantplus:sword/lightning",
				"enchantplus:yay",
				"enchantplus:bow/flame_burst"
			];

			expect(inEnchantingTable?.data.values).toEqual(expect.arrayContaining(expectedValues));
			expect(inEnchantingTable?.data.values).toHaveLength(expectedValues.length);
		});
	});
});
