const MAX_MOD_ID_LENGTH = 64;

/**
 * Turns any name into an id every loader accepts: a lowercase letter, then 1 to 63 lowercase letters, digits or underscores.
 * @example toModId("Terralith_v2.6.5+26.3") // "terralith_v2_6_5_26_3"
 * @example toModId("1.21 Pack") // "datapack_1_21_pack"
 */
export function toModId(name: string): string {
	const slug = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
	const id = /^[a-z][a-z0-9_]/.test(slug) ? slug : `datapack_${slug}`;
	return id.slice(0, MAX_MOD_ID_LENGTH);
}
