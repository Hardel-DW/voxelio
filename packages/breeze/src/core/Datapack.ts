import { DatapackError } from "@/core/DatapackError";
import type { DataDrivenElement, DataDrivenRegistryElement, LabeledElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import { Tags, createTagFromElement, mergeDataDrivenRegistryElement } from "@/core/Tag";
import { getMinecraftVersion } from "@/core/Version";
import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import type { Logger } from "@/core/engine/migrations/logger";
import type { ChangeSet } from "@/core/engine/migrations/types";
import type { TagType } from "@/schema/TagType";
import { downloadZip, extractZip } from "@voxelio/zip";
import type { InputWithoutMeta } from "@voxelio/zip";

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
	private fileName: string;
	private pack: PackMcmeta;
	private files: Record<string, Uint8Array<ArrayBufferLike>>;
	private fileVersion: number;
	private registryCache = new Map<string, DataDrivenRegistryElement<any>[]>();
	private indexCache = new Map<string, Map<string, DataDrivenRegistryElement<any>>>();

	constructor(files: Record<string, Uint8Array<ArrayBufferLike>>, fileName?: string) {
		this.files = files;
		this.fileName = fileName ?? "Datapack";

		const nameWithoutExtension = this.fileName.replace(/\.(zip|jar)$/, "");
		const versionMatch = nameWithoutExtension.match(/^V(\d+)-/);
		this.fileVersion = versionMatch?.[1] ? +versionMatch[1] + 1 : 0;

		const packMcmeta = files["pack.mcmeta"];
		if (!packMcmeta) throw new DatapackError("tools.error.failed_to_get_pack_mcmeta");

		const pack = JSON.parse(new TextDecoder().decode(packMcmeta));
		if (!pack.pack.pack_format) throw new DatapackError("tools.error.failed_to_get_pack_format");
		this.pack = pack;
	}

	static async parse(file: File) {
		return new Datapack(await extractZip(new Uint8Array(await file.arrayBuffer())), file.name);
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
	 * Check if the datapack is modded.
	 * @returns Whether the datapack is modded.
	 */
	isModded() {
		return this.fileName.endsWith(".jar");
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
	 * Processes a datapack name by handling versioning and file extensions
	 * @example
	 * datapackName("test.zip") // Returns "V0-test"
	 * datapackName("V1-test") // Returns "V2-test"
	 */
	getFileName(): string {
		const nameWithoutExtension = this.fileName.replace(/\.(zip|jar)$/, "");
		if (nameWithoutExtension.startsWith("V")) {
			return nameWithoutExtension.replace(/^V\d+-/, `V${this.fileVersion}-`);
		}

		return `V0-${nameWithoutExtension}`;
	}

	/**
	 * Get the voxel logs of the current version
	 */
	getVoxelLogs(version?: number) {
		const versionToGet = version ?? this.fileVersion;
		return this.files?.[`voxel/v${versionToGet}.json`];
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

	with(elements: LabeledElement[]): this {
		for (const element of elements) {
			if (element.type === "deleted") {
				const filePath = new Identifier(element.identifier).toFilePath();
				delete this.files[filePath];
			} else if (element.type === "new" || element.type === "updated") {
				const filePath = new Identifier(element.element.identifier).toFilePath();
				const content = JSON.stringify(element.element.data);
				this.files[filePath] = new TextEncoder().encode(content);
			}
		}

		this.registryCache.clear();
		this.indexCache.clear();

		return this;
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
	): LabeledElement[] {
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

	/**
	 * Generate a new datapack.
	 * @param content - The content of the datapack.
	 * @param params - The parameters of the datapack.
	 * @returns The new datapack.
	 */
	generate(
		content: LabeledElement[],
		params: { isMinified: boolean; logger?: Logger; include?: DataDrivenRegistryElement<DataDrivenElement>[] }
	) {
		const { isMinified, logger, include = [] } = params;

		const files: InputWithoutMeta[] = [];
		this.prepareExistingFiles(files, content);
		this.prepareIncludedFiles(files, include, isMinified);
		this.prepareContentFiles(files, content, isMinified);
		this.prepareLogger(files, logger, isMinified);

		return downloadZip(files);
	}

	/**
	 * Prepare a JSON file structure for adding to the zip
	 * @param path - The path of the file.
	 * @param data - The data of the file.
	 * @param isMinified - Whether the file is minified.
	 */
	private prepareFile(path: string, data: object | string | Uint8Array<ArrayBufferLike>, isMinified: boolean): InputWithoutMeta {
		const input =
			data instanceof Uint8Array
				? data
				: new TextEncoder().encode(typeof data === "string" ? data : JSON.stringify(data, null, isMinified ? 0 : 4));

		return {
			name: path,
			input: new ReadableStream({
				start(controller) {
					controller.enqueue(input);
					controller.close();
				}
			})
		};
	}

	/**
	 * Prepare the existing files for the zip. Files marked as deleted will be skipped.
	 * @param files - The array to add files to
	 * @param content - The content of the datapack.
	 */
	private prepareExistingFiles(files: InputWithoutMeta[], content: LabeledElement[]) {
		const filesToDelete = new Set(
			content.filter((file) => file.type === "deleted").map((file) => new Identifier(file.identifier).toFilePath())
		);

		for (const [path, data] of Object.entries(this.files)) {
			if (!filesToDelete.has(path)) {
				files.push(this.prepareFile(path, data, false));
			}
		}
	}

	/**
	 * Prepare the included files for the zip. E.G Voxel Datapacks. No operation is made on the files.
	 * @param files - The array to add files to
	 * @param include - The included files.
	 * @param isMinified - Whether the file is minified.
	 */
	private prepareIncludedFiles(files: InputWithoutMeta[], include: DataDrivenRegistryElement<DataDrivenElement>[], isMinified: boolean) {
		for (const file of include) {
			files.push(this.prepareFile(new Identifier(file.identifier).toFilePath(), file.data, isMinified));
		}
	}

	/**
	 * Process files, deleted tags will continue to exist but will be empty, and other files will be deleted, the rest will be added as is.
	 * @param files - The array to add files to
	 * @param content - The content of the datapack.
	 * @param isMinified - Whether the file is minified.
	 */
	private prepareContentFiles(files: InputWithoutMeta[], content: LabeledElement[], isMinified: boolean) {
		for (const file of content) {
			if (file.type === "deleted" && file.identifier.registry.startsWith("tags")) {
				files.push(this.prepareFile(new Identifier(file.identifier).toFilePath(), { values: [] }, isMinified));
				continue;
			}

			if (file.type === "deleted") continue;
			files.push(this.prepareFile(new Identifier(file.element.identifier).toFilePath(), file.element.data, isMinified));
		}
	}

	/**
	 * Prepare the logs files for the zip.
	 * @param files - The array to add files to
	 * @param logger - The logger.
	 * @param isMinified - Whether the file is minified.
	 */
	private prepareLogger(files: InputWithoutMeta[], logger: Logger | undefined, isMinified: boolean) {
		if (logger) {
			const logData = logger.exportJson();
			files.push(this.prepareFile(`voxel/v${this.fileVersion}.json`, logData, isMinified));
		}
	}
}
