import { Datapack } from "@/core/Datapack";
import { DatapackError } from "@/core/DatapackError";
import type { ConfiguratorConfigFromDatapack, DataDrivenElement, VoxelElement } from "@/core/Element";
import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import type { Analysers, GetAnalyserMinecraft, GetAnalyserVoxel } from "@/core/engine/Analyser";
import { analyserCollection } from "@/core/engine/Analyser";
import { Logger } from "@/core/engine/migrations/logger";
import { extractZip } from "@voxelio/zip";

export interface ParserParams<K extends DataDrivenElement> {
	element: DataDrivenRegistryElement<K>;
	tags?: string[];
	configurator?: ConfiguratorConfigFromDatapack;
}

export type Parser<T extends VoxelElement, K extends DataDrivenElement> = (params: ParserParams<K>) => T;

export interface ParseDatapackResult<T extends VoxelElement> {
	name: string;
	files: Record<string, Uint8Array>;
	elements: Map<string, T>;
	version: number;
	isModded: boolean;
	logger: Logger;
}

/**
 * Parses a datapack and returns the elements.
 */
export async function parseDatapack<T extends keyof Analysers>(file: File): Promise<ParseDatapackResult<GetAnalyserVoxel<T>>> {
	const zip = await extractZip(new Uint8Array(await file.arrayBuffer()));
	const datapack = new Datapack(zip);
	const version = datapack.getPackFormat();
	const isModded = file.name.endsWith(".jar");
	const files = datapack.getFiles();

	const logger = new Logger(files);
	const elements = new Map<string, GetAnalyserVoxel<T>>();

	// Type-safe concept processing
	function processConcept<K extends keyof Analysers>(conceptName: K) {
		const analyser = analyserCollection[conceptName];
		const registry = datapack.getRegistry<GetAnalyserMinecraft<K>>(conceptName);

		for (const element of registry) {
			const configurator = datapack.readFile<ConfiguratorConfigFromDatapack>(element.identifier, "voxel");
			const tags = analyser.hasTag ? datapack.getRelatedTags(`tags/${conceptName}`, element.identifier) : [];

			const parsed = analyser.parser({ element, tags, configurator });
			logger.register(parsed.identifier, parsed);

			const hydrated = logger.applyExistingChanges(parsed);

			elements.set(new Identifier(element.identifier).toUniqueKey(), hydrated as GetAnalyserVoxel<T>);
		}
	}

	// Process all concepts from analyserCollection
	for (const conceptName of Object.keys(analyserCollection) as Array<keyof Analysers>) {
		processConcept(conceptName);
	}

	if (elements.size === 0) throw new DatapackError("tools.warning.no_elements");

	return { name: file.name, files, elements, version, isModded, logger };
}
