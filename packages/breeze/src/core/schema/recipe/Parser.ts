import { normalizeResourceLocation } from "@/core/Element";
import type { Parser, ParserParams } from "@/core/engine/Parser";
import { extractUnknownFields } from "@/core/schema/utils";
import type {
	CraftingTransmuteData,
	MinecraftRecipe,
	RecipeProps,
	RecipeResult,
	RecipeTypeSpecific,
	SmeltingData,
	SmithingTransformData,
	SmithingTrimData
} from "./types";
import { KNOWN_RECIPE_FIELDS, normalizeIngredient, positionToSlot } from "./types";

export const RecipeDataDrivenToVoxelFormat: Parser<RecipeProps, MinecraftRecipe> = ({
	element,
	configurator
}: ParserParams<MinecraftRecipe>): RecipeProps => {
	const data = structuredClone(element.data);
	const slots: Record<string, string[] | string> = {};
	let gridSize: { width: number; height: number } | undefined;
	let typeSpecific: RecipeTypeSpecific | undefined;

	const normalizedType = normalizeResourceLocation(data.type);
	switch (normalizedType) {
		case "minecraft:crafting_shaped":
			parseShapedCrafting();
			break;
		case "minecraft:crafting_shapeless":
			parseShapelessCrafting();
			break;
		case "minecraft:crafting_transmute":
			parseCraftingTransmute();
			break;
		case "minecraft:smelting":
		case "minecraft:blasting":
		case "minecraft:smoking":
		case "minecraft:campfire_cooking":
			parseSmelting();
			break;
		case "minecraft:stonecutting":
			parseStonecutting();
			break;
		case "minecraft:smithing_transform":
			parseSmithingTransform();
			break;
		case "minecraft:smithing_trim":
			parseSmithingTrim();
			break;
		default:
			parseGenericRecipe();
			break;
	}

	let result: RecipeResult;
	if (normalizedType === "minecraft:smithing_trim") {
		result = {
			item: "minecraft:air",
			count: 1
		};
	} else if (data.result) {
		result = parseResult(data.result, data.count);
	} else {
		result = {
			item: "minecraft:air",
			count: 1
		};
	}

	return {
		identifier: element.identifier,
		type: normalizedType,
		group: data.group,
		category: data.category,
		showNotification: data.show_notification,
		slots,
		gridSize,
		result,
		typeSpecific,
		unknownFields: extractUnknownFields(data, KNOWN_RECIPE_FIELDS),
		override: configurator
	};

	function parseShapedCrafting() {
		if (!data.pattern || !data.key) return;

		const pattern = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
		const key = data.key;

		const height = pattern.length;
		const width = Math.max(...pattern.map((row) => row.length));
		gridSize = { width, height };

		// Always use 3x3 grid for slot calculation to match UI
		const UIGridWidth = 3;

		for (let row = 0; row < height; row++) {
			const patternRow = pattern[row] || "";
			for (let col = 0; col < width; col++) {
				const symbol = patternRow[col];
				if (symbol && symbol !== " " && key[symbol]) {
					const slotIndex = positionToSlot(row, col, UIGridWidth);
					slots[slotIndex] = normalizeIngredient(key[symbol]);
				}
			}
		}
	}

	function parseShapelessCrafting() {
		if (!data.ingredients) return;

		let slotIndex = 0;
		for (const ingredient of data.ingredients) {
			slots[slotIndex.toString()] = normalizeIngredient(ingredient);
			slotIndex++;
		}
	}

	function parseCraftingTransmute() {
		if (data.input) {
			slots["0"] = normalizeIngredient(data.input);
		}
		if (data.material) {
			slots["1"] = normalizeIngredient(data.material);
		}

		typeSpecific = {
			inputSlot: "0",
			materialSlot: "1"
		} as CraftingTransmuteData;
	}

	function parseSmelting() {
		if (data.ingredient) {
			slots["0"] = normalizeIngredient(data.ingredient);
		}

		typeSpecific = {
			experience: data.experience,
			cookingTime: data.cookingtime
		} as SmeltingData;
	}

	function parseStonecutting() {
		if (data.ingredient) {
			slots["0"] = normalizeIngredient(data.ingredient);
		}
	}

	function parseSmithingTransform() {
		if (data.template) {
			slots["0"] = normalizeIngredient(data.template);
		}
		if (data.base) {
			slots["1"] = normalizeIngredient(data.base);
		}
		if (data.addition) {
			slots["2"] = normalizeIngredient(data.addition);
		}

		typeSpecific = {
			templateSlot: "0",
			baseSlot: "1",
			additionSlot: "2"
		} as SmithingTransformData;
	}

	function parseSmithingTrim() {
		if (data.template) {
			slots["0"] = normalizeIngredient(data.template);
		}
		if (data.base) {
			slots["1"] = normalizeIngredient(data.base);
		}
		if (data.addition) {
			slots["2"] = normalizeIngredient(data.addition);
		}

		typeSpecific = {
			templateSlot: "0",
			baseSlot: "1",
			additionSlot: "2",
			pattern: data.pattern_trim
		} as SmithingTrimData;
	}

	function parseGenericRecipe() {
		let slotIndex = 0;

		if (data.ingredients) {
			for (const ingredient of data.ingredients) {
				slots[slotIndex.toString()] = normalizeIngredient(ingredient);
				slotIndex++;
			}
		}

		if (data.ingredient) {
			slots[slotIndex.toString()] = normalizeIngredient(data.ingredient);
		}
	}

	function parseResult(result: any, legacyCount?: number): RecipeResult {
		if (typeof result === "string") {
			return {
				item: normalizeResourceLocation(result),
				count: legacyCount || 1
			};
		}

		if (result?.item) {
			return {
				item: normalizeResourceLocation(result.item),
				count: result.count || legacyCount || 1,
				components: result.components
			};
		}

		return {
			item: normalizeResourceLocation(result?.id || "minecraft:air"),
			count: result?.count || legacyCount || 1,
			components: result?.components,
			unknownFields: result ? extractUnknownFields(result, new Set(["item", "id", "count", "components"])) : undefined
		};
	}
};
