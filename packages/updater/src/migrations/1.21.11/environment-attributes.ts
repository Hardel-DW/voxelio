import type { Migration } from "@/types";
import { renameIdentifier } from "@/utils/identifier";

export const environmentAttributes: Migration = {
	id: "1.21.11/environment-attributes",
	description: "Migrate environment attributes changes",
	migrate(ctx) {
		renameIdentifier(ctx, "minecraft:visual/water_fog_radius", "minecraft:visual/water_fog_end_distance", /\.json$/);

		ctx.transform(/\.json$/, (content, path) => {
			if (!content.includes("visual/extra_fog")) return undefined;
			ctx.warn(`${path}: minecraft:visual/extra_fog has been removed`);
			return undefined;
		});

		ctx.transform(/\.json$/, (content, path) => {
			if (!content.includes("visual/cloud_opacity")) return undefined;
			ctx.warn(`${path}: minecraft:visual/cloud_opacity replaced by minecraft:visual/cloud_color - format changed`);
			return undefined;
		});
	},
};
