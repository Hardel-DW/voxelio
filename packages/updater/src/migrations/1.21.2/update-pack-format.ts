import type { Migration } from "@/types";
import { updateLegacyPackFormat } from "@/utils/pack-format";

export const updatePackFormat: Migration = {
	id: "1.21.2/update-pack-format",
	description: "Update pack format to 57",
	migrate(ctx) {
		updateLegacyPackFormat(ctx, 57);
	},
};
