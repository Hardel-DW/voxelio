import type { Migration } from "@/types";
import { updateLegacyPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21.4/update-pack-format",
	description: "Update pack format to 61",
	migrate(ctx) {
		updateLegacyPackFormat(ctx, 61);
	},
};
