import type { Migration } from "@/types";
import { updateLegacyPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21.6/update-pack-format",
	description: "Update pack format to 80",
	migrate(ctx) {
		updateLegacyPackFormat(ctx, 80);
	},
};
