export const PACK_VERSION = {
	"1": { start: "1.12", end: "1.12.2" },
	"4": { start: "1.13", end: "1.14.4" },
	"5": { start: "1.15", end: "1.16.1" },
	"6": { start: "1.16.2", end: "1.16.5" },
	"7": { start: "1.17", end: "1.17.1" },
	"8": { start: "1.18", end: "1.18.1" },
	"9": "1.18.2",
	"10": { start: "1.19", end: "1.19.3" },
	"12": "1.19.4",
	"15": { start: "1.20", end: "1.20.1" },
	"18": "1.20.2",
	"26": { start: "1.20.3", end: "1.20.4" },
	"41": { start: "1.20.5", end: "1.20.6" },
	"48": { start: "1.21", end: "1.21.1" },
	"57": { start: "1.21.2", end: "1.21.3" },
	"61": "1.21.4",
	"71": "1.21.5",
	"80": "1.21.6"
};

/**
 * The version of the engine
 */
export const ENGINE_VERSION = 1;

/**
 * Get the Minecraft version from the pack format
 * @example 1.21.1
 * @param packFormat - The pack format
 * @returns The Minecraft version
 */
export function getMinecraftVersion(packFormat: number): string {
	const version = PACK_VERSION[packFormat.toString() as keyof typeof PACK_VERSION];
	if (!version) {
		throw new Error(`Unsupported pack_format: ${packFormat}`);
	}
	return typeof version === "string" ? version : version.start;
}

/**
 * Get the description of the pack format e.g :
 * Version 1.21.1
 * Version 1.21.2 - 1.21.3
 * Snapshot - 1.21.4 (for versions between known versions)
 * Future Version (for versions above known versions)
 * @param packFormat - The pack format
 * @returns The description of the pack format
 */
export function getDescription(packFormat: number): string {
	const keys = Object.keys(PACK_VERSION)
		.map(Number)
		.sort((a, b) => a - b);
	const maxVersion = Math.max(...keys);

	if (packFormat > maxVersion) {
		return "Future Version";
	}

	const version = PACK_VERSION[packFormat.toString() as keyof typeof PACK_VERSION];
	if (version) {
		return typeof version === "string" ? version : `Version ${version.start} - ${version.end}`;
	}

	// Handle snapshot versions (between known versions)
	const nextVersion = keys.find((v) => v > packFormat);
	if (nextVersion) {
		const nextVersionData = PACK_VERSION[nextVersion.toString() as keyof typeof PACK_VERSION];
		const versionStr = typeof nextVersionData === "string" ? nextVersionData : nextVersionData.start;
		return `Snapshot - ${versionStr}`;
	}

	throw new Error(`Unsupported pack_format: ${packFormat}`);
}
