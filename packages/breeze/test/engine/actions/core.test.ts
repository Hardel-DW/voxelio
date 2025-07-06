import { updateData } from "@/core/engine/actions";
import type { CoreAction } from "@/core/engine/actions/domains/core/types";
import { describe, expect, it, beforeEach } from "vitest";
import { createComplexMockElement, createMockEnchantmentElement } from "@test/template/concept/enchant/VoxelDriven";

describe("Action System", () => {
    let mockElement: ReturnType<typeof createMockEnchantmentElement>;
    let complexElement: ReturnType<typeof createComplexMockElement>;

    beforeEach(() => {
        mockElement = createMockEnchantmentElement();
        complexElement = createComplexMockElement();
    });

    describe("Core Domain Actions", () => {
        it("should set a value", async () => {
            expect(mockElement.data.minCostBase).toBe(1);

            const action: CoreAction = {
                type: "core.set_value",
                path: "minCostBase",
                value: 20
            };

            const result = await updateData(action, mockElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBe(20);
            expect(mockElement.data.minCostBase).toBe(1);
            expect(result).not.toBe(mockElement.data);
        });

        it("should toggle a value", async () => {
            const element = createMockEnchantmentElement({ minCostBase: 5 });
            expect(element.data.minCostBase).toBe(5);

            const action: CoreAction = {
                type: "core.toggle_value",
                path: "minCostBase",
                value: 5
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBeUndefined();
            expect(element.data.minCostBase).toBe(5);
            expect(result).not.toBe(element.data);
        });

        it("should set undefined", async () => {
            const element = createMockEnchantmentElement({ minCostBase: 5 });
            expect(element.data.minCostBase).toBe(5);
            expect(element.data).toHaveProperty("minCostBase");

            const action: CoreAction = {
                type: "core.set_undefined",
                path: "minCostBase"
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBeUndefined();
            // set_undefined met la valeur à undefined mais garde la propriété
            expect(result).toHaveProperty("minCostBase");

            // Vérifie que l'objet original n'a pas changé
            expect(element.data.minCostBase).toBe(5);
            expect(element.data).toHaveProperty("minCostBase");
            expect(result).not.toBe(element.data);
        });

        it("should execute sequential actions", async () => {
            const element = createMockEnchantmentElement({ min_cost: 1 });
            expect(element.data.min_cost).toBe(1);
            expect(element.data.maxCostBase).toBe(10);
            expect(element.data).not.toHaveProperty("max_cost");

            const action: CoreAction = {
                type: "core.sequential",
                actions: [
                    {
                        type: "core.set_value",
                        path: "min_cost",
                        value: 5
                    },
                    {
                        type: "core.set_value",
                        path: "max_cost",
                        value: 10
                    }
                ]
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.min_cost).toBe(5);
            expect(result?.max_cost).toBe(10);

            // Vérifie que l'objet original n'a pas changé
            expect(element.data.min_cost).toBe(1);
            expect(element.data.maxCostBase).toBe(10);
            expect(element.data).not.toHaveProperty("max_cost");
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative actions with boolean condition", async () => {
            const element = createMockEnchantmentElement({ minCostBase: 10 });

            // Vérifie l'état initial
            expect(element.data.minCostBase).toBe(10);

            const action: CoreAction = {
                type: "core.alternative",
                condition: true,
                ifTrue: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 20
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 5
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBe(20);
            expect(result?.minCostBase).not.toBe(5); // Vérifie que ifFalse n'a pas été exécuté

            // Vérifie que l'objet original n'a pas changé
            expect(element.data.minCostBase).toBe(10);
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative actions with false condition", async () => {
            const element = createMockEnchantmentElement({ minCostBase: 10 });

            const action: CoreAction = {
                type: "core.alternative",
                condition: false,
                ifTrue: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 20
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 5
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBe(5); // ifFalse exécuté
            expect(element.data.minCostBase).toBe(10);
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative actions without ifFalse", async () => {
            const element = createMockEnchantmentElement({ minCostBase: 10 });

            const action: CoreAction = {
                type: "core.alternative",
                condition: false,
                ifTrue: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 20
                }
                // Pas de ifFalse
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBe(10); // Pas de changement
            expect(result).toStrictEqual(element.data); // Même objet retourné
        });

        it("should handle alternative with if_field_is_undefined condition", async () => {
            const element = createMockEnchantmentElement({
                minCostBase: 10
                // weight equal 1 in default element
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.weight === undefined,
                ifTrue: {
                    type: "core.set_value",
                    path: "weight",
                    value: 5
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "weight",
                    value: 10
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.weight).toBe(10); // weight était undefined donc ifFalse
            expect(element.data.weight).toBe(1);
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative with compare_value_to_field_value condition", async () => {
            const element = createMockEnchantmentElement({
                minCostBase: 10,
                maxCostBase: 20
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.minCostBase === element.data.maxCostBase,
                ifTrue: {
                    type: "core.set_value",
                    path: "balanced",
                    value: true
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "balanced",
                    value: false
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.balanced).toBe(false); // 10 != 20
            expect(element.data.balanced).toBeUndefined();
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative with all_of condition", async () => {
            const element = createMockEnchantmentElement({
                weight: 10,
                mode: "normal"
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.weight === 10 && element.data.mode === "normal",
                ifTrue: {
                    type: "core.set_value",
                    path: "weight",
                    value: 5
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "weight",
                    value: 9
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.weight).toBe(5);
            expect(element.data.weight).toBe(10);
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative with any_of condition", async () => {
            const element = createMockEnchantmentElement({
                weight: 5,
                mode: "only_creative"
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.weight === 10 || element.data.mode === "only_creative",
                ifTrue: {
                    type: "core.set_value",
                    path: "mode",
                    value: "normal"
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "mode",
                    value: "soft_delete"
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.mode).toBe("normal");
            expect(element.data.mode).toBe("only_creative");
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative with inverted condition", async () => {
            const element = createMockEnchantmentElement({
                mode: "normal"
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.mode !== "only_creative",
                ifTrue: {
                    type: "core.set_value",
                    path: "notCreative",
                    value: true
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "notCreative",
                    value: false
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.notCreative).toBe(true); // NOT(mode=creative) = NOT(false) = true
            expect(element.data.notCreative).toBeUndefined();
            expect(result).not.toBe(element.data);
        });

        it("should handle alternative with contains condition", async () => {
            const element = createMockEnchantmentElement({
                tags: ["minecraft:curse", "minecraft:rare"]
            });

            const action: CoreAction = {
                type: "core.alternative",
                condition: element.data.tags.includes("minecraft:curse"),
                ifTrue: {
                    type: "core.set_value",
                    path: "isCurse",
                    value: true
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "isCurse",
                    value: false
                }
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.isCurse).toBe(true); // tags contient "minecraft:curse"
            expect(element.data.isCurse).toBeUndefined();
            expect(result).not.toBe(element.data);
        });

        it("should invert boolean values", async () => {
            const element = createMockEnchantmentElement({
                isActive: true,
                isDisabled: false
            });

            // Vérifie l'état initial
            expect(element.data.isActive).toBe(true);
            expect(element.data.isDisabled).toBe(false);

            const action: CoreAction = {
                type: "core.invert_boolean",
                path: "isActive"
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.isActive).toBe(false);
            expect(result?.isDisabled).toBe(false); // Pas touché

            // Vérifie que l'objet original n'a pas changé
            expect(element.data.isActive).toBe(true);
            expect(element.data.isDisabled).toBe(false);
            expect(result).not.toBe(element.data);
        });

        it("should not change non-boolean values with invert_boolean", async () => {
            const element = createMockEnchantmentElement({
                minCostBase: 10,
                description: "test"
            });

            const action: CoreAction = {
                type: "core.invert_boolean",
                path: "minCostBase"
            };

            const result = await updateData(action, element.data, 48);
            expect(result).toBeDefined();
            expect(result?.minCostBase).toBe(10); // Pas changé car pas un boolean
            expect(result).toBe(element.data); // Même objet car pas de changement
        });
    });

    describe("Identifier Preservation", () => {
        it("should maintain Identifier instance through set_value", async () => {
            const action: CoreAction = {
                type: "core.set_value",
                path: "minCostBase",
                value: 5
            };

            const result = await updateData(action, mockElement.data, 48);
            expect(result?.identifier).toBeDefined();
            expect(mockElement.data.identifier).toEqual(result?.identifier);
        });

        it("should maintain Identifier instance through sequential actions", async () => {
            const action: CoreAction = {
                type: "core.sequential",
                actions: [
                    {
                        type: "core.set_value",
                        path: "minCostBase",
                        value: 5
                    },
                    {
                        type: "core.set_undefined",
                        path: "maxCostBase"
                    }
                ]
            };

            const result = await updateData(action, mockElement.data, 48);
            expect(result?.identifier).toBeDefined();
            expect(mockElement.data.identifier).toEqual(result?.identifier);
        });

        it("should maintain Identifier instance through alternative actions", async () => {
            const action: CoreAction = {
                type: "core.alternative",
                condition: false,
                ifTrue: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 20
                },
                ifFalse: {
                    type: "core.set_value",
                    path: "minCostBase",
                    value: 5
                }
            };

            const result = await updateData(action, mockElement.data, 48);
            expect(result?.identifier).toBeDefined();
            expect(mockElement.data.identifier).toEqual(result?.identifier);
        });
    });

    describe("Complex Operations", () => {
        it("should handle nested path operations in objects", async () => {
            // Test modification d'un objet imbriqué
            expect(complexElement.data.identifier.namespace).toBe("enchantplus");
            expect(complexElement.data.identifier.resource).toBe("bow/accuracy_shot");

            const action: CoreAction = {
                type: "core.set_value",
                path: "identifier.namespace",
                value: "modpack"
            };

            const result = await updateData(action, complexElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.identifier?.namespace).toBe("modpack");
            expect(result?.identifier?.resource).toBe("bow/accuracy_shot"); // Pas touché

            // Vérifie que l'objet original n'a pas changé
            expect(complexElement.data.identifier.namespace).toBe("enchantplus");
            expect(result).not.toBe(complexElement.data);
        });

        it("should handle nested path operations in arrays", async () => {
            expect(complexElement.data.effects).toBeDefined();
            expect(complexElement.data.effects?.["minecraft:projectile_spawned"]).toBeDefined();
            expect(Array.isArray(complexElement.data.effects?.["minecraft:projectile_spawned"])).toBe(true);

            const projectileSpawned = complexElement.data.effects?.["minecraft:projectile_spawned"] as any[];
            expect(projectileSpawned[0].effect.type).toBe("minecraft:run_function");
            expect(projectileSpawned[0].effect.function).toBe("enchantplus:actions/accuracy_shot/on_shoot");

            const action: CoreAction = {
                type: "core.set_value",
                path: "effects.minecraft:projectile_spawned.0.effect.function",
                value: "modpack:new_function"
            };

            const result = await updateData(action, complexElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.effects).toBeDefined();

            const resultProjectileSpawned = result?.effects?.["minecraft:projectile_spawned"] as any[];
            expect(resultProjectileSpawned[0].effect.function).toBe("modpack:new_function");
            expect(resultProjectileSpawned[0].effect.type).toBe("minecraft:run_function"); // Pas touché

            // Vérifie que l'objet original n'a pas changé
            expect(projectileSpawned[0].effect.function).toBe("enchantplus:actions/accuracy_shot/on_shoot");
            expect(result).not.toBe(complexElement.data);
        });

        it("should handle nested path operations with description", async () => {
            // Test modification d'un objet de description
            expect(complexElement.data.description).toBeDefined();
            expect(typeof complexElement.data.description).toBe("object");
            expect(!Array.isArray(complexElement.data.description)).toBe(true);

            const description = complexElement.data.description as { translate: string; fallback: string };
            expect(description.translate).toBe("enchantment.test.foo");
            expect(description.fallback).toBe("Enchantment Test");

            const action: CoreAction = {
                type: "core.set_value",
                path: "description.fallback",
                value: "New Test Description"
            };

            const result = await updateData(action, complexElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.description).toBeDefined();

            expect(typeof result?.description).toBe("object");
            expect(!Array.isArray(result?.description)).toBe(true);

            const resultDescription = result?.description as { translate: string; fallback: string };
            expect(resultDescription.fallback).toBe("New Test Description");
            expect(resultDescription.translate).toBe("enchantment.test.foo"); // Pas touché

            // Vérifie que l'objet original n'a pas changé
            expect(description.fallback).toBe("Enchantment Test");
            expect(result).not.toBe(complexElement.data);
        });

        it("should handle array index operations", async () => {
            // Test modification d'un élément spécifique dans un array
            expect(complexElement.data.exclusiveSet).toBeDefined();
            expect(Array.isArray(complexElement.data.exclusiveSet)).toBe(true);

            const exclusiveSet = complexElement.data.exclusiveSet as string[];
            expect(exclusiveSet[0]).toBe("minecraft:efficiency");
            expect(exclusiveSet[1]).toBe("minecraft:unbreaking");

            const action: CoreAction = {
                type: "core.set_value",
                path: "exclusiveSet.1",
                value: "minecraft:mending"
            };

            const result = await updateData(action, complexElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.exclusiveSet).toBeDefined();
            expect(Array.isArray(result?.exclusiveSet)).toBe(true);

            const resultExclusiveSet = result?.exclusiveSet as string[];
            expect(resultExclusiveSet[0]).toBe("minecraft:efficiency"); // Pas touché
            expect(resultExclusiveSet[1]).toBe("minecraft:mending"); // Modifié
            expect(exclusiveSet[1]).toBe("minecraft:unbreaking");
            expect(result).not.toBe(complexElement.data);
        });

        it("should chain multiple complex operations", async () => {
            // Vérifie l'état initial
            expect(complexElement.data.weight).toBe(2);
            expect(complexElement.data.exclusive).toBeUndefined();
            expect(complexElement.data.deprecated_field).toBeUndefined();

            const action: CoreAction = {
                type: "core.sequential",
                actions: [
                    {
                        type: "core.set_value",
                        path: "weight",
                        value: 5
                    },
                    {
                        type: "core.toggle_value",
                        path: "exclusive",
                        value: true
                    },
                    {
                        type: "core.set_undefined",
                        path: "deprecated_field"
                    }
                ]
            };

            const result = await updateData(action, complexElement.data, 48);
            expect(result).toBeDefined();
            expect(result?.weight).toBe(5);
            expect(result?.exclusive).toBe(true); // toggle_value ajoute la valeur si elle n'existe pas
            expect(result?.deprecated_field).toBeUndefined(); // set_undefined met à undefined
            expect(result?.identifier).toBeDefined();
            expect(complexElement.data.identifier).toEqual(result?.identifier);

            // Vérifie que l'objet original n'a pas changé
            expect(complexElement.data.weight).toBe(2);
            expect(complexElement.data.exclusive).toBeUndefined();
            expect(result).not.toBe(complexElement.data);
        });
    });
});
