import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import type { OptionalTag, TagType } from "@/core/Tag";

/**
 * A utility class for comparing and processing Minecraft tags.
 * Used to handle tag references and resolve recursive tag values.
 */
export class TagsComparator {
	private readonly registry: string;
	private readonly tagMap: Map<string, DataDrivenRegistryElement<TagType>>;

	/**
	 * Creates a new TagsComparator instance
	 * @param tags Array of tag registry elements to process
	 */
	constructor(private readonly tags: DataDrivenRegistryElement<TagType>[]) {
		const registries = new Set(tags.map((tag) => tag.identifier.registry));

		if (registries.size === 0) {
			throw new Error("No tags provided");
		}

		if (registries.size > 1) {
			throw new Error(`Multiple registries found: ${Array.from(registries).join(", ")}. All tags must have the same registry.`);
		}

		this.registry = Array.from(registries)[0];
		this.tagMap = new Map(tags.map((tag) => [new Identifier(tag.identifier).toString(), tag]));
	}

	/**
	 * Gets all values from all tags, merging them into a single list
	 * @returns Array of all unique values from all tags
	 */
	public getAllValues(): string[] {
		const values = new Set<string>();
		const processedTags = new Set<string>();

		for (const tag of this.tags) {
			this.addValuesFromTag(tag, values, processedTags);
		}

		return Array.from(values);
	}

	/**
	 * Gets all values recursively from a specific tag, removing duplicates.
	 * @param identifier The identifier of the tag to process
	 * @returns Array of unique values from the tag
	 */
	public getRecursiveValues(identifier: IdentifierObject): string[] {
		const values = new Set<string>();
		const processedTags = new Set<string>();

		const element = this.tags.find((tag) => new Identifier(tag.identifier).equalsObject(identifier));
		if (element) {
			this.addValuesFromTag(element, values, processedTags);
		}

		return Array.from(values);
	}

	/**
	 * Recursively add values from a tag to the set
	 * @param tag The tag to process
	 * @param accumulator The set to add values to
	 * @param processedTags Set of tag IDs that have already been processed (to prevent infinite loops)
	 */
	private addValuesFromTag(element: DataDrivenRegistryElement<TagType>, accumulator: Set<string>, processedTags: Set<string>): void {
		if (this.isTagProcessed(element, processedTags)) return;
		for (const value of element.data.values) {
			this.processValue(value, accumulator, processedTags);
		}
	}

	private isTagProcessed(element: DataDrivenRegistryElement<TagType>, processedTags: Set<string>): boolean {
		const tagId = new Identifier(element.identifier).toString();
		if (processedTags.has(tagId)) return true;
		processedTags.add(tagId);
		return false;
	}

	private processValue(value: string | OptionalTag, accumulator: Set<string>, processedTags: Set<string>): void {
		if (typeof value === "string") {
			this.processStringValue(value, accumulator, processedTags);
		} else {
			this.processOptionalTag(value, accumulator, processedTags);
		}
	}

	private processStringValue(value: string, accumulator: Set<string>, processedTags: Set<string>): void {
		if (value.startsWith("#")) {
			const tagPath = value.slice(1);
			const tagId = Identifier.of(tagPath, this.registry);
			this.processTagReference(tagId.toString(), accumulator, processedTags);
		} else {
			accumulator.add(value);
		}
	}

	private processTagReference(tagId: string, accumulator: Set<string>, processedTags: Set<string>): void {
		const referencedTag = this.findTagByPath(tagId);
		if (referencedTag) {
			this.addValuesFromTag(referencedTag, accumulator, processedTags);
		}
	}

	private processOptionalTag(tag: OptionalTag, accumulator: Set<string>, processedTags: Set<string>): void {
		if (!tag.required) return;
		this.processTagReference(tag.id, accumulator, processedTags);
	}

	/**
	 * Find a tag by its path in the tags array
	 * @param path The path to search for
	 * @returns The found tag or undefined
	 */
	private findTagByPath(path: string): DataDrivenRegistryElement<TagType> | undefined {
		return this.tagMap.get(path);
	}

	/**
	 * Finds all tags that contain a specific item recursively
	 * @param itemId The item ID to search for (e.g., "minecraft:diamond_sword")
	 * @returns Array of tag resource names that contain the item
	 */
	public findItemTags(itemId: string): Identifier[] {
		return this.tags
			.filter((tag) => this.getRecursiveValues(tag.identifier).includes(itemId))
			.map((tag) => new Identifier(tag.identifier));
	}
}
