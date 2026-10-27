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
	"80": "1.21.6",
	"81": { start: "1.21.7", end: "1.21.8" },
	"88": { start: "1.21.9", end: "1.21.10" },
	"94": "1.21.11",
	"101": { start: "26.1", end: "26.1.2" },
	"107": "26.2",
	"121": "26.3"
};

export const SIMPLE_PACK_VERSION: Record<string, string> = Object.fromEntries(
	Object.entries(PACK_VERSION).map(([key, value]) => [key, typeof value === "string" ? value : `${value.start} - ${value.end}`])
);

/**
 * The version of the engine
 */
export const ENGINE_VERSION = 1;

const KNOWN_FORMATS = Object.keys(PACK_VERSION)
	.map(Number)
	.sort((a, b) => a - b);

/**
 * The newest pack format this table knows.
 */
export const LATEST_PACK_FORMAT: number = KNOWN_FORMATS[KNOWN_FORMATS.length - 1];

/**
 * Get the Minecraft version from the pack format. A format between two releases belongs to the snapshots of the next one.
 * @example 1.21.1
 * @param packFormat - The pack format
 * @returns The Minecraft version
 */
export function getMinecraftVersion(packFormat: number): string {
	const format = KNOWN_FORMATS.find((known) => known >= packFormat);
	if (format === undefined || packFormat < 1) {
		throw new Error(`Unsupported pack_format: ${packFormat}`);
	}
	const version = PACK_VERSION[format.toString() as keyof typeof PACK_VERSION];
	return typeof version === "string" ? version : version.start;
}
