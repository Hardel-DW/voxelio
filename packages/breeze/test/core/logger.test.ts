import { Logger } from "@/core/engine/migrations/logger";
import { updateData } from "@/core/engine/actions";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/concept/enchant";
import { describe, expect, it } from "vitest";

describe("Logger", () => {
	describe("trackChanges", () => {
		it("should generate minimal patch when setting a value", () => {
			const logger = new Logger();
			const element = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.attack_speed });
			const updated = logger.trackChanges(element, (el) => updateData(CoreAction.setValue("maxLevel", 10), el));
			const changeSets = logger.getChangeSets();
			expect(changeSets).toHaveLength(1);
			expect(changeSets[0].patch).toHaveLength(1);
			expect(changeSets[0].patch[0]).toEqual({ op: "replace", path: "/maxLevel", value: 10 });
			expect(updated.maxLevel).toBe(10);
		});

		it("should generate remove patch when deleting a key with setUndefined", () => {
			const logger = new Logger();
			const element = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.attack_speed });
			expect(element.exclusiveSet).toBe("#enchantplus:exclusive_set/sword_attribute");

			const updated = logger.trackChanges(element, (el) => updateData(CoreAction.setUndefined("exclusiveSet"), el));
			const changeSets = logger.getChangeSets();
			expect(changeSets).toHaveLength(1);
			expect(changeSets[0].patch).toHaveLength(1);
			expect(changeSets[0].patch[0]).toEqual({ op: "remove", path: "/exclusiveSet" });
			expect(updated.exclusiveSet).toBeUndefined();
			expect("exclusiveSet" in updated).toBe(false);
		});

		it("should preserve key order and generate minimal patch", () => {
			const logger = new Logger();
			const element = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.attack_speed });
			const originalKeys = Object.keys(element);
			const updated = logger.trackChanges(element, (el) => updateData(CoreAction.setValue("maxLevel", 10), el));
			const updatedKeys = Object.keys(updated);
			expect(updatedKeys).toEqual(originalKeys);
		});

		it("should preserve key order when deleting a key", () => {
			const logger = new Logger();
			const element = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.attack_speed });
			const originalKeys = Object.keys(element).filter((k) => k !== "exclusiveSet");
			const updated = logger.trackChanges(element, (el) => updateData(CoreAction.setUndefined("exclusiveSet"), el));
			const updatedKeys = Object.keys(updated);
			expect(updatedKeys).toEqual(originalKeys);
		});
	});
});
