import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import { TagsComparator } from "@/core/TagComparator";
import type { TagType } from "@/core/Tag";

export class TagCompiler {
	constructor(private readonly enableFlattening = true) {}

	compile(datapackTags: Array<{ id: string; tags: DataDrivenRegistryElement<TagType>[] }>): DataDrivenRegistryElement<TagType>[] {
		const processed = this.mergeWithReplace(datapackTags);
		return this.enableFlattening ? this.flatten(processed) : processed;
	}

	private mergeWithReplace(
		datapackTags: Array<{ id: string; tags: DataDrivenRegistryElement<TagType>[] }>
	): DataDrivenRegistryElement<TagType>[] {
		const tagMap = new Map<string, DataDrivenRegistryElement<TagType>>();

		for (const datapack of datapackTags) {
			for (const tag of datapack.tags) {
				const key = new Identifier(tag.identifier).toUniqueKey();
				const existing = tagMap.get(key);

				tagMap.set(
					key,
					tag.data.replace || !existing
						? { identifier: tag.identifier, data: { values: [...tag.data.values] } }
						: {
								identifier: tag.identifier,
								data: { values: Array.from(new Set([...existing.data.values, ...tag.data.values])) }
							}
				);
			}
		}

		return Array.from(tagMap.values());
	}

	private flatten(tags: DataDrivenRegistryElement<TagType>[]): DataDrivenRegistryElement<TagType>[] {
		return tags.map((tag) => ({
			identifier: tag.identifier,
			data: { values: new TagsComparator(tags).getRecursiveValues(tag.identifier) }
		}));
	}
}
