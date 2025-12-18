import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import { Tags, type OptionalTag, type TagType } from "@/core/Tag";

/**
 * A utility class for comparing and processing Minecraft tags.
 * Used to handle tag references and resolve recursive tag values.
 */
export class TagsProcessor {
	private readonly registry: string;
	private readonly tagMap: Map<string, DataDrivenRegistryElement<TagType>>;

	/**
	 * Creates a new TagsComparator instance
	 * @param tags Array of tag registry elements to process
	 */
	constructor(private readonly tags: DataDrivenRegistryElement<TagType>[]) {
		const registries = new Set(tags.map((tag) => tag.identifier.registry));

		if (registries.size > 1) {
			throw new Error(`Multiple registries found: ${Array.from(registries).join(", ")}. All tags must have the same registry.`);
		}

		this.registry = registries.size > 0 ? Array.from(registries)[0] : "";
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

	/**
	 * Remove IDs from all tags (removes both string and OptionalTag if ID matches)
	 * @param idsToRemove Set of IDs to remove (e.g., "minecraft:sharpness")
	 * @returns New tags without the removed IDs
	 */
	public removeIds(idsToRemove: Set<string>): DataDrivenRegistryElement<TagType>[] {
		return this.tags.map((tag) => ({
			identifier: tag.identifier,
			data: {
				...tag.data,
				values: tag.data.values.filter((v) => {
					const id = typeof v === "string" ? v : v.id;
					return !idsToRemove.has(id);
				})
			}
		}));
	}

	/**
	 * Inject IDs into specific tags (with duplicate check)
	 * Creates new tags if they don't exist
	 * @param elementToTags Map of element ID to tag identifiers
	 *   Example: "minecraft:sharpness" -> [tagId1, tagId2]
	 * @returns New tags with injected IDs (including newly created tags)
	 */
	public injectIds(elementToTags: Map<string, IdentifierObject[]>): DataDrivenRegistryElement<TagType>[] {
		const resultMap = new Map<string, DataDrivenRegistryElement<TagType>>();

		for (const tag of this.tags) {
			resultMap.set(new Identifier(tag.identifier).toUniqueKey(), {
				identifier: tag.identifier,
				data: { ...tag.data, values: [...tag.data.values] }
			});
		}

		for (const [elementId, tagIdentifiers] of elementToTags) {
			for (const tagId of tagIdentifiers) {
				const tagKey = new Identifier(tagId).toUniqueKey();
				let tagEntry = resultMap.get(tagKey);

				if (!tagEntry) {
					tagEntry = { identifier: tagId, data: { values: [] } };
					resultMap.set(tagKey, tagEntry);
				}

				const tags = new Tags(tagEntry.data);
				if (!tags.hasValue(elementId)) {
					tagEntry.data.values.push(elementId);
				}
			}
		}

		return Array.from(resultMap.values());
	}

	/**
	 * Merge multiple datapacks tags (respects replace flag and priority order)
	 * @param datapackTags Array of datapacks with their tags (ordered by priority)
	 * @returns Merged tags
	 */
	public static merge(
		datapackTags: Array<{ id: string; tags: DataDrivenRegistryElement<TagType>[] }>
	): DataDrivenRegistryElement<TagType>[] {
		const tagMap = new Map<string, DataDrivenRegistryElement<TagType>>();

		for (const datapack of datapackTags) {
			for (const tag of datapack.tags) {
				const key = new Identifier(tag.identifier).toUniqueKey();
				const existing = tagMap.get(key);

				if (tag.data.replace || !existing) {
					tagMap.set(key, { identifier: tag.identifier, data: { values: [...tag.data.values] } });
				} else {
					tagMap.set(key, {
						identifier: tag.identifier,
						data: { values: Array.from(new Set([...existing.data.values, ...tag.data.values])) }
					});
				}
			}
		}

		return Array.from(tagMap.values());
	}

	/**
	 * Flatten all tags (resolve all #tag references)
	 * @returns Tags with all recursive values resolved
	 */
	public flatten(): DataDrivenRegistryElement<TagType>[] {
		return this.tags.map((tag) => ({
			identifier: tag.identifier,
			data: { values: this.getRecursiveValues(tag.identifier) }
		}));
	}
}
