import { normalizeResourceLocation } from "@/core/Element";
import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import type { CraftingTransmuteData, MinecraftRecipe, RecipeProps, SmeltingData, SmithingTransformData, SmithingTrimData } from "./types";
import { compareIngredients, denormalizeIngredient, getOccupiedSlots, hasSlotContent } from "./types";

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
	if (element.group) recipe.group = element.group;
	if (element.category) recipe.category = element.category;
	if (element.showNotification !== undefined) recipe.show_notification = element.showNotification;

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

	if (element.unknownFields) {
		Object.assign(recipe, element.unknownFields);
	}

	return {
		element: {
			data: recipe,
			identifier: element.identifier
		},
		tags: []
	};

	function compileShapedCrafting() {
		const gridSize = element.gridSize || { width: 3, height: 3 };

		if (original?.pattern && original?.key) {
			const originalPattern = Array.isArray(original.pattern) ? original.pattern : [original.pattern];
			const canReuseOriginal = checkCanReuseOriginalPattern(originalPattern, original.key, gridSize);

			if (canReuseOriginal) {
				recipe.pattern = originalPattern;
				recipe.key = {};
				for (const [symbol, ingredient] of Object.entries(original.key)) {
					if (typeof ingredient === "string" && ingredient.startsWith("#")) {
						recipe.key[symbol] = normalizeResourceLocation(ingredient);
					} else if (typeof ingredient === "string") {
						recipe.key[symbol] = normalizeResourceLocation(ingredient);
					} else {
						recipe.key[symbol] = ingredient;
					}
				}
				return;
			}
		}

		const pattern: string[] = [];
		const key: Record<string, any> = {};
		let symbolCounter = 65;

		for (let row = 0; row < gridSize.height; row++) {
			let patternRow = "";
			for (let col = 0; col < gridSize.width; col++) {
				const slotIndex = (row * 3 + col).toString();
				const items = element.slots[slotIndex];

				if (items && hasSlotContent(items)) {
					let symbol = findExistingSymbol(items, key);
					if (!symbol) {
						symbol = String.fromCharCode(symbolCounter++);
						// Use preserveTagFormat=true when there's no original to maintain string format
						const shouldPreserveTagFormat = !original?.key;
						key[symbol] = denormalizeIngredient(items, shouldPreserveTagFormat);
					}
					patternRow += symbol;
				} else {
					patternRow += " ";
				}
			}
			pattern.push(patternRow);
		}

		recipe.pattern = pattern;
		recipe.key = key;
	}

	function compileShapelessCrafting() {
		const occupiedSlots = getOccupiedSlots(element.slots);

		if (original?.ingredients) {
			recipe.ingredients = original.ingredients;
		} else {
			recipe.ingredients = occupiedSlots
				.map((slot) => element.slots[slot])
				.map((items) => denormalizeIngredient(items, true))
				.filter((ing) => ing !== undefined);
		}
	}

	function compileCraftingTransmute() {
		const transmuteData = element.typeSpecific as CraftingTransmuteData;
		if (!transmuteData) return;

		const inputItems = element.slots[transmuteData.inputSlot];
		const materialItems = element.slots[transmuteData.materialSlot];

		if (inputItems) {
			recipe.input = original?.input || denormalizeIngredient(inputItems, true);
		}
		if (materialItems) {
			recipe.material = original?.material || denormalizeIngredient(materialItems, true);
		}
	}

	function compileSmelting() {
		const smeltingData = element.typeSpecific as SmeltingData;

		const ingredientItems = element.slots["0"];
		if (ingredientItems) {
			recipe.ingredient = original?.ingredient || denormalizeIngredient(ingredientItems, true);
		}

		if (smeltingData?.experience !== undefined) {
			recipe.experience = smeltingData.experience;
		}
		if (smeltingData?.cookingTime !== undefined) {
			recipe.cookingtime = smeltingData.cookingTime;
		}
	}

	function compileStonecutting() {
		const ingredientItems = element.slots["0"];
		if (ingredientItems) {
			recipe.ingredient = original?.ingredient || denormalizeIngredient(ingredientItems, true);
		}

		if (element.result.count && element.result.count > 1) {
			recipe.count = element.result.count;
		}
	}

	function compileSmithingTransform() {
		const smithingData = element.typeSpecific as SmithingTransformData;
		if (!smithingData) return;

		const templateItems = element.slots[smithingData.templateSlot];
		const baseItems = element.slots[smithingData.baseSlot];
		const additionItems = element.slots[smithingData.additionSlot];

		if (templateItems) {
			recipe.template = original?.template || denormalizeIngredient(templateItems, true);
		}
		if (baseItems) {
			recipe.base = original?.base || denormalizeIngredient(baseItems, true);
		}
		if (additionItems) {
			recipe.addition = original?.addition || denormalizeIngredient(additionItems, true);
		}
	}

	function compileSmithingTrim() {
		const trimData = element.typeSpecific as SmithingTrimData;
		if (!trimData) return;

		const templateItems = element.slots[trimData.templateSlot];
		const baseItems = element.slots[trimData.baseSlot];
		const additionItems = element.slots[trimData.additionSlot];

		if (templateItems) {
			recipe.template = original?.template || denormalizeIngredient(templateItems, true);
		}
		if (baseItems) {
			recipe.base = original?.base || denormalizeIngredient(baseItems, true);
		}
		if (additionItems) {
			recipe.addition = original?.addition || denormalizeIngredient(additionItems, true);
		}
		if (trimData.pattern) {
			recipe.pattern_trim = trimData.pattern;
		}
	}

	function compileGenericRecipe() {
		const occupiedSlots = getOccupiedSlots(element.slots);

		if (occupiedSlots.length > 0) {
			if (occupiedSlots.length === 1) {
				const items = element.slots[occupiedSlots[0]];
				recipe.ingredient = denormalizeIngredient(items, true);
			} else {
				recipe.ingredients = occupiedSlots
					.map((slot) => element.slots[slot])
					.map((items) => denormalizeIngredient(items, true))
					.filter((ing) => ing !== undefined);
			}
		}
	}

	function compileResult(): any {
		const result = element.result;

		if (original?.result) {
			return original.result;
		}

		if (element.type === "minecraft:stonecutting" && !result.components) {
			return result.item;
		}

		if (result.components) {
			return {
				id: result.item,
				...(result.count && result.count > 1 && { count: result.count }),
				components: result.components,
				...result.unknownFields
			};
		}

		if (result.count && result.count > 1) {
			return {
				id: result.item,
				count: result.count,
				...result.unknownFields
			};
		}

		return result.item;
	}

	function checkCanReuseOriginalPattern(
		originalPattern: string[],
		originalKey: Record<string, any>,
		gridSize: { width: number; height: number }
	): boolean {
		if (originalPattern.length !== gridSize.height) return false;
		if (originalPattern.some((row) => row.length !== gridSize.width)) return false;

		for (let row = 0; row < gridSize.height; row++) {
			for (let col = 0; col < gridSize.width; col++) {
				const slotIndex = (row * 3 + col).toString();
				const items = element.slots[slotIndex];
				const symbol = originalPattern[row][col];

				if (symbol === " ") {
					if (items && hasSlotContent(items)) return false;
				} else {
					if (!items || !hasSlotContent(items)) return false;
					const expectedIngredient = originalKey[symbol];
					const actualIngredient = denormalizeIngredient(items, true);
					if (!compareIngredients(expectedIngredient, actualIngredient)) {
						return false;
					}
				}
			}
		}

		return true;
	}

	function findExistingSymbol(items: string[] | string, key: Record<string, any>): string | null {
		for (const [symbol, ingredient] of Object.entries(key)) {
			if (compareIngredients(denormalizeIngredient(items, true), ingredient)) {
				return symbol;
			}
		}
		return null;
	}
};
