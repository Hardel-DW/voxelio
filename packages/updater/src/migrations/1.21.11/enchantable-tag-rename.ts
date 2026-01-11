import type { Migration } from "@/types";
import { renameIdentifier } from "@/utils/identifier";

export const enchantableTagRename: Migration = {
	id: "1.21.11/enchantable-tag-rename",
	description: "Rename #enchantable/sword to #enchantable/sweeping",
	migrate(ctx) {
		renameIdentifier(ctx, "#minecraft:enchantable/sword", "#minecraft:enchantable/sweeping");
	},
};
