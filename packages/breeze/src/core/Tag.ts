import type { DataDrivenElement, DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import type { IdentifierObject } from "@/core/Identifier";

import type { Compiler } from "@/core/engine/Compiler";

/**
 * Represents a Minecraft tag system that can contain multiple values.
 * Tags are used to group blocks, items, entities, or functions together.
 */
export class Tags {
	/**
	 * Creates a new Tags instance
	 * @param tags The tag data containing values and optional replace property
	 */
	constructor(public readonly tags: TagType) {
		this.tags = tags;
	}

	/**
	 * Gets the raw tag data
	 * @returns The TagType object containing values and replace property
	 * @example
	 * const tag = new Tags({
	 *   replace: false,
	 *   values: ["minecraft:diamond_sword", "minecraft:iron_sword"]
	 * });
	 * const data = tag.getTags(); // Returns the TagType object
	 */
	getTags() {
		return this.tags;
	}

	/**
	 * Checks if a specific value exists in the tag
	 * @param name The value to check for
	 * @returns True if the value exists in the tag
	 * @example
	 * const tag = new Tags({
	 *   values: ["minecraft:diamond_sword"]
	 * });
	 * tag.hasValue("minecraft:diamond_sword"); // Returns true
	 */
	hasValue(name: string) {
		return this.tags.values.includes(name);
	}

	getFirstValue(): string | null {
		return (
			this.tags.values.map((value) => (typeof value === "string" ? value : value.id)).find((value) => !value.startsWith("#")) ?? null
		);
	}

	/**
	 * Gets all values in the tag
	 * @returns Array of values in the tag
	 * @example
	 * const tag = new Tags({
	 *   values: ["minecraft:diamond_sword", "minecraft:iron_sword"]
	 * });
	 * tag.getValues(); // Returns ["minecraft:diamond_sword", "minecraft:iron_sword"]
	 */
	getValues() {
		return this.tags.values;
	}

	fromRegistry(): string[] {
		return this.tags.values.map((value) => (typeof value === "string" ? value : value.id));
	}

	isPresentInTag(value: string): boolean {
		return this.tags.values.some((tagValue) => (typeof tagValue === "string" ? tagValue === value : tagValue.id === value));
	}
}

export interface TagType extends DataDrivenElement {
	replace?: boolean;
	values: (string | OptionalTag)[];
}

export type OptionalTag = {
	required: boolean;
	id: string;
};

export function isTag(tag: any): tag is TagType {
	return tag && typeof tag === "object" && "values" in tag;
}

/**
 * Converts a list of tags to identifiers.
 * @param tags - The list of tags to convert.
 * @param registry - The registry to use.
 * @returns The list of identifiers.
 */
export const tagsToIdentifiers = (tags: string[], registry: string): IdentifierObject[] => tags.map((tag) => Identifier.of(tag, registry));


/**
 * Merge two tags.
 * @param a - The first tag.
 * @param b - The second tag.
 * @returns The merged tag.
 */
export const mergeTags = (a: TagType, b: TagType): TagType => ({
	values: Array.from(new Set([...a.values, ...b.values]))
});

export const mergeDataDrivenRegistryElement = (
	a: DataDrivenRegistryElement<TagType>[],
	b: DataDrivenRegistryElement<TagType>[]
): DataDrivenRegistryElement<TagType>[] => {
	const tagMap = new Map<string, DataDrivenRegistryElement<TagType>>();

	for (const tag of [...a, ...b]) {
		const key = new Identifier(tag.identifier).toFilePath();
		const existing = tagMap.get(key);

		tagMap.set(key, existing ? { identifier: existing.identifier, data: mergeTags(existing.data, tag.data) } : tag);
	}

	return Array.from(tagMap.values());
};

/**
 * Create a tag from a list of main elements like "enchantment".
 */
export const createTagFromElement = (elements: ReturnType<Compiler>[]) => {
	const tagMap: Record<string, DataDrivenRegistryElement<TagType>> = {};

	for (const { element, tags } of elements) {
		for (const tag of tags) {
			const key = new Identifier(tag).toFilePath();
			const elementId = new Identifier(element.identifier).toString();

			tagMap[key] ??= { identifier: tag, data: { values: [] } };
			tagMap[key].data.values.push(elementId);
		}
	}

	return Object.values(tagMap);
};
