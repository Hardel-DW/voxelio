import type { DataDrivenElement, VoxelElement } from "@/core/Element";
import { normalizeResourceLocation } from "@/core/Element";
export interface RecipeProps extends VoxelElement {
	type: RecipeType;
	group?: string;
	category?: string;
	showNotification?: boolean;
	slots: Record<string, string[] | string>; // string[] -> ["minecraft:diamond"], string -> "#minecraft:logs"
	gridSize?: { width: number; height: number }; // For shaped crafting only
	disabled?: boolean;
	result: RecipeResult;
	typeSpecific?: RecipeTypeSpecific;
}

export interface RecipeResult {
	id: string;
	count?: number;
	components?: any;
}

export type RecipeTypeSpecific = SmeltingData | SmithingTransformData | SmithingTrimData | CraftingTransmuteData;

export interface SmeltingData {
	experience?: number;
	cookingTime?: number;
}

export interface SmithingTransformData {
	templateSlot: string;
	baseSlot: string;
	additionSlot: string;
}

export interface SmithingTrimData {
	templateSlot: string;
	baseSlot: string;
	additionSlot: string;
	pattern?: string;
}

export interface CraftingTransmuteData {
	inputSlot: string;
	materialSlot: string;
}

export type RecipeType =
	| "minecraft:crafting_shaped"
	| "minecraft:crafting_shapeless"
	| "minecraft:crafting_transmute"
	| "minecraft:smelting"
	| "minecraft:blasting"
	| "minecraft:smoking"
	| "minecraft:campfire_cooking"
	| "minecraft:stonecutting"
	| "minecraft:smithing_transform"
	| "minecraft:smithing_trim"
	| (string & {}); // Allow custom mod recipe types

export type CraftingBookCategory = "building" | "redstone" | "equipment" | "misc";
export type CookingBookCategory = "food" | "blocks" | "misc";

export interface MinecraftRecipe extends DataDrivenElement {
	type: string;
	group?: string;
	category?: string;
	show_notification?: boolean;

	// Shaped crafting
	pattern?: string | string[];
	key?: Record<string, any>;

	// Shapeless crafting
	ingredients?: any[];

	// Transmute crafting
	input?: any;
	material?: any;

	// Smelting
	ingredient?: any;
	experience?: number;
	cookingtime?: number;

	// Smithing
	base?: any;
	addition?: any;
	template?: any;
	pattern_trim?: string;

	// Result
	result?: any;
	count?: number; // Legacy stonecutting

	[key: string]: any;
}

export const KNOWN_RECIPE_FIELDS = new Set([
	"type",
	"group",
	"category",
	"show_notification",
	"pattern",
	"key",
	"ingredients",
	"input",
	"material",
	"ingredient",
	"experience",
	"cookingtime",
	"base",
	"addition",
	"template",
	"pattern_trim",
	"result",
	"count"
]);

export function normalizeIngredient(ingredient: any): string[] | string {
	if (!ingredient) return [];
	if (ingredient.tag) return normalizeResourceLocation(`#${ingredient.tag}`);

	if (typeof ingredient === "string") {
		return ingredient.startsWith("#")
			? normalizeResourceLocation(ingredient)
			: [normalizeResourceLocation(ingredient)];
	}

	if (!Array.isArray(ingredient)) {
		return ingredient.item ? [normalizeResourceLocation(ingredient.item)] : [];
	}

	if (ingredient.length === 1) {
		const first = ingredient[0];
		if (typeof first === "string" && first.startsWith("#")) return normalizeResourceLocation(first);
		if (first?.tag) return normalizeResourceLocation(`#${first.tag}`);
	}

	return ingredient.map((item) => normalizeResourceLocation(typeof item === "string" ? item : item.item));
}

export function denormalizeIngredient(items: string[] | string): string | string[] {
	if (typeof items === "string") return items;
	return items.length === 1 ? items[0] : items;
}

/**
 * Convert grid position to slot index
 * @param row Row position (0-indexed)
 * @param col Column position (0-indexed)
 * @param width Grid width
 * @returns Slot index as string
 */
export function positionToSlot(row: number, col: number, width: number): string {
	return (row * width + col).toString();
}

/**
 * Convert slot index to grid position
 * @param slot Slot index as string
 * @param width Grid width
 * @returns Grid position
 */
export function slotToPosition(slot: string, width: number): { row: number; col: number } {
	const index = Number.parseInt(slot, 10);
	return {
		row: Math.floor(index / width),
		col: index % width
	};
}

/**
 * Check if a slot has content
 */
export function hasSlotContent(items: string[] | string): boolean {
	return typeof items === "string" ? items.length > 0 : items.length > 0;
}

/**
 * Get all occupied slots from a slots object
 * @param slots Slots record
 * @returns Array of slot indices
 */
export function getOccupiedSlots(slots: Record<string, string[] | string>): string[] {
	return Object.entries(slots)
		.filter(([, items]) => hasSlotContent(items))
		.map(([slot]) => slot);
}

/**
 * Optimize grid size to minimum required dimensions
 * @param slots Slots record
 * @param defaultWidth Default grid width
 * @returns Optimized grid size
 */
export function optimizeGridSize(slots: Record<string, string[] | string>, defaultWidth = 3): { width: number; height: number } {
	const occupiedSlots = getOccupiedSlots(slots);
	if (occupiedSlots.length === 0) {
		return { width: 1, height: 1 };
	}

	const positions = occupiedSlots.map((slot) => slotToPosition(slot, defaultWidth));
	const maxRow = Math.max(...positions.map((p) => p.row));
	const maxCol = Math.max(...positions.map((p) => p.col));

	return {
		width: maxCol + 1,
		height: maxRow + 1
	};
}

/**
 * Compare two ingredients semantically, handling different formats
 * @param a First ingredient
 * @param b Second ingredient
 * @returns true if ingredients are equivalent
 */
export function compareIngredients(a: any, b: any): boolean {
	if (a === b) return true;
	if (!a || !b) return false;

	const normalizeForComparison = (ingredient: any): any => {
		if (typeof ingredient === "string") {
			if (ingredient.startsWith("#")) {
				return { tag: normalizeResourceLocation(ingredient.slice(1)) };
			}
			return normalizeResourceLocation(ingredient);
		}

		if (ingredient.tag) {
			return { tag: normalizeResourceLocation(ingredient.tag) };
		}

		if (ingredient.item) {
			return normalizeResourceLocation(ingredient.item);
		}

		return ingredient;
	};

	const normalizedA = normalizeForComparison(a);
	const normalizedB = normalizeForComparison(b);

	return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
}
