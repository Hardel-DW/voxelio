import { generateFabricMod } from "@/fabric";
import { generateForgeMods } from "@/forge-neoforge";
import { toModId } from "@/modid";
import { generateQuiltMod } from "@/quilt";
import { DEFAULT_MOD_METADATA, type ModMetadata, type ModPlatformType, ModPlatforms } from "@/types";
import { extractZip } from "@voxelio/zip";
import { Datapack } from "@voxelio/breeze";

/**
 * Converts a datapack ZIP file to mod(s) for specified platforms
 * @param datapackZip - Datapack ZIP file to convert
 * @param platforms - Target platforms for conversion
 * @param metadata - Optional metadata for the mod
 * @returns Promise resolving with resulting ZIP as Uint8Array
 */
export async function convertDatapack(datapackZip: File, platforms: ModPlatformType[], metadata?: ModMetadata): Promise<Response> {
	const files = await extractZip(new Uint8Array(await datapackZip.arrayBuffer()));
	const finalMetadata = metadata || readMetadata(files, datapackZip.name.replace(/\.zip$/i, ""));
	const modFiles = generateModFiles(finalMetadata, platforms);

	const allFiles = {
		...files,
		...Object.fromEntries(Object.entries(modFiles).map(([path, content]) => [path, new TextEncoder().encode(content)]))
	};

	// Enable JAR compatibility mode (disable data descriptors for STORED entries)
	// This ensures the generated JAR works with Forge/Java strict ZIP validation
	return new Datapack(allFiles).generate(undefined, true);
}

/**
 * Extracts metadata from datapack's pack.mcmeta and icon
 * @param file - Datapack ZIP file
 * @param modName - Name to use for the mod (from zip filename)
 * @returns Extracted metadata combined with default values
 */
export async function extractMetadata(file: File, modName: string): Promise<ModMetadata> {
	return readMetadata(await extractZip(new Uint8Array(await file.arrayBuffer())), modName);
}

function readMetadata(files: Record<string, Uint8Array>, modName: string): ModMetadata {
	const datapack = attempt(() => new Datapack(files));

	return {
		...DEFAULT_MOD_METADATA,
		id: toModId(modName),
		name: modName,
		description:
			attempt(() => datapack?.getDescription({ fallback: DEFAULT_MOD_METADATA.description })) ?? DEFAULT_MOD_METADATA.description,
		version: attempt(() => datapack?.getVersion()) ?? DEFAULT_MOD_METADATA.version,
		icon: "pack.png" in files ? "pack.png" : undefined
	};
}

// Each pack.mcmeta field is optional for a mod: an unreadable one falls back alone instead of discarding the others.
function attempt<T>(read: () => T): T | undefined {
	try {
		return read();
	} catch (error) {
		console.warn("Cannot read the datapack metadata", error);
		return undefined;
	}
}

function generateModFiles(metadata: ModMetadata, platforms: ModPlatformType[]) {
	const files: Record<string, string> = {};
	const commonData = { ...metadata, id: toModId(metadata.id) };

	if (platforms.includes(ModPlatforms.FABRIC)) {
		files["fabric.mod.json"] = generateFabricMod(commonData);
	}

	if (platforms.includes(ModPlatforms.QUILT)) {
		files["quilt.mod.json"] = generateQuiltMod(commonData);
	}

	if (platforms.includes(ModPlatforms.FORGE)) {
		files["META-INF/mods.toml"] = generateForgeMods(commonData, ModPlatforms.FORGE);
	}

	if (platforms.includes(ModPlatforms.NEOFORGE)) {
		files["META-INF/neoforge.mods.toml"] = generateForgeMods(commonData, ModPlatforms.NEOFORGE);
	}

	return files;
}
