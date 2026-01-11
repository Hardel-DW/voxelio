import type { Migration } from "@/types";
import { intToHex } from "@/utils/color";

const COLOR_FIELDS = new Set([
	"water_color",
	"foliage_color",
	"dry_foliage_color",
	"grass_color",
	"grass_color_modifier",
]);

export const biomeColors: Migration = {
	id: "1.21.11/biome-colors",
	description: "Convert biome color fields from int to hex string",
	migrate(ctx) {
		ctx.transform(/^data\/[^/]+\/worldgen\/biome\/.*\.json$/, (content) => {
			const data = JSON.parse(content);
			if (!data.effects) return undefined;

			let changed = false;
			for (const field of COLOR_FIELDS) {
				if (typeof data.effects[field] !== "number") continue;
				data.effects[field] = intToHex(data.effects[field]);
				changed = true;
			}

			return changed ? JSON.stringify(data, null, 2) : undefined;
		});
	},
};
