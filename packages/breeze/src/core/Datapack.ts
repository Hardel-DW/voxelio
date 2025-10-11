import { DatapackError } from "@/core/DatapackError";
import type { ConfiguratorConfigFromDatapack, DataDrivenElement, DataDrivenRegistryElement, VoxelElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import { Tags } from "@/core/Tag";
import { getMinecraftVersion } from "@/core/Version";
import { Logger } from "@/core/engine/migrations/logger";
import type { ChangeSet } from "@/core/engine/migrations/types";
import type { TagType } from "@/core/Tag";
import { extractZip } from "@voxelio/zip";
import { DatapackDownloader } from "@/core/DatapackDownloader";
import { analyserCollection } from "@/core/engine/Analyser";
import type { Analysers, GetAnalyserVoxel, GetAnalyserMinecraft } from "@/core/engine/Analyser";

export interface RegistryCache {
	[registry: string]: Map<string, DataDrivenRegistryElement<any>>;
}

export interface PackMcmeta {
	pack: {
		pack_format: number;
		description: string;
	};
}

export interface ParserParams<K extends DataDrivenElement> {
	element: DataDrivenRegistryElement<K>;
	tags?: string[];
	configurator?: ConfiguratorConfigFromDatapack;
}

export type Parser<T extends VoxelElement, K extends DataDrivenElement> = (params: ParserParams<K>) => T;

export interface ParseDatapackResult<T extends VoxelElement> {
	files: Record<string, Uint8Array>;
	elements: Map<string, T>;
	version: number;
	logger: Logger;
}

export class Datapack {
	private pack: PackMcmeta;
	private files: Record<string, Uint8Array<ArrayBufferLike>>;
	private registryCache = new Map<string, DataDrivenRegistryElement<any>[]>();
	private indexCache = new Map<string, Map<string, DataDrivenRegistryElement<any>>>();

	constructor(files: Record<string, Uint8Array<ArrayBufferLike>>) {
		this.files = files;

		const packMcmeta = files["pack.mcmeta"];
		if (!packMcmeta) throw new DatapackError("failed_to_get_pack_mcmeta");

		const pack = JSON.parse(new TextDecoder().decode(packMcmeta));
		if (!pack.pack.pack_format) throw new DatapackError("failed_to_get_pack_format");
		this.pack = pack;
	}

	static async from(file: File) {
		return new Datapack(await extractZip(new Uint8Array(await file.arrayBuffer())));
	}

	/**
	 * Parse the datapack.
	 * @returns The parsed datapack.
	 */
	parse<T extends keyof Analysers>() {
		const logger = new Logger(this.files);
		const elements = new Map<string, GetAnalyserVoxel<T>>();

		const processConcept = <K extends keyof Analysers>(conceptName: K) => {
			const analyser = analyserCollection[conceptName];
			const registry = this.getRegistry<GetAnalyserMinecraft<K>>(conceptName);

			for (const element of registry) {
				const configurator = this.readFile<ConfiguratorConfigFromDatapack>(element.identifier, "voxel");
				const tags = analyser.hasTag ? this.getRelatedTags(`tags/${conceptName}`, element.identifier) : [];
				const parsed = analyser.parser({ element, tags, configurator });

				elements.set(new Identifier(element.identifier).toUniqueKey(), parsed as GetAnalyserVoxel<T>);
			}
		};

		for (const conceptName of Object.keys(analyserCollection) as Array<keyof Analysers>) {
			processConcept(conceptName);
		}

		if (elements.size === 0) throw new DatapackError("no_elements");
		return { files: this.files, elements, version: this.getPackFormat(), logger };
	}

	/**
	 * Get the namespaces of the datapack. (From Data)
	 * @returns The namespaces of the datapack.
	 */
	getNamespaces() {
		return Object.keys(this.files)
			.filter((path) => path.startsWith("data/"))
			.map((path) => path.split("/")[1])
			.filter((namespace, index, self) => namespace && self.indexOf(namespace) === index);
	}

	/**
	 * Get the pack format of the datapack. Or throw an error if it's not found.
	 * @returns The pack format of the datapack.
	 */
	getPackFormat() {
		if (!this.pack.pack.pack_format) throw new DatapackError("failed_to_get_pack_format");
		return this.pack.pack.pack_format;
	}

	/**
	 * Get the formatted version of the datapack.
	 * @returns The version of the datapack.
	 * @example
	 * getVersion() // "1.21.1"
	 */
	getVersion() {
		return getMinecraftVersion(this.getPackFormat());
	}

	/**
	 * Get the description of the datapack. If no description is found, the fallback will be used, and if no fallback is provided, an error will be thrown.
	 * @param fallback - The fallback description.
	 * @returns The description of the datapack.
	 */
	getDescription(fallback = "Unknown") {
		if (!fallback && !this.pack.pack.description) throw new DatapackError("failed_to_get_datapack_description");
		return this.pack.pack.description || fallback;
	}

	/**
	 * Get all changes from all log versions combined
	 * @returns Flattened array of all ChangeSet from all versions
	 */
	getAllChanges(): ChangeSet[] {
		const allChanges: ChangeSet[] = [];
		for (const [path, data] of Object.entries(this.files)) {
			if (!path.startsWith("voxel/v") || !path.endsWith(".json")) continue;

			try {
				const logContent = JSON.parse(new TextDecoder().decode(data));
				if (logContent.logs && Array.isArray(logContent.logs)) {
					allChanges.push(...logContent.logs);
				}
			} catch (error) {
				console.warn(`Failed to parse log file ${path}:`, error);
			}
		}

		return allChanges;
	}

	/**
	 * Get the files of the datapack.
	 * @returns The files of the datapack.
	 */
	getFiles() {
		return this.files;
	}

	/**
	 * Pre-compute all registry data in a single pass for optimal performance
	 * @param logger - Optional logger to determine modified elements
	 * @returns Indexed registry data and modified elements set
	 */
	getIndex(registry: string): Map<string, DataDrivenRegistryElement<any>> {
		if (!this.indexCache.has(registry)) {
			const map = new Map<string, DataDrivenRegistryElement<any>>();
			for (const el of [...this.getRegistry(registry), ...this.getRegistry(`tags/${registry}`)]) {
				map.set(new Identifier(el.identifier).toUniqueKey(), el);
			}
			this.indexCache.set(registry, map);
		}
		return this.indexCache.get(registry) ?? new Map();
	}

	/**
	 * Get the registry of the datapack. Find all jsons for a registry.
	 * @param registry - The registry of the datapack.
	 * @param path - Optional path filter for resources.
	 * @param excludeNamespaces - Optional array of namespaces to exclude.
	 * @returns The registry of the datapack.
	 * @example
	 * getRegistry("enchantment") // Returns all the enchantments of the datapack like Fire Aspect, Looting, etc.
	 * getRegistry("enchantment", "combat/", ["minecraft"]) // Returns combat enchantments excluding minecraft namespace
	 */
	getRegistry<T extends DataDrivenElement>(
		registry: string | undefined,
		path?: string,
		excludeNamespaces?: string[]
	): DataDrivenRegistryElement<T>[] {
		if (!registry) return [];
		const cacheKey = registry + path + excludeNamespaces?.join(",");
		if (this.registryCache.has(cacheKey)) {
			return this.registryCache.get(cacheKey) as DataDrivenRegistryElement<T>[];
		}

		const registries: DataDrivenRegistryElement<T>[] = [];
		for (const file of Object.keys(this.files)) {
			const fileParts = file.split("/");
			if (!file.endsWith(".json")) continue;
			if (fileParts.length < 3) continue;
			if (fileParts[0] !== "data") continue;

			const namespace = fileParts[1];
			const firstFolder = fileParts[2];
			const depth = Datapack.getRegistryDepth(firstFolder);
			const detectedRegistry = fileParts.slice(2, 2 + depth).join("/");

			if (detectedRegistry !== registry) continue;

			const resource = fileParts
				.slice(2 + depth)
				.join("/")
				.replace(".json", "");
			if (!resource || !namespace || !registry) continue;

			if (path && !resource.startsWith(path)) continue;
			if (excludeNamespaces && excludeNamespaces.length > 0 && excludeNamespaces.includes(namespace)) continue;

			registries.push({
				identifier: { namespace, registry, resource },
				data: JSON.parse(new TextDecoder().decode(this.files[file]))
			});
		}

		this.registryCache.set(cacheKey, registries);
		return registries;
	}

	/**
	 * Read a file from the datapack.
	 * @param identifier - The identifier of the file.
	 * @param basePath - The base path of the file.
	 * @returns The file.
	 */
	readFile<T>(identifier: IdentifierObject, basePath = "data"): T | undefined {
		const file = new Identifier(identifier).toFilePath(basePath);
		if (!(file in this.files)) return undefined;
		return JSON.parse(new TextDecoder().decode(this.files[file]));
	}

	generate(logger?: Logger) {
		return new DatapackDownloader(this.files).download(logger);
	}

	/**
	 * For an element, get all the tags where the identifier appears.
	 * @param registry - The registry of the tags.
	 * @param identifier - The identifier of the tags.
	 * @returns The related tags of the identifier.
	 */
	getRelatedTags(registry: string | undefined, identifier: IdentifierObject): string[] {
		if (!registry) return [];
		return this.getRegistry<TagType>(registry)
			.filter((tag) => new Tags(tag.data).isPresentInTag(new Identifier(identifier).toString()))
			.map((tag) => new Identifier(tag.identifier).toString());
	}

	/**
	 * Get all registries present in the datapack
	 * @returns Set of all registry names found in data/ paths
	 */
	getRegistries(basePath: string = "data"): Set<string> {
		const registries = new Set<string>();

		for (const file of Object.keys(this.files)) {
			if (!file.startsWith(`${basePath}/`)) continue;
			const parts = file.split("/");
			if (parts.length < 3) continue;

			const firstFolder = parts[2];
			const depth = Datapack.getRegistryDepth(firstFolder);
			const registry = parts.slice(2, 2 + depth).join("/");
			if (registry) registries.add(registry);
		}

		return registries;
	}

	/**
	 * Determine the registry depth based on the first folder after namespace
	 * @param firstFolder - First folder after namespace (e.g., "enchantment", "worldgen", "tags")
	 * @returns 2 if the folder requires two levels (worldgen/*, tags/*), 1 otherwise
	 */
	static getRegistryDepth(firstFolder: string): number {
		const twoLevelRegistries = ["worldgen", "tags"];
		return twoLevelRegistries.includes(firstFolder) ? 2 : 1;
	}
}
