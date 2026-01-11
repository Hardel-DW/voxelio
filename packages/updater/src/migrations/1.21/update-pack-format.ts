import type { Migration } from "@/types";
import { updateLegacyPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21/update-pack-format",
	description: "Update pack format to 48",
	migrate(ctx) {
		updateLegacyPackFormat(ctx, 48);
	},
};
