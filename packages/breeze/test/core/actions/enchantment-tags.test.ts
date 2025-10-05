import { describe, expect, it } from "vitest";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions/index";
import type { EnchantmentProps } from "@/core/schema/enchant/types";

describe("Enchantment Tags - CoreAction.removeTags", () => {
	it("should remove a tag from enchantment.tags array", () => {
		const enchantment: Partial<EnchantmentProps> = {
			tags: ["#minecraft:exclusive_set/armor", "#minecraft:treasure"]
		};

		const action = CoreAction.removeTags(["#minecraft:exclusive_set/armor"]);
		const updated = updateData(action, enchantment as Record<string, unknown>);

		expect(updated?.tags).toEqual(["#minecraft:treasure"]);
		expect(updated?.tags).not.toContain("#minecraft:exclusive_set/armor");
	});

	it("should handle removing multiple tags", () => {
		const enchantment: Partial<EnchantmentProps> = {
			tags: ["#minecraft:exclusive_set/armor", "#minecraft:treasure", "#minecraft:curse"]
		};

		const action = CoreAction.removeTags(["#minecraft:exclusive_set/armor", "#minecraft:treasure"]);
		const updated = updateData(action, enchantment as Record<string, unknown>);

		expect(updated?.tags).toEqual(["#minecraft:curse"]);
	});

	it("should not fail if tag doesn't exist", () => {
		const enchantment: Partial<EnchantmentProps> = {
			tags: ["#minecraft:treasure"]
		};

		const action = CoreAction.removeTags(["#minecraft:exclusive_set/armor"]);
		const updated = updateData(action, enchantment as Record<string, unknown>);

		expect(updated?.tags).toEqual(["#minecraft:treasure"]);
	});

	it("should result in empty array if all tags are removed", () => {
		const enchantment: Partial<EnchantmentProps> = {
			tags: ["#minecraft:exclusive_set/armor"]
		};

		const action = CoreAction.removeTags(["#minecraft:exclusive_set/armor"]);
		const updated = updateData(action, enchantment as Record<string, unknown>);

		expect(updated?.tags).toEqual([]);
	});
});
