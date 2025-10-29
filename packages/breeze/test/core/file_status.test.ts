import { describe, it, expect } from "vitest";
import { FileStatusComparator, FILE_STATUS } from "@/core/FileStatusComparator";
import { createFilesFromElements } from "@test/mock/utils";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { Enchantment, EnchantmentProps } from "@/core/schema/enchant/types";
import { Logger } from "@/core/engine/migrations/logger";
import { createMockEnchantmentElement } from "@test/mock/enchant/VoxelDriven";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions";

const createSimpleEnchantment = (namespace: string, resource: string): EnchantmentProps =>
	createMockEnchantmentElement({
		identifier: { namespace, registry: "enchantment", resource },
		description: { translate: `enchantment.${namespace}.${resource}` }
	}).data;

describe("FileStatusComparator", () => {
	describe("ADDED status", () => {
		it("should detect newly added enchantment", () => {
			const originalFiles = createFilesFromElements([
				{
					identifier: { namespace: "test", registry: "enchantment", resource: "existing" },
					data: {
						description: { translate: "enchantment.test.existing" },
						anvil_cost: 1,
						max_level: 1,
						min_cost: { base: 1, per_level_above_first: 1 },
						max_cost: { base: 10, per_level_above_first: 1 },
						weight: 1,
						supported_items: "#minecraft:enchantable/sword",
						slots: ["mainhand"],
						effects: {}
					}
				}
			] as DataDrivenRegistryElement<Enchantment>[]);

			const elements = new Map();
			elements.set("test:existing$enchantment", createSimpleEnchantment("test", "existing"));
			elements.set("test:new_one$enchantment", createSimpleEnchantment("test", "new_one"));

			const logger = new Logger();
			const comparator = new FileStatusComparator(originalFiles, elements, logger);

			expect(comparator.getFileStatus("test:new_one$enchantment")).toBe(FILE_STATUS.ADDED);
		});
	});

	describe("UPDATED status", () => {
		it("should detect updated enchantment when tracked by logger", () => {
			const originalFiles = createFilesFromElements([
				{
					identifier: { namespace: "test", registry: "enchantment", resource: "modified" },
					data: {
						description: { translate: "enchantment.test.modified" },
						anvil_cost: 1,
						max_level: 1,
						min_cost: { base: 1, per_level_above_first: 1 },
						max_cost: { base: 10, per_level_above_first: 1 },
						weight: 1,
						supported_items: "#minecraft:enchantable/sword",
						slots: ["mainhand"],
						effects: {}
					}
				}
			] as DataDrivenRegistryElement<Enchantment>[]);

			const logger = new Logger();
			const enchantment = createSimpleEnchantment("test", "modified");
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 5), el));
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 3), el));
			logger.trackChanges(enchantment, (el) => updateData<EnchantmentProps>(CoreAction.setValue("maxLevel", 10), el));

			const elements = new Map().set("test:modified$enchantment", enchantment);
			const comparator = new FileStatusComparator(originalFiles, elements, logger);
			expect(comparator.getFileStatus("test:modified$enchantment")).toBe(FILE_STATUS.UPDATED);
		});
	});

	describe("UNCHANGED status", () => {
		it("should detect unchanged enchantment when not tracked by logger", () => {
			const originalFiles = createFilesFromElements([
				{
					identifier: { namespace: "test", registry: "enchantment", resource: "unchanged" },
					data: {
						description: { translate: "enchantment.test.unchanged" },
						anvil_cost: 1,
						max_level: 1,
						min_cost: { base: 1, per_level_above_first: 1 },
						max_cost: { base: 10, per_level_above_first: 1 },
						weight: 1,
						supported_items: "#minecraft:enchantable/sword",
						slots: ["mainhand"],
						effects: {}
					}
				}
			] as DataDrivenRegistryElement<Enchantment>[]);

			const logger = new Logger();
			const elements = new Map();
			elements.set("test:unchanged$enchantment", createSimpleEnchantment("test", "unchanged"));

			const comparator = new FileStatusComparator(originalFiles, elements, logger);
			expect(comparator.getFileStatus("test:unchanged$enchantment")).toBe(FILE_STATUS.UNCHANGED);
		});
	});

	// TODO: Add DELETED status test when element deletion is implemented in Breeze
	// Currently compileDatapack keeps all original files and only overwrites elements in the Map
	// describe("DELETED status", () => { ... });
});
