import { Datapack } from "@/core/Datapack";
import type { DataDrivenElement, DataDrivenRegistryElement, VoxelElement } from "@/core/Element";
import type { IdentifierObject } from "@/core/Identifier";
import { type Analysers, type GetAnalyserVoxel, analyserCollection } from "@/core/engine/Analyser";
import type { Analyser } from "@/core/engine/Analyser";
import type { Logger } from "@/core/engine/migrations/logger";

export type Compiler<T extends VoxelElement = VoxelElement, K extends DataDrivenElement = DataDrivenElement> = (
	element: T,
	config: keyof Analysers,
	original?: K
) => {
	element: DataDrivenRegistryElement<K>;
	tags: IdentifierObject[];
};

export function compileDatapack(props: {
	elements: GetAnalyserVoxel<keyof Analysers>[];
	files: Record<string, Uint8Array>;
	logger?: Logger;
}) {
	const datapack = new Datapack(props.files);
	const results: LabeledElement[] = [];
	const registryGroups = new Map<keyof Analysers, GetAnalyserVoxel<keyof Analysers>[]>();

	for (const element of props.elements) {
		const registry = element.identifier.registry as keyof Analysers;
		if (!registryGroups.has(registry)) registryGroups.set(registry, []);
		registryGroups.get(registry)?.push(element);
	}

	for (const [registry, registryElements] of registryGroups) {
		const { compiler, hasTag } = analyserCollection[registry] as Analyser<typeof registry>;
		const compiled = registryElements.map((element) => compiler(element, registry, datapack.readFile(element.identifier)));
		const compiledElements = compiled.map((r) => r.element);
		const compiledTags = hasTag ? [...compiledElements, ...datapack.getCompiledTags(compiled, registry)] : compiledElements;
		results.push(...datapack.labelElements(registry, compiledTags, props.logger));
	}

	return results;
}


/**
 * Get the identifier from a labeled element
 * @param comp - The labeled element
 * @returns The identifier
 */
export function getLabeledIdentifier(comp: LabeledElement): IdentifierObject {
	return comp.type === "deleted" ? comp.identifier : comp.element.identifier;
}

export type LabeledElement = NewOrUpdated | Deleted;

interface NewOrUpdated {
	type: "new" | "updated";
	element: DataDrivenRegistryElement<DataDrivenElement>;
}

interface Deleted {
	type: "deleted";
	identifier: IdentifierObject;
}
