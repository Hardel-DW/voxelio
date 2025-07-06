import { Datapack } from "@/core/Datapack";
import type { DataDrivenElement, DataDrivenRegistryElement, LabeledElement, VoxelElement } from "@/core/Element";
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

export function compileDatapack({
    elements,
    files,
    logger
}: {
    elements: GetAnalyserVoxel<keyof Analysers>[];
    files: Record<string, Uint8Array>;
    logger?: Logger;
}): Array<LabeledElement> {
    const datapack = new Datapack(files);
    const results: LabeledElement[] = [];
    const registryGroups = new Map<keyof Analysers, GetAnalyserVoxel<keyof Analysers>[]>();

    for (const element of elements) {
        const registry = element.identifier.registry as keyof Analysers;
        if (!registryGroups.has(registry)) registryGroups.set(registry, []);
        registryGroups.get(registry)?.push(element);
    }

    for (const [registry, registryElements] of registryGroups) {
        const { compiler, hasTag } = analyserCollection[registry] as Analyser<typeof registry>;
        const compiled = registryElements.map((element) => compiler(element, registry, datapack.readFile(element.identifier)));
        const compiledElements = compiled.map((r) => r.element);
        const compiledTags = hasTag ? [...compiledElements, ...datapack.getCompiledTags(compiled, registry)] : compiledElements;
        results.push(...datapack.labelElements(registry, compiledTags, logger));
    }

    return results;
}
