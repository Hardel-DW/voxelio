import { Datapack } from "@/core/Datapack";
import type { DataDrivenElement, DataDrivenRegistryElement, VoxelElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import type { TagType } from "@/core/Tag";
import { TagsProcessor } from "@/core/TagsProcessor";
import { type Analysers, type GetAnalyserVoxel, analyserCollection } from "@/core/engine/Analyser";
import type { Analyser } from "@/core/engine/Analyser";

export type Compiler<T extends VoxelElement = VoxelElement, K extends DataDrivenElement = DataDrivenElement> = (
	element: T,
	config: keyof Analysers,
	original?: K
) => {
	element: DataDrivenRegistryElement<K>;
	tags: IdentifierObject[];
};

function writeElement(files: Record<string, Uint8Array>, element: DataDrivenRegistryElement<any>) {
	const path = new Identifier(element.identifier).toFilePath("data");
	files[path] = new TextEncoder().encode(JSON.stringify(element.data, null, 2));
}

export function compileDatapack(props: { elements: GetAnalyserVoxel<keyof Analysers>[]; files: Record<string, Uint8Array> }): Datapack {
	const newFiles = structuredClone(props.files);
	const datapack = new Datapack(props.files);
	const registryGroups = Map.groupBy(props.elements, (e) => e.identifier.registry as keyof Analysers);

	for (const [registry, registryElements] of registryGroups) {
		const { compiler, hasTag } = analyserCollection[registry] as Analyser<typeof registry>;

		// Compile Voxel → DataDriven
		const compiled = registryElements.map((el) => compiler(el, registry, datapack.readFile(el.identifier)));
		for (const { element } of compiled) writeElement(newFiles, element);

		// Process tags if needed
		if (hasTag) {
			const idMap = new Set(compiled.map((c) => new Identifier(c.element.identifier).toString()));
			const originalTags = datapack.getRegistry<TagType>(`tags/${registry}`);
			const processor = new TagsProcessor(originalTags);
			const cleanedTags = processor.removeIds(idMap);
			const elementToTags = new Map<string, IdentifierObject[]>();
			for (const { element, tags } of compiled) {
				elementToTags.set(new Identifier(element.identifier).toString(), tags);
			}

			const processorCleaned = new TagsProcessor(cleanedTags);
			const finalTags = processorCleaned.injectIds(elementToTags);
			for (const tag of finalTags) writeElement(newFiles, tag);
		}
	}

	return new Datapack(newFiles);
}
