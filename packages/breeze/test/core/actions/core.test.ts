import { updateData } from "@/core/engine/actions";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { describe, expect, it, beforeEach } from "vitest";
import { createComplexMockElement, createMockEnchantmentElement } from "@test/mock/enchant/VoxelDriven";
import type { EnchantmentProps } from "@/core/schema/enchant/types";

describe("Action System", () => {
	let mockElement: ReturnType<typeof createMockEnchantmentElement>;
	let complexElement: ReturnType<typeof createComplexMockElement>;

	beforeEach(() => {
		mockElement = createMockEnchantmentElement();
		complexElement = createComplexMockElement();
	});

	describe("Core Domain Actions", () => {
		it("should set a value", () => {
			expect(mockElement.data.minCostBase).toBe(1);

			const actions = CoreAction.setValue("minCostBase", 20);

			const result = updateData(actions, mockElement.data, 48);
			expect(result).toBeDefined();
			expect(result?.minCostBase).toBe(20);
			expect(mockElement.data.minCostBase).toBe(1);
			expect(result).not.toBe(mockElement.data);
		});

		it("should toggle a value", () => {
			const element = createMockEnchantmentElement({ minCostBase: 5 });
			expect(element.data.minCostBase).toBe(5);

			const response = CoreAction.toggleValue("minCostBase", 5);

			const result = updateData(response, element.data, 48);
			expect(result).toBeDefined();
			expect(result?.minCostBase).toBeUndefined();
			expect(element.data.minCostBase).toBe(5);
			expect(result).not.toBe(element.data);
		});

		it("should set undefined", () => {
			const element = createMockEnchantmentElement({ minCostBase: 5 });
			expect(element.data.minCostBase).toBe(5);
			expect(element.data).toHaveProperty("minCostBase");

			const response = CoreAction.setUndefined("minCostBase");

			const result = updateData(response, element.data, 48);
			expect(result).toBeDefined();
			expect(result?.minCostBase).toBeUndefined();
			// set_undefined met la valeur à undefined mais garde la propriété
			expect(result).toHaveProperty("minCostBase");

			// Vérifie que l'objet original n'a pas changé
			expect(element.data.minCostBase).toBe(5);
			expect(element.data).toHaveProperty("minCostBase");
			expect(result).not.toBe(element.data);
		});

		it("should invert boolean values", () => {
			const element = createMockEnchantmentElement({
				isActive: true,
				isDisabled: false
			});

			// Vérifie l'état initial
			expect(element.data.isActive).toBe(true);
			expect(element.data.isDisabled).toBe(false);

			const response = CoreAction.invertBoolean("isActive");

			const result = updateData(response, element.data, 48);
			expect(result).toBeDefined();
			expect(result?.isActive).toBe(false);
			expect(result?.isDisabled).toBe(false); // Pas touché

			// Vérifie que l'objet original n'a pas changé
			expect(element.data.isActive).toBe(true);
			expect(element.data.isDisabled).toBe(false);
			expect(result).not.toBe(element.data);
		});

		it("should not change non-boolean values with invert_boolean", () => {
			const element = createMockEnchantmentElement({
				minCostBase: 10,
				description: "test"
			});

			const response = CoreAction.invertBoolean("minCostBase");

			const result = updateData(response, element.data, 48);
			expect(result).toBeDefined();
			expect(result?.minCostBase).toBe(10); // Pas changé car pas un boolean
			expect(result).toBe(element.data); // Même objet car pas de changement
		});
	});

	describe("Identifier Preservation", () => {
		it("should maintain Identifier instance through set_value", () => {
			const response = CoreAction.setValue("minCostBase", 5);

			const result = updateData(response, mockElement.data, 48);
			expect(result?.identifier).toBeDefined();
			expect(mockElement.data.identifier).toEqual(result?.identifier);
		});
	});

	describe("Complex Operations", () => {
		it("should handle nested path operations in objects", () => {
			expect(complexElement.data.identifier.namespace).toBe("enchantplus");
			expect(complexElement.data.identifier.resource).toBe("bow/accuracy_shot");

			const response = CoreAction.setValue("identifier.namespace", "modpack");
			const result = updateData(response, complexElement.data, 48);
			expect(result).toBeDefined();
			expect(result?.identifier?.namespace).toBe("modpack");
			expect(result?.identifier?.resource).toBe("bow/accuracy_shot");

			expect(complexElement.data.identifier.namespace).toBe("enchantplus");
			expect(result).not.toBe(complexElement.data);
		});

		it("should handle nested path operations in arrays", () => {
			expect(complexElement.data.effects).toBeDefined();
			expect(complexElement.data.effects?.["minecraft:projectile_spawned"]).toBeDefined();
			expect(Array.isArray(complexElement.data.effects?.["minecraft:projectile_spawned"])).toBe(true);

			const projectileSpawned = complexElement.data.effects?.["minecraft:projectile_spawned"] as any[];
			expect(projectileSpawned[0].effect.type).toBe("minecraft:run_function");
			expect(projectileSpawned[0].effect.function).toBe("enchantplus:actions/accuracy_shot/on_shoot");

			const response = CoreAction.setValue("effects.minecraft:projectile_spawned.0.effect.function", "modpack:new_function");
			const result = updateData(response, complexElement.data, 48);
			expect(result).toBeDefined();
			expect(result?.effects).toBeDefined();

			const resultProjectileSpawned = result?.effects?.["minecraft:projectile_spawned"] as any[];
			expect(resultProjectileSpawned[0].effect.function).toBe("modpack:new_function");
			expect(resultProjectileSpawned[0].effect.type).toBe("minecraft:run_function");
			expect(projectileSpawned[0].effect.function).toBe("enchantplus:actions/accuracy_shot/on_shoot");
			expect(result).not.toBe(complexElement.data);
		});

		it("should handle nested path operations with description", () => {
			expect(complexElement.data.description).toBeDefined();
			expect(typeof complexElement.data.description).toBe("object");
			expect(!Array.isArray(complexElement.data.description)).toBe(true);

			const description = complexElement.data.description as { translate: string; fallback: string };
			expect(description.translate).toBe("enchantment.test.foo");
			expect(description.fallback).toBe("Enchantment Test");

			const response = CoreAction.setValue("description.fallback", "New Test Description");
			const result = updateData(response, complexElement.data, 48);
			expect(result).toBeDefined();
			expect(result?.description).toBeDefined();
			expect(typeof result?.description).toBe("object");
			expect(!Array.isArray(result?.description)).toBe(true);

			const resultDescription = result?.description as { translate: string; fallback: string };
			expect(resultDescription.fallback).toBe("New Test Description");
			expect(resultDescription.translate).toBe("enchantment.test.foo");
			expect(description.fallback).toBe("Enchantment Test");
			expect(result).not.toBe(complexElement.data);
		});

		it("should handle array index operations", () => {
			expect(complexElement.data.exclusiveSet).toBeDefined();
			expect(Array.isArray(complexElement.data.exclusiveSet)).toBe(true);

			const exclusiveSet = complexElement.data.exclusiveSet as string[];
			expect(exclusiveSet[0]).toBe("minecraft:efficiency");
			expect(exclusiveSet[1]).toBe("minecraft:unbreaking");

			const response = CoreAction.setValue("exclusiveSet.1", "minecraft:mending");
			const result = updateData(response, complexElement.data, 48);
			expect(result).toBeDefined();
			expect(result?.exclusiveSet).toBeDefined();
			expect(Array.isArray(result?.exclusiveSet)).toBe(true);

			const resultExclusiveSet = result?.exclusiveSet as string[];
			expect(resultExclusiveSet[0]).toBe("minecraft:efficiency");
			expect(resultExclusiveSet[1]).toBe("minecraft:mending");
			expect(exclusiveSet[1]).toBe("minecraft:unbreaking");
			expect(result).not.toBe(complexElement.data);
		});
	});

	describe("Tags - CoreAction.removeTags", () => {
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
});
