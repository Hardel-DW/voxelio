import { DatapackError } from "@/core/DatapackError";
import type { DataDrivenElement, DataDrivenRegistryElement } from "@/core/Element";
import { Identifier, IdentifierObject } from "@/core/Identifier";
import { Tags, createTagFromElement, mergeDataDrivenRegistryElement } from "@/core/Tag";
import { getMinecraftVersion } from "@/core/Version";
import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import type { Logger } from "@/core/engine/migrations/logger";
import type { ChangeSet } from "@/core/engine/migrations/types";
import type { TagType } from "@/core/Tag";
import { extractZip } from "@voxelio/zip";
import { DatapackDownloader } from "@/core/DatapackDownloader";

export interface RegistryCache {
	[registry: string]: Map<string, DataDrivenRegistryElement<any>>;
}

export interface PackMcmeta {
	pack: {
		pack_format: number;
		description: string;
	};
}

export class Datapack {
	private pack: PackMcmeta;
	private files: Record<string, Uint8Array<ArrayBufferLike>>;
	private registryCache = new Map<string, DataDrivenRegistryElement<any>[]>();
	private indexCache = new Map<string, Map<string, DataDrivenRegistryElement<any>>>();

	constructor(files: Record<string, Uint8Array<ArrayBufferLike>>) {
		this.files = files;

		const packMcmeta = files["pack.mcmeta"];
		if (!packMcmeta) throw new DatapackError("tools.error.failed_to_get_pack_mcmeta");

		const pack = JSON.parse(new TextDecoder().decode(packMcmeta));
		if (!pack.pack.pack_format) throw new DatapackError("tools.error.failed_to_get_pack_format");
		this.pack = pack;
	}

	static async parse(file: File) {
		return new Datapack(await extractZip(new Uint8Array(await file.arrayBuffer())));
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
		if (!this.pack.pack.pack_format) throw new DatapackError("tools.error.failed_to_get_pack_format");
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
		if (!fallback && !this.pack.pack.description) throw new DatapackError("tools.error.failed_to_get_datapack_description");
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
		const cacheKey = `${registry}|${path || ""}|${excludeNamespaces?.join(",") || ""}`;
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
			const compressedPath = file.split("/").slice(2).join("/").replace(".json", "");

			if (!compressedPath.startsWith(`${registry}/`) && compressedPath !== registry) continue;

			const resource = compressedPath.slice(registry.length + 1);
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
	 * For an element, get all the tags where the identifier appears.
	 * @param registry - The registry of the tags.
	 * @param identifier - The identifier of the tags.
	 * @returns The related tags of the identifier.
	 */
	getRelatedTags(registry: string | undefined, identifier: string): string[] {
		if (!registry) return [];
		return this.getRegistry<TagType>(registry)
			.filter((tag) => new Tags(tag.data).isPresentInTag(Identifier.fromUniqueKey(identifier).toString()))
			.map((tag) => Identifier.fromUniqueKey(tag.identifier).toString());
	}


	/**
	 * Get the values of the tags of an element.
	 * @param identifier - The identifier of the Tags element.
	 * @param blacklist - The blacklist of values to exclude.
	 * @returns The values of the tags of the element.
	 */
	getTag(identifier: IdentifierObject, blacklist: string[] = []): TagType {
		const tags = this.readFile<TagType>(identifier);
		if (!tags) return { values: [] };

		return {
			values: tags.values.filter((value) => !blacklist.includes(typeof value === "string" ? value : value.id))
		};
	}

	/**
	 * Find for each identifier all corresponding tags in the datapack, (excluding the blacklist).
	 * @param identifier - The identifier of the Tags element.
	 * @param blacklist - The blacklist of values to exclude.
	 * @returns The values of the tags of the element.
	 */
	getTags(identifier: IdentifierObject[], blacklist: string[] = []): DataDrivenRegistryElement<TagType>[] {
		return identifier.map((id) => ({ identifier: id, data: this.getTag(id, blacklist) }));
	}

	/**
	 * Get the compiled tags of the elements.
	 * @param elements - The elements to compile.
	 * @returns The compiled tags.
	 */
	getCompiledTags(elements: ReturnType<Compiler>[], concept: keyof Analysers): DataDrivenRegistryElement<TagType>[] {
		const registryElements: DataDrivenRegistryElement<TagType>[] = createTagFromElement(elements);
		const blacklist = elements.map((e) => new Identifier(e.element.identifier).toString());
		const ogTags = this.getRegistry<TagType>(`tags/${concept}`).map((e) => e.identifier);
		const originalTags = this.getTags(ogTags, blacklist);
		return mergeDataDrivenRegistryElement(originalTags, registryElements);
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

	generate(logger: Logger, filename: string, isModded: boolean) {
		return new DatapackDownloader(this.files, isModded, filename).download(logger);
	}

	/**
	 * Label the elements.
	 * @param registry - The registry of the elements.
	 * @param elements - The elements to label.
	 * @param logger - The logger.
	 * @returns The labeled elements.
	 */
	labelElements<K extends keyof Analysers>(
		registry: K,
		elements: DataDrivenRegistryElement<DataDrivenElement>[],
		logger?: Logger
	) {
		const originalIndex = this.getIndex(registry);
		const compiledSet = new Set(elements.map((el) => new Identifier(el.identifier).toUniqueKey()));
		const modified = new Set<string>();
		if (logger) {
			for (const change of logger.getChanges()) {
				if (change.identifier && change.registry) {
					modified.add(`${change.identifier}$${change.registry}`);
				}
			}
		}

		const results: LabeledElement[] = [];
		for (const el of elements) {
			const key = new Identifier(el.identifier).toUniqueKey();
			if (!originalIndex.has(key)) {
				results.push({ type: "new", element: el });
			} else if (modified.has(key)) {
				results.push({ type: "updated", element: el });
			}
		}

		for (const [id, originalEl] of originalIndex) {
			if (!compiledSet.has(id)) {
				results.push({ type: "deleted", identifier: originalEl.identifier });
			}
		}

		return results;
	}
}
