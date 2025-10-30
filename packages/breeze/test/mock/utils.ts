import { downloadZip, type InputWithMeta } from "@voxelio/zip";
import type { DataDrivenRegistryElement, DataDrivenElement } from "@/core/Element";

/**
 * Create a zip file from a record of files
 * @param filesRecord - A record of files to create
 * @returns A zip file
 */
export async function createZipFile(filesRecord: Record<string, Uint8Array>): Promise<File> {
	const files: InputWithMeta[] = Object.entries(filesRecord).map(([path, content]) => ({
		name: path,
		input: new File([new Uint8Array(content)], path)
	}));
	const zipContent = downloadZip(files);
	return new File([await zipContent.arrayBuffer()], "datapack.zip");
}

/**
 * Prepare files for a datapack, add pack.mcmeta based on version.
 * @param filesRecord - A record of files to create
 * @param packVersion - The version of the pack
 * @returns A record of files
 */
export function prepareFiles(filesRecord: Record<string, Record<string, unknown>>, packVersion = 61) {
	const packData = packVersion === -1 ? { pack: {} } : { pack: { pack_format: packVersion, description: "lorem ipsum" } };
	const files: Record<string, Uint8Array> = {};
	files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify(packData, null, 2));

	for (const [path, content] of Object.entries(filesRecord)) {
		files[path] = new TextEncoder().encode(JSON.stringify(content, null, 2));
	}

	return files;
}

/**
 * Create files from DataDrivenRegistryElement.
 * @param elements - The elements to create files from
 * @param packVersion - The version of the pack
 * @returns A record of files
 */
export function createFilesFromElements(
	elements: DataDrivenRegistryElement<DataDrivenElement>[],
	packVersion = 61
): Record<string, Uint8Array> {
	const packData = packVersion === -1 ? { pack: {} } : { pack: { pack_format: packVersion, description: "lorem ipsum" } };
	const files: Record<string, Uint8Array> = {};
	files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify(packData, null, 2));

	for (const element of elements) {
		const { namespace, registry, resource } = element.identifier;
		const filePath = `data/${namespace}/${registry}/${resource}.json`;
		files[filePath] = new TextEncoder().encode(JSON.stringify(element.data, null, 2));
	}

	return files;
}
