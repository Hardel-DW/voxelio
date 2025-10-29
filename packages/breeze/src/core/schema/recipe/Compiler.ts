import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import type { CraftingTransmuteData, MinecraftRecipe, RecipeProps, SmeltingData, SmithingTransformData, SmithingTrimData } from "./types";
import { denormalizeIngredient, getOccupiedSlots } from "./types";

/**
 * Compile Voxel recipe format back to Minecraft Recipe format using slot-based system.
 */
export const VoxelToRecipeDataDriven: Compiler<RecipeProps, MinecraftRecipe> = (
	originalElement: RecipeProps,
	_: keyof Analysers,
	original?: MinecraftRecipe
) => {
	const element = structuredClone(originalElement);
	const recipe = original ? structuredClone(original) : ({} as MinecraftRecipe);
	recipe.type = element.type;
	recipe.group = element.group;
	recipe.category = element.category;
	recipe.show_notification = element.showNotification;

	switch (element.type) {
		case "minecraft:crafting_shaped":
			compileShapedCrafting();
			break;
		case "minecraft:crafting_shapeless":
			compileShapelessCrafting();
			break;
		case "minecraft:crafting_transmute":
			compileCraftingTransmute();
			break;
		case "minecraft:smelting":
		case "minecraft:blasting":
		case "minecraft:smoking":
		case "minecraft:campfire_cooking":
			compileSmelting();
			break;
		case "minecraft:stonecutting":
			compileStonecutting();
			break;
		case "minecraft:smithing_transform":
			compileSmithingTransform();
			break;
		case "minecraft:smithing_trim":
			compileSmithingTrim();
			break;
		default:
			compileGenericRecipe();
			break;
	}

	if (element.type !== "minecraft:smithing_trim") {
		recipe.result = compileResult();
	}

	return { element: { data: recipe, identifier: element.identifier }, tags: [] };

	function compileShapedCrafting() {
		const gridSize = element.gridSize || { width: 3, height: 3 };
		const key: Record<string, string | string[]> = {};
		const ingredientToSymbol = new Map<string, string>();
		let symbolCounter = 65;

		const getSymbolForIngredient = (ingredient: string | string[]): string => {
			const normalized = JSON.stringify(ingredient);
			if (ingredientToSymbol.has(normalized)) return ingredientToSymbol.get(normalized) as string;
			const exist = original?.key && Object.entries(original.key).find(([, ing]) => JSON.stringify(ingredient) === JSON.stringify(ing))?.[0];
			const symbol = exist || String.fromCharCode(symbolCounter++);
			ingredientToSymbol.set(normalized, symbol);
			key[symbol] = ingredient;
			return symbol;
		};

		const pattern = Array.from({ length: gridSize.height }, (_, row) => {
			return Array.from({ length: gridSize.width }, (_, col) => {
				const items = element.slots[(row * 3 + col).toString()];
				return items?.length > 0 ? getSymbolForIngredient(denormalizeIngredient(items)) : " ";
			}).join("");
		});

		recipe.pattern = pattern;
		recipe.key = key;
	}

	function compileShapelessCrafting() {
		const occupiedSlots = getOccupiedSlots(element.slots);
		recipe.ingredients = occupiedSlots
			.map((slot) => denormalizeIngredient(element.slots[slot]))
			.filter((ing) => ing !== undefined);
	}

	function compileCraftingTransmute() {
		const transmuteData = element.typeSpecific as CraftingTransmuteData;
		if (!transmuteData) return;

		const inputItems = element.slots[transmuteData.inputSlot];
		const materialItems = element.slots[transmuteData.materialSlot];

		if (inputItems) recipe.input = denormalizeIngredient(inputItems);
		if (materialItems) recipe.material = denormalizeIngredient(materialItems);
	}

	function compileSmelting() {
		const smeltingData = element.typeSpecific as SmeltingData;
		const ingredientItems = element.slots["0"];

		if (ingredientItems) recipe.ingredient = denormalizeIngredient(ingredientItems);
		if (smeltingData?.experience !== undefined) recipe.experience = smeltingData.experience;
		if (smeltingData?.cookingTime !== undefined) recipe.cookingtime = smeltingData.cookingTime;
	}

	function compileStonecutting() {
		const ingredientItems = element.slots["0"];
		if (ingredientItems) recipe.ingredient = denormalizeIngredient(ingredientItems);
		if (element.result.count && element.result.count > 1) recipe.count = element.result.count;
	}

	function compileSmithingTransform() {
		const smithingData = element.typeSpecific as SmithingTransformData;
		if (!smithingData) return;

		const templateItems = element.slots[smithingData.templateSlot];
		const baseItems = element.slots[smithingData.baseSlot];
		const additionItems = element.slots[smithingData.additionSlot];

		if (templateItems) recipe.template = denormalizeIngredient(templateItems);
		if (baseItems) recipe.base = denormalizeIngredient(baseItems);
		if (additionItems) recipe.addition = denormalizeIngredient(additionItems);
	}

	function compileSmithingTrim() {
		const trimData = element.typeSpecific as SmithingTrimData;
		if (!trimData) return;

		const templateItems = element.slots[trimData.templateSlot];
		const baseItems = element.slots[trimData.baseSlot];
		const additionItems = element.slots[trimData.additionSlot];

		if (templateItems) recipe.template = denormalizeIngredient(templateItems);
		if (baseItems) recipe.base = denormalizeIngredient(baseItems);
		if (additionItems) recipe.addition = denormalizeIngredient(additionItems);
		if (trimData.pattern) recipe.pattern_trim = trimData.pattern;
	}

	function compileGenericRecipe() {
		const occupiedSlots = getOccupiedSlots(element.slots);
		if (occupiedSlots.length === 0) return;

		if (occupiedSlots.length === 1) {
			recipe.ingredient = denormalizeIngredient(element.slots[occupiedSlots[0]]);
			return;
		}

		recipe.ingredients = occupiedSlots
			.map((slot) => denormalizeIngredient(element.slots[slot]))
			.filter((ing) => ing !== undefined);
	}

	function compileResult() {
		const { id, count, components } = element.result;
		const originalIsObject = original?.result && typeof original.result === "object";
		const hasExplicitCountInOriginal = originalIsObject && "count" in original.result;
		const shouldIncludeCount = count && (count > 1 || hasExplicitCountInOriginal);
		if (!components && !shouldIncludeCount && !originalIsObject) return id;

		return {
			id,
			...(shouldIncludeCount && { count }),
			...(components && { components })
		};
	}

};
