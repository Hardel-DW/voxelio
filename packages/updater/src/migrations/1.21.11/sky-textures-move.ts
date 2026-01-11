import type { Migration } from "@/types";

const TEXTURE_RENAMES: Record<string, string> = {
	"assets/minecraft/textures/environment/sun.png": "assets/minecraft/textures/environment/sun/sun.png",
	"assets/minecraft/textures/environment/end_flash.png": "assets/minecraft/textures/environment/end_flash/end_flash.png",
};

export const skyTexturesMove: Migration = {
	id: "1.21.11/sky-textures-move",
	description: "Move sky textures to new locations",
	migrate(ctx) {
		for (const [oldPath, newPath] of Object.entries(TEXTURE_RENAMES)) {
			ctx.renameFile(oldPath, newPath);
		}

		if (ctx.hasFile("assets/minecraft/textures/environment/moon_phases.png")) {
			ctx.warn("moon_phases.png must be manually split into individual sprites in moon/ folder");
		}
	},
};
