import type { Migration } from "@/types";

export const itemAtlasSplit: Migration = {
	id: "1.21.11/item-atlas-split",
	description: "Warn about item textures atlas split",
	migrate(ctx) {
		const itemModels = ctx.getFiles(/^assets\/[^/]+\/models\/item\/.*\.json$/);

		if (itemModels.length > 0) {
			ctx.warn("Item textures now use a separate 'items' atlas. Item models referencing 'blocks' atlas textures may need updating.");
		}
	},
};
