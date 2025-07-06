import { analyserCollection } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import { Identifier } from "@/core/Identifier";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import type { Enchantment } from "@/schema/Enchantment";
import { DATA_DRIVEN_TEMPLATE_ENCHANTMENT, makeAdvancedEnchantment } from "@test/template/concept/enchant/DataDriven";
import { VOXEL_TEMPLATE_ENCHANTMENT } from "@test/template/concept/enchant/VoxelDriven";
import { describe, it, expect, beforeEach } from "vitest";

describe("Enchantment Schema", () => {
    describe("Voxel Element to Data Driven", () => {
        const simpleVoxelElement = VOXEL_TEMPLATE_ENCHANTMENT[0];
        const onlyCreativeVoxelElement = VOXEL_TEMPLATE_ENCHANTMENT[1];
        const softDeleteVoxelElement = VOXEL_TEMPLATE_ENCHANTMENT[2];
        const dataDrivenEnchantment = DATA_DRIVEN_TEMPLATE_ENCHANTMENT[0];

        describe("Should be defined", () => {
            it("should be defined", () => {
                expect(simpleVoxelElement).toBeDefined();
            });

            it("should have an identifier", () => {
                expect(simpleVoxelElement.identifier).toBeDefined();
            });

            it("should have a data", () => {
                expect(simpleVoxelElement.data).toBeDefined();
            });

            it("should have a description", () => {
                expect(simpleVoxelElement.data.description).toBeDefined();
            });
        });

        describe("Should Compile", () => {
            it("should compile", () => {
                const { compiler } = analyserCollection.enchantment;
                const compiled = compiler(simpleVoxelElement.data, "enchantment");
                expect(compiled).toBeDefined();
            });

            describe("Simple Data Driven Compilation", () => {
                let compiled: ReturnType<Compiler<EnchantmentProps, Enchantment>>;

                beforeEach(() => {
                    const { compiler } = analyserCollection.enchantment;
                    compiled = compiler(simpleVoxelElement.data, "enchantment", dataDrivenEnchantment.data);
                });

                it("should compile with data driven enchantment", () => {
                    expect(compiled).toBeDefined();
                });

                it("All required fields are defined", () => {
                    expect(compiled.element.data.description).toBeDefined();
                    expect(compiled.element.data.exclusive_set).toBeDefined();
                    expect(compiled.element.data.supported_items).toBeDefined();
                    expect(compiled.element.data.weight).toBeDefined();
                    expect(compiled.element.data.max_level).toBeDefined();
                    expect(compiled.element.data.min_cost).toBeDefined();
                    expect(compiled.element.data.max_cost).toBeDefined();
                    expect(compiled.element.data.slots).toBeDefined();
                    expect(compiled.element.data.effects).toBeDefined();

                    expect(compiled.element.data.slots).toBeInstanceOf(Array);
                    expect(compiled.element.data.weight).toBe(2);
                    expect(compiled.element.data.max_level).toBe(1);
                    expect(compiled.element.data.min_cost).toBeInstanceOf(Object);
                    expect(compiled.element.data.max_cost).toBeInstanceOf(Object);
                    expect(compiled.element.data.min_cost.base).toBe(20);
                    expect(compiled.element.data.min_cost.per_level_above_first).toBe(9);
                    expect(compiled.element.data.max_cost.base).toBe(65);
                    expect(compiled.element.data.max_cost.per_level_above_first).toBe(9);
                    expect(compiled.element.data.effects).toEqual(expect.any(Object));
                });

                it("should have effects defined", () => {
                    expect(compiled.element.data.effects).toBeDefined();
                });

                it("should contain projectile_spawned effect", () => {
                    expect(Object.keys(compiled.element.data.effects as any)).toContain("minecraft:projectile_spawned");
                });

                it("should have correct exclusive set tag", () => {
                    expect(
                        compiled.tags.find((tag) =>
                            new Identifier(tag).equalsObject(Identifier.of("enchantplus:exclusive_set/bow", "tags/enchantment"))
                        )
                    ).toBeDefined();
                });

                it("should not contain damage effect", () => {
                    expect(Object.keys(compiled.element.data.effects as any).find((key) => key === "minecraft:damage")).toBeUndefined();
                });
            });

            describe("Only Creative Compilation", () => {
                let compiled: ReturnType<Compiler<EnchantmentProps, Enchantment>>;

                beforeEach(() => {
                    const { compiler } = analyserCollection.enchantment;
                    compiled = compiler(onlyCreativeVoxelElement.data, "enchantment");
                });

                it("should compile with data driven enchantment", () => {
                    expect(compiled).toBeDefined();
                });

                it("Should remove all unfunctional tags to the elements", () => {
                    expect(
                        compiled.tags.find((tag) =>
                            new Identifier(tag).equalsObject(Identifier.of("minecraft:double_trade_price", "tags/enchantment"))
                        )
                    ).toBeUndefined();
                    expect(
                        compiled.tags.find((tag) =>
                            new Identifier(tag).equalsObject(Identifier.of("minecraft:prevents_bee_spawns_when_mining", "tags/enchantment"))
                        )
                    ).toBeUndefined();
                });
            });

            describe("Soft Delete Compilation", () => {
                let compiled: ReturnType<Compiler<EnchantmentProps, Enchantment>>;

                beforeEach(() => {
                    const { compiler } = analyserCollection.enchantment;
                    compiled = compiler(softDeleteVoxelElement.data, "enchantment");
                });

                it("should compile with data driven enchantment", () => {
                    expect(compiled).toBeDefined();
                });

                it("should have correct exclusive set tag", () => {
                    expect(compiled.tags).toEqual([]);
                    expect(compiled.element.data.exclusiveSet).toBeUndefined();
                    expect(compiled.element.data.effects).toBeUndefined();
                });
            });
        });
    });

    describe("Data Driven to Voxel Element", () => {
        it("should compile", () => {
            const dataDrivenEnchantment = DATA_DRIVEN_TEMPLATE_ENCHANTMENT[0];

            const { parser } = analyserCollection.enchantment;
            const compiled = parser({ element: dataDrivenEnchantment });
            expect(compiled).toBeDefined();
        });

        describe("Should Determine Mode", () => {
            it("Should be soft delete", () => {
                const dataDrivenEnchantment = makeAdvancedEnchantment({
                    tags: [],
                    exclusiveSet: undefined,
                    effects: {}
                });

                const { parser } = analyserCollection.enchantment;
                const compiled = parser({ element: dataDrivenEnchantment });
                expect(compiled).toBeDefined();
                expect(compiled.mode).toBe("soft_delete");
            });

            it("Should be only creative", () => {
                const dataDrivenEnchantment = makeAdvancedEnchantment({
                    tags: ["minecraft:curse", "minecraft:double_trade_price", "minecraft:prevents_bee_spawns_when_mining"],
                    effects: {
                        "minecraft:damage": [
                            {
                                effect: {
                                    type: "minecraft:add",
                                    value: 5
                                }
                            }
                        ]
                    }
                });

                const { parser } = analyserCollection.enchantment;
                const compiled = parser({ element: dataDrivenEnchantment });
                expect(compiled).toBeDefined();
                expect(compiled.mode).toBe("only_creative");
            });

            it("Should be only creative even with exclusive set", () => {
                const dataDrivenEnchantment = makeAdvancedEnchantment({
                    tags: ["minecraft:curse", "minecraft:double_trade_price", "minecraft:prevents_bee_spawns_when_mining"],
                    exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
                    effects: {
                        "minecraft:damage": [
                            {
                                effect: {
                                    type: "minecraft:add",
                                    value: 5
                                }
                            }
                        ]
                    }
                });

                const { parser } = analyserCollection.enchantment;
                const compiled = parser({ element: dataDrivenEnchantment });
                expect(compiled).toBeDefined();
                expect(compiled.mode).toBe("only_creative");
            });

            it("Should be soft delete even with exclusive set", () => {
                const dataDrivenEnchantment = makeAdvancedEnchantment({
                    tags: [],
                    exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
                    effects: {}
                });

                const { parser } = analyserCollection.enchantment;
                const compiled = parser({ element: dataDrivenEnchantment });
                expect(compiled).toBeDefined();
                expect(compiled.mode).toBe("soft_delete");
            });
        });
    });
});
