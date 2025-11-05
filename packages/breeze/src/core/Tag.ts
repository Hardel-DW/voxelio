import type { DataDrivenElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import type { Analysers } from "@/core/engine/Analyser";

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
	getTags(): TagType {
		return this.tags;
	}

	/**
	 * Checks if a specific value exists in the tag
	 * @param name The value to check for (string or OptionalTag)
	 * @returns True if the value exists in the tag
	 * @example
	 * const tag = new Tags({
	 *   values: ["minecraft:diamond_sword"]
	 * });
	 * tag.hasValue("minecraft:diamond_sword"); // Returns true
	 */
	hasValue(name: string | OptionalTag): boolean {
		const searchId = typeof name === "string" ? name : name.id;
		return this.tags.values.some((v) => (typeof v === "string" ? v : v.id) === searchId);
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
	getValues(): TagType["values"] {
		return this.tags.values;
	}

	fromRegistry(): string[] {
		return this.tags.values.map((value) => (typeof value === "string" ? value : value.id));
	}

	isPresentInTag(value: string): boolean {
		return this.tags.values.some((tagValue) => (typeof tagValue === "string" ? tagValue === value : tagValue.id === value));
	}

	static isTag(tag: any): tag is TagType {
		return tag && typeof tag === "object" && "values" in tag;
	}

	/**
	 * Common utility to process tags for compilation
	 */
	static process(tags: string[], config: keyof Analysers): IdentifierObject[] {
		return tags.map((tag) => Identifier.of(tag, `tags/${config}`));
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
