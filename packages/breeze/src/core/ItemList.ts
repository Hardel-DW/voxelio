import type { SingleOrMultiple } from "@/index";

/**
 * Represents an item reference that can be either a direct item ID or a tag reference
 */
export interface ItemReference {
	/** Whether this reference is a tag (starts with #) or direct item */
	isTag: boolean;
	/** The item ID or tag ID */
	id: string;
}

/**
 * Extracts the first item from a SingleOrMultiple structure and determines if it's a tag
 * Used commonly in enchantments and recipes where supportedItems can be single or array
 * @param element - Single item/tag or array of items/tags
 * @returns ItemReference with parsed information
 * @example
 * getItemFromMultipleOrOne("minecraft:sword") // { isTag: false, id: "minecraft:sword" }
 * getItemFromMultipleOrOne("#minecraft:swords") // { isTag: true, id: "#minecraft:swords" }
 * getItemFromMultipleOrOne(["#minecraft:swords", "minecraft:stick"]) // { isTag: true, id: "#minecraft:swords" }
 */
export function getItemFromMultipleOrOne(element: SingleOrMultiple<string>): ItemReference {
	const getItem = (id: string): ItemReference => ({
		isTag: id.startsWith("#"),
		id
	});

	return Array.isArray(element) ? getItem(element[0]) : getItem(element);
}

/**
 * Extracts all items from a SingleOrMultiple structure into an array
 * @param element - Single item/tag or array of items/tags
 * @returns Array of all items/tags
 * @example
 * getAllItems("minecraft:sword") // ["minecraft:sword"]
 * getAllItems(["minecraft:sword", "minecraft:axe"]) // ["minecraft:sword", "minecraft:axe"]
 */
export function getAllItems(element: SingleOrMultiple<string>): string[] {
	return Array.isArray(element) ? element : [element];
}

/**
 * Filters items from a SingleOrMultiple structure based on predicate
 * @param element - Single item/tag or array of items/tags
 * @param predicate - Function to test each item
 * @returns Filtered array of items
 * @example
 * filterItems(["#minecraft:swords", "minecraft:stick"], (item) => item.startsWith("#")) // ["#minecraft:swords"]
 */
export function filterItems(element: SingleOrMultiple<string>, predicate: (item: string) => boolean): string[] {
	const items = getAllItems(element);
	return items.filter(predicate);
}

/**
 * Checks if a SingleOrMultiple structure contains any tags (items starting with #)
 * @param element - Single item/tag or array of items/tags
 * @returns True if any element is a tag
 * @example
 * containsTags("#minecraft:swords") // true
 * containsTags(["minecraft:sword", "#minecraft:axes"]) // true
 * containsTags("minecraft:sword") // false
 */
export function containsTags(element: SingleOrMultiple<string>): boolean {
	return getAllItems(element).some((item) => item.startsWith("#"));
}

/**
 * Separates direct items from tag references
 * @param element - Single item/tag or array of items/tags
 * @returns Object with separate arrays for direct items and tags
 * @example
 * separateItemsAndTags(["minecraft:sword", "#minecraft:axes", "minecraft:pickaxe"])
 * // { items: ["minecraft:sword", "minecraft:pickaxe"], tags: ["#minecraft:axes"] }
 */
export function separateItemsAndTags(element: SingleOrMultiple<string>): { items: string[]; tags: string[] } {
	const allItems = getAllItems(element);
	return {
		items: allItems.filter((item) => !item.startsWith("#")),
		tags: allItems.filter((item) => item.startsWith("#"))
	};
}
