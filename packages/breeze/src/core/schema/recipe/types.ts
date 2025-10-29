import type { DataDrivenElement, VoxelElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
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
	| (string & {});

export type CraftingBookCategory = "building" | "redstone" | "equipment" | "misc";
export type CookingBookCategory = "food" | "blocks" | "misc";
export interface MinecraftRecipe extends DataDrivenElement {
	type: string;
	group?: string;
	category?: string;
	show_notification?: boolean;
	pattern?: string | string[]; // Shaped
	key?: Record<string, string | string[]>; // Shaped
	ingredients?: any[]; // Shapeless
	input?: string | string[]; // Transmute
	material?: string | string[]; // Transmute
	ingredient?: string | string[]; // Smelting
	experience?: number; // Smelting	
	cookingtime?: number; // Smelting
	base?: string | string[]; // Smithing
	addition?: string | string[]; // Smithing
	template?: string | string[]; // Smithing
	pattern_trim?: string; // Smithing
	result?: any;
	count?: number;
}

export function normalizeIngredient(ingredient: any): string[] | string {
	if (!ingredient) return [];
	if (ingredient.tag) return Identifier.qualify(`#${ingredient.tag}`);

	if (typeof ingredient === "string") {
		return ingredient.startsWith("#")
			? Identifier.qualify(ingredient)
			: [Identifier.qualify(ingredient)];
	}

	if (!Array.isArray(ingredient)) {
		return ingredient.item ? [Identifier.qualify(ingredient.item)] : [];
	}

	if (ingredient.length === 1) {
		const first = ingredient[0];
		if (typeof first === "string" && first.startsWith("#")) return Identifier.qualify(first);
		if (first?.tag) return Identifier.qualify(`#${first.tag}`);
	}

	return ingredient.map((item) => Identifier.qualify(typeof item === "string" ? item : item.item));
}

export function denormalizeIngredient(items: string[] | string): string | string[] {
	return typeof items === "string" ? items : items.length === 1 ? items[0] : items;
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
 * Get all occupied slots from a slots object
 * @param slots Slots record
 * @returns Array of slot indices
 */
export function getOccupiedSlots(slots: Record<string, string[] | string>): string[] {
	return Object.entries(slots).filter(([, items]) => items?.length > 0).map(([slot]) => slot);
}