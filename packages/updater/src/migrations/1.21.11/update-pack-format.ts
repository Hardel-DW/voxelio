import type { Migration } from "@/types";
import { updateModernPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21.11/update-pack-format",
	description: "Update pack format to 94",
	migrate(ctx) {
		updateModernPackFormat(ctx, 94);
	},
};
