import { describe, expect, it } from "vitest";
import { extractUnknownFields, processElementTags, mergeKnownFields } from "@/core/schema/utils";

describe("Schema Utils", () => {
	describe("extractUnknownFields", () => {
		it("should extract unknown fields correctly", () => {
			const obj = {
				type: "test",
				id: "test_id",
				customField: "custom_value",
				anotherCustom: 123
			};
			const knownFields = new Set(["type", "id"]);

			const result = extractUnknownFields(obj, knownFields);

			expect(result).toEqual({
				customField: "custom_value",
				anotherCustom: 123
			});
		});

		it("should return undefined when no unknown fields", () => {
			const obj = {
				type: "test",
				id: "test_id"
			};
			const knownFields = new Set(["type", "id"]);

			const result = extractUnknownFields(obj, knownFields);

			expect(result).toBeUndefined();
		});
	});

	describe("processElementTags", () => {
		it("should return empty array for empty tags", () => {
			const result = processElementTags([], "enchantment");
			expect(result).toEqual([]);
		});

		it("should process tags correctly", () => {
			const tags = ["minecraft:test_tag"];
			const result = processElementTags(tags, "enchantment");

			expect(result).toHaveLength(1);
			expect(result[0].resource).toBe("test_tag");
			expect(result[0].registry).toBe("tags/enchantment");
			expect(result[0].namespace).toBe("minecraft");
		});
	});

	describe("mergeKnownFields", () => {
		it("should merge multiple sets correctly", () => {
			const set1 = new Set(["field1", "field2"]);
			const set2 = new Set(["field3", "field4"]);
			const set3 = new Set(["field2", "field5"]); // field2 is duplicate

			const result = mergeKnownFields(set1, set2, set3);

			expect(result).toEqual(new Set(["field1", "field2", "field3", "field4", "field5"]));
		});

		it("should handle empty sets", () => {
			const set1 = new Set(["field1"]);
			const set2 = new Set<string>();

			const result = mergeKnownFields(set1, set2);

			expect(result).toEqual(new Set(["field1"]));
		});
	});
});
