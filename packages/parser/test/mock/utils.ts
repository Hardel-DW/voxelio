/**
 * Prepare files for a datapack, add pack.mcmeta based on version.
 * @param filesRecord - A record of files to create
 * @param packVersion - The version of the pack
 * @returns A record of files
 */
export function prepareFiles(filesRecord: Record<string, Record<string, unknown>>, packVersion = 61): Record<string, Uint8Array> {
	const packData = packVersion === -1 ? { pack: {} } : { pack: { pack_format: packVersion, description: "lorem ipsum" } };
	const files: Record<string, Uint8Array> = {};
	files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify(packData, null, 2));

	for (const [path, content] of Object.entries(filesRecord)) {
		files[path] = new TextEncoder().encode(JSON.stringify(content, null, 2));
	}

	return files;
}
