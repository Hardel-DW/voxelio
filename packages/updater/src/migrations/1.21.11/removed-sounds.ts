import type { Migration } from "@/types";

const SOUND_REPLACEMENTS: Record<string, string> = {
	"item.underwater_saddle.equip": "item.armor.equip_leather",
};

export const removedSounds: Migration = {
	id: "1.21.11/removed-sounds",
	description: "Handle removed sound events",
	migrate(ctx) {
		ctx.transform(/\.(json|mcfunction)$/, (content, path) => {
			let result = content;
			let changed = false;

			for (const [oldSound, newSound] of Object.entries(SOUND_REPLACEMENTS)) {
				if (!result.includes(oldSound)) continue;

				if (ctx.force) {
					result = result.replaceAll(oldSound, newSound);
					changed = true;
					ctx.warn(`${path}: references sound event "${oldSound}" replaced with "${newSound}"`);
				} else {
					ctx.warn(`${path}: references removed sound event "${oldSound}"`);
				}
			}

			return changed ? result : undefined;
		});
	},
};
