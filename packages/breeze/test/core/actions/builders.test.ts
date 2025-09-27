import { updateData } from "@/core/engine/actions";
import { Actions } from "@/core/engine/actions/builders/CoreActionBuilder";
import { LootTableActionBuilder } from "@/core/engine/actions/builders/LootTableActionBuilder";
import { RecipeActionBuilder } from "@/core/engine/actions/builders/RecipeActionBuilder";
import type { CoreAction } from "@/core/engine/actions/domains/core/types";
import { describe, it, expect } from "vitest";

describe("Action Builders", () => {
	describe("Core Actions Builder", () => {
		it("should create setValue action", () => {
			const built = new Actions().setValue("test.path", 42).build();

			expect(built).toEqual({
				type: "core.set_value",
				path: "test.path",
				value: 42
			});
		});

		it("should create toggleValue action", () => {
			const built = new Actions().toggleValue("enabled", true).build();

			expect(built).toEqual({
				type: "core.toggle_value",
				path: "enabled",
				value: true
			});
		});

		it("should create sequential action", () => {
			const built = new Actions().sequential(new Actions().setValue("a", 1), new Actions().setValue("b", 2)).build();

			expect(built).toEqual({
				type: "core.sequential",
				actions: [
					{ type: "core.set_value", path: "a", value: 1 },
					{ type: "core.set_value", path: "b", value: 2 }
				]
			});
		});

		it("should create alternative action with then/else", () => {
			const condition = true;
			const built = new Actions()
				.alternative(condition)
				.ifTrue(new Actions().setValue("success", true))
				.ifFalse(new Actions().setValue("success", false))
				.build();

			expect(built).toEqual({
				type: "core.alternative",
				condition: true,
				ifTrue: { type: "core.set_value", path: "success", value: true },
				ifFalse: { type: "core.set_value", path: "success", value: false }
			});
		});

		it("should work with actual updateData", async () => {
			const element = { test: 0 };
			const action = new Actions().setValue("test", 42);

			const result = await updateData(action.build(), element, 48);

			expect(result?.test).toBe(42);
			expect(element.test).toBe(0); // Original unchanged
		});
	});

	describe("LootTable Actions Builder", () => {
		it("should create addItem action with fluent API", () => {
			const action = new LootTableActionBuilder()
				.addItem(0)
				.name("minecraft:diamond")
				.weight(10)
				.quality(5)
				.conditions("minecraft:random_chance")
				.functions("minecraft:set_count");

			const built = action.build();

			expect(built).toEqual({
				type: "loot_table.add_loot_item",
				poolIndex: 0,
				item: {
					name: "minecraft:diamond",
					weight: 10,
					quality: 5,
					conditions: ["minecraft:random_chance"],
					functions: ["minecraft:set_count"]
				}
			});
		});

		it("should create modifyItem action", () => {
			const action = new LootTableActionBuilder().modifyItem("item_1").weight(15);

			const built = action.build();

			expect(built).toEqual({
				type: "loot_table.modify_loot_item",
				itemId: "item_1",
				property: "weight",
				value: 15
			});
		});

		it("should create createGroup action", () => {
			const action = new LootTableActionBuilder().createGroup("alternatives", 0).items("item_1", "item_2").entryIndex(2);

			const built = action.build();

			expect(built).toEqual({
				type: "loot_table.create_loot_group",
				groupType: "alternatives",
				itemIds: ["item_1", "item_2"],
				poolIndex: 0,
				entryIndex: 2
			});
		});

		it("should throw error when required fields missing", () => {
			const action = new LootTableActionBuilder().addItem(0); // No name set

			expect(() => action.build()).toThrow("Item name is required");
		});
	});

	describe("Recipe Actions Builder", () => {
		it("should create addIngredient action", () => {
			const action = new RecipeActionBuilder()
				.addIngredient("0")
				.items("minecraft:iron_ingot", "minecraft:gold_ingot")
				.replaceExisting();

			const built = action.build();

			expect(built).toEqual({
				type: "recipe.add_ingredient",
				slot: "0",
				items: ["minecraft:iron_ingot", "minecraft:gold_ingot"],
				replace: true
			});
		});

		it("should create convertType action", () => {
			const action = new RecipeActionBuilder().convertType("minecraft:smelting").clearIngredients();

			const built = action.build();

			expect(built).toEqual({
				type: "recipe.convert_recipe_type",
				newType: "minecraft:smelting",
				preserveIngredients: false
			});
		});
	});

	describe("JSON Compatibility", () => {
		it("should convert builder to JSON", () => {
			const action = new Actions().setValue("test", 123);
			const json = action.toJSON();

			expect(json).toEqual({
				type: "core.set_value",
				path: "test",
				value: 123
			});
		});

		it("should accept JSON actions in sequential", () => {
			const jsonAction: CoreAction = { type: "core.set_value", path: "json", value: 1 };
			const builderAction = new Actions().setValue("builder", 2);
			const sequential = new Actions().sequential(jsonAction, builderAction);
			const built = sequential.build();

			expect(built.actions).toEqual([
				{ type: "core.set_value", path: "json", value: 1 },
				{ type: "core.set_value", path: "builder", value: 2 }
			]);
		});

		it("should work with Condition objects", () => {
			const element = { test: undefined };
			const action = new Actions().alternative(element.test === undefined).ifTrue(new Actions().setValue("result", "was_undefined"));
			const built = action.build();

			expect(built.condition).toBe(true);
			expect(built.ifTrue).toEqual({
				type: "core.set_value",
				path: "result",
				value: "was_undefined"
			});
		});
	});

	describe("Error Handling", () => {
		it("should throw error for incomplete alternative", () => {
			const action = new Actions().alternative(true); // No ifTrue() called

			expect(() => action.build()).toThrow("Alternative action requires an 'ifTrue' action");
		});

		it("should throw error for incomplete modify action", () => {
			const action = new LootTableActionBuilder().modifyItem("item_1"); // No property set

			expect(() => action.build()).toThrow("Property and value must be set");
		});

		it("should throw error when calling build on base builder", () => {
			expect(() => new Actions().build()).toThrow("Use specific builder methods to create actions");
		});
	});
});
