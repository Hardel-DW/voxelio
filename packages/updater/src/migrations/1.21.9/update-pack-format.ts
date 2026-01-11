import type { Migration } from "@/types";
import { updateModernPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21.9/update-pack-format",
	description: "Update pack format to 86",
	migrate(ctx) {
		updateModernPackFormat(ctx, 86);
	},
};
