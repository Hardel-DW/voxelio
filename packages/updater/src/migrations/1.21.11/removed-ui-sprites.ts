import type { Migration } from "@/types";

const REMOVED_SPRITES = [
	"container/inventory/effect_background_large",
	"container/inventory/effect_background_small",
];

const REMOVED_SPRITE_FILES = [
	"assets/minecraft/textures/gui/sprites/container/inventory/effect_background_large.png",
	"assets/minecraft/textures/gui/sprites/container/inventory/effect_background_small.png",
];

export const removedUiSprites: Migration = {
	id: "1.21.11/removed-ui-sprites",
	description: "Remove deprecated UI sprites and warn about references",
	migrate(ctx) {
		for (const file of REMOVED_SPRITE_FILES) {
			ctx.deleteFile(file);
		}

		ctx.transform(/\.json$/, (content, path) => {
			for (const sprite of REMOVED_SPRITES) {
				if (!content.includes(sprite)) continue;
				ctx.warn(`${path}: references removed sprite "${sprite}"`);
			}
			return undefined;
		});
	},
};
