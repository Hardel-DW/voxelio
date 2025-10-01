import { describe, expect, it } from "vitest";
import { Tags } from "@/core/Tag";
import { TagsProcessor } from "@/core/TagsProcessor";
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

	describe("getTagsFromRegistry", () => {
		it("should extract tag values from registry", () => {
			const tag: TagType = {
				values: ["minecraft:test", { id: "minecraft:optional", required: false }, "minecraft:other"]
			};

			const result = new Tags(tag).fromRegistry();
			expect(result).toEqual(["minecraft:test", "minecraft:optional", "minecraft:other"]);
		});
	});

	describe("hasValue with OptionalTag", () => {
		it("should find string value", () => {
			const tag: TagType = {
				values: ["minecraft:test1", { id: "minecraft:optional1", required: false }]
			};

			expect(new Tags(tag).hasValue("minecraft:test1")).toBe(true);
		});

		it("should find OptionalTag value", () => {
			const tag: TagType = {
				values: ["minecraft:test1", { id: "minecraft:optional1", required: false }]
			};

			expect(new Tags(tag).hasValue({ id: "minecraft:optional1", required: false })).toBe(true);
		});

		it("should return false for non-existent value", () => {
			const tag: TagType = {
				values: ["minecraft:test1"]
			};

			expect(new Tags(tag).hasValue("minecraft:non_existent")).toBe(false);
		});
	});

	describe("TagsProcessor.injectIds", () => {
		it("should inject IDs into tags", () => {
			const existingTags: DataDrivenRegistryElement<TagType>[] = [
				{
					identifier: { namespace: "test", registry: "tags/enchantment", resource: "group1" },
					data: { values: [] }
				},
				{
					identifier: { namespace: "test", registry: "tags/enchantment", resource: "group2" },
					data: { values: [] }
				}
			];

			const elementToTags = new Map([
				["test:first", [
					{ namespace: "test", registry: "tags/enchantment", resource: "group1" },
					{ namespace: "test", registry: "tags/enchantment", resource: "group2" }
				]],
				["test:second", [
					{ namespace: "test", registry: "tags/enchantment", resource: "group1" }
				]]
			]);

			const processor = new TagsProcessor(existingTags);
			const result = processor.injectIds(elementToTags);

			const group1 = result.find((tag) => tag.identifier.resource === "group1");
			expect(group1?.data.values).toContain("test:first");
			expect(group1?.data.values).toContain("test:second");

			const group2 = result.find((tag) => tag.identifier.resource === "group2");
			expect(group2?.data.values).toContain("test:first");
			expect(group2?.data.values).not.toContain("test:second");
		});
	});
});

describe("TagsProcessor", () => {
	describe("merge and flatten", () => {
		it("should merge tags from multiple datapacks and flatten references", () => {
			const merged = TagsProcessor.merge([
				{ id: "minecraft", tags: vanillaDatapackTags },
				{ id: "enchantplus", tags: customDatapackTags }
			]);

			const processor = new TagsProcessor(merged);
			const result = processor.flatten();

			expect(result).toHaveLength(4);

			const inEnchantingTable = result.find((tag) => tag.identifier.resource === "in_enchanting_table");
			expect(inEnchantingTable?.data.values).toContain("minecraft:sharpness");
			expect(inEnchantingTable?.data.values).toContain("enchantplus:bow/eternal_frost");
		});

		it("should handle replace property correctly", () => {
			const result = TagsProcessor.merge([
				{ id: "minecraft", tags: vanillaDatapackTags },
				{ id: "replacing", tags: replacingDatapackTags }
			]);

			expect(result).toHaveLength(3);
			const nonTreasure = result.find((tag) => tag.identifier.resource === "non_treasure");
			expect(nonTreasure?.data.values).toEqual(["enchantplus:custom_only"]);
		});
	});

	describe("merge without flattening", () => {
		it("should merge tags but keep references intact", () => {
			const result = TagsProcessor.merge([
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
			const firstOrder = TagsProcessor.merge([
				{ id: "vanilla", tags: vanillaDatapackTags },
				{ id: "custom", tags: customDatapackTags }
			]);

			const secondOrder = TagsProcessor.merge([
				{ id: "custom", tags: customDatapackTags },
				{ id: "vanilla", tags: vanillaDatapackTags }
			]);

			expect(firstOrder).not.toEqual(secondOrder);
		});
	});

	describe("complex tag flattening", () => {
		it("should flatten nested tag references correctly", () => {
			const merged = TagsProcessor.merge([
				{ id: "vanilla", tags: vanillaDatapackTags },
				{ id: "advanced", tags: advancedDatapackTags }
			]);

			const processor = new TagsProcessor(merged);
			const result = processor.flatten();

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

	describe("removeIds", () => {
		it("should remove IDs from tags", () => {
			const tags: DataDrivenRegistryElement<TagType>[] = [
				{
					identifier: { namespace: "test", registry: "tags/enchantment", resource: "group1" },
					data: { values: ["test:first", "test:second", "test:third"] }
				}
			];

			const processor = new TagsProcessor(tags);
			const result = processor.removeIds(new Set(["test:first", "test:third"]));

			const group1 = result.find((tag) => tag.identifier.resource === "group1");
			expect(group1?.data.values).toEqual(["test:second"]);
		});

		it("should remove OptionalTag by ID", () => {
			const tags: DataDrivenRegistryElement<TagType>[] = [
				{
					identifier: { namespace: "test", registry: "tags/enchantment", resource: "group1" },
					data: { values: ["test:first", { id: "test:optional", required: false }, "test:third"] }
				}
			];

			const processor = new TagsProcessor(tags);
			const result = processor.removeIds(new Set(["test:optional"]));

			const group1 = result.find((tag) => tag.identifier.resource === "group1");
			expect(group1?.data.values).toEqual(["test:first", "test:third"]);
		});
	});
});
