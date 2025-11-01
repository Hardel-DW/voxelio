import { describe, it, expect } from "vitest";
import { FileStatusComparator, FILE_STATUS } from "@/core/FileStatusComparator";
import { createFilesFromElements } from "@test/mock/utils";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { Enchantment, EnchantmentProps } from "@/core/schema/enchant/types";
import { Logger } from "@/core/engine/migrations/logger";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import { originalEnchantments } from "@test/mock/enchant";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions";
import { Identifier } from "@/core/Identifier";

const minimalId = new Identifier(originalEnchantments.minimal.identifier);
const unknownId = new Identifier(originalEnchantments.unknown.identifier);
const sharpnessId = new Identifier(originalEnchantments.sharpness.identifier);
const knockbackId = new Identifier(originalEnchantments.knockback.identifier);

describe("FileStatusComparator", () => {
	describe("ADDED status", () => {
		it("should detect newly added enchantment", () => {
			const originalFiles = createFilesFromElements([originalEnchantments.minimal] as DataDrivenRegistryElement<Enchantment>[]);
			const elements = new Map();
			elements.set(minimalId.toUniqueKey(), EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.minimal }));
			elements.set(unknownId.toUniqueKey(), EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.unknown }));

			const logger = new Logger();
			const comparator = new FileStatusComparator(originalFiles, elements, logger);
			expect(comparator.getFileStatus(unknownId.toUniqueKey())).toBe(FILE_STATUS.ADDED);
		});
	});

	describe("UPDATED status", () => {
		it("should detect updated enchantment when tracked by logger", () => {
			const originalFiles = createFilesFromElements([originalEnchantments.sharpness] as DataDrivenRegistryElement<Enchantment>[]);
			const logger = new Logger();
			const enchantment = EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.sharpness });
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 5), el));
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 3), el));
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 10), el));

			const elements = new Map().set(sharpnessId.toUniqueKey(), enchantment);
			const comparator = new FileStatusComparator(originalFiles, elements, logger);
			expect(comparator.getFileStatus(sharpnessId.toUniqueKey())).toBe(FILE_STATUS.UPDATED);
		});
	});

	describe("UNCHANGED status", () => {
		it("should detect unchanged enchantment when not tracked by logger", () => {
			const originalFiles = createFilesFromElements([originalEnchantments.knockback] as DataDrivenRegistryElement<Enchantment>[]);
			const logger = new Logger();
			const elements = new Map();
			elements.set(knockbackId.toUniqueKey(), EnchantmentDataDrivenToVoxelFormat({ element: originalEnchantments.knockback }));

			const comparator = new FileStatusComparator(originalFiles, elements, logger);
			expect(comparator.getFileStatus(knockbackId.toUniqueKey())).toBe(FILE_STATUS.UNCHANGED);
		});
	});

	// TODO: Add DELETED status test when element deletion is implemented in Breeze
	// Currently compileDatapack keeps all original files and only overwrites elements in the Map
	// describe("DELETED status", () => { ... });
});
